// @0xward/cultos-utils
// AI-powered meme coin generator framework for the Stacks ecosystem (Bitcoin L2)
// SIP-10 compliant token metadata, viral factor scoring, and cult mechanics

const SIP10_STANDARD       = "SIP-010";
const STACKS_ECOSYSTEM     = "Stacks Bitcoin L2";
const DEFAULT_SUPPLY       = "1000000000";
const MAX_TICKER_LENGTH    = 8;
const MIN_TICKER_LENGTH    = 2;
const MAX_NAME_LENGTH      = 64;

const CULT_ARCHETYPES = {
    degen:   { viralMultiplier: 1.8, description: "High risk, high reward degenerate energy"  },
    meme:    { viralMultiplier: 2.0, description: "Pure internet culture and meme propagation" },
    oracle:  { viralMultiplier: 1.5, description: "Mystical on-chain prophecy narrative"       },
    rebel:   { viralMultiplier: 1.6, description: "Anti-establishment movement energy"         },
    cosmic:  { viralMultiplier: 1.7, description: "Universal and transcendental branding"      },
};

const TOKENOMICS_PRESETS = {
    fair:    { community: 80, team: 10, treasury: 10 },
    stealth: { community: 95, team: 0,  treasury: 5  },
    vested:  { community: 60, team: 20, treasury: 20 },
};

class CultOSUtils {
    constructor(options = {}) {
        this.ecosystem  = options.ecosystem  || STACKS_ECOSYSTEM;
        this.standard   = options.standard   || SIP10_STANDARD;
        this.version    = "1.1.7";
    }

    _validateTicker(ticker) {
        if (typeof ticker !== "string" || ticker.trim().length === 0) {
            throw new Error("ticker must be a non-empty string.");
        }
        const clean = ticker.trim().toUpperCase();
        if (clean.length < MIN_TICKER_LENGTH || clean.length > MAX_TICKER_LENGTH) {
            throw new Error(
                `ticker must be ${MIN_TICKER_LENGTH}–${MAX_TICKER_LENGTH} characters. Got: "${clean}" (${clean.length})`
            );
        }
        if (!/^[A-Z0-9]+$/.test(clean)) {
            throw new Error(`ticker must only contain uppercase letters and digits. Got: "${clean}"`);
        }
        return clean;
    }

    _validateName(name) {
        if (typeof name !== "string" || name.trim().length === 0) {
            throw new Error("name must be a non-empty string.");
        }
        if (name.trim().length > MAX_NAME_LENGTH) {
            throw new Error(`name must not exceed ${MAX_NAME_LENGTH} characters.`);
        }
        return name.trim();
    }

    _validateSupply(supply) {
        const s = String(supply || DEFAULT_SUPPLY).replace(/_/g, "");
        if (!/^\d+$/.test(s) || BigInt(s) <= 0n) {
            throw new Error(`supply must be a positive integer string. Got: "${supply}"`);
        }
        return s;
    }

    _computeViralScore(archetype, supply, nameLength) {
        const base      = CULT_ARCHETYPES[archetype]?.viralMultiplier || 1.0;
        const supplyNum = Math.log10(parseFloat(supply) || 1);
        const namePenalty = nameLength > 20 ? 0.9 : 1.0;
        const raw = base * (supplyNum / 10) * namePenalty * 100;
        return Math.min(Math.round(raw), 100);
    }

    static generateMemeMetadata(name, ticker, options = {}) {
        const instance = new CultOSUtils(options);
        return instance.generateMemeMetadata(name, ticker, options);
    }

    generateMemeMetadata(name, ticker, options = {}) {
        const validName    = this._validateName(name);
        const validTicker  = this._validateTicker(ticker);
        const supply       = this._validateSupply(options.supply);
        const archetype    = options.archetype || "meme";
        const decimals     = options.decimals  ?? 6;
        const preset       = options.tokenomics || "fair";

        if (!CULT_ARCHETYPES[archetype]) {
            throw new Error(
                `Unknown archetype: "${archetype}". Use: ${Object.keys(CULT_ARCHETYPES).join(", ")}.`
            );
        }
        if (!TOKENOMICS_PRESETS[preset]) {
            throw new Error(
                `Unknown tokenomics preset: "${preset}". Use: ${Object.keys(TOKENOMICS_PRESETS).join(", ")}.`
            );
        }

        const viralScore   = this._computeViralScore(archetype, supply, validName.length);
        const tokenomics   = TOKENOMICS_PRESETS[preset];
        const cultMeta     = CULT_ARCHETYPES[archetype];

        return {
            name:          validName,
            ticker:        validTicker,
            supply,
            decimals,
            sip10Standard: this.standard,
            ecosystem:     this.ecosystem,
            securedBy:     "Bitcoin",
            archetype,
            archetypeDescription: cultMeta.description,
            viralScore,
            viralRating:   viralScore >= 80 ? "Viral" : viralScore >= 50 ? "Growing" : "Niche",
            tokenomics: {
                preset,
                communityPercent: tokenomics.community,
                teamPercent:      tokenomics.team,
                treasuryPercent:  tokenomics.treasury,
            },
            generatedAt:   new Date().toISOString(),
            sdkVersion:    this.version,
        };
    }

    computeViralFactor(metadata) {
        if (!metadata || typeof metadata !== "object") {
            throw new Error("metadata must be a valid object.");
        }
        if (!metadata.ticker || !metadata.name) {
            throw new Error("metadata must include 'ticker' and 'name'.");
        }
        const archetype  = metadata.archetype || "meme";
        const supply     = metadata.supply    || DEFAULT_SUPPLY;
        return this._computeViralScore(archetype, supply, metadata.name.length);
    }

    getCultArchetypes() {
        return Object.entries(CULT_ARCHETYPES).map(([key, val]) => ({ id: key, ...val }));
    }

    getTokenomicsPresets() {
        return Object.entries(TOKENOMICS_PRESETS).map(([key, val]) => ({ id: key, ...val }));
    }

    getVersion() {
        return this.version;
    }
}

module.exports = { CultOSUtils, CULT_ARCHETYPES, TOKENOMICS_PRESETS, SIP10_STANDARD };
