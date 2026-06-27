<p align="center">
  <img src="https://raw.githubusercontent.com/0xward/CultOS-V2/main/public/CultOS_Logo.png" width="96" alt="CultOS logo" />
</p>

# @0xward/cultos-utils

<p align="center">
  <a href="https://www.npmjs.com/package/@0xward/cultos-utils"><img src="https://img.shields.io/npm/v/@0xward/cultos-utils?style=flat-square" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/package/@0xward/cultos-utils"><img src="https://img.shields.io/npm/dm/@0xward/cultos-utils?style=flat-square" alt="NPM Downloads" /></a>
  <a href="https://www.npmjs.com/package/@0xward/cultos-utils"><img src="https://img.shields.io/npm/l/@0xward/cultos-utils?style=flat-square" alt="License" /></a>
</p>

Shared utility layer for **[CultOS](https://github.com/0xward/CultOS-V2)** — an AI-powered memetic identity engine that permanently inscribes cultural identity vectors onto Bitcoin via Stacks L2. This package provides the fee calculation, token field sanitization, viral score rating, and SIP-010 metadata generation that the CultOS V2 web app runs before every on-chain deployment.

> **Note:** this package does **not** sign or broadcast transactions. It handles the client-side logic layer — computing fees, sanitizing Oracle output, and shaping token metadata — before the user's wallet (Leather / Xverse) signs the actual contract call via `@stacks/connect`.

---

## Installation

```bash
# npm
npm install @0xward/cultos-utils

# yarn
yarn add @0xward/cultos-utils

# pnpm
pnpm add @0xward/cultos-utils
```

**Prerequisites:** Node.js >= 18.0.0

**Peer context:** If you're integrating into a Stacks app, you'll typically also use `@stacks/connect` for wallet connection and `@stacks/transactions` for constructing contract call arguments.

---

## What this package actually does

- **Fee calculation** — `calcDeployFee(viralScore)` computes the STX deployment fee using the same formula as CultOS V2's `handleDeploy()`: `0.05 + (viralScore / 100) * 0.1`. Returns `feeSTX`, `microSTX`, and the clamped score, ready to pass directly to `openContractCall()`.

- **Field sanitization** — `sanitizeField(str, field)` strips non-ASCII characters and enforces character limits (name: 64, ticker: 8, lore: 490), identical to the guard in CultOS V2 before every on-chain call. `sanitizeOracleResult(oracleResult)` sanitizes all three fields at once and returns `{ safeName, safeTicker, safeLore }`.

- **Viral score rating** — `getViralRating(viralScore)` maps a numeric Oracle score to the display label and color used throughout CultOS V2: `>= 80` → Viral (green), `>= 50` → Growing (amber), `< 50` → Niche (red).

- **SIP-010 metadata generation** — `generateMemeMetadata(name, ticker, options)` shapes a complete token metadata object — including ecosystem, network, archetype, tokenomics, fee estimate, and viral rating — for previewing a sub-cult before the user confirms deployment.

### What this package does **not** do
- It does not call the Groq API or the CultOS Oracle. Oracle invocation happens server-side in CultOS V2's Vercel function (`/api/oracle`).
- It does not sign or broadcast Stacks transactions.
- It does not interact with Firebase or any real-time database.

---

## Quick Start

```javascript
const { CultOSUtils } = require("@0xward/cultos-utils");

const utils = new CultOSUtils({ network: "mainnet" });

// 1. Sanitize Oracle output before passing to openContractCall()
const { safeName, safeTicker, safeLore } = utils.sanitizeOracleResult({
  upgradedName: "ENTROPIC VEIL",
  ticker:       "XVRL",
  lore:         "A sovereign signal cast across the memetic substrate...",
});

// 2. Calculate the deployment fee from the Oracle's viralScore
const { feeSTX, microSTX } = utils.calcDeployFee(78);
console.log(`Fee: ${feeSTX} STX (${microSTX} microSTX)`);
// → Fee: 0.128 STX (128000 microSTX)

// 3. Get the display rating for the viralScore
const { rating, color } = utils.getViralRating(78);
console.log(`${rating}`); // → Growing

// 4. Generate a full SIP-010 metadata preview
const metadata = utils.generateMemeMetadata("ENTROPIC VEIL", "XVRL", {
  archetype:  "oracle",
  tokenomics: "fair",
});
console.log(metadata);
```

---

## API Reference

### `new CultOSUtils(options?)`

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `network` | `"mainnet" \| "testnet" \| "devnet"` | `"mainnet"` | Stacks network context. Throws if unsupported. |
| `ecosystem` | `string` | `"Stacks Bitcoin L2"` | Ecosystem label included in metadata output. |
| `standard` | `string` | `"SIP-010"` | Token standard label included in metadata output. |

### Methods

| Method | Parameters | Returns | Description |
| :--- | :--- | :--- | :--- |
| `sanitizeField` | `str: string`, `field: "name"\|"ticker"\|"lore"` | `string` | Strips non-ASCII, enforces field character limit. Mirrors CultOS V2's pre-deploy guard. |
| `sanitizeOracleResult` | `oracleResult: { upgradedName, ticker, lore }` | `{ safeName, safeTicker, safeLore }` | Sanitizes all three required fields at once. |
| `calcDeployFee` | `viralScore: number` | `{ feeSTX, microSTX, viralScore }` | Computes STX fee from viralScore using the CultOS V2 formula. |
| `getViralRating` | `viralScore: number` | `{ rating, color }` | Returns the display label and hex color for a viralScore. |
| `generateMemeMetadata` | `name: string`, `ticker: string`, `options?: Object` | `Object` | Returns a full SIP-010 token metadata object with fee estimate and viral rating. |
| `getCultArchetypes` | — | `Array` | Lists all supported cult archetypes with their viral multipliers. |
| `getTokenomicsPresets` | — | `Array` | Lists all tokenomics distribution presets. |
| `getSupportedNetworks` | — | `Array` | Lists mainnet, testnet, and devnet config (chainId, apiUrl, currency). |
| `getVersion` | — | `string` | Returns the package version string. |

---

## Used by

This package is the shared utility layer behind **[CultOS V2](https://github.com/0xward/CultOS-V2)** — the AI-powered cult identity engine on Stacks. CultOS V2 uses `sanitizeOracleResult()`, `calcDeployFee()`, and `getViralRating()` from this package in its deployment flow before every on-chain `register-cult` contract call.

---

## License

This project is licensed under the terms of the MIT License.
