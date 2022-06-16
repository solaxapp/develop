import {clusterApiUrl, Transaction} from "@solana/web3.js";
import React, {useContext, useMemo, useState} from "react";
import {
    getSavedNetwork,
    getSavedSlippage,
    getSavedTheme,
    setSavedNetwork,
    setSavedSlippage,
    setSavedTheme
} from "../../helper/session";
import {DEFAULT_SLIPPAGE} from "../../constants/app";
import {setProgramIds} from "../../helper/ids";

const GlobalContext = React.createContext({
    slippage: DEFAULT_SLIPPAGE,
    setSlippage: (val) => {
    },
    theme: "dark",
    changeTheme: () => {
    },
    network: "testnet",
    changeNetwork: (val) => {
    },
    endpoint: "testnet",
});

export function GlobalProvider({children}) {
    const [slippage, setSlippage] = useState(getSavedSlippage())
    const [theme, setTheme] = useState(getSavedTheme())
    const [network, setNetwork] = useState(getSavedNetwork())

    const changeTheme = () => {
        if (theme === "light") {
            setSavedTheme("dark")
            setTheme('dark')
        } else {
            setSavedTheme("light")
            setTheme('light')
        }
    }

    const endpoint = useMemo(() => clusterApiUrl(network), [network]);
    setProgramIds(network);

    const changeNetwork = (value) => {
        setNetwork(value);
        setSavedNetwork(value);
        window.location.reload();
    }

    const changeSlippage = (value) => {
        value = parseFloat(value)
        setSlippage(value);
        setSavedSlippage(value)
    }

    return (
        <GlobalContext.Provider
            value={{
                slippage: parseFloat(slippage),
                setSlippage: changeSlippage,
                theme: theme,
                changeTheme: changeTheme,
                network: network,
                changeNetwork: changeNetwork,
                endpoint: endpoint,
            }}>
            {children}
        </GlobalContext.Provider>
    );
}

export function useNetworkConfig() {
    const {network, changeNetwork, endpoint} = useContext(GlobalContext);
    return {network, changeNetwork, endpoint};
}

export function useThemeConfig() {
    const {theme, changeTheme} = useContext(GlobalContext);
    return {theme, changeTheme};
}

export function useSlippageConfig() {
    const {slippage, setSlippage} = useContext(GlobalContext);
    return {slippage, setSlippage};
}

export const sendTransaction = async (connection, instructions, signers, walletPublicKey, walletSendTransaction, notify, awaitConfirmation = true) => {
    let transaction = new Transaction();
    instructions.forEach((instruction) => transaction.add(instruction));
    transaction.recentBlockhash = (
        await connection.getRecentBlockhash("max")
    ).blockhash;
    transaction.setSigners(
        // fee payied by the wallet owner
        walletPublicKey,
        ...signers.map((s) => s.publicKey)
    );
    if (signers.length > 0) {
        transaction.partialSign(...signers);
    }
    let signature = await walletSendTransaction(transaction, connection);
    notify('info', 'Transaction sent:', signature);

    if (awaitConfirmation) {
        const status = await connection.confirmTransaction(signature, 'processed');
        console.log("STATUS", status)
        notify('success', 'Transaction successful!', signature);
    }

    /*transaction = await wallet.signTransaction(transaction);
    const rawTransaction = transaction.serialize();
    let options = {
        skipPreflight: true,
        commitment: "singleGossip",
    };

    const txid = await connection.sendRawTransaction(rawTransaction, options);

    if (awaitConfirmation) {
        const status = (
            await connection.confirmTransaction(
                txid,
                options && (options.commitment)
            )
        ).value;

        if (status?.err) {
            const errors = await getErrorForTransaction(connection, txid);
            notify({
                message: "Transaction failed...",
                description: (
                    <>
                        {errors.map((err) => (
                            <div>{err}</div>
                        ))}
                        <ExplorerLink address={txid} type="transaction"/>
                    </>
                ),
                type: "error",
            });

            throw new Error(
                `Raw transaction ${txid} failed (${JSON.stringify(status)})`
            );
        }
    }*/

    return signature;
};