import React, {useState} from "react";
import {
    Card,
    CenteredCol,
    CenteredRow,
    FlexRow,
    PageContainer,
    PageTitle,
    SwapWrapper,
    WalletButton
} from "../../components/Flex";
import CurrencyInput from "../../components/CurrencyInput";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    CircularProgress,
    FormControlLabel,
    Radio,
    RadioGroup
} from "@mui/material";
import {
    ADD_LIQUIDITY_LABEL,
    CREATE_POOL_LABEL,
    generateActionLabel,
    generateExactOneLabel
} from "../../constants/labels";
import {getPoolName} from "../../helper/token";
import {useTranslation} from "react-i18next";
import {useCurrencyPairState} from "../../context/CurrencyPairProvider";
import {useConnection, useWallet} from "@solana/wallet-adapter-react";
import {addLiquidity, usePoolForBasket} from "../../helper/crypto/Pools";
import {useNetworkConfig, useSlippageConfig} from "../../context/GlobalProvider";
import {useNotify} from "../../context/Notifications";
import {CurveType, PoolOperation} from "../../constants/app";
import {LoadingButton} from "@mui/lab";
import LiquidityDescription from "./components/LiquidityDescription";
import {Text} from "../../components/Text";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {PoolDetails} from "./components/PoolDetails";
import PoolConfig from "./components/PoolConfig";
import {useAllTokensContext} from "../../context/TokensProvider";
import styled from "@emotion/styled";

const StyledRadio = styled(Radio)(({theme}) => ({
    "&.Mui-checked": {
        color: theme.palette.common.white
    }
}))

const CurrencyWrapper = styled(CenteredCol)(() => ({}))

const StyledAccordion = styled(Accordion)(() => ({
    marginTop: 10,
    background: "#111a2f",
    "&::before": {
        display: "none"
    }
}))

const SlippageWrapper = styled(FlexRow)(() => ({
    paddingTop: 10,
    justifyContent: "space-between",
    width: "100%"
}))

const SlippageText = styled(Text)(() => ({}))

const SlippageAmount = styled(Text)(() => ({}))

