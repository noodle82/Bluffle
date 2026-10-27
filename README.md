# BLUFFLE! v5 — iPad-friendly Codemagic build package

## What this build includes
- Original BLUFFLE! v4.2 gameplay and audio, with 130 draft free questions (Junior 35 / Family 75 / Classic 20).
- The original GitHub Pages website at root `index.html`, plus a `www/` copy for Capacitor.
- `package.json`, `capacitor.config.json`, and `codemagic.yaml` for an **unsigned iOS simulator build** in Codemagic.
- Premium is a preview only. No purchase, ads, or App Store signing is implemented.
- `free-questions.csv` is an editable audit list. Question wording and facts require editorial verification before release.

## Upload using iPad Safari
1. Extract this ZIP in Files.
2. In the `noodle82/Bluffle` GitHub repository, upload files from the extracted folder to the **root** of the main branch, keeping the `www` folder structure. Replace existing root files with the matching names.
3. Commit the changes. Your GitHub Pages game will update from root `index.html`.
4. Open Codemagic > Bluffle > Check for configuration files. Select the YAML workflow `ios-simulator-beta`.
5. Run the unsigned simulator build. **It cannot be installed on a real iPhone/iPad.** Signing and TestFlight follow after Apple Developer enrollment is active.

## Important caveats
- We have not executed a Codemagic cloud build here. Native compatibility is unverified until the workflow succeeds.
- The 500-question Excel workbook is not in the uploaded project. This is a new curated 130-question starter set, not a verified 130/370 split of that workbook.
- The native project is generated on the Codemagic Mac by `npx cap add ios`; no local Mac is needed for this attempt.
- Before publishing, verify facts, App Store compliance, purchases, privacy policy, and brand rights.
