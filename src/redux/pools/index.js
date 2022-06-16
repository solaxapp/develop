import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {cache} from "../../context/AccountsProvider";
import {TokenSwapLayout} from "../../helper/crypto/models/TokenSwap";
import {PublicKey} from "@solana/web3.js";
import {programIds} from "../../helper/ids";
import {queryPools, toPoolInfo} from "../../helper/crypto/Pools";

//Redux method for finding best pool for swap
export const fetchBestPool = createAsyncThunk("fetchBestPool", async (data, {
    rejectWithValue,
    fulfillWithValue
}) => {
    try {
        const {connection, sortedMints, pools} = data;
        let matchingPool = pools
            .filter((p) => !p.legacy)
            .filter((p) =>
                p.pubkeys.holdingMints
                    .map((a) => a.toBase58())
                    .sort()
                    .every((address, i) => address === sortedMints[i])
            );

        const poolQuantities = {};
        for (let i = 0; i < matchingPool.length; i++) {
            const p = matchingPool[i];

            const [account0, account1] = await Promise.all([
                cache.queryAccount(connection, p.pubkeys.holdingAccounts[0]),
                cache.queryAccount(connection, p.pubkeys.holdingAccounts[1]),
            ]);
            const amount =
                (account0.info.amount.toNumber() || 0) +
                (account1.info.amount.toNumber() || 0);
            if (amount > 0) {
                poolQuantities[i.toString()] = amount;
            }
        }
        if (Object.keys(poolQuantities).length > 0) {
            const sorted = Object.entries(
                poolQuantities
            ).sort(([pool0Idx, amount0], [pool1Idx, amount1]) =>
                amount0 > amount1 ? -1 : 1
            );
            const bestPool = matchingPool[parseInt(sorted[0][0])];
            return fulfillWithValue(bestPool)
        }
    } catch (e) {
        console.error("fetchBestPool", e)
        return rejectWithValue(e);
    }
})

export const fetchAllPools = createAsyncThunk("fetchAllPools", async (data, {
    rejectWithValue,
    fulfillWithValue
}) => {
    try {
        const {connection} = data
        let result = await Promise.all([
            queryPools(connection, programIds().swap),
            ...programIds().swap_legacy.map((leg) => queryPools(connection, leg, true)),
        ])
        return fulfillWithValue(result.flat());
    } catch (e) {
        console.error("fetchAllPools", e)
        return rejectWithValue(e);
    }
});

export const onPoolAccountChange = createAsyncThunk("onPoolAccountChange", async (data, {
    rejectWithValue,
    fulfillWithValue
}) => {
    try {
        const {info, pools} = data
        const id = (info.accountId);
        if (info.accountInfo.data.length === TokenSwapLayout.span) {
            const account = info.accountInfo;
            const updated = {
                data: TokenSwapLayout.decode(account.data),
                account: account,
                pubkey: new PublicKey(id),
            };

            const index =
                pools &&
                pools.findIndex((p) => p.pubkeys.account.toBase58() === id);
            if (index && index >= 0 && pools) {
                // TODO: check if account is empty?

                const filtered = pools.filter((p, i) => i !== index);
                return fulfillWithValue([...filtered, toPoolInfo(updated, programIds().swap)])
            } else {
                let pool = toPoolInfo(updated, programIds().swap);

                pool.pubkeys.feeAccount = new PublicKey(updated.data.feeAccount);
                pool.pubkeys.holdingMints = [
                    new PublicKey(updated.data.mintA),
                    new PublicKey(updated.data.mintB),
                ];
                return fulfillWithValue([...pools, pool])
            }
        }
    } catch (e) {
        console.error("onPoolAccountChange", e)
        return rejectWithValue(e);
    }
})

const initialState = {
    bestPool: undefined,
    allPools: [],
    loading: false,
}

export const poolsSlice = createSlice({
    name: 'pools',
    initialState,
    reducers: {},
    extraReducers: {
        [fetchBestPool.fulfilled]: (state, {payload}) => {
            state.loadingBestPool = false;
            state.bestPool = payload;
        },
        [fetchAllPools.pending]: (state) => {
            state.loading = true
        },
        [fetchAllPools.fulfilled]: (state, {payload}) => {
            state.loading = false
            if (payload)
                state.allPools = payload;
        },
        [onPoolAccountChange.pending]: (state) => {
            state.loading = true
        },
        [onPoolAccountChange.fulfilled]: (state, {payload}) => {
            state.loading = false
            if (payload)
                state.allPools = payload;
        },
    }
});
export const poolsReducer = poolsSlice.reducer;
