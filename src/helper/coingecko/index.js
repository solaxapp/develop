const COINGECKO_API = "https://api.coingecko.com/api/v3"

export const getCoinGeckoPriceForTokens = async (tokens = [], currency) => {
    try {
        const resp = await window.fetch(COINGECKO_API + `/simple/price?ids=${tokens}&vs_currencies=${currency}`);
        return await resp.json();
    } catch {
        // ignore
    }
}