import StoreKitTest
import XCTest

final class iPadPremiumTests: XCTestCase {
    func testAnnualPurchase() throws {
        try verifyPurchase(buttonTitle: "Abbonati per un anno", plan: "annuale")
    }

    func testMonthlyPurchase() throws {
        try verifyPurchase(buttonTitle: "Abbonati per un mese", plan: "mensile")
    }

    private func verifyPurchase(buttonTitle: String, plan: String) throws {
        continueAfterFailure = false
        let config = try XCTUnwrap(Bundle(for: Self.self).url(forResource: "Premium", withExtension: "storekit"))
        let session = try SKTestSession(contentsOf: config)
        session.resetToDefaultState()
        session.clearTransactions()
        session.disableDialogs = true

        let app = XCUIApplication(bundleIdentifier: "it.dovelhomesso.casadolcecasa")
        app.launch()
        let web = app.webViews.firstMatch
        XCTAssertTrue(web.waitForExistence(timeout: 30))
        let guideDismiss = web.buttons["Chiudi"].firstMatch
        if guideDismiss.waitForExistence(timeout: 3) { guideDismiss.tap() }

        let premium = web.buttons.containing(NSPredicate(format: "label CONTAINS %@", "Scopri Premium")).firstMatch
        XCTAssertTrue(premium.waitForExistence(timeout: 10))
        premium.tap()

        let purchase = web.buttons[buttonTitle].firstMatch
        XCTAssertTrue(purchase.waitForExistence(timeout: 15))
        let enabled = XCTNSPredicateExpectation(predicate: NSPredicate(format: "enabled == true"), object: purchase)
        XCTAssertEqual(XCTWaiter.wait(for: [enabled], timeout: 20), .completed)
        purchase.tap()
        XCTAssertTrue(web.staticTexts["Premium attivato per la tua famiglia."].waitForExistence(timeout: 30))
        XCTAssertTrue(session.allTransactions().contains {
            $0.productIdentifier == "it.dovelhomesso.casadolcecasa.premium." + plan
        })
    }
}
