# BLUFFLE! — Commercial Foundation v3

## What works
- Complete one-device game from the original prototype, with 20-question free prototype pool.
- Private pass-and-play entry, anonymous voting, one-by-one reveals, 1 point for correct answer and 1 per player fooled.
- Local session recovery across reloads. Sensitive entry/vote screens resume behind a handoff.
- Premium £3.99 **preview only**, with no checkout, entitlement unlock, ads or analytics.
- Installable web-app manifest and icons when hosted over HTTPS.

## iPad-only workflow
1. Create a GitHub account and repository called `bluffle`.
2. Upload the files in this directory into the repository using Safari or a browser-based IDE such as github.dev.
3. Enable GitHub Pages under Settings > Pages > Deploy from a branch (main/root).
4. Open the published HTTPS URL in Safari on iPad, then Share > Add to Home Screen.
5. Test complete games and send changes through GitHub. Keep the source private until ready if you prefer; GitHub Pages access depends on repository and plan.
6. For the native iOS build, connect the repo to a cloud Mac CI service such as Codemagic. Add Capacitor configuration and native iOS project in a cloud dev environment; configure Apple certificates and App Store Connect. Do not upload secrets to the repo.

## Required before App Store submission
- Apple Developer account and App Store Connect app record.
- Capacitor native wrapper and reproducible cloud iOS builds.
- Apple StoreKit non-consumable product ID `com.bluffle.premium_lifetime`; use verified store entitlement and Restore Purchases, not a local boolean.
- AdMob integration with consent, child-appropriate targeting and test ad IDs during development; ads only between rounds.
- Proper privacy policy, App Privacy disclosures, age-rating and review of UK children/data rules.
- Full question-bank research and source review. Existing prototype content is NOT fact-checked for publication.
- Accessibility, device QA, App Store screenshots, purchase sandbox tests and review submission.

## Important
This is a working **web prototype with commercial scaffolding**, not an App Store binary. The premium dialog does not charge money. No ads are shown. Local storage is not encrypted; avoid using real sensitive information in player names or answers.
