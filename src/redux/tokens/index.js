import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {TokenListProvider} from "@solana/spl-token-registry";
import {cache, getMultipleAccounts} from "../../context/AccountsProvider";
import {PublicKey} from "@solana/web3.js";
import {TokenIcon} from "../../components/TokenIcon";
import React from "react";
import {FEATURED_MARKETS_JSON_URL} from "../../constants/wormhole";
import {CHAINS} from "../../constants/app";
import {CHAIN_ID_BSC, CHAIN_ID_ETH} from "@certusone/wormhole-sdk";
import {solax_token} from "../../helper/ids";

export const fetchAllTokens = createAsyncThunk("fetchAllSolanaTokens", async (data, {
    rejectWithValue,
    fulfillWithValue
}) => {
    try {
        const {connection, network} = data;
        const res = await new TokenListProvider().resolve();
        const list = res.filterByClusterSlug(network)
            // .excludeByTag("nft")
            .getList();
        list.push(solax_token);
        console.log("LSIT", list)
        const knownMints = list.reduce((map, item) => {
            map.set(item.address, item);
            return map;
        }, new Map());

        const accounts = await getMultipleAccounts(connection, [...knownMints.keys()], 'single');
        accounts.keys.forEach((key, index) => {
            const account = accounts.array[index];
            if (!account) {
                knownMints.delete(accounts.keys[index]);
                return;
            }
            try {
                cache.addMint(new PublicKey(key), account);
            } catch {
                // ignore
            }
        })

        let parsedTokens = list.map(value => {
            return {
                ...value,
                icon: <TokenIcon mintAddress={value.address} icon={value.logoURI}/>,
                chain: CHAINS.solana
            }
        })

        const resp = await window.fetch(FEATURED_MARKETS_JSON_URL);
        let wormData = await resp.json();
        let eTokens = wormData.tokens[2];
        let bTokens = wormData.tokens[4];
        let mappedETHTokens = Object.keys(eTokens).map(key => {
            let item = eTokens[key];
            return ({
                address: key,
                icon: <TokenIcon mintAddress={key} icon={item.logo}/>,
                name: item.symbol,
                symbol: item.symbol,
                chain: CHAINS.eth,
                chainId: CHAIN_ID_ETH
            })
        })
        let mappedBNBTokens = Object.keys(bTokens).map(key => {
            let item = bTokens[key];
            return ({
                address: key,
                icon: <TokenIcon mintAddress={key} icon={item.logo}/>,
                name: item.symbol,
                symbol: item.symbol,
                chain: CHAINS.bnb,
                chainId: CHAIN_ID_BSC
            })
        })
        return fulfillWithValue({
            tokenMap: knownMints,
            solanaTokens: parsedTokens,
            ethTokens: mappedETHTokens,
            bnbTokens: mappedBNBTokens
        })
    } catch (e) {
        console.error("fetchAllSolanaTokens", e)
        return rejectWithValue(e);
    }
})


const initialState = {
    solanaTokens: [],
    ethTokens: [],
    bnbTokens: [],
    tokenMap: new Map(),
    loading: false,
}

export const TokensSlice = createSlice({
    name: 'tokens',
    initialState,
    reducers: {},
    extraReducers: {
        [fetchAllTokens.pending]: (state) => {
            state.loading = true
        },
        [fetchAllTokens.fulfilled]: (state, {payload}) => {
            state.loading = false;
            state.solanaTokens = payload.solanaTokens;
            state.ethTokens = payload.ethTokens;
            state.bnbTokens = payload.bnbTokens;
            state.tokenMap = payload.tokenMap
        },
    }
});
export const tokensReducer = TokensSlice.reducer;
