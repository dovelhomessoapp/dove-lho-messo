import XCTest

final class StoreScreenshots: XCTestCase {
    func closeGuide(_ app: XCUIApplication) {
        let close = app.webViews.buttons["Chiudi"].firstMatch
        if close.waitForExistence(timeout: 3) { close.tap() }
    }
    func capture(_ name: String) {
        let attachment = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
    func testStoreScreenshots() throws {
        continueAfterFailure = false
        let app = XCUIApplication(bundleIdentifier: "it.dovelhomesso.casadolcecasa")
        app.launch()
        XCTAssertTrue(app.webViews.firstMatch.waitForExistence(timeout: 30))
        closeGuide(app)
        sleep(3)
        capture("01-home")
        for (label, name) in [("Oggetti", "02-oggetti"), ("Posizioni", "03-posizioni"), ("Libri", "04-libri"), ("Dispensa", "05-dispensa")] {
            let button = app.webViews.buttons[label].firstMatch
            XCTAssertTrue(button.waitForExistence(timeout: 5), "Navigation missing: \(label)")
            button.tap()
            closeGuide(app)
            sleep(2)
            capture(name)
        }
    }

    func testQRPDFPreview() {
        continueAfterFailure = false
        let app = XCUIApplication(bundleIdentifier: "it.dovelhomesso.casadolcecasa")
        app.launchArguments = ["--qr-pdf-smoke"]
        app.launch()
        let preview = app.navigationBars["Etichette QR A4"]
        XCTAssertTrue(preview.waitForExistence(timeout: 30), "Generated QR PDF did not open in the native viewer")
        XCTAssertTrue(preview.buttons["Condividi"].exists)
        preview.buttons["Fine"].tap()
        XCTAssertTrue(app.webViews.firstMatch.waitForExistence(timeout: 5))
    }
}
