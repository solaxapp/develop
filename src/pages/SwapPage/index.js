import React, {useState} from "react";
import {Card, FlexRow, PageContainer, PageTitle, SwapWrapper, WalletButton} from "../../components/Flex";
import {useTranslation} from "react-i18next";
import "../../assets/css/swap.css"
import {useConnection, useWallet} from "@solana/wallet-adapter-react";
import {useCurrencyPairState} from "../../context/CurrencyPairProvider";
import {useNetworkConfig, useSlippageConfig} from "../../context/GlobalProvider";
import {swap, usePoolForBasket} from "../../helper/crypto/Pools";
import {PoolOperation} from "../../constants/app";
import {useNotify} from "../../context/Notifications";
import {useAllTokensContext} from "../../context/TokensProvider";
import {CHAIN_ID_SOLANA} from "@certusone/wormhole-sdk";
import {styled} from "@mui/material/styles";
import {CircularProgress, IconButton} from "@mui/material";
import {AddressesPopover} from "./components/PoolAddress";
import CurrencyInput from "../../components/CurrencyInput";
import {generateActionLabel, POOL_NOT_AVAILABLE} from "../../constants/labels";
import {getTokenName} from "../../helper/token";
import TradeInfo from "./components/TradeInfo";
import PendingOutlinedIcon from "@mui/icons-material/PendingOutlined";
import {Text} from "../../components/Text";
import {getEvmChainId} from "../../constants/wormhole";
import {parsed_solax_token} from "../../helper/ids";
import {useSnackbar} from "notistack";
import {useEthereumProvider} from "../../context/EtherumProvider";
import {attestEthToSolana, transferEthToSolana} from "../../helper/wormhole";
import SwapVertIcon from '@mui/icons-material/SwapVert';

export const StyledCircularProgress = styled(CircularProgress)(({theme}) => ({
    color: theme.palette.common.white
}))

const antIcon = <PendingOutlinedIcon style={{fontSize: 24}} spin/>;

const SwapIcon = styled(SwapVertIcon)(({theme}) => ({
    color: theme.palette.common.green
}))

const SlippageWrapper = styled(FlexRow)(({theme}) => ({
    paddingTop: 10,
    justifyContent: "space-between",
    width: "100%"
}))

const SlippageText = styled(Text)(({theme}) => ({}))

const SlippageAmount = styled(Text)(({theme}) => ({}))

const StyledIconButton = styled(IconButton)(({theme}) => ({
    width: "fit-content",
    alignSelf: "center"
}))

