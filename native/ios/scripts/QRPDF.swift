import Capacitor
import PDFKit
import UIKit
#if DEBUG && targetEnvironment(simulator)
import WebKit
#endif

final class DLMBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        super.capacitorDidLoad()
        bridge?.registerPluginInstance(QRPDFPlugin())
        if #available(iOS 16.0, *) {
            bridge?.registerPluginInstance(PantryBarcodePlugin())
        }
        #if DEBUG && targetEnvironment(simulator)
        if ProcessInfo.processInfo.arguments.contains("--qr-pdf-smoke") {
            let source = """
                window.addEventListener('load', () => {
                    const openPreview = () => {
                        if (typeof window.downloadAllQRA4 !== 'function') {
                            setTimeout(openPreview, 100);
                            return;
                        }
                        db.places.push({ id: 'qr-smoke', name: 'Scaffale di prova' });
                        window.downloadAllQRA4(new Set(['P:qr-smoke']), false);
                    };
                    setTimeout(openPreview, 1000);
                }, { once: true });
                """
            webView?.configuration.userContentController.addUserScript(
                WKUserScript(source: source, injectionTime: .atDocumentEnd, forMainFrameOnly: true)
            )
        }
        #endif
    }
}

@objc(QRPDFPlugin)
final class QRPDFPlugin: CAPPlugin, CAPBridgedPlugin {
    let identifier = "QRPDFPlugin"
    let jsName = "QRPDF"
    let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "preview", returnType: CAPPluginReturnPromise)
    ]

    @objc func preview(_ call: CAPPluginCall) {
        guard let base64 = call.getString("base64"), let data = Data(base64Encoded: base64) else {
            call.reject("PDF non valido")
            return
        }

        DispatchQueue.main.async {
            guard let presenter = self.bridge?.viewController,
                  presenter.viewIfLoaded?.window != nil,
                  presenter.presentedViewController == nil,
                  let document = PDFDocument(data: data), document.pageCount > 0 else {
                call.reject("Anteprima PDF non disponibile")
                return
            }

            let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
            let file = directory.appendingPathComponent("etichette-qr-A4.pdf")
            do {
                try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
                try data.write(to: file, options: .atomic)
            } catch {
                try? FileManager.default.removeItem(at: directory)
                call.reject("Impossibile preparare il PDF")
                return
            }

            let preview = QRPDFPreview(document: document, file: file)
            let navigation = UINavigationController(rootViewController: preview)
            navigation.modalPresentationStyle = .fullScreen
            presenter.present(navigation, animated: true) { call.resolve() }
        }
    }
}

private final class QRPDFPreview: UIViewController {
    private let document: PDFDocument
    private let file: URL

    init(document: PDFDocument, file: URL) {
        self.document = document
        self.file = file
        super.init(nibName: nil, bundle: nil)
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) { fatalError("Use init(document:file:)") }

    deinit {
        try? FileManager.default.removeItem(at: file.deletingLastPathComponent())
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        title = "Etichette QR A4"
        view.backgroundColor = .systemBackground
        navigationItem.leftBarButtonItem = UIBarButtonItem(
            title: "Fine", style: .done, target: self, action: #selector(closePreview)
        )
        navigationItem.rightBarButtonItem = UIBarButtonItem(
            title: "Condividi", style: .plain, target: self, action: #selector(sharePDF)
        )

        let pdfView = PDFView()
        pdfView.translatesAutoresizingMaskIntoConstraints = false
        pdfView.document = document
        pdfView.autoScales = true
        view.addSubview(pdfView)
        let area = view.safeAreaLayoutGuide
        NSLayoutConstraint.activate([
            pdfView.topAnchor.constraint(equalTo: area.topAnchor),
            pdfView.bottomAnchor.constraint(equalTo: area.bottomAnchor),
            pdfView.leadingAnchor.constraint(equalTo: area.leadingAnchor),
            pdfView.trailingAnchor.constraint(equalTo: area.trailingAnchor)
        ])
    }

    @objc private func closePreview() {
        dismiss(animated: true)
    }

    @objc private func sharePDF() {
        let share = UIActivityViewController(activityItems: [file], applicationActivities: nil)
        share.popoverPresentationController?.barButtonItem = navigationItem.rightBarButtonItem
        present(share, animated: true)
    }
}
