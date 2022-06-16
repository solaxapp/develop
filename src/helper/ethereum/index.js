import {TokenImplementation__factory,} from "@certusone/wormhole-sdk";
import {formatUnits} from "ethers/lib.esm/utils";
import {ethers} from "ethers";

const ERC20_BASIC_ABI = [
    "function name() view returns (string name)",
    "function symbol() view returns (string symbol)",
    "function decimals() view returns (uint8 decimals)",
];

const handleError = (e) => {
    return undefined;
};


//This is a valuable intermediate step to the parsed token account, as the token has metadata information on it.
export async function getEthereumToken(tokenAddress, provider) {
    const token = TokenImplementation__factory.connect(tokenAddress, provider);
    return token;
}

export async function ethTokenToParsedTokenAccount(token, signerAddress) {
    const decimals = await token.decimals();
    const balance = await token.balanceOf(signerAddress);
    const symbol = await token.symbol();
    const name = await token.name();
    return {
        publicKey: signerAddress,
        mintKey: token.address,
        amount: balance.toString(),
        decimals: decimals,
        uiAmount: Number(formatUnits(balance, decimals)),
        uiAmountString: formatUnits(balance, decimals),
        symbol: symbol,
        name: name,
    }
}

export const fetchEthTokenMetaData = async (address, provider) => {
    console.log("ADDRESSS", address)
    const contract = await new ethers.Contract(address, ERC20_BASIC_ABI, provider);
    const tokenName = await contract.name().catch(handleError)
    const symbol = await contract.symbol().catch(handleError)
    const decimals = await contract.decimals().catch(handleError)
    return {tokenName, symbol, decimals};
};