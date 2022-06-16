import {ConnectionProvider, WalletProvider} from '@solana/wallet-adapter-react';
import {
    getLedgerWallet,
    getPhantomWallet,
    getSlopeWallet,
    getSolflareWallet,
    getSolletExtensionWallet,
    getSolletWallet,
    getTorusWallet,
} from '@solana/wallet-adapter-wallets';
import {useSnackbar} from 'notistack';
import {useCallback, useMemo} from 'react';
import {useNetworkConfig} from "./GlobalProvider";
import {WalletModalProvider} from "@solana/wallet-adapter-react-ui";
import {AccountsProvider} from "./AccountsProvider";
import {MarketProvider} from "./MarketProvider";
import {CurrencyPairProvider} from "./CurrencyPairProvider";
import {TokensProvider} from "./TokensProvider";
import {PoolsProvider} from "./PoolsProvider";
import {EthereumProvider} from "./EtherumProvider";

export const ContextProvider = ({children}) => {
    const {endpoint, network} = useNetworkConfig();

    const wallets = useMemo(() => [
        getPhantomWallet(),
        getSlopeWallet(),
        getSolflareWallet(),
        getTorusWallet({
            options: {clientId: 'Get a client ID @ https://developer.tor.us'}
        }),
        getLedgerWallet(),
        getSolletWallet({network}),
        getSolletExtensionWallet({network}),
    ], [network]);

    const {enqueueSnackbar} = useSnackbar();
    const onError = useCallback((error) => {
            enqueueSnackbar(error.message ? `${error.name}: ${error.message}` : error.name, {variant: 'error'});
            console.error("WalletProvider error: ", error);
        },
        [enqueueSnackbar]
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} onError={onError} autoConnect={true}>
                <WalletModalProvider>
                    <EthereumProvider>
                        <TokensProvider>
                            <PoolsProvider>
                                <AccountsProvider network={network}>
                                    <MarketProvider>
                                        <CurrencyPairProvider>
                                            {children}
                                        </CurrencyPairProvider>
                                    </MarketProvider>
                                </AccountsProvider>
                            </PoolsProvider>
                        </TokensProvider>
                    </EthereumProvider>
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};