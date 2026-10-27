# BLUFFLE! v4 — iPad-friendly game build

## Install / update GitHub Pages
Upload **index.html**, **manifest.webmanifest**, **icon-192.png**, **icon-512.png** to the **root** of your existing `noodle82/Bluffle` repository on the `main` branch. Replace the older files with the same names. Do not upload the ZIP itself. Wait for Pages deployment, then refresh https://noodle82.github.io/Bluffle/ (Safari may cache the older version).

## New gameplay settings
- Question mode: automatic by youngest player's age (7–8 Junior, 9–12 Family, 13+ Classic), or manually choose Junior / Family / Classic.
- Ages selected for each player at setup. Ages are used only locally for question selection.
- Answer timer: Off by default; optional 30/60/90/120 seconds. If time expires with a valid draft, it is submitted; otherwise player may finish or skip.
- Little Bluffer Help: Optional by default; Always show; Off. Hints explain the question but never disclose the answer.
- Preserved: private handoffs, answer entry, secret voting, one-by-one reveal, scoring, game totals, local recovery, Premium preview.

## Questions
The app currently has a provisional pool of 16 Junior, 12 Family, and 20 Classic questions. The Family mode draws from both Junior and Family pools. Questions are illustrative and require independent fact/source/editorial verification before publication. `question-template.csv` is a template for the owner's questions; CSV import is **not yet implemented**. The current bank is embedded in `index.html`.

## Commercial limitations
No live ads or payments; £3.99 Premium is a preview. No native iOS binary yet. Test on real devices before launch. Existing v3 saved sessions are not migrated to v4; start a new game.

## v4.1: age-gated Little Bluffer Help

- The help button is shown only to the current answer-entry player if their entered age is under 10.
- Help is optional and hidden by default on every turn. It does not appear during voting.
- The global help setting has been removed from setup. Question difficulty still uses the selected mode / youngest player's age.
- Age is entered as a whole number during setup; no date of birth is requested.
- Answer timer remains off by default.
