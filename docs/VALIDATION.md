# Validation — 2026-11-16

- Production build: TypeScript checks and Vite build passed.
- Rust: 8 tests passed, including exact content changes, container-only changes, Android metadata, native-library paths, Mac binary plist parsing/root normalization, invalid inputs, app-identifier mismatches, and expanded-size limits.
- Browser acceptance: 9 tests passed. Covered sample analysis, permissions, native libraries, sizes, JSON export, uploads, filters, local history, new sessions, invalid archives, help/settings, unsupported questions, mobile layout, cancellation, and file replacement. Optional integration tests were enabled with the existing MouseForMobile APK and Mac app ZIP; both compared successfully without modifying them.
- Production smoke: passed against built static assets with the headers from `vercel.json`, including CSP. The WebAssembly worker loaded, the sample comparison and size view worked, no browser errors occurred, and no external requests were observed.
- Theme skill: official quick validator passed. Desktop welcome, desktop comparison, and mobile screenshots were visually inspected.

The in-app browser host was unavailable, so a visible in-app preview could not be opened. Automated Chromium checks and actual screenshots were used for verification.

Not verified: deployed Vercel hosting, Safari/Firefox, very large archives near every configured limit, arbitrary APK vendor variants, complete dependency inventories, app safety/signing, and runtime behavior of uploaded apps.
