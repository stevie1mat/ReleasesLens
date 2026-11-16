#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH="${CARGO_HOME:-$HOME/.cargo}/bin:$PATH"
cargo build --manifest-path engine/Cargo.toml --target wasm32-unknown-unknown --release --locked
mkdir -p public/engine
cp engine/target/wasm32-unknown-unknown/release/releaselens_engine.wasm public/engine/releaselens.wasm
