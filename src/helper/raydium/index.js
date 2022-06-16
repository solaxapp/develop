const RAYDIUM_API = "https://api.raydium.io/v2/";

export const getAllRaydiumPools = async () => {
    try {
        const resp = await window.fetch(RAYDIUM_API + "main/pairs");
        return await resp.json();
    } catch {
        // ignore
    }
}