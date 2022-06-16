import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import React from "react";
import {getBridgeAddressForChain, getTokenBridgeAddressForChain} from "../../constants/wormhole";
import {
    CHAIN_ID_SOLANA,
    getEmitterAddressEth, hexToNativeString,
    hexToUint8Array,
    parseSequenceFromLogEth,
    redeemOnEth,
    transferFromEth,
    uint8ArrayToHex
} from "@certusone/wormhole-sdk";
import {parseUnits} from "ethers/lib.esm/utils";
import {Alert} from "@mui/lab";
import parseError from "../../helper/error";
import {getSignedVAAWithRetry} from "../../helper/wormhole";
import {ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID} from "@solana/spl-token";
import {PublicKey} from "@solana/web3.js";
import {zeroPad} from "@ethersproject/bytes/lib.esm";

export const customEthToSolana = createAsyncThunk("fetchAllSolanaTokens", async (data, {
    rejectWithValue,
    fulfillWithValue
}) => {
    const {
        amount,
        relayerFee,
        decimals,
        token,
        signer,
        recipientChain,
        recipientAddress,
        enqueueSnackbar,
        chainId
    } = data;
    console.log("signer", signer)
    console.log("tokenAddress", token.address)
    console.log("decimals", decimals)
    console.log("amount",amount)
    console.log("recipientChain",recipientChain)
    console.log("recipientAddress",recipientAddress)
    console.log("chainId",chainId)
    console.log("relayerFee",relayerFee)
    try {
        const associatedTokenAccount =
            await Token.getAssociatedTokenAddress(
                ASSOCIATED_TOKEN_PROGRAM_ID,
                TOKEN_PROGRAM_ID,
                new PublicKey(recipientAddress), // this might error
                recipientAddress
            );
        console.log("associatedTokenAccount",associatedTokenAccount)

        console.log("PARSIRA",amount,decimals)
        const baseAmountParsed = parseUnits(amount, decimals);
        console.log("baseAmountParsed",baseAmountParsed)
        const feeParsed = parseUnits(relayerFee || "0", decimals);
        console.log("feeParsed",feeParsed)
        const transferAmountParsed = baseAmountParsed.add(feeParsed);
        console.log("transferAmountParsed",transferAmountParsed)
        let recAddress = zeroPad(associatedTokenAccount.toBytes(), 32);
        console.log("recAddress",recAddress)
        const receipt = await transferFromEth(
            getTokenBridgeAddressForChain(token.chainId),
            signer,
            token.address,
            transferAmountParsed,
            recipientChain,
            recAddress,
            feeParsed
        );
        console.log("receipt",receipt)
        enqueueSnackbar(null, {
            content: <Alert severity="success">Transaction confirmed</Alert>,
        });

        const sequence = parseSequenceFromLogEth(receipt, getBridgeAddressForChain(chainId));
        console.log("sequence",sequence)
        const emitterAddress = getEmitterAddressEth(getTokenBridgeAddressForChain(chainId));
        console.log("emitterAddress",emitterAddress)
        enqueueSnackbar(null, {
            content: <Alert severity="info">Fetching VAA</Alert>,
        });
        const {vaaBytes} = await getSignedVAAWithRetry(
            chainId,
            emitterAddress,
            sequence.toString()
        );
        console.log("vaaBytes",vaaBytes)
        enqueueSnackbar(null, {
            content: <Alert severity="success">Fetched Signed VAA</Alert>,
        });

        const signedVAA = hexToUint8Array(uint8ArrayToHex(vaaBytes))

        const redeem = await redeemOnEth(
            getTokenBridgeAddressForChain(chainId),
            signer,
            signedVAA
        );

        enqueueSnackbar(null, {
            content: <Alert severity="success">Transaction confirmed</Alert>,
        });

        fulfillWithValue({
            VAAHex: uint8ArrayToHex(vaaBytes),
            transferTx: {
                id: receipt.transactionHash,
                block: receipt.blockNumber
            }
        })
    } catch (e) {
        console.error("customEthToSolana", e)
        enqueueSnackbar(null, {
            content: <Alert severity="error">{parseError(e)}</Alert>,
        });
        return rejectWithValue(e);
    }
})


const initialState = {
    loadingTransaction: false,
    VAAHex: undefined,
    transferTx: {
        id: undefined,
        block: undefined
    }
}

export const WormholeSlice = createSlice({
    name: 'wormhole',
    initialState,
    reducers: {},
    extraReducers: {
        [customEthToSolana.pending]: (state) => {
            state.loadingTransaction = true
        },
        [customEthToSolana.fulfilled]: (state, {payload}) => {
            state.loadingTransaction = false;
            console.log("customEthToSolana.fulfilled", payload)
        },
    }
});
export const wormholeReducer = WormholeSlice.reducer;