export default function SwapPage() {
    const {enqueueSnackbar} = useSnackbar();
    const {wallet} = useWallet();
    const {network} = useNetworkConfig();
    const {slippage} = useSlippageConfig();
    const {t} = useTranslation();
    const {publicKey, sendTransaction, connected} = useWallet();
    const {connection} = useConnection();
    const [pendingTx, setPendingTx] = useState(false);
    const [openCurrencyInput, setOpenCurrencyInput] = useState({
        first: false,
        second: false
    });
    const {A, B, setLastTypedAccount, setPoolOperation} = useCurrencyPairState();
    const {bestPool} = usePoolForBasket([A?.mintAddress, B?.mintAddress]);
    const {tokenMap} = useAllTokensContext();
    const {signer, provider, signerAddress} = useEthereumProvider();
    const notify = useNotify();
    const [sourceChainId, setSourceChainId] = useState(getEvmChainId(CHAIN_ID_SOLANA, network));
    const [targetChainId, setTargetChainId] = useState(getEvmChainId(CHAIN_ID_SOLANA, network));

    const swapAccounts = () => {
        const tempA = A;
        A.setMint(B.token);
        A.setAmount(B.amount);
        setSourceChainId(B.token.chainId)
        B.setMint(tempA.token);
        B.setAmount(tempA.amount);
        setTargetChainId(tempA.token.chainId)
        setPoolOperation((op) => {
            switch (+op) {
                case PoolOperation.SwapGivenInput:
                    return PoolOperation.SwapGivenProceeds;
                case PoolOperation.SwapGivenProceeds:
                    return PoolOperation.SwapGivenInput;
                case PoolOperation.Add:
                    return PoolOperation.SwapGivenInput;
                default:
                    return null;
            }
        });
    };

    const handleOpenCurrencyInput = (number) => () => {
        if (number === 1) {
            setOpenCurrencyInput({
                first: true,
                second: false
            })
        } else {
            setOpenCurrencyInput({
                first: false,
                second: true
            })
        }
    }

    const handleCloseCurrencyInput = () => {
        setOpenCurrencyInput({
            first: false,
            second: false
        })
    }

    const handleSwap = async () => {
        if (isSolanaNetwork(sourceChainId, network) && isSolanaNetwork(targetChainId, network)) {
            if (A.account && B.mintAddress) {
                try {
                    setPendingTx(true);
                    const components = [
                        {
                            account: A.account,
                            mintAddress: A.mintAddress,
                            amount: A.convertAmount(),
                        },
                        {
                            mintAddress: B.mintAddress,
                            amount: B.convertAmount(),
                        },
                    ];
                    await swap(connection, components, slippage, bestPool, publicKey, notify, sendTransaction);
                } catch (e) {
                    // getErrorForTransaction(e)
                    console.error("SWAP ERROR", e)
                    notify("error", "Please try again and approve transactions from your wallet. Swap trade cancelled.");
                } finally {
                    setPendingTx(false);
                }
            }
        } else {
            //WORM SWAP
            console.log("WORM SWAP", publicKey)
            await attestEthToSolana(
                network,
                A.token.address,
                signer,
                connection,
                publicKey.toString(),
                undefined
            );
            await transferEthToSolana(
                network,
                A.token.address,
                signer,
                connection,
                publicKey.toString(),
                publicKey.toString(),
                undefined
            )
            // await EthToSolana(
            //     connection,
            //     A.token.address,
            //     new PublicKey("Fuwdtp3azhHAoACLY1WbBh6sHbG4XMRvR4UV2BJLQjzT"),
            //     signer,
            //     1,
            //     wallet,
            //     undefined
            // )
            // let hexAddress;
            //
            // if (isEVMChain(targetChainId) && signerAddress) {
            //     console.log("setTargetAddressHex", signerAddress)
            //     hexAddress = hexToUint8Array(uint8ArrayToHex(zeroPad(arrayify(signerAddress), 32)))
            //     console.log("hexAddress", hexAddress)
            // } else if (targetChainId === CHAIN_ID_SOLANA && publicKey) {
            //     const targetAsset = await (getForeignAssetSolana(
            //         connection,
            //         SOL_TOKEN_BRIDGE_ADDRESS(network),
            //         sourceChainId,
            //         hexToUint8Array("000000000000000000000000ae13d989dac2f0debff460ac112a837c89baa7cd")
            //     ));
            //     console.log("targetAsset", targetAsset)
            //     // otherwise, use the associated token account (which we create in the case it doesn't exist)
            //     try {
            //         const associatedTokenAccount = await Token.getAssociatedTokenAddress(
            //             ASSOCIATED_TOKEN_PROGRAM_ID,
            //             TOKEN_PROGRAM_ID,
            //             new PublicKey(targetAsset), // this might error
            //             publicKey
            //         );
            //         if (associatedTokenAccount) {
            //             hexAddress = uint8ArrayToHex(zeroPad(associatedTokenAccount.toBytes(), 32))
            //         } else {
            //             hexAddress = hexToUint8Array(uint8ArrayToHex(zeroPad(associatedTokenAccount.toBytes(), 32)))
            //         }
            //     } catch (e) {
            //         console.error("associatedTokenAccount", e)
            //     }
            // }
            // console.log("hexAddress", hexAddress)
            // await transferTokenFromEth(
            //     enqueueSnackbar,
            //     signer,
            //     A.token.address,
            //     18,
            //     A.amount,
            //     targetChainId,
            //     hexAddress,
            //     false,
            //     sourceChainId,
            //     undefined)
        }

    };

    return (
        <PageContainer>
            <SwapWrapper>
                <PageTitle>{t('swapPage.title')}</PageTitle>
                <Card style={{
                    paddingTop: 0
                }}>
                    <AddressesPopover pool={bestPool}/>
                    <CurrencyInput
                        showOtherChains={isSolanaNetwork(targetChainId, network)}
                        selectedChainId={sourceChainId}
                        open={openCurrencyInput.first}
                        handleOpen={handleOpenCurrencyInput(1)}
                        handleClose={handleCloseCurrencyInput}
                        network={network}
                        title={t('swapPage.from')}
                        amount={A.amount}
                        mint={A.mintAddress}
                        onInputChange={(value) => {
                            if (A.amount !== value) {
                                setLastTypedAccount(A.mintAddress);
                            }
                            A.setAmount(value);
                        }}
                        onMintChange={async (item) => {
                            A.setMint(item);
                            if (!isSolanaNetwork(item.chainId, network)) {
                                B.setAmount(A.amount);
                                B.setMint(parsed_solax_token);
                            }
                            setSourceChainId(item.chainId)
                        }}
                    />
                    <StyledIconButton onClick={swapAccounts}>
                        <SwapIcon/>
                    </StyledIconButton>
                    <CurrencyInput
                        showOtherChains={isSolanaNetwork(sourceChainId, network)}
                        selectedChainId={targetChainId}
                        open={openCurrencyInput.second}
                        handleOpen={handleOpenCurrencyInput(2)}
                        handleClose={handleCloseCurrencyInput}
                        network={network}
                        title={t('swapPage.to')}
                        amount={B.amount}
                        mint={B.mintAddress}
                        onInputChange={(val) => {
                            if (B.amount !== val) {
                                setLastTypedAccount(B.mintAddress);
                            }
                            B.setAmount(val);
                        }}
                        onMintChange={(item) => {
                            B.setMint(item);
                            setTargetChainId(item.chainId)
                        }}
                    />
                    <SlippageWrapper>
                        <SlippageText>
                            {t('swapPage.slippageTolerance')}
                        </SlippageText>
                        <SlippageAmount>
                            {slippage}%
                        </SlippageAmount>
                    </SlippageWrapper>
                    <WalletButton
                        size="large"
                        onClick={handleSwap}
                        disabled={
                            (isSolanaNetwork(sourceChainId, network) && isSolanaNetwork(targetChainId, network) ? (!connected || (connected &&
                                (pendingTx ||
                                    !A.account ||
                                    !B.mintAddress ||
                                    A.account === B.account ||
                                    !A.sufficientBalance() ||
                                    !bestPool))) : false)
                        }>
                        {
                            (isSolanaNetwork(sourceChainId, network) && isSolanaNetwork(targetChainId, network) ? generateActionLabel(!bestPool
                                    ? POOL_NOT_AVAILABLE(
                                        getTokenName(tokenMap, A.mintAddress),
                                        getTokenName(tokenMap, B.mintAddress)
                                    )
                                    : t('common.swap'),
                                connected, tokenMap, A, B, true) : "WORM SWAP")
                        }
                        {pendingTx && <CircularProgress indicator={antIcon} className="trade-spinner"/>}
                    </WalletButton>
                    <TradeInfo pool={bestPool}/>
                </Card>
            </SwapWrapper>
        </PageContainer>
    );
}

const isSolanaNetwork = (chainId, network) => {
    if (chainId === CHAIN_ID_SOLANA)
        return true;
    if (chainId === getEvmChainId(CHAIN_ID_SOLANA, network))
        return true;
    if (chainId === 102)
        return true;
}