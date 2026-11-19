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
