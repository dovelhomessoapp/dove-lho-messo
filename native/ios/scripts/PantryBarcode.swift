import AVFoundation
import Capacitor
import UIKit
import Vision
import VisionKit

@available(iOS 16.0, *)
@objc(PantryBarcodePlugin)
final class PantryBarcodePlugin: CAPPlugin, CAPBridgedPlugin {
    let identifier = "PantryBarcodePlugin"
    let jsName = "PantryBarcode"
    let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "scan", returnType: CAPPluginReturnPromise)
    ]

    private var session: PantryBarcodeSession?

    @objc func scan(_ call: CAPPluginCall) {
        Task { @MainActor in
            guard DataScannerViewController.isSupported else {
                call.resolve(["useWeb": true])
                return
            }
            if AVCaptureDevice.authorizationStatus(for: .video) == .notDetermined {
                _ = await AVCaptureDevice.requestAccess(for: .video)
            }
            guard DataScannerViewController.isAvailable else {
                call.reject("Fotocamera non disponibile", "CAMERA_UNAVAILABLE")
                return
            }
            guard self.session == nil, let presenter = self.bridge?.viewController,
                  presenter.viewIfLoaded?.window != nil, presenter.presentedViewController == nil else {
                call.reject("Scanner non disponibile", "SCANNER_BUSY")
                return
            }
            let session = PantryBarcodeSession { [weak self] result in
                self?.session = nil
                switch result {
                case .code(let code): call.resolve(["code": code])
                case .cancelled: call.resolve()
                case .unavailable: call.reject("Lettura interrotta", "SCAN_UNAVAILABLE")
                }
            }
            self.session = session
            session.present(from: presenter)
        }
    }
}

@available(iOS 16.0, *)
@MainActor
private final class PantryBarcodeSession: NSObject, DataScannerViewControllerDelegate {
    enum Outcome {
        case code(String), cancelled, unavailable
    }

    private let scanner = DataScannerViewController(
        recognizedDataTypes: [.barcode(symbologies: [.ean13, .ean8, .upce, .itf14, .code128])],
        qualityLevel: .accurate,
        recognizesMultipleItems: false,
        isHighFrameRateTrackingEnabled: false,
        isPinchToZoomEnabled: true,
        isGuidanceEnabled: true,
        isHighlightingEnabled: true
    )
    private var completion: ((Outcome) -> Void)?

    init(completion: @escaping (Outcome) -> Void) {
        self.completion = completion
        super.init()
    }

    func present(from presenter: UIViewController) {
        scanner.delegate = self
        scanner.title = "Inquadra il codice a barre"
        scanner.navigationItem.leftBarButtonItem = UIBarButtonItem(
            barButtonSystemItem: .cancel, target: self, action: #selector(cancel)
        )
        let navigation = UINavigationController(rootViewController: scanner)
        navigation.modalPresentationStyle = .fullScreen
        presenter.present(navigation, animated: true) { [weak self] in
            guard let self, self.completion != nil else { return }
            do {
                try self.scanner.startScanning()
            } catch {
                self.finish(.unavailable)
            }
        }
    }

    func dataScanner(_ dataScanner: DataScannerViewController,
                     didAdd addedItems: [RecognizedItem], allItems: [RecognizedItem]) {
        for item in addedItems {
            guard case .barcode(let barcode) = item, let payload = barcode.payloadStringValue else { continue }
            let code = payload.filter { !$0.isWhitespace }
            guard code.range(of: "^[0-9]{8,14}$", options: .regularExpression) != nil else { continue }
            finish(.code(code))
            return
        }
    }

    func dataScanner(_ dataScanner: DataScannerViewController,
                     becameUnavailableWithError error: DataScannerViewController.ScanningUnavailable) {
        finish(.unavailable)
    }

    @objc private func cancel() {
        finish(.cancelled)
    }

    private func finish(_ outcome: Outcome) {
        guard let completion else { return }
        self.completion = nil
        scanner.stopScanning()
        if let navigation = scanner.navigationController {
            navigation.dismiss(animated: true) { completion(outcome) }
        } else {
            completion(outcome)
        }
    }
}
