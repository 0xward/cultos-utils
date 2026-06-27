// @0xward/cultos-utils
// Shared utility layer for CultOS — the AI-powered memetic identity engine on Stacks (Bitcoin L2).
// Provides fee calculation, token field sanitization, viral score rating, and SIP-010 metadata
// generation — the same logic used by the CultOS V2 web app before every on-chain deployment.

const SIP10_STANDARD   = "SIP-010";
const STACKS_ECOSYSTEM = "Stacks Bitcoin L2";
const DEFAULT_SUPPLY   = "1000000000";

// ─── NETWORK CONFIG ───────────────────────────────────────────────────────────
const STACKS_NETWORKS = {
  mainnet: { chainId: 1,          apiUrl: "https://api.mainnet.hiro.so",  currency: "STX" },
  testnet: { chainId: 2147483648, apiUrl: "https://api.testnet.hiro.so",  currency: "STX" },
  devnet:  { chainId: 2147483648, apiUrl: "http://localhost:3999",         currency: "STX" },
};

// ─── CULT ARCHETYPES ──────────────────────────────────────────────────────────
const CULT_ARCHETYPES = {
  degen:  { viralMultiplier: 1.8, description: "High risk, high reward degenerate energy"  },
  meme:   { viralMultiplier: 2.0, description: "Pure internet culture and meme propagation" },
  oracle: { viralMultiplier: 1.5, description: "Mystical on-chain prophecy narrative"       },
  rebel:  { viralMultiplier: 1.6, description: "Anti-establishment movement energy"         },
  cosmic: { viralMultiplier: 1.7, description: "Universal and transcendental branding"      },
};

// ─── TOKENOMICS PRESETS ───────────────────────────────────────────────────────
const TOKENOMICS_PRESETS = {
  fair:    { community: 80, team: 10, treasury: 10 },
  stealth: { community: 95, team: 0,  treasury: 5  },
  vested:  { community: 60, team: 20, treasury: 20 },
};

// ─── FIELD LIMITS (mirrors oracle.ts server-side guards) ─────────────────────
const FIELD_LIMITS = {
  name:   64,
  ticker: 8,
  lore:   490,
};

class CultOSUtils {
  /**
   * @param {Object} options
   * @param {"mainnet"|"testnet"|"devnet"} [options.network="mainnet"]
   * @param {string}  [options.ecosystem]
   * @param {string}  [options.standard]
   */
  constructor(options = {}) {
    const net = options.network || "mainnet";
    if (!STACKS_NETWORKS[net]) {
      throw new Error(`Unsupported network: "${net}". Use "mainnet", "testnet", or "devnet".`);
    }
    this.networkName   = net;
    this.networkConfig = STACKS_NETWORKS[net];
    this.ecosystem     = options.ecosystem || STACKS_ECOSYSTEM;
    this.standard      = options.standard  || SIP10_STANDARD;
    this.version       = "1.2.0";
  }

  // ── SANITIZATION ─────────────────────────────────────────────────────────────

  /**
   * Sanitize a token field to printable ASCII, identical to the guard used in
   * CultOS V2's handleDeploy() before every on-chain contract call.
   *
   * @param {string} str
   * @param {"name"|"ticker"|"lore"} field
   * @returns {string}
   */
  sanitizeField(str, field) {
    if (typeof str !== "string") throw new Error(`sanitizeField: "${field}" must be a string.`);
    const max = FIELD_LIMITS[field];
    if (!max) throw new Error(`sanitizeField: unknown field "${field}". Use: name, ticker, lore.`);
    return str.replace(/[^ -~]/g, "").slice(0, max).trim();
  }

  /**
   * Sanitize all three required token fields at once.
   * Returns { safeName, safeTicker, safeLore } ready to pass to openContractCall().
   *
   * @param {{ upgradedName: string, ticker: string, lore: string }} oracleResult
   * @returns {{ safeName: string, safeTicker: string, safeLore: string }}
   */
  sanitizeOracleResult(oracleResult) {
    if (!oracleResult || typeof oracleResult !== "object") {
      throw new Error("sanitizeOracleResult: expected an oracle result object.");
    }
    return {
      safeName:   this.sanitizeField(oracleResult.upgradedName || "", "name"),
      safeTicker: this.sanitizeField(oracleResult.ticker        || "", "ticker"),
      safeLore:   this.sanitizeField(oracleResult.lore          || "", "lore"),
    };
  }

  // ── FEE CALCULATION ──────────────────────────────────────────────────────────

  /**
   * Compute the deployment fee in STX from a viralScore.
   * Mirrors the formula in CultOS V2 App.tsx handleDeploy():
   *   feeFloat = 0.05 + (viralScore / 100) * 0.1
   *
   * @param {number} viralScore  Integer 40–95 returned by the Oracle.
   * @returns {{ feeSTX: string, microSTX: number, viralScore: number }}
   */
  calcDeployFee(viralScore) {
    const score = Math.min(95, Math.max(40, Math.round(Number(viralScore) || 60)));
    const feeFloat = 0.05 + (score / 100) * 0.1;
    return {
      feeSTX:     feeFloat.toFixed(3),
      microSTX:   Math.round(feeFloat * 1_000_000),
      viralScore: score,
    };
  }

