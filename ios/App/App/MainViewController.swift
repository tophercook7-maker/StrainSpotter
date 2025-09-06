import UIKit
import Capacitor

@objc(MainViewController)
class MainViewController: CAPBridgeViewController {
  override func viewDidLoad() {
    super.viewDidLoad()
    // Solid backgrounds prevent WKWebView white flashes/flicker
    self.view.backgroundColor = .black
    self.webView?.isOpaque = false
    self.webView?.backgroundColor = .black
    // If you ever add a scroll view wrapper, keep it simple:
    self.webView?.scrollView.backgroundColor = .black
  }
}
