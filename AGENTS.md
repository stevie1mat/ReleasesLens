# ReleaseLens

For interface changes, read `.agents/skills/clear-workspace-theme/SKILL.md` and preserve the reference-based light workspace theme. The skill is intentionally stored with this project.

The comparison engine lives in `engine/` (Rust), runs as WebAssembly in a browser worker, and must not upload user archives. Chat is deterministic question handling over report data; do not imply a language model is connected.

After changing Rust code, run `npm run test:engine`, `npm run build:engine`, and `npm run build`. Keep the compiled `public/engine/releaselens.wasm` with the source so ordinary Vercel builds do not need a Rust toolchain. After UI behavior changes, run `npm run test:e2e`.

Do not execute uploaded app contents. Preserve archive size, file-count, metadata, decompression, and path checks. Disclose unsupported analysis rather than returning fabricated results.
