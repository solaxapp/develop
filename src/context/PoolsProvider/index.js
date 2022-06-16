import React, {useContext, useEffect} from "react";
import {useConnection} from "@solana/wallet-adapter-react";
import {programIds} from "../../helper/ids";
import {dispatch, useSelector} from "../../store/redux";
import {fetchAllPools, onPoolAccountChange} from "../../redux/pools";

const PoolsContext = React.createContext({
    pools: [],
    loading: false,
});

export function PoolsProvider({children}) {
    const {connection} = useConnection();
    const {allPools, loading} = useSelector(state => state.pools)

    // initial query
    useEffect(() => {
        if (allPools.length === 0) {
            dispatch(fetchAllPools({connection: connection}))
        }
    }, [allPools.length, connection]);

    //query for updating pools
    useEffect(() => {
        const subID = connection.onProgramAccountChange(
            programIds().swap,
            async (info) => {
                dispatch(onPoolAccountChange({info: info, pools: allPools}))
            },
            "singleGossip"
        );

        return () => {
            connection.removeProgramAccountChangeListener(subID);
        };
    }, [connection, allPools.length, allPools]);

    return (
        <PoolsContext.Provider
            value={{
                pools: allPools,
                loading: loading,
            }}>
            {children}
        </PoolsContext.Provider>
    );
}

export function useAllPoolsContext() {
    return useContext(PoolsContext);
}