  // ── VIRAL SCORE RATING ────────────────────────────────────────────────────────

  /**
   * Convert a numeric viralScore to the display label used throughout CultOS V2.
   *   >= 80  → "Viral"
   *   >= 50  → "Growing"
   *   < 50   → "Niche"
   *
   * @param {number} viralScore
   * @returns {{ rating: string, color: string }}
   */
  getViralRating(viralScore) {
    const score = Number(viralScore) || 0;
    if (score >= 80) return { rating: "Viral",   color: "#22C55E" };
    if (score >= 50) return { rating: "Growing", color: "#F59E0B" };
    return                  { rating: "Niche",   color: "#EF4444" };
  }

  // ── SIP-010 METADATA ─────────────────────────────────────────────────────────

  /**
   * Generate a fully-shaped SIP-010 token metadata object.
   * Used by CultOS V2 to preview a token before the user confirms deployment.
   *
   * @param {string} name
   * @param {string} ticker
   * @param {Object} [options]
   * @param {string} [options.supply]
   * @param {string} [options.archetype="meme"]
   * @param {number} [options.decimals=6]
   * @param {string} [options.tokenomics="fair"]
   * @returns {Object}
   */
  generateMemeMetadata(name, ticker, options = {}) {
    const safeName   = this.sanitizeField(name,   "name");
    const safeTicker = this.sanitizeField(ticker, "ticker").toUpperCase().replace(/[^A-Z0-9]/g, "");

    if (safeName.length < 3)   throw new Error(`name too short after sanitize: "${safeName}"`);
    if (safeTicker.length < 3) throw new Error(`ticker too short after sanitize: "${safeTicker}"`);

    const supply    = String(options.supply || DEFAULT_SUPPLY).replace(/_/g, "");
    const archetype = options.archetype  || "meme";
    const decimals  = options.decimals   ?? 6;
    const preset    = options.tokenomics || "fair";

    if (!CULT_ARCHETYPES[archetype]) {
      throw new Error(`Unknown archetype: "${archetype}". Use: ${Object.keys(CULT_ARCHETYPES).join(", ")}.`);
    }
    if (!TOKENOMICS_PRESETS[preset]) {
      throw new Error(`Unknown tokenomics preset: "${preset}". Use: ${Object.keys(TOKENOMICS_PRESETS).join(", ")}.`);
    }

    const viralScore = this._computeViralScore(archetype, supply, safeName.length);
    const { rating: viralRating } = this.getViralRating(viralScore);
    const { feeSTX, microSTX }    = this.calcDeployFee(viralScore);
    const tokenomics = TOKENOMICS_PRESETS[preset];
    const cultMeta   = CULT_ARCHETYPES[archetype];

    return {
      name:                 safeName,
      ticker:               safeTicker,
      supply,
      decimals,
      sip10Standard:        this.standard,
      ecosystem:            this.ecosystem,
      securedBy:            "Bitcoin",
      network:              this.networkName,
      archetype,
      archetypeDescription: cultMeta.description,
      viralScore,
      viralRating,
      estimatedFeeSTX:      feeSTX,
      estimatedMicroSTX:    microSTX,
      tokenomics: {
        preset,
        communityPercent: tokenomics.community,
        teamPercent:      tokenomics.team,
        treasuryPercent:  tokenomics.treasury,
      },
      generatedAt: new Date().toISOString(),
      sdkVersion:  this.version,
    };
  }

  // ── HELPERS ───────────────────────────────────────────────────────────────────

  getCultArchetypes() {
    return Object.entries(CULT_ARCHETYPES).map(([key, val]) => ({ id: key, ...val }));
  }

  getTokenomicsPresets() {
    return Object.entries(TOKENOMICS_PRESETS).map(([key, val]) => ({ id: key, ...val }));
  }

  getSupportedNetworks() {
    return Object.keys(STACKS_NETWORKS).map((key) => ({ name: key, ...STACKS_NETWORKS[key] }));
  }

  getVersion() { return this.version; }

  // ── PRIVATE ───────────────────────────────────────────────────────────────────

  _computeViralScore(archetype, supply, nameLength) {
    const base       = CULT_ARCHETYPES[archetype]?.viralMultiplier || 1.0;
    const supplyNum  = Math.log10(parseFloat(supply) || 1);
    const namePenalty = nameLength > 20 ? 0.9 : 1.0;
    const raw = base * (supplyNum / 10) * namePenalty * 100;
    return Math.min(95, Math.max(40, Math.round(raw)));
  }
}

module.exports = { CultOSUtils, CULT_ARCHETYPES, TOKENOMICS_PRESETS, STACKS_NETWORKS, SIP10_STANDARD };