export default function LiquidityPage() {
    const {network} = useNetworkConfig();
    const {slippage} = useSlippageConfig();
    const {t} = useTranslation();
    const allWallets = useWallet();
    const {connected, publicKey, sendTransaction} = allWallets;
    const {connection} = useConnection();
    const [pendingTx, setPendingTx] = useState(false);
    const [depositType, setDepositType] = useState("both");
    const {A, B, setLastTypedAccount, setPoolOperation, options, setOptions} = useCurrencyPairState();
    const [depositToken, setDepositToken] = useState(A.mintAddress);
    let {bestPool} = usePoolForBasket([A?.mintAddress, B?.mintAddress]);
    const {tokenMap} = useAllTokensContext();
    const notify = useNotify();
    const [openCurrencyInput, setOpenCurrencyInput] = useState({
        first: false,
        second: false
    });
    const [expandPoolDetails, setExpandPoolDetails] = useState(false);
    let hasSufficientBalance = A.sufficientBalance() && B.sufficientBalance();

    const executeAction = !connected ? connected : async (instance) => {
        const currentDepositToken = getDepositToken();
        if (depositType === "one" && currentDepositToken?.account && currentDepositToken.mint) {
            setPendingTx(true);
            const components = [{
                account: currentDepositToken.account,
                mintAddress: currentDepositToken.mintAddress,
                amount: currentDepositToken.convertAmount(),
            }];
            addLiquidity(connection, components, slippage, instance, options, depositType,
                notify, publicKey, sendTransaction).then(() => {
                setPendingTx(false);
            }).catch((e) => {
                console.error("Transaction failed", e);
                notify("error", "Please try again and approve transactions from your wallet. Adding liquidity cancelled.");
                setPendingTx(false);
            });
        } else if (A.account && B.account && A.mint && B.mint) {
            setPendingTx(true);
            const components = [
                {
                    account: A.account,
                    mintAddress: A.mintAddress,
                    amount: A.convertAmount(),
                },
                {
                    account: B.account,
                    mintAddress: B.mintAddress,
                    amount: B.convertAmount(),
                },
            ];

            // use input from B as offset during pool init for curve with offset
            if (options.curveType === CurveType.ConstantProductWithOffset && !instance) {
                options.token_b_offset = components[1].amount;
                components[1].amount = 0;
            }

            addLiquidity(connection, components, slippage, instance, options, depositType, notify, publicKey,
                sendTransaction).then(() => {
                setPendingTx(false);
            }).catch((e) => {
                console.log("Transaction failed", e);
                notify("error", "Please try again and approve transactions from your wallet. Adding liquidity cancelled.")
                setPendingTx(false);
            });
        }
    };

    const getDepositToken = () => {
        if (!depositToken) {
            return undefined;
        }
        return depositToken === A.mintAddress ? A : B;
    };

    const handleToggleDepositType = (item) => {
        if (item === bestPool?.pubkeys.mint.toBase58()) {
            setDepositType("both");
        } else if (item === A.mintAddress) {
            if (depositType !== "one") {
                setDepositType("one");
            }
            setDepositToken(A.mintAddress);
        } else if (item === B.mintAddress) {
            if (depositType !== "one") {
                setDepositType("one");
            }
            setDepositToken(B.mintAddress);
        }
    };

    const createPoolButton = bestPool && (
        <LoadingButton
            className="add-button"
            type="primary"
            size="large"
            onClick={() => executeAction()}
            loading={pendingTx}
            disabled={
                connected &&
                (pendingTx ||
                    !A.account ||
                    !B.account ||
                    A.account === B.account ||
                    !hasSufficientBalance)
            }>
            {generateActionLabel(CREATE_POOL_LABEL, connected, tokenMap, A, B)}
        </LoadingButton>
    );

    const addLiquidityButton = (
        <WalletButton
            size="large"
            onClick={() => executeAction(bestPool)}
            trigger={["click"]}
            disabled={
                !connected || (connected && connected &&
                    (depositType === "both"
                        ? pendingTx ||
                        !A.account ||
                        !B.account ||
                        A.account === B.account ||
                        !hasSufficientBalance
                        : !getDepositToken()?.account ||
                        !getDepositToken()?.sufficientBalance()))
            }>
            {depositType === "both"
                ? generateActionLabel(bestPool ? ADD_LIQUIDITY_LABEL : CREATE_POOL_LABEL, connected, tokenMap, A, B)
                : generateExactOneLabel(connected, tokenMap, getDepositToken())}
            {pendingTx && <CircularProgress className="add-spinner"/>}
        </WalletButton>
    );

    const getTokenOptions = (t) => {
        let name = "";
        let mint = "";
        if (bestPool) {
            name = getPoolName(tokenMap, bestPool);
            mint = bestPool.pubkeys.mint.toBase58();
        }
        return (
            <>
                {bestPool && (
                    <FormControlLabel
                        key={`pool-${mint}`}
                        value={mint}
                        control={<StyledRadio/>}
                        name={name}
                        label={`${t('common.add')} ${name}`}/>
                )}
                {[A, B].map((item) => {
                    return (
                        <FormControlLabel
                            key={item.mintAddress}
                            value={item.mintAddress}
                            control={<StyledRadio/>}
                            name={item.name}
                            label={`${t('common.add')} ${item.name}`}/>
                    );
                })}
            </>
        );
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

    const handleChangePoolDetails = () => {
        setExpandPoolDetails(!expandPoolDetails);
    }

    return (
        <PageContainer>
            <SwapWrapper>
                <PageTitle>{t('liquidityPage.title')}</PageTitle>
                <Card>
                    <CenteredRow>
                        <LiquidityDescription/>
                        <PoolConfig
                            options={options}
                            setOptions={setOptions}
                            createPoolButton={createPoolButton}
                        />
                    </CenteredRow>
                    {bestPool && (
                        <CenteredRow>
                            <RadioGroup
                                style={{
                                    justifyContent: "center"
                                }}
                                row
                                onChange={(item) => handleToggleDepositType(item.target.value)}
                                value={
                                    depositType === "both"
                                        ? bestPool?.pubkeys.mint.toBase58()
                                        : getDepositToken()?.mintAddress
                                }>
                                {getTokenOptions(t)}
                            </RadioGroup>
                        </CenteredRow>
                    )}
                    {depositType === "both" && (
                        <CurrencyWrapper>
                            <CurrencyInput
                                open={openCurrencyInput.first}
                                handleOpen={handleOpenCurrencyInput(1)}
                                handleClose={handleCloseCurrencyInput}
                                network={network}
                                title={t('liquidityPage.from')}
                                onInputChange={(val) => {
                                    setPoolOperation(PoolOperation.Add);
                                    if (A.amount !== val) {
                                        setLastTypedAccount(A.mintAddress);
                                    }
                                    A.setAmount(val);
                                }}
                                amount={A.amount}
                                mint={A.mintAddress}
                                onMintChange={(item) => {
                                    A.setMint(item);
                                }}
                            />
                            <div>+</div>
                            <CurrencyInput
                                open={openCurrencyInput.second}
                                handleOpen={handleOpenCurrencyInput(2)}
                                handleClose={handleCloseCurrencyInput}
                                network={network}
                                title={
                                    options.curveType === CurveType.ConstantProductWithOffset
                                        ? "Offset"
                                        : "Input"
                                }
                                onInputChange={(val) => {
                                    setPoolOperation(PoolOperation.Add);
                                    if (B.amount !== val) {
                                        setLastTypedAccount(B.mintAddress);
                                    }
                                    B.setAmount(val);
                                }}
                                amount={B.amount}
                                mint={B.mintAddress}
                                onMintChange={(item) => {
                                    B.setMint(item);
                                }}
                            />
                        </CurrencyWrapper>
                    )}
                    {depositType === "one" && depositToken && (
                        <CurrencyWrapper>
                            <CurrencyInput
                                network={network}
                                title={t('liquidityPage.from')}
                                onInputChange={(val) => {
                                    setPoolOperation(PoolOperation.Add);
                                    const dToken = getDepositToken();
                                    if (dToken && dToken.amount !== val) {
                                        setLastTypedAccount(dToken.mintAddress);
                                    }
                                    getDepositToken()?.setAmount(val);
                                }}
                                amount={getDepositToken()?.amount}
                                mint={getDepositToken()?.mintAddress}
                                hideSelect={true}
                            />
                        </CurrencyWrapper>
                    )}
                    <SlippageWrapper>
                        <SlippageText>
                            {t('liquidityPage.slippageTolerance')}
                        </SlippageText>
                        <SlippageAmount>
                            {slippage}%
                        </SlippageAmount>
                    </SlippageWrapper>
                    {addLiquidityButton}
                    <StyledAccordion
                        expanded={expandPoolDetails}
                        onChange={handleChangePoolDetails}>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon/>}>
                            <Text>
                                {t('liquidityPage.poolInfo')}
                            </Text>
                        </AccordionSummary>
                        <AccordionDetails>
                            {bestPool && <PoolDetails pool={bestPool}/>}
                        </AccordionDetails>
                    </StyledAccordion>
                </Card>
            </SwapWrapper>
        </PageContainer>
    );
}