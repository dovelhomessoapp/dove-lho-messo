# iOS development build

This builds the existing Casa dolce casa UI with Capacitor 8.6.0, Swift Package Manager and bundled web resources. It is a development scaffold, not an App Store submission or installable IPA.

## Reproduce on a supported Mac

Node 22+, Xcode 26+, macOS supported by that Xcode. From `native/ios`:

```sh
npm ci
npm run prepare:ios
npm run check
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' -derivedDataPath build CODE_SIGNING_ALLOWED=NO build
```

`prepare:ios` generates a fresh platform. For an existing generated platform use `npm run stage`, `python3 scripts/configure-ios.py`, `npx cap sync ios`. Generated folders are ignored by git; the lockfile pins npm packages, and the generated SPM dependency is exact.

The GitHub Actions workflow runs on a standard macos-15 runner on this preparation branch. It performs staging validation, WebKit layout checks with external requests blocked, then compiles without signing. No Apple credentials or upload are configured.

## Native-specific staging

- Copy only app web assets; exclude Android, SQL, secrets, service worker and web update flow. Generated `index.html` is the full app, not the old inventory landing page.
- Preserve the existing production files. Native-only transforms fail when the expected source patterns change.
- Bundle the QR/barcode libraries so the initial scanner code does not require downloading executable code.
- Set an immutable `app-store` presentation context. Reuse the existing access-only store guard: recognize existing subscriptions after account login, but do not expose Stripe checkout/portal or web purchase prompts in this development build. Native purchases are not implemented.
- Confirmation/reset emails return to the existing HTTPS app. After confirming/resetting in Safari, sign in in the native app; automatic native email/invite callbacks remain to be implemented and tested.
- Camera/photo permission descriptions are Italian. Reuse the existing RGB app icon, resized during the Mac build.
- AI models/OCR and public catalogs still require network access. Export/share and clipboard behavior require native device validation.

## Still required before TestFlight / review

1. Apple membership activation, matching app identifier registration, signing and provisioning.
2. Real-device tests for authentication/session renewal, confirmation/reset/invites, family sync, camera/photo picker, scans, permissions, offline behavior, QR export/share and account deletion.
3. Native push registration/delivery and settings; current web push functionality is not assumed to work in WKWebView.
4. Decide and implement App Store subscriptions or validate the intended access-only model. Existing Stripe prices are not silently migrated to Apple purchases.
5. Privacy manifest and App Privacy disclosures based on the final SDKs and data flows; review current Apple requirements.
6. Distribution archive, TestFlight upload and actual install testing. A successful simulator compile does not verify these steps or imply App Review approval.

The native app has its own local storage sandbox. Existing cloud household data is available only after signing in; Safari's local-only archive/session is not automatically transferred.
