import React, {useEffect, useState} from "react";
import {
    CircularProgress,
    Dialog,
    DialogContent,
    IconButton,
    InputAdornment,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    styled,
    TextField
} from "@mui/material";
import {FlexCol, FlexRow} from "../Flex";
import {useMint, useUserAccounts} from "../../context/AccountsProvider";
import {Text} from "../Text";
import SearchIcon from '@mui/icons-material/Search';
import {useTranslation} from "react-i18next";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import {useAllTokensContext} from "../../context/TokensProvider";
import {useEthereumProvider, useIsWalletReady} from "../../context/EtherumProvider";
import {useNotify} from "../../context/Notifications";
import {CHAINS} from "../../constants/app";
import KeyAndBalance from "../../pages/SwapPage/components/KeyAndBalance";
import {CHAIN_ID_BSC, CHAIN_ID_ETH} from "@certusone/wormhole-sdk";
import {getEvmChainId} from "../../constants/wormhole";
import {ethers} from "ethers";
import {useConnection, useWallet} from "@solana/wallet-adapter-react";
import ReplayIcon from '@mui/icons-material/Replay';
import {dispatch} from "../../store/redux";
import {fetchAllTokens} from "../../redux/tokens";

const CurrencyWrapper = styled(FlexRow)(() => ({
    alignItems: "center",
    minWidth: 80,
    fontWeight: "bold",
    padding: "16px 0",
    minHeight: 58,
    width: "100%",
    cursor: "pointer",
}))

const StyledInput = styled('input')(({theme}) => ({
    color: theme.palette.common.purple,
    textAlign: "end",
    fontWeight: "bold",
    background: "#111a2f",
    border: "none",
    outline: "none",
    "& :active": {
        border: "none",
        outline: "none"
    },
    "& :focus": {
        border: "none",
        outline: "none"
    }
}))

const FilterInput = styled(TextField)(() => ({
    border: "0.5px solid #111a2f",
    width: "100%",
    borderRadius: 4
}))

const StyledList = styled(List)(() => ({
    marginTop: 10,
    minHeight: 300,
    overflow: "auto",
    height: 300,
}))

const Wrapper = styled(FlexCol)(() => ({
    width: "100%",
    padding: 10,
    background: "#111a2f",
    boxShadow: "inset 0px 0px 40px #00000029, 0px 0px 20px #00000029",
}))

const DescriptionWrapper = styled(FlexRow)(() => ({
    justifyContent: "space-between"
}))

const Balance = styled(Text)(({theme}) => ({
    cursor: "pointer"
}))

const SwapIcon = styled(ArrowDownwardIcon)(({theme}) => ({
    color: theme.palette.common.white
}))

const StyledDialogContent = styled(DialogContent)(() => ({
    background: "#131E34 0% 0% no-repeat padding-box",
    boxShadow: "inset 0px 0px 40px #00000029, 0px 0px 20px #00000029",
}))

const ReloadHeader = styled(FlexRow)(() => ({
    justifyContent: "space-between",
    alignItems: "center"
}))

export const default_input_token = {
    address: "",
    icon: "",
    name: "",
    symbol: "Chose token",
    chain: "",
    chainId: -1,
}

