import detectEthereumProvider from "@metamask/detect-provider";
import {BigNumber, ethers} from "ethers";
import React, {useCallback, useContext, useMemo, useState,} from "react";
import {getEvmChainId, METAMASK_CHAIN_PARAMETERS} from "../../constants/wormhole";
import {CHAIN_ID_SOLANA, isEVMChain} from "@certusone/wormhole-sdk";
import {hexlify, hexStripZeros} from "@ethersproject/bytes";
import {useNetworkConfig} from "../GlobalProvider";
import {useWallet} from "@solana/wallet-adapter-react";

const EthereumProviderContext = React.createContext({
    connect: () => {
    },
    disconnect: () => {
    },
    provider: undefined,
    chainId: undefined,
    signer: undefined,
    signerAddress: undefined,
    providerError: null,
});

export const EthereumProvider = ({children}) => {
    const [providerError, setProviderError] = useState(null);
    const [provider, setProvider] = useState(undefined);
    const [chainId, setChainId] = useState(undefined);
    const [signer, setSigner] = useState(undefined);
    const [signerAddress, setSignerAddress] = useState(undefined);
    const connect = useCallback(() => {
        setProviderError(null);
        detectEthereumProvider().then((detectedProvider) => {
            if (detectedProvider) {
                const provider = new ethers.providers.Web3Provider(detectedProvider, "any");
                provider.send("eth_requestAccounts", []).then(() => {
                    setProviderError(null);
                    setProvider(provider);
                    provider.getNetwork().then((network) => {
                        setChainId(network.chainId);
                    }).catch(() => {
                        setProviderError(
                            "An error occurred while getting the network"
                        );
                    });
                    const signer = provider.getSigner();
                    setSigner(signer);
                    signer.getAddress().then((address) => {
                        setSignerAddress(address);
                    }).catch(() => {
                        setProviderError(
                            "An error occurred while getting the signer address"
                        );
                    });
                    // TODO: try using ethers directly
                    // @ts-ignore
                    if (detectedProvider && detectedProvider.on) {
                        // @ts-ignore
                        detectedProvider.on("chainChanged", (chainId) => {
                            try {
                                setChainId(BigNumber.from(chainId).toNumber());
                            } catch (e) {
                            }
                        });
                        // @ts-ignore
                        detectedProvider.on("accountsChanged", (accounts) => {
                            try {
                                const signer = provider.getSigner();
                                setSigner(signer);
                                signer.getAddress().then((address) => {
                                    setSignerAddress(address);
                                }).catch(() => {
                                    setProviderError("An error occurred while getting the signer address");
                                });
                            } catch (e) {
                            }
                        });
                    }
                }).catch(() => {
                    setProviderError("An error occurred while requesting eth accounts");
                });
            } else {
                setProviderError("Please install MetaMask");
            }
        }).catch(() => {
            setProviderError("Please install MetaMask");
        });
    }, []);

    console.log("ETHER CONNECTED TO: ", chainId)

    const disconnect = useCallback(() => {
        setProviderError(null);
        setProvider(undefined);
        setChainId(undefined);
        setSigner(undefined);
        setSignerAddress(undefined);
    }, []);
    const contextValue = useMemo(() => ({
        connect,
        disconnect,
        provider,
        chainId,
        signer,
        signerAddress,
        providerError,
    }), [connect, disconnect, provider, chainId, signer, signerAddress, providerError]);
    return (
        <EthereumProviderContext.Provider value={contextValue}>
            {children}
        </EthereumProviderContext.Provider>
    );
};

export const useEthereumProvider = () => {
    return useContext(EthereumProviderContext);
};

const createWalletStatus = (isReady, statusMessage = "", forceNetworkSwitch, walletAddress) => ({
    isReady,
    statusMessage,
    forceNetworkSwitch,
    walletAddress,
});

export function useIsWalletReady(chainId, autoSwitch = true) {
    const {network} = useNetworkConfig();
    const {provider, signerAddress, chainId: evmChainId} = useEthereumProvider();
    const {publicKey, ready} = useWallet();
    const hasEthInfo = !!provider && !!signerAddress;
    const correctEvmNetwork = getEvmChainId(chainId, network);
    const hasCorrectEvmNetwork = evmChainId === correctEvmNetwork;

    const forceNetworkSwitch = useCallback(async () => {
        if (provider && correctEvmNetwork) {
            if (!isEVMChain(chainId)) {
                console.log("NIJE EVM CHAIN", correctEvmNetwork)
                return;
            }
            try {
                console.log("MENJA CHAIN", correctEvmNetwork)
                await provider.send("wallet_switchEthereumChain", [
                    {chainId: hexStripZeros(hexlify(correctEvmNetwork))},
                ]);
            } catch (switchError) {
                // This error code indicates that the chain has not been added to MetaMask.
                if (switchError.code === 4902) {
                    const addChainParameter =
                        METAMASK_CHAIN_PARAMETERS[correctEvmNetwork];
                    if (addChainParameter !== undefined) {
                        try {
                            await provider.send("wallet_addEthereumChain", [
                                addChainParameter,
                            ]);
                        } catch (addError) {
                            console.error(addError);
                        }
                    }
                }
            }
        }
    }, [provider, correctEvmNetwork, chainId]);

    return useMemo(() => {
        if (chainId === CHAIN_ID_SOLANA && publicKey) {
            return createWalletStatus(
                ready,
                undefined,
                forceNetworkSwitch,
                publicKey
            );
        }
        if (isEVMChain(chainId) && hasEthInfo && signerAddress) {
            if (hasCorrectEvmNetwork) {
                return createWalletStatus(
                    true,
                    undefined,
                    forceNetworkSwitch,
                    signerAddress
                );
            } else {
                if (provider && correctEvmNetwork && autoSwitch) {
                    forceNetworkSwitch();
                }
                return createWalletStatus(
                    false,
                    `Wallet is not connected to ${network}. Expected Chain ID: ${correctEvmNetwork}`,
                    forceNetworkSwitch,
                    undefined
                );
            }
        }

        return createWalletStatus(
            false,
            "Wallet not connected",
            forceNetworkSwitch,
            undefined
        );
    }, [
        chainId,
        autoSwitch,
        forceNetworkSwitch,
        hasEthInfo,
        correctEvmNetwork,
        hasCorrectEvmNetwork,
        provider,
        signerAddress,
    ]);
}
