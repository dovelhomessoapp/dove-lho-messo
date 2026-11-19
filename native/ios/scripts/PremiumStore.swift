import Capacitor
import Foundation
import StoreKit

enum PremiumStore {
    static let productID = "it.dovelhomesso.casadolcecasa.premium.annuale"

    enum PurchaseOutcome {
        case activated
        case pending
        case cancelled
    }

    enum StoreError: LocalizedError {
        case productUnavailable
        case invalidTransaction

        var errorDescription: String? {
            switch self {
            case .productUnavailable:
                return "L’abbonamento annuale non è disponibile al momento."
            case .invalidTransaction:
                return "Non è stato possibile verificare l’acquisto con Apple."
            }
        }
    }

    static func annualProduct() async throws -> Product {
        let products = try await Product.products(for: [productID])
        guard let product = products.first,
              product.type == .autoRenewable,
              let period = product.subscription?.subscriptionPeriod,
              period.unit == .year, period.value == 1 else {
            throw StoreError.productUnavailable
        }
        return product
    }

    // The callback must verify the signed transaction on the server and
    // persist the entitlement before StoreKit is told the purchase is complete.
    static func purchase(
        accountToken: UUID,
        activate: (String) async throws -> Void
    ) async throws -> PurchaseOutcome {
        let product = try await annualProduct()
        switch try await product.purchase(options: [.appAccountToken(accountToken)]) {
        case .success(let result):
            guard case .verified(let transaction) = result,
                  transaction.productID == productID,
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
                let product = try await PremiumStore.annualProduct()
                call.resolve(["price": product.displayPrice])
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
                if call.getBool("restore") == true {
                    try await AppStore.sync()
                }
                for await result in Transaction.currentEntitlements {
                    guard case .verified(let transaction) = result,
                          transaction.productID == PremiumStore.productID,
                          transaction.appAccountToken == accountID else { continue }
                    try await submit(homeID: homeID, token: token, signedTransaction: result.jwsRepresentation)
                    await transaction.finish()
                    call.resolve(["outcome": "activated"])
                    return
                }
                if call.getBool("restore") == true {
                    call.resolve(["outcome": "missing"])
                    return
                }

                let outcome = try await PremiumStore.purchase(accountToken: accountID) { signed in
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
