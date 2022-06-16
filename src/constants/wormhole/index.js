import {CHAIN_ID_BSC, CHAIN_ID_ETH, CHAIN_ID_SOLANA} from "@certusone/wormhole-sdk";
import {getAddress} from "@ethersproject/address";

export const MAX_VAA_UPLOAD_RETRIES_SOLANA = 5;

export const SOL_BRIDGE_ADDRESS = (network) => {
    return network === "mainnet"
        ? "worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth"
        : network === "testnet"
            ? "3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5"
            : "Bridge1p5gheXUvJ6jGWGeCsgPKgnE3YgdGKRVCMY9o";
}

export const BSC_TOKEN_BRIDGE_ADDRESS = (network) => getAddress(
    network === "mainnet"
        ? "0xB6F6D86a8f9879A9c87f643768d9efc38c1Da6E7"
        : network === "testnet"
            ? "0x9dcF9D205C9De35334D646BeE44b2D2859712A09"
            : "0x0290FB167208Af455bB137780163b7B7a9a10C16"
);

export const BSC_BRIDGE_ADDRESS = (network) => getAddress(
    network === "mainnet"
        ? "0x98f3c9e6E3fAce36bAAd05FE09d375Ef1464288B"
        : network === "testnet"
            ? "0x68605AD7b15c732a30b1BbC62BE8F2A509D74b4D"
            : "0xC89Ce4735882C9F0f0FE26686c53074E09B0D550"
);

export const ETH_BRIDGE_ADDRESS = (network) => getAddress(
    network === "mainnet"
        ? "0x98f3c9e6E3fAce36bAAd05FE09d375Ef1464288B"
        : network === "testnet"
            ? "0x706abc4E45D419950511e474C7B9Ed348A4a716c"
            : "0xC89Ce4735882C9F0f0FE26686c53074E09B0D550"
);

export const ETH_TOKEN_BRIDGE_ADDRESS = (network) => getAddress(
    network === "mainnet"
        ? "0x3ee18B2214AFF97000D974cf647E7C347E8fa585"
        : network === "testnet"
            ? "0xF890982f9310df57d00f659cf4fd87e65adEd8d7"
            : "0x0290FB167208Af455bB137780163b7B7a9a10C16"
);

export const SOL_TOKEN_BRIDGE_ADDRESS = (network) => {
    return network === "mainnet"
        ? "wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb"
        : network === "testnet"
            ? "DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe"
            : "B6RHG3mfcckmrYN1UhmJzyS1XX3fZKbkeUcpJe9Sy3FE";
}

export const WORMHOLE_RPC_HOSTS = (network) => {
    return network === "mainnet"
        ? [
            "https://wormhole-v2-mainnet-api.certus.one",
            "https://wormhole.inotel.ro",
            "https://wormhole-v2-mainnet-api.mcf.rocks",
            "https://wormhole-v2-mainnet-api.chainlayer.network",
            "https://wormhole-v2-mainnet-api.staking.fund",
            "https://wormhole-v2-mainnet.01node.com",
        ]
        : network === "testnet"
            ? ["https://wormhole-v2-testnet-api.certus.one"]
            : ["http://localhost:7071"];
}


export const TERRA_TOKEN_METADATA_URL = "https://assets.terra.money/cw20/tokens.json";
export const FEATURED_MARKETS_JSON_URL = "https://raw.githubusercontent.com/certusone/wormhole-token-list/main/src/markets.json";

export const ETH_NETWORK_CHAIN_ID = (network) => network === "mainnet" ? 1 : network === "testnet" ? 5 : 1337;
export const BSC_NETWORK_CHAIN_ID = (network) => network === "mainnet" ? 56 : network === "testnet" ? 97 : 1397;

export const getEvmChainId = (chainId, network) =>
    chainId === CHAIN_ID_ETH
        ? ETH_NETWORK_CHAIN_ID(network)
        : chainId === CHAIN_ID_BSC
            ? BSC_NETWORK_CHAIN_ID(network)
            : CHAIN_ID_SOLANA;

export const METAMASK_CHAIN_PARAMETERS = {
    1: {
        chainId: "0x1",
        chainName: "Ethereum Mainnet",
        nativeCurrency: {name: "Ether", symbol: "ETH", decimals: 18},
        rpcUrls: ["https://rpc.ankr.com/eth"],
        blockExplorerUrls: ["https://etherscan.io"],
    },
    3: {
        chainId: "0x3",
        chainName: "Ropsten",
        nativeCurrency: {name: "Ropsten Ether", symbol: "ROP", decimals: 18},
        rpcUrls: ["https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"],
        blockExplorerUrls: ["https://ropsten.etherscan.io"],
    },
    5: {
        chainId: "0x5",
        chainName: "Görli",
        nativeCurrency: {name: "Görli Ether", symbol: "GOR", decimals: 18},
        rpcUrls: ["https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"],
        blockExplorerUrls: ["https://goerli.etherscan.io"],
    },
    56: {
        chainId: "0x38",
        chainName: "Binance Smart Chain Mainnet",
        nativeCurrency: {
            name: "Binance Chain Native Token",
            symbol: "BNB",
            decimals: 18,
        },
        rpcUrls: ["https://bsc-dataseed.binance.org"],
        blockExplorerUrls: ["https://bscscan.com"],
    },
    97: {
        chainId: "0x61",
        chainName: "Binance Smart Chain Testnet",
        nativeCurrency: {
            name: "Binance Chain Native Token",
            symbol: "BNB",
            decimals: 18,
        },
        rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545"],
        blockExplorerUrls: ["https://testnet.bscscan.com"],
    },
    137: {
        chainId: "0x89",
        chainName: "Polygon Mainnet",
        nativeCurrency: {name: "MATIC", symbol: "MATIC", decimals: 18},
        rpcUrls: ["https://polygon-rpc.com"],
        blockExplorerUrls: ["https://polygonscan.com"],
    },
    250: {
        chainId: "0xfa",
        chainName: "Fantom Opera",
        nativeCurrency: {name: "Fantom", symbol: "FTM", decimals: 18},
        rpcUrls: ["https://rpc.ftm.tools"],
        blockExplorerUrls: ["https://ftmscan.com"],
    },
    686: {
        chainId: "0x2ae",
        chainName: "Karura Testnet",
        nativeCurrency: {name: "Karura Token", symbol: "KAR", decimals: 18},
        rpcUrls: ["https://karura-dev.aca-dev.network/eth/http"],
        blockExplorerUrls: ["https://blockscout.karura-dev.aca-dev.network"],
    },
    787: {
        chainId: "0x313",
        chainName: "Acala Testnet",
        nativeCurrency: {name: "Acala Token", symbol: "ACA", decimals: 18},
        rpcUrls: ["https://acala-dev.aca-dev.network/eth/http"],
        blockExplorerUrls: ["https://blockscout.acala-dev.aca-dev.network"],
    },
    4002: {
        chainId: "0xfa2",
        chainName: "Fantom Testnet",
        nativeCurrency: {name: "Fantom", symbol: "FTM", decimals: 18},
        rpcUrls: ["https://rpc.testnet.fantom.network"],
        blockExplorerUrls: ["https://testnet.ftmscan.com"],
    },
    42261: {
        chainId: "0xa515",
        chainName: "Emerald Paratime Testnet",
        nativeCurrency: {name: "Emerald Rose", symbol: "ROSE", decimals: 18},
        rpcUrls: ["https://testnet.emerald.oasis.dev"],
        blockExplorerUrls: ["https://testnet.explorer.emerald.oasis.dev"],
    },
    42262: {
        chainId: "0xa516",
        chainName: "Emerald Paratime Mainnet",
        nativeCurrency: {name: "Emerald Rose", symbol: "ROSE", decimals: 18},
        rpcUrls: ["https://emerald.oasis.dev"],
        blockExplorerUrls: ["https://explorer.emerald.oasis.dev"],
    },
    43113: {
        chainId: "0xa869",
        chainName: "Avalanche Fuji Testnet",
        nativeCurrency: {name: "Avalanche", symbol: "AVAX", decimals: 18},
        rpcUrls: ["https://api.avax-test.network/ext/bc/C/rpc"],
        blockExplorerUrls: ["https://testnet.snowtrace.io"],
    },
    43114: {
        chainId: "0xa86a",
        chainName: "Avalanche C-Chain",
        nativeCurrency: {name: "Avalanche", symbol: "AVAX", decimals: 18},
        rpcUrls: ["https://api.avax.network/ext/bc/C/rpc"],
        blockExplorerUrls: ["https://snowtrace.io"],
    },
    80001: {
        chainId: "0x13881",
        chainName: "Mumbai",
        nativeCurrency: {name: "MATIC", symbol: "MATIC", decimals: 18},
        rpcUrls: ["https://rpc-mumbai.maticvigil.com"],
        blockExplorerUrls: ["https://mumbai.polygonscan.com"],
    },
    1313161554: {
        chainId: "0x4e454152",
        chainName: "Aurora Mainnet",
        nativeCurrency: {name: "Ether", symbol: "ETH", decimals: 18},
        rpcUrls: ["https://mainnet.aurora.dev"],
        blockExplorerUrls: ["https://aurorascan.dev"],
    },
    1313161555: {
        chainId: "0x4e454153",
        chainName: "Aurora Testnet",
        nativeCurrency: {name: "Ether", symbol: "ETH", decimals: 18},
        rpcUrls: ["https://testnet.aurora.dev"],
        blockExplorerUrls: ["https://testnet.aurorascan.dev"],
    },
};

export const getBridgeAddressForChain = (chainId, network) =>
    chainId === CHAIN_ID_SOLANA
        ? SOL_BRIDGE_ADDRESS(network)
        : chainId === CHAIN_ID_ETH
            ? ETH_BRIDGE_ADDRESS(network)
            : chainId === CHAIN_ID_BSC
                ? BSC_BRIDGE_ADDRESS(network)
                : "";

export const getTokenBridgeAddressForChain = (chainId, network) =>
    chainId === CHAIN_ID_SOLANA
        ? SOL_TOKEN_BRIDGE_ADDRESS(network)
        : chainId === CHAIN_ID_ETH
            ? ETH_TOKEN_BRIDGE_ADDRESS(network)
            : chainId === CHAIN_ID_BSC
                ? BSC_TOKEN_BRIDGE_ADDRESS(network)
                : "";