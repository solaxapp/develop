export const DEFAULT_SLIPPAGE = 0.1;
export const DEFAULT_DENOMINATOR = 10_000;
export const LIQUIDITY_PROVIDER_FEE = 0.003;
export const SERUM_FEE = 0.0005;
export const POOLS_WITH_AIRDROP = [];
export const STABLE_COINS = new Set(["USDC", "wUSDC", "USDT", "wUSDT", "WUSDT"]);
export const LIQUIDITY_TOKEN_PRECISION = 8;

export const PoolOperation = {
    Add: 0,
    SwapGivenInput: 1,
    SwapGivenProceeds: 2,
}

export const CurveType  = {
    ConstantProduct: 0,
    ConstantPrice: 1,
    Stable: 2,
    ConstantProductWithOffset: 3,
}

export const CHAINS = {
    solana: "Solana",
    eth: "Etherium",
    bnb: "Binance"
}