export default function CurrencyInput({
                                          mint, amount, title, onInputChange, onMintChange, network, handleOpen,
                                          handleClose, open, showOtherChains = false, selectedChainId
                                      }) {
    const {t} = useTranslation();
    const {solanaTokens, bnbTokens, ethTokens, loading} = useAllTokensContext();
    const {userAccounts} = useUserAccounts();
    const [previewTokens, setPreviewTokens] = useState([]);
    const [userUiBalance, setUserUiBalance] = useState(0);
    const [selected, setSelected] = useState(default_input_token);
    const localeMint = useMint(mint);
    const {isReady, statusMessage, forceNetworkSwitch} = useIsWalletReady(selectedChainId);
    const {provider} = useEthereumProvider();
    const {connection} = useConnection();
    const {ready, connected} = useWallet();
    const notify = useNotify();

    useEffect(() => {
        if (!isReady) {
            forceNetworkSwitch();
        }
        let pt = [];
        if (showOtherChains) {
            pt = [...bnbTokens.slice(0, 10), ethTokens.slice(0, 10)]
        }
        pt = [...pt, ...solanaTokens.slice(0, 10)]
        let allTokens = [...solanaTokens, ...bnbTokens, ...ethTokens];
        if (mint) {
            let selected = allTokens.filter(item => item.address === mint)[0]
            setSelected(selected ? selected : default_input_token);
            if (selected) {
                if (selected.chain === CHAINS.solana) {
                    userUiSolanaBalance()
                } else if (selected.chain === CHAINS.eth || selected.chain === CHAINS.bnb) {
                    userUiEtherBalance();
                }

            }
        }
        setPreviewTokens(pt);
    }, [network, mint, open, isReady, ready, connected, localeMint])

    //calculate balance for solana token
    const userUiSolanaBalance = () => {
        if (!ready) {
            notify("info", "Solana wallet is not ready")
            setUserUiBalance(0);
            return;
        }
        const currentAccount = userAccounts.find((a) => a.info.mint.toBase58() === mint)
        if (currentAccount && localeMint) {
            let balans = (currentAccount.info.amount.toNumber() / Math.pow(10, localeMint.decimals))
            setUserUiBalance(balans);
            return;
        }
        setUserUiBalance(0)
    };

    //Get ether balance for chosen token
    const userUiEtherBalance = async () => {
        if (!isReady) {
            if (statusMessage) {
                notify("info", statusMessage)
            } else {
                notify("info", "MetaMask wallet is not ready")
            }
            setUserUiBalance(0);
            return;
        }
        let balanceBigNumber = await provider.getBalance(selected.address)
        setUserUiBalance(ethers.utils.formatEther(balanceBigNumber))
    }

    const handleInputChange = async (event) => {
        const {value} = event.target
        if (value > userUiBalance) {
            onInputChange(userUiBalance)
            return;
        }
        onInputChange(value);
    }

    const handleFilterChange = (event) => {
        const {value} = event.target;
        let allTokens;
        if (showOtherChains) {
            allTokens = [...solanaTokens, ...bnbTokens, ...ethTokens]
        } else {
            allTokens = [...solanaTokens]
        }
        setPreviewTokens(allTokens.filter(token =>
            token.name.toLowerCase().includes(value.toLowerCase()) ||
            token.symbol.toLowerCase().includes(value.toLowerCase()) ||
            token.address.toLowerCase().includes(value.toLowerCase())))
    }

    const onTokenSelect = (token) => {
        onMintChange(token);
        handleClose();
    }

    const onBalanceClick = () => {
        onInputChange(userUiBalance)
    }

    const reloadTokens = () => {
        dispatch(fetchAllTokens({connection: connection, network: network}))
    }

    return (
        <Wrapper>
            <DescriptionWrapper>
                <Text>
                    {title}
                </Text>
                <Balance
                    onClick={onBalanceClick}>
                    {t('currencyInput.balance')} {userUiBalance}
                </Balance>
            </DescriptionWrapper>
            <FlexRow>
                <CurrencyWrapper onClick={handleOpen}>
                    {selected.icon}
                    {selected.symbol}
                    <SwapIcon/>
                </CurrencyWrapper>
                <StyledInput
                    value={amount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                />
            </FlexRow>
            {showMetamaskWallet(selected.chainId, network) && <KeyAndBalance chainId={selectedChainId}/>}
            {open && <Dialog
                fullWidth={true}
                onClose={handleClose}
                open={open}>
                <StyledDialogContent>
                    <ReloadHeader>
                        <Text>{title}</Text>
                        <IconButton onClick={reloadTokens}>
                            <ReplayIcon/>
                        </IconButton>
                    </ReloadHeader>
                    <FilterInput
                        onChange={handleFilterChange}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon/>
                                </InputAdornment>
                            ),
                        }}/>
                    <StyledList>
                        {loading ? <CircularProgress/> :
                            (previewTokens.map((token, index) => (
                                    <ListItem button key={`token-list-${index}`} onClick={() => onTokenSelect(token)}>
                                        <ListItemAvatar>
                                            {token.icon}
                                        </ListItemAvatar>
                                        <ListItemText primary={token.name} secondary={`chain: ${token.chain}`}/>
                                    </ListItem>
                                ))
                            )
                        }
                    </StyledList>
                </StyledDialogContent>
            </Dialog>
            }
        </Wrapper>
    );
};

const showMetamaskWallet = (chainId, network) => {
    return chainId === CHAIN_ID_ETH ||
        chainId === CHAIN_ID_BSC ||
        chainId === getEvmChainId(CHAIN_ID_ETH, network) ||
        chainId === getEvmChainId(CHAIN_ID_BSC, network)
}