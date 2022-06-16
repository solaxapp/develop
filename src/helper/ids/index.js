import {PublicKey} from "@solana/web3.js";
import {TokenSwapLayout} from "../crypto/models/TokenSwap2";
import solaxIcon from "../../assets/images/solaxFavicon.png"
import {TokenIcon} from "../../components/TokenIcon";
import React from "react";
import {CHAINS} from "../../constants/app";

//Fr5NhW9Uq6HbvqeK7QLEwKCnTQmJYX9wcXHTm8tutrpF
//FG16puugZaBnWuVbVn3ZcdYaQuv6qTW3i4gEWvLCVFZ3

export const solax_token = {
    address: "BmfhvzTWVyP7VXFSW5VnDCuviuKFVpYs3JYnGANjDqv8",
    chainId: 102,
    decimals: 6,
    extensions: {website: 'https://solax.app'},
    logoURI: solaxIcon,
    name: "Solax",
    symbol: "Solax"
}

export const parsed_solax_token = {
    address: "BmfhvzTWVyP7VXFSW5VnDCuviuKFVpYs3JYnGANjDqv8",
    icon: <TokenIcon mintAddress="8ZY7EkwN7LxifYvvrQDbpjqxkrjHUFMwWgq8fupNNvub" icon={solaxIcon}/>,
    name: "Solax",
    symbol: "Solax",
    chain: CHAINS.solana,
    chainId: 102
}

export const SOLAX_ADDRESS = new PublicKey(
    "BmfhvzTWVyP7VXFSW5VnDCuviuKFVpYs3JYnGANjDqv8"
);

export const WRAPPED_SOL_MINT = new PublicKey(
    "So11111111111111111111111111111111111111112"
);

export const SWAP_PROGRAM_OWNER_FEE_ADDRESS = new PublicKey(
    "FG16puugZaBnWuVbVn3ZcdYaQuv6qTW3i4gEWvLCVFZ3"
);

let TOKEN_PROGRAM_ID = new PublicKey(
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);

let SWAP_PROGRAM_ID;
let SWAP_PROGRAM_LEGACY_IDS;
let SWAP_PROGRAM_LAYOUT;
//
// export const SWAP_HOST_FEE_ADDRESS = process.env.REACT_APP_SWAP_HOST_FEE_ADDRESS
//     ? new PublicKey(`${process.env.REACT_APP_SWAP_HOST_FEE_ADDRESS}`)
//     : SWAP_PROGRAM_OWNER_FEE_ADDRESS;
//
//
// console.debug(`Host address: ${SWAP_HOST_FEE_ADDRESS?.toBase58()}`);
// console.debug(`Owner address: ${SWAP_PROGRAM_OWNER_FEE_ADDRESS?.toBase58()}`);
//
// // legacy pools are used to show users contributions in those pools to allow for withdrawals of funds
// export const PROGRAM_IDS = [
//     {
//         name: "mainnet-beta",
//         swap: () => ({
//             current: new PublicKey("9qvG1zUp8xF1Bi4m6UdRNby1BAAuaDrUxSpv4CmRRMjL"),
//             legacy: [],
//         }),
//     },
//     {
//         name: "testnet",
//         swap: () => ({
//             current: new PublicKey("2n2dsFSgmPcZ8jkmBZLGUM2nzuFqcBGQ3JEEj6RJJcEg"),
//             legacy: [
//                 new PublicKey("9tdctNJuFsYZ6VrKfKEuwwbPp4SFdFw3jYBZU8QUtzeX"),
//                 new PublicKey("CrRvVBS4Hmj47TPU3cMukurpmCUYUrdHYxTQBxncBGqw"),
//             ],
//         }),
//     },
//     {
//         name: "devnet",
//         swap: () => ({
//             current: new PublicKey("BSfTAcBdqmvX5iE2PW88WFNNp2DHhLUaBKk5WrnxVkcJ"),
//             legacy: [
//                 new PublicKey("H1E1G7eD5Rrcy43xvDxXCsjkRggz7MWNMLGJ8YNzJ8PM"),
//                 new PublicKey("CMoteLxSPVPoc7Drcggf3QPg3ue8WPpxYyZTg77UGqHo"),
//                 new PublicKey("EEuPz4iZA5reBUeZj6x1VzoiHfYeHMppSCnHZasRFhYo"),
//             ],
//         }),
//     },
//     {
//         name: "localnet",
//         swap: () => ({
//             current: new PublicKey("5rdpyt5iGfr68qt28hkefcFyF4WtyhTwqKDmHSBG8GZx"),
//             legacy: [],
//         }),
//     },
// ];
//
// export const setProgramIds = (envName) => {
//     let instance = PROGRAM_IDS.find((env) => env.name === envName);
//     if (!instance) {
//         return;
//     }
//
//     let swap = instance.swap();
//
//     SWAP_PROGRAM_ID = swap.current;
//     SWAP_PROGRAM_LEGACY_IDS = swap.legacy;
// };
//
// export const programIds = () => {
//     return {
//         token: TOKEN_PROGRAM_ID,
//         swap: SWAP_PROGRAM_ID,
//         swap_legacy: SWAP_PROGRAM_LEGACY_IDS,
//     };
// };
export const SWAP_HOST_FEE_ADDRESS = process.env.REACT_APP_SWAP_HOST_FEE_ADDRESS
    ? new PublicKey(`${process.env.REACT_APP_SWAP_HOST_FEE_ADDRESS}`)
    : SWAP_PROGRAM_OWNER_FEE_ADDRESS;

export const ENABLE_FEES_INPUT = true;

console.debug(`Host address: ${SWAP_HOST_FEE_ADDRESS?.toBase58()}`);
console.debug(`Owner address: ${SWAP_PROGRAM_OWNER_FEE_ADDRESS?.toBase58()}`);

// legacy pools are used to show users contributions in those pools to allow for withdrawals of funds
export const PROGRAM_IDS = [
    {
        name: "mainnet-beta",
        swap: () => ({
            current: {
                pubkey: new PublicKey("SwaPpA9LAaLfeLi3a68M4DjnLqgtticKg6CnyNwgAC8"),
                layout: TokenSwapLayout,
            },
            legacy: [new PublicKey("9qvG1zUp8xF1Bi4m6UdRNby1BAAuaDrUxSpv4CmRRMjL")],
        }),
    },
    {
        name: "testnet",
        swap: () => ({
            current: {
                pubkey: new PublicKey("2n2dsFSgmPcZ8jkmBZLGUM2nzuFqcBGQ3JEEj6RJJcEg"),
                layout: TokenSwapLayout,
            },
            legacy: [
                new PublicKey("9tdctNJuFsYZ6VrKfKEuwwbPp4SFdFw3jYBZU8QUtzeX"),
                new PublicKey("CrRvVBS4Hmj47TPU3cMukurpmCUYUrdHYxTQBxncBGqw"),
            ],
        }),
    },
    {
        name: "devnet",
        swap: () => ({
            current: {
                pubkey: new PublicKey("SwaPpA9LAaLfeLi3a68M4DjnLqgtticKg6CnyNwgAC8"),
                layout: TokenSwapLayout,
            },
            legacy: [],
        }),
    },
    {
        name: "localnet",
        swap: () => ({
            current: {
                pubkey: new PublicKey("369YmCWHGxznT7GGBhcLZDRcRoGWmGKFWdmtiPy78yj7"),
                layout: TokenSwapLayout,
            },
            legacy: [],
        }),
    },
];

export const setProgramIds = (envName) => {
    let instance = PROGRAM_IDS.find((env) => env.name === envName);
    if (!instance) {
        return;
    }

    let swap = instance.swap();

    SWAP_PROGRAM_ID = swap.current.pubkey;
    SWAP_PROGRAM_LAYOUT = swap.current.layout;
    SWAP_PROGRAM_LEGACY_IDS = swap.legacy;
};

export const programIds = () => {
    return {
        token: TOKEN_PROGRAM_ID,
        swap: SWAP_PROGRAM_ID,
        swapLayout: SWAP_PROGRAM_LAYOUT,
        swap_legacy: SWAP_PROGRAM_LEGACY_IDS,
    };
};
