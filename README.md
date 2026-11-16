<div align="center">

# ReleaseLens

### Two releases. Every difference.

Compare app builds in your browser. See what changed, ask about the details, and export the report.

![Rust](https://img.shields.io/badge/engine-Rust-dea584?style=flat-square)
![WebAssembly](https://img.shields.io/badge/runtime-WebAssembly-654ff0?style=flat-square)
![Local analysis](https://img.shields.io/badge/analysis-on_device-36b88c?style=flat-square)

[Quick start](#quick-start) · [Features](#what-you-get) · [Supported formats](#supported-formats) · [Development](#development)

</div>

![ReleaseLens circular release comparison and report chat](docs/screenshots/releaselens-workspace.png)

ReleaseLens turns two app archives into a file-by-file comparison. A Rust engine runs as WebAssembly in a browser worker, checking file contents with SHA-256. Your app archives stay on your device.

- **See the difference.** One circular chart separates the previous release on the left from the new release on the right. Hover over a segment for its percentage and file count.
- **Look closer.** Search changed paths, inspect declared permissions, compare package sizes, and review native-library paths.
- **Take the report with you.** Download JSON or a standalone HTML report.

## Quick start

Requires **Node.js 20.19+ or 22.12+**. The compiled Rust engine is included; running the app does not require a Rust toolchain.

```sh
git clone https://github.com/stevie1mat/ReleasesLens.git
cd ReleasesLens
npm ci
npm run dev
```

Open the local URL printed by Vite. Choose a previous release and a new release, then select **Compare releases**.

Want to explore first? Select **Try a sample comparison**. It runs the same engine against included, non-installable APK fixtures.

## Try it with two files

Use the ZIP archives in [`test/`](test):

| Previous release | New release |
| --- | --- |
| [`release-before.zip`](test/release-before.zip) | [`release-after.zip`](test/release-after.zip) |

Expected result: **1 added, 1 removed, 3 modified, and 1 unchanged file.** Each ring half shows 60% modified and 20% unchanged, with 20% removed on the left and 20% added on the right.

After comparison, try:

```text
Which files changed?
Which permissions were added?
Why did the package size change?
Which native libraries were added?
```

Chat answers supported questions directly from the comparison report using predefined local handling. It does not connect to a language model or analyze source-code behavior.

## What you get

| Feature | Details |
| --- | --- |
| Content comparison | Added, removed, modified, and unchanged files based on SHA-256 of decompressed contents |
| Release chart | Separate previous/new release halves with category percentages and hover details |
| File explorer | Search paths and filter by change type |
| Size breakdown | Compressed package sizes, expanded sizes, and file-level deltas |
| Android metadata | Package ID, version, SDK levels, and declared permission differences |
| Mac metadata | App identifiers and versions from XML or binary `Info.plist` |
| Native libraries | Added/removed Android `.so`, Mac `.dylib`, and bundled `.framework` paths |
| Report export | JSON and standalone HTML downloads |
| Local persistence | Up to eight conversations and report data saved in this browser |

## Supported formats

| Format | Support |
| --- | --- |
| Android APK | Archive contents and binary AXML or text XML manifests |
| Mac app ZIP | One `.app` per archive; root names normalized and Finder metadata ignored |
| General ZIP | File contents, sizes, and path differences |
| AAB, IPA, DMG, encrypted ZIP | Not supported |

Compare matching archive types. Mismatched app identifiers, ambiguous or duplicate paths, and unreadable archives are rejected. Compression support depends on the bundled ZIP engine.

### Archive limits

| Limit | Per archive |
| --- | --- |
| Compressed size | 100 MiB |
| Expanded size | 512 MiB |
| Single entry | 128 MiB |
| Entries | 20,000 |
| Metadata file | 4 MiB |

App contents are read in memory, never executed or extracted to disk.

## Privacy and scope

Archive analysis runs in a browser worker with no application backend or archive uploads. There is no account, analytics integration, remote font, or external model. Conversation history stores report data locally, not archive bytes; large reports may be omitted to bound storage use. Exported reports contain paths and metadata.

**ReleaseLens compares packages; it does not establish whether an app is safe.** Signing-certificate verification, malware scanning, DEX decompilation, complete dependency/version resolution, Mac entitlements, and runtime testing are outside its scope. Metadata parsing warnings appear in the report.

## How it works

```text
Previous archive + New archive
              │
              ▼
      Browser Web Worker
      Rust → WebAssembly
              │
     Validate archive limits
     Read metadata and paths
     Hash and compare contents
              │
              ▼
   Circular chart + Report chat
              │
              ▼
       JSON / HTML export
```

## Development

### Build the application

```sh
npm ci
npm run build
npm run preview
```

### Work on the Rust engine

Engine source lives in [`engine/src/lib.rs`](engine/src/lib.rs). Install Rust and the WebAssembly target, then run:

```sh
rustup target add wasm32-unknown-unknown
npm run test:engine
npm run build:engine
npm run build
```

Commit the rebuilt [`public/engine/releaselens.wasm`](public/engine/releaselens.wasm) alongside engine changes. Ordinary deployments use this compiled asset.

### Run browser tests

```sh
npx playwright install chromium
npm run test:e2e
```

The suite covers comparisons, report questions, filters, exports, invalid inputs, cancellation, chart percentages, tooltips, and responsive viewport behavior. Optional integration tests read existing archives from `RELEASELENS_INTEGRATION_APK` and `RELEASELENS_INTEGRATION_MAC_ZIP`; they skip when those paths are absent.

To check the production bundle with Vercel headers:

```sh
npm run build
node tests/production-smoke.mjs
```

## Deploy

Import the repository into Vercel as a Vite project:

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Output directory | `dist` |

[`vercel.json`](vercel.json) supplies static hosting headers. The compiled WebAssembly engine is served as a static asset, so deployment needs no Rust compiler, backend, secrets, or upload storage.
