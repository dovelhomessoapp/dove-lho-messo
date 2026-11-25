import Capacitor
import Foundation
import StoreKit
import UIKit

enum PremiumStore {
    enum Plan: String {
        case annual, monthly

        var productID: String {
            "it.dovelhomesso.casadolcecasa.premium." + (self == .annual ? "annuale" : "mensile")
        }

        var periodUnit: Product.SubscriptionPeriod.Unit {
            self == .annual ? .year : .month
        }
    }

    enum PurchaseOutcome {
        case activated
        case pending
        case cancelled
    }

    enum StoreError: LocalizedError {
        case productUnavailable
        case invalidTransaction
        case purchaseWindowUnavailable

        var errorDescription: String? {
            switch self {
            case .productUnavailable:
                return "L’abbonamento non è disponibile al momento."
            case .invalidTransaction:
                return "Non è stato possibile verificare l’acquisto con Apple."
            case .purchaseWindowUnavailable:
                return "Torna alla schermata Premium e riprova ad aprire l’acquisto Apple."
            }
        }
    }

    static func product(for plan: Plan) async throws -> Product {
        let products = try await Product.products(for: [plan.productID])
        guard let product = products.first,
              product.type == .autoRenewable,
              let period = product.subscription?.subscriptionPeriod,
              period.unit == plan.periodUnit, period.value == 1 else {
            throw StoreError.productUnavailable
        }
        return product
    }

    // The callback must verify the signed transaction on the server and
    // persist the entitlement before StoreKit is told the purchase is complete.
    @MainActor static func purchase(
        plan: Plan,
        accountToken: UUID,
        presenter: UIViewController?,
        activate: (String) async throws -> Void
    ) async throws -> PurchaseOutcome {
        let product = try await product(for: plan)
        let options: Set<Product.PurchaseOption> = [.appAccountToken(accountToken)]
        let result: Product.PurchaseResult
        if #available(iOS 17.0, *) {
            guard let scene = presenter?.viewIfLoaded?.window?.windowScene else {
                throw StoreError.purchaseWindowUnavailable
            }
            result = try await product.purchase(confirmIn: scene, options: options)
        } else {
            result = try await product.purchase(options: options)
        }
        switch result {
        case .success(let result):
            guard case .verified(let transaction) = result,
                  transaction.productID == plan.productID,
                  transaction.appAccountToken == accountToken else {
                throw StoreError.invalidTransaction
            }
            try await activate(result.jwsRepresentation)
            await transaction.finish()
            return .activated
        case .pending:
            return .pending
        case .userCancelled:
            return .cancelled
        @unknown default:
            throw StoreError.invalidTransaction
        }
    }
}

@objc(PremiumStorePlugin)
final class PremiumStorePlugin: CAPPlugin, CAPBridgedPlugin {
    let identifier = "PremiumStorePlugin"
    let jsName = "PremiumStore"
    let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "price", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "checkout", returnType: CAPPluginReturnPromise)
    ]

    @objc func price(_ call: CAPPluginCall) {
        Task { @MainActor in
            do {
                guard let plan = PremiumStore.Plan(rawValue: call.getString("plan") ?? "") else {
                    call.reject("Piano Premium non disponibile.")
                    return
                }
                let product = try await PremiumStore.product(for: plan)
                var pricing: [String: Any] = ["price": product.displayPrice]
                if plan == .monthly,
                   let subscription = product.subscription,
                   let offer = subscription.introductoryOffer,
                   offer.paymentMode == .payAsYouGo,
                   offer.period.unit == .month,
                   offer.period.value == 1,
                   await subscription.isEligibleForIntroOffer {
                    pricing["introPrice"] = offer.displayPrice
                    pricing["introMonths"] = offer.periodCount
                }
                call.resolve(pricing)
            } catch { call.reject(error.localizedDescription) }
        }
    }

    @objc func checkout(_ call: CAPPluginCall) {
        Task { @MainActor in
            guard let token = call.getString("session"),
                  let accountID = call.getString("accountID").flatMap(UUID.init(uuidString:)),
                  let homeID = call.getString("homeID").flatMap(UUID.init(uuidString:)) else {
                call.reject("Accedi con l’account proprietario della casa.")
                return
            }

            do {
                try await submit(homeID: homeID, token: token, signedTransaction: nil)
                let restoring = call.getBool("restore") == true
                let plan = PremiumStore.Plan(rawValue: call.getString("plan") ?? "")
                if restoring {
                    try await AppStore.sync()
                }
                for await result in Transaction.currentEntitlements {
                    guard case .verified(let transaction) = result,
                          !transaction.isUpgraded,
                          (restoring
                            ? [PremiumStore.Plan.annual.productID, PremiumStore.Plan.monthly.productID].contains(transaction.productID)
                            : transaction.productID == plan?.productID),
                          transaction.appAccountToken == accountID else { continue }
                    try await submit(homeID: homeID, token: token, signedTransaction: result.jwsRepresentation)
                    await transaction.finish()
                    call.resolve(["outcome": "activated"])
                    return
                }
                if restoring {
                    call.resolve(["outcome": "missing"])
                    return
                }

                guard let plan else {
                    call.reject("Piano Premium non disponibile.")
                    return
                }
                let outcome = try await PremiumStore.purchase(
                    plan: plan, accountToken: accountID, presenter: self.bridge?.viewController
                ) { signed in
                    try await self.submit(homeID: homeID, token: token, signedTransaction: signed)
                }
                switch outcome {
                case .activated: call.resolve(["outcome": "activated"])
                case .pending: call.resolve(["outcome": "pending"])
                case .cancelled: call.resolve(["outcome": "cancelled"])
                }
            } catch { call.reject(error.localizedDescription) }
        }
    }

    private func submit(homeID: UUID, token: String, signedTransaction: String?) async throws {
        let url = URL(string: "https://ephdnunjudbwlgbxdadm.supabase.co/functions/v1/apple-premium-activate")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer " + token, forHTTPHeaderField: "Authorization")
        var body = ["homeId": homeID.uuidString]
        body["signedTransaction"] = signedTransaction
        request.httpBody = try JSONEncoder().encode(body)
        let (_, response) = try await URLSession.shared.data(for: request)
        let status = (response as? HTTPURLResponse)?.statusCode
        if status == 200 { return }
        let message = status == 403
            ? "Solo il proprietario della casa può gestire il Premium."
            : "Verifica Premium non disponibile. Riprova o usa Ripristina acquisti."
        throw NSError(domain: "DLMPremium", code: status ?? 0, userInfo: [NSLocalizedDescriptionKey: message])
    }
}
