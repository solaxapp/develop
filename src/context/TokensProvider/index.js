import {Account} from "@solana/web3.js";
import React, {useContext, useEffect} from "react";
import {useConnection} from "@solana/wallet-adapter-react";
import {dispatch, useSelector} from "../../store/redux";
import {fetchAllTokens} from "../../redux/tokens";
import {useNetworkConfig} from "../GlobalProvider";

const TokensContext = React.createContext({
    solanaTokens: [],
    bnbTokens: [],
    ethTokens: [],
    tokenMap: new Map(),
    loading: false
});

export function TokensProvider({children}) {
    const {connection} = useConnection();
    const {network} = useNetworkConfig();
    const {solanaTokens, bnbTokens, ethTokens, tokenMap, loading} = useSelector(state => state.tokens)

    useEffect(() => {
        if (tokenMap.size === 0 && connection) {
            console.log("connection", connection, "connection")
            dispatch(fetchAllTokens({connection: connection, network: network}))
        }
    }, [connection, network, tokenMap.length])

    // The websocket library solana/web3.js uses closes its websocket connection when the subscription list
    // is empty after opening its first time, preventing subsequent subscriptions from receiving responses.
    // This is a hack to prevent the list from every getting empty
    useEffect(() => {
        const id = connection.onAccountChange(new Account().publicKey, () => {
        });
        return () => {
            connection.removeAccountChangeListener(id);
        };
    }, [connection]);

    useEffect(() => {
        const id = connection.onSlotChange(() => null);
        return () => {
            connection.removeSlotChangeListener(id);
        };
    }, [connection]);

    return (
        <TokensContext.Provider
            value={{
                solanaTokens: solanaTokens,
                bnbTokens: bnbTokens,
                ethTokens: ethTokens,
                tokenMap: tokenMap,
                loading: loading
            }}>
            {children}
        </TokensContext.Provider>
    );
}

export function useAllTokensContext() {
    const context = useContext(TokensContext);
    return {
        solanaTokens: context.solanaTokens,
        bnbTokens: context.bnbTokens,
        ethTokens: context.ethTokens,
        tokenMap: context.tokenMap,
        loading: context.loading
    };
}