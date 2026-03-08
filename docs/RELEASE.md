# Release Readiness

- Last updated: `2026-03-07 23:41 America/New_York`
- Target release: `v0.1.0`
- Current status: `private beta published; unsigned macOS + Windows release is live for testers`

## Distribution Decision

- Release type: `private beta`
- macOS: ship `unsigned` and `not notarized`
- Windows: ship `unsigned`
- Signing/notarization is explicitly deferred for `v0.1.0` because this build is staying private.
- Testers should be told up front that macOS Gatekeeper and Windows reputation warnings are expected for this build.

## Validated Scope

- macOS packaged validation passed for install, launch, runtime/storage diagnostics, create/save/reopen, roster -> sheet -> edit routing, JSON export, PDF export, and reinstall-over-existing-data persistence.
- Windows packaged validation passed for create/save/reopen, JSON export/import, PDF export, and reinstall-over-existing-data persistence.
- The current validated artifact set on this machine is:
  - `release/DND Character Sheet-0.1.0-arm64.dmg`
  - `release/DND Character Sheet-0.1.0-arm64.dmg.blockmap`
  - `release/DND Character Sheet Setup 0.1.0.exe`
  - `release/DND Character Sheet Setup 0.1.0.exe.blockmap`
  - `release/win-unpacked/`
- `package.json` is already at version `0.1.0`.

## Latest Local Verification

- On `2026-03-07`, `npx -y -p node@22 -p npm@10 npm run release:verify-local` passed on this machine.
- That command covered `typecheck`, `test`, macOS DMG build, Windows unpacked packaging, and Windows NSIS installer generation.
- The clean release commit is `7ffcbfd`, and tag `v0.1.0` has already been pushed to `origin`.
- A ready-to-paste GitHub release body now lives in `docs/RELEASE_BODY_v0.1.0.md`.

## Published Release

- GitHub release: `https://github.com/dillybop1/DnD-Character-Sheet-Program-2/releases/tag/v0.1.0`
- Published state: `private pre-release`
- Attached installer assets:
  - `DND Character Sheet-0.1.0-arm64.dmg`
  - `DND Character Sheet Setup 0.1.0.exe`

## Build Baseline

Use Node `22.x`.

```bash
npm install
npm run typecheck
npm run test
npm run build
npm run pack:win-local
npm run build:win-local
```

Notes:

- `npm run build` produces the macOS DMG through `electron-builder`.
- `npm run pack:win-local` and `npm run build:win-local` are the current Windows validation path when local `winCodeSign` symlink privileges are not available.
- `npm run release:verify-local` now bundles the local private-beta verification flow into one command.
- If the release shell does not already have Node `22.x` active, this repo can use `npx -y -p node@22 -p npm@10 npm run <script>` as a temporary fallback. A quick check is `npx -y node@22 -v`.
- `M1-03` remains blocked, so browser-backed `npm run dev` is still the supported live development workflow.

## Remaining Release Gaps

- No blocking gaps remain for the published private beta.
- A future public release still needs a separate signing/notarization milestone.
- If the installers are rebuilt again later, update this file if the artifact filenames change.

## Publish Checklist

1. Reconfirm Node `22.x` on the release machine, or use `npx -y -p node@22 -p npm@10 npm ...`, and run a clean `npm install`.
2. Use commit `7ffcbfd` and pushed tag `v0.1.0` as the private-beta snapshot.
3. Rebuild or explicitly bless the current validated artifacts with `npm run release:verify-local` on Node `22.x` if you want a fresh artifact set before publishing.
4. Publish a private release for tag `v0.1.0`.
5. Attach the DMG and NSIS installer artifacts.
6. Include the unsigned-install caveat in the release notes.

Status: completed for `v0.1.0`.

## Tester Caveats

- macOS testers should expect a first-launch trust warning because the app is unsigned and not notarized.
- Windows testers should expect an unknown-publisher or reputation warning because the installer is unsigned.
- This build should be shared directly with trusted testers, not presented as a polished public release.

## Draft Release Notes

- First private-beta desktop build for macOS and Windows using `Electron + React + TypeScript`.
- Roster-first single-window workflow with dedicated saved-sheet and editor routes.
- Offline SQLite persistence with JSON export/import for cross-machine transfer.
- Linked compendium, bounded homebrew support, and starter feat automation.
- Print/PDF export plus packaged installer validation on macOS and Windows.
- Unsigned distribution for trusted testers while signing/notarization is deferred.
