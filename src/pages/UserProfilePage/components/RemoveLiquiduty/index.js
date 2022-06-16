import React, {useEffect, useMemo, useState} from "react";
import {useConnection, useWallet} from "@solana/wallet-adapter-react";
import {useMint, useUserAccounts} from "../../../../context/AccountsProvider";
import {programIds} from "../../../../helper/ids";
import {TokenSwapLayout} from "../../../../helper/crypto/models/TokenSwap2";
import {removeExactOneLiquidity, removeLiquidity} from "../../../../helper/crypto/Pools";
import {formatPriceNumber, getPoolName, getTokenName} from "../../../../helper/token";
import {Button, CircularProgress, Radio, Slider} from "@mui/material";
import {Card, FlexCol, FlexRow} from "../../../../components/Flex";
import {Text} from "../../../../components/Text";
import {PoolIcon, TokenIcon} from "../../../../components/TokenIcon";
import {PoolCurrencyInput} from "../../../../components/PoolCurrencyInput";
import {useEnrichedPools} from "../../../../context/MarketProvider";
import {generateRemoveLabel} from "../../../../constants/labels";
import {useAllTokensContext} from "../../../../context/TokensProvider";

export const RemoveLiquidity = ({instance, removeRatio, withdrawType, amount, withdrawToken}) => {
    const {account, pool} = instance;
    const [pendingTx, setPendingTx] = useState(false);
    const {wallet, connected} = useWallet();
    const connection = useConnection();
    const {tokenMap} = useAllTokensContext();
    const mint = useMint(withdrawToken);

    const isLatestLayout = programIds().swapLayout === TokenSwapLayout;

    let liquidityAmount = removeRatio * account.info.amount.toNumber();
    const hasSufficientBalance =
        liquidityAmount <= account.info.amount.toNumber();

    const onRemove = async () => {
        try {
            setPendingTx(true);
            if (withdrawType === "one" && isLatestLayout) {
                const tokenAmount = amount * Math.pow(10, mint?.decimals || 0);
                await removeExactOneLiquidity(
                    connection,
                    wallet,
                    account,
                    liquidityAmount,
                    tokenAmount,
                    withdrawToken,
                    pool
                );
            } else {
                await removeLiquidity(
                    connection,
                    wallet,
                    liquidityAmount,
                    account,
                    pool
                );
            }
        } catch {
            // notify({
            //     description:
            //         "Please try again and approve transactions from your wallet",
            //     message: "Removing liquidity cancelled.",
            //     type: "error",
            // });
        } finally {
            setPendingTx(false);
            // TODO: force refresh of pool accounts?
        }
    };

    return (
        <Button
            className="add-button"
            type="primary"
            size="large"
            onClick={onRemove}
            disabled={
                connected &&
                (pendingTx || !hasSufficientBalance || !account || !liquidityAmount)
            }
        >
            {generateRemoveLabel(
                connected,
                liquidityAmount,
                pool,
                tokenMap,
                hasSufficientBalance
            )}
            {pendingTx && (
                <CircularProgress/>
            )}
        </Button>
    );
};

export const RemoveLiquidityEntry = ({instance, enriched}) => {
    const {account, pool} = instance;
    const [inputType, setInputType] = useState("slider");
    const {tokenMap} = useAllTokensContext();
    const isLatestLayout = programIds().swapLayout === TokenSwapLayout;
    const lpMint = useMint(pool?.pubkeys.mint);

    const [withdrawType, setWithdrawType] = useState("both");
    const [withdrawToken, setWithdrawToken] = useState(pool?.pubkeys.mint.toBase58());

    const ratio = (account?.info.amount.toNumber() || 0) / (lpMint?.supply.toNumber() || 1);

    const baseMintAddress = enriched.mints[0];
    const quoteMintAddress = enriched.mints[1];

    const [inputInfo, setInputInfo] = useState({
        amount: "initial",
        lastTyped: "pool",
        liquidityPercentage: 100,
    });

    const [inputsDescription, setInputsDescription] = useState({
        pool: "Input",
        poolAmount: formatPriceNumber.format(
            ratio * (enriched?.supply || 0) * (inputInfo.liquidityPercentage / 100)
        ),
        tokenA: "Output (estimated)",
        tokenAAmount: formatPriceNumber.format(
            ratio *
            (enriched?.liquidityA || 0) *
            (inputInfo.liquidityPercentage / 100)
        ),
        tokenB: "Output (estimated)",
        tokenBAmount: formatPriceNumber.format(
            ratio *
            (enriched?.liquidityB || 0) *
            (inputInfo.liquidityPercentage / 100)
        ),
    });

    useEffect(() => {
        switch (inputInfo.lastTyped) {
            case "pool": {
                setInputsDescription({
                    pool: withdrawType === "both" ? "Input" : "Output (Estimated)",
                    poolAmount:
                        inputInfo.amount !== "initial"
                            ? inputInfo.amount
                            : formatPriceNumber.format(
                                ratio *
                                (enriched?.supply || 0) *
                                (inputInfo.liquidityPercentage / 100)
                            ),
                    tokenA: withdrawType === "one" ? "Input" : "Output (Estimated)",
                    tokenAAmount: formatPriceNumber.format(
                        ratio *
                        (enriched?.liquidityA || 0) *
                        (inputInfo.liquidityPercentage / 100)
                    ),
                    tokenB: withdrawType === "one" ? "Input" : "Output (Estimated)",
                    tokenBAmount: formatPriceNumber.format(
                        ratio *
                        (enriched?.liquidityB || 0) *
                        (inputInfo.liquidityPercentage / 100)
                    ),
                });
                break;
            }
            case "tokenA": {
                setInputsDescription({
                    pool: withdrawType === "both" ? "Input" : "Output (Estimated)",
                    poolAmount: formatPriceNumber.format(
                        ratio *
                        (enriched?.supply || 0) *
                        (inputInfo.liquidityPercentage / 100)
                    ),
                    tokenA: withdrawType === "one" ? "Input" : "Output (Estimated)",
                    tokenAAmount: inputInfo.amount,
                    tokenB: withdrawType === "one" ? "Input" : "Output (Estimated)",
                    tokenBAmount: formatPriceNumber.format(
                        ratio *
                        (enriched?.liquidityB || 0) *
                        (inputInfo.liquidityPercentage / 100)
                    ),
                });
                break;
            }
            case "tokenB": {
                setInputsDescription({
                    pool: withdrawType === "both" ? "Input" : "Output (Estimated)",
                    poolAmount: formatPriceNumber.format(
                        ratio *
                        (enriched?.supply || 0) *
                        (inputInfo.liquidityPercentage / 100)
                    ),
                    tokenA: withdrawType === "one" ? "Input" : "Output (Estimated)",
                    tokenAAmount: formatPriceNumber.format(
                        ratio *
                        (enriched?.liquidityA || 0) *
                        (inputInfo.liquidityPercentage / 100)
                    ),
                    tokenB: withdrawType === "one" ? "Input" : "Output (Estimated)",
                    tokenBAmount: inputInfo.amount,
                });
                break;
            }
            case "slider": {
                setInputsDescription({
                    pool: withdrawType === "both" ? "Input" : "Output (Estimated)",
                    poolAmount: formatPriceNumber.format(
                        ratio *
                        (enriched?.supply || 0) *
                        (inputInfo.liquidityPercentage / 100)
                    ),
                    tokenA: withdrawType === "one" ? "Input" : "Output (Estimated)",
                    tokenAAmount: formatPriceNumber.format(
                        ratio *
                        (enriched?.liquidityA || 0) *
                        (inputInfo.liquidityPercentage / 100)
                    ),
                    tokenB: withdrawType === "one" ? "Input" : "Output (Estimated)",
                    tokenBAmount: formatPriceNumber.format(
                        ratio *
                        (enriched?.liquidityB || 0) *
                        (inputInfo.liquidityPercentage / 100)
                    ),
                });
                break;
            }
        }
    }, [inputInfo, enriched, ratio, inputInfo.liquidityPercentage, withdrawType]);

    useEffect(() => {
        if (withdrawType === "one") {
            if (
                withdrawToken === baseMintAddress &&
                inputInfo.amount !== inputsDescription.tokenAAmount
            ) {
                setInputInfo({
                    ...inputInfo,
                    lastTyped: "tokenA",
                    amount: inputsDescription.tokenAAmount,
                });
            } else if (
                withdrawToken === quoteMintAddress &&
                inputInfo.amount !== inputsDescription.tokenBAmount
            ) {
                setInputInfo({
                    ...inputInfo,
                    lastTyped: "tokenB",
                    amount: inputsDescription.tokenBAmount,
                });
            }
        }
        // Only needed to change with specific states
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [withdrawToken, withdrawType, baseMintAddress, quoteMintAddress]);

    if (!pool || !enriched) {
        return null;
    }

    const handleInputChange = (val, inputSource) => {
        switch (inputSource) {
            case "pool": {
                setInputInfo({
                    liquidityPercentage: (val * 100) / (enriched.supply * ratio),
                    amount: val,
                    lastTyped: "pool",
                });
                break;
            }
            case "tokenA": {
                setInputInfo({
                    liquidityPercentage: (val * 100) / (enriched.liquidityA * ratio),
                    amount: val,
                    lastTyped: "tokenA",
                });
                break;
            }
            case "tokenB": {
                setInputInfo({
                    liquidityPercentage: (val * 100) / (enriched.liquidityB * ratio),
                    amount: val,
                    lastTyped: "tokenB",
                });
                break;
            }
            case "slider": {
                setInputInfo({
                    ...inputInfo,
                    liquidityPercentage: val,
                    lastTyped: "slider",
                });
                break;
            }
        }
    };

    const getTokenOptions = () => {
        if (pool) {
            const name = getPoolName(tokenMap, pool);
            const mint = pool.pubkeys.mint.toBase58();
            return (
                <>
                    <Radio key={mint} value={mint} name={name}>
                        {name}
                    </Radio>
                    {pool.pubkeys.holdingMints.map((mint) => {
                        const mintAddress = mint.toBase58();
                        const tokenName = getTokenName(tokenMap, mintAddress);
                        return (
                            <Radio key={mintAddress} value={mintAddress} name={tokenName}>
                                {tokenName}
                            </Radio>
                        );
                    })}
                </>
            );
        }
        return null;
    };

    const handleToggleWithdrawType = (item) => {
        if (item === pool?.pubkeys.mint.toBase58()) {
            setWithdrawType("both");
            setWithdrawToken(pool?.pubkeys.mint.toBase58());
        } else if (item === enriched.mints[0]) {
            if (withdrawType !== "one") {
                setWithdrawType("one");
            }
            setWithdrawToken(enriched.mints[0]);
        } else if (item === enriched.mints[1]) {
            if (withdrawType !== "one") {
                setWithdrawType("one");
            }
            setWithdrawToken(enriched.mints[1]);
        }
    };
    return (
        <>
            {inputType === "slider" && (
                <div className="input-card">
                    Remove Liquidity
                    <Card
                        style={{
                            mixBlendMode: "normal",
                        }}>
                        <div className="pool-card" style={{width: "initial"}}>
                            <div className="pool-card-row">
                                <div className="pool-card-cell">Amount</div>
                                <div className="pool-card-cell">
                                    <Button onClick={() => setInputType("input")}>
                                        Detailed
                                    </Button>
                                </div>
                            </div>
                            <div className="pool-card-row">
                                <div className="pool-card-cell">
                                    <Text style={{fontSize: "42px"}}>
                                        {formatPriceNumber.format(inputInfo.liquidityPercentage)}%
                                    </Text>
                                </div>
                            </div>
                            <div className="pool-card-row">
                                <Slider
                                    style={{width: "100%"}}
                                    value={inputInfo.liquidityPercentage}
                                    tipFormatter={(amount) => `${amount}%`}
                                    min={0}
                                    max={100}
                                    onChange={(amount) =>
                                        setInputInfo({
                                            ...inputInfo,
                                            liquidityPercentage: amount,
                                            lastTyped: "slider",
                                        })
                                    }
                                />
                            </div>
                            <FlexRow>
                                <FlexCol>
                                    <Button
                                        onClick={() =>
                                            setInputInfo({
                                                ...inputInfo,
                                                liquidityPercentage: 25,
                                                lastTyped: "slider",
                                            })
                                        }
                                    >
                                        25%
                                    </Button>
                                </FlexCol>
                                <FlexCol>
                                    <Button
                                        onClick={() =>
                                            setInputInfo({
                                                ...inputInfo,
                                                liquidityPercentage: 50,
                                                lastTyped: "slider",
                                            })
                                        }
                                    >
                                        50%
                                    </Button>
                                </FlexCol>
                                <FlexCol>
                                    <Button
                                        onClick={() =>
                                            setInputInfo({
                                                ...inputInfo,
                                                liquidityPercentage: 75,
                                                lastTyped: "slider",
                                            })
                                        }
                                    >
                                        75%
                                    </Button>
                                </FlexCol>
                                <FlexCol>
                                    <Button
                                        onClick={() =>
                                            setInputInfo({
                                                ...inputInfo,
                                                liquidityPercentage: 100,
                                                lastTyped: "slider",
                                            })
                                        }
                                    >
                                        100%
                                    </Button>
                                </FlexCol>
                            </FlexRow>
                        </div>
                    </Card>
                    ↓
                    <Card
                        className="ccy-input"
                        style={{borderRadius: 20, width: "100%"}}
                        size="small"
                    >
                        <div className="pool-card" style={{width: "initial"}}>
                            <div className="pool-card-row">
                                <div className="pool-card-cell">
                                    {formatPriceNumber.format(
                                        ratio *
                                        enriched.liquidityA *
                                        (inputInfo.liquidityPercentage / 100)
                                    )}
                                </div>
                                <div className="pool-card-cell">
                                    <div style={{display: "flex", alignItems: "center"}}>
                                        <TokenIcon mintAddress={baseMintAddress}/>
                                        <h3 style={{margin: 0}}>{enriched?.names[0]}</h3>
                                    </div>
                                </div>
                            </div>
                            <div className="pool-card-row">
                                <div className="pool-card-cell">
                                    {formatPriceNumber.format(
                                        ratio *
                                        enriched.liquidityB *
                                        (inputInfo.liquidityPercentage / 100)
                                    )}
                                </div>
                                <div className="pool-card-cell">
                                    <div style={{display: "flex", alignItems: "center"}}>
                                        <TokenIcon mintAddress={quoteMintAddress}/>
                                        <h3 style={{margin: 0}}>{enriched.names[1]}</h3>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
            {inputType === "input" && (
                <div className="input-card">
                    Remove Liquidity
                    {isLatestLayout && pool && (
                        <div className="flex-row-center">
                            <Radio.Group
                                style={{margin: "10px 0"}}
                                onChange={(item) => handleToggleWithdrawType(item.target.value)}
                                value={
                                    withdrawType === "both"
                                        ? pool?.pubkeys.mint.toBase58()
                                        : withdrawToken
                                }
                            >
                                {getTokenOptions()}
                            </Radio.Group>
                        </div>
                    )}
                    <Card
                        className="ccy-input"
                        style={{borderRadius: 20, width: "100%"}}
                        size="small"
                    >
                        <div className="pool-card" style={{width: "initial"}}>
                            <div className="pool-card-row">
                                <div className="pool-card-cell">Amount Estimated</div>
                                <div className="pool-card-cell">
                                    <Button onClick={() => setInputType("slider")}>Simple</Button>
                                </div>
                            </div>
                            <div className="pool-card-row">
                                <div className="pool-card-cell">
                                    <Text style={{fontSize: "42px"}}>
                                        {formatPriceNumber.format(inputInfo.liquidityPercentage)}%
                                    </Text>
                                </div>
                            </div>
                        </div>
                        <div className="pool-card-row">
                            <Slider
                                style={{width: "100%"}}
                                value={inputInfo.liquidityPercentage}
                                tipFormatter={(amount) => `${amount}%`}
                                min={0}
                                max={100}
                                onChange={(amount) =>
                                    handleInputChange(amount, "slider")
                                }
                            />
                        </div>
                        <FlexRow>
                            <FlexCol>
                                <Button onClick={() => handleInputChange(25, "slider")}>
                                    25%
                                </Button>
                            </FlexCol>
                            <FlexCol>
                                <Button onClick={() => handleInputChange(50, "slider")}>
                                    50%
                                </Button>
                            </FlexCol>
                            <FlexCol>
                                <Button onClick={() => handleInputChange(75, "slider")}>
                                    75%
                                </Button>
                            </FlexCol>
                            <FlexCol>
                                <Button onClick={() => handleInputChange(100, "slider")}>
                                    100%
                                </Button>
                            </FlexCol>
                        </FlexRow>
                    </Card>
                    <PoolCurrencyInput
                        mint={pool.pubkeys.mint.toBase58()}
                        pool={pool}
                        title={inputsDescription.pool}
                        amount={inputsDescription.poolAmount}
                        onInputChange={(val) => {
                            handleInputChange(val, "pool");
                        }}
                    />
                    ↓
                    {(withdrawType === "both" || withdrawToken === baseMintAddress) && (
                        <PoolCurrencyInput
                            mint={baseMintAddress}
                            title={inputsDescription.tokenA}
                            amount={inputsDescription.tokenAAmount}
                            onInputChange={(val) => {
                                handleInputChange(val, "tokenA");
                            }}
                        />
                    )}
                    {withdrawType === "both" && "+"}
                    {(withdrawType === "both" || withdrawToken === quoteMintAddress) && (
                        <PoolCurrencyInput
                            mint={quoteMintAddress}
                            title={inputsDescription.tokenB}
                            amount={inputsDescription.tokenBAmount}
                            onInputChange={(val) => {
                                handleInputChange(val, "tokenB");
                            }}
                        />
                    )}
                </div>
            )}
            {account && (
                <RemoveLiquidity
                    instance={{pool: pool, account: account}}
                    removeRatio={inputInfo.liquidityPercentage / 100}
                    withdrawType={withdrawType}
                    amount={
                        withdrawToken === baseMintAddress
                            ? parseFloat(inputsDescription.tokenAAmount)
                            : parseFloat(inputsDescription.tokenBAmount)
                    }
                    withdrawToken={withdrawToken}
                />
            )}
            <YourPosition pool={pool}/>
        </>
    );
};


export const YourPosition = ({pool}) => {
    const pools = useMemo(() => [pool].filter((p) => p), [
        pool,
    ]);
    const enriched = useEnrichedPools(pools)[0];
    const {userAccounts} = useUserAccounts();
    const lpMint = useMint(pool?.pubkeys.mint);

    if (!pool || !enriched) {
        return null;
    }
    const baseMintAddress = pool.pubkeys.holdingMints[0].toBase58();
    const quoteMintAddress = pool.pubkeys.holdingMints[1].toBase58();

    const ratio =
        userAccounts
            .filter((f) => pool.pubkeys.mint.equals(f.info.mint))
            .reduce((acc, item) => item.info.amount.toNumber() + acc, 0) /
        (lpMint?.supply.toNumber() || 0);

    return (
        <Card
            className="ccy-input"
            style={{borderRadius: 20, width: "100%"}}
            bodyStyle={{padding: "7px"}}
            size="small"
            title="Your Position"
        >
            <div className="pool-card" style={{width: "initial"}}>
                <div className="pool-card-row">
                    <div className="pool-card-cell">
                        <div style={{display: "flex", alignItems: "center"}}>
                            <PoolIcon mintA={baseMintAddress} mintB={quoteMintAddress}/>
                            <h3 style={{margin: 0}}>{enriched?.name}</h3>
                        </div>
                    </div>
                    <div className="pool-card-cell">
                        <h3 style={{margin: 0}}>
                            {formatPriceNumber.format(ratio * enriched.supply)}
                        </h3>
                    </div>
                </div>
                <div className="pool-card-row" style={{margin: 0}}>
                    <div className="pool-card-cell">Your Share:</div>
                    <div className="pool-card-cell">
                        {ratio * 100 < 0.001 && ratio > 0 ? "<" : ""}
                        {formatPriceNumber.format(ratio * 100)}%
                    </div>
                </div>
                <div className="pool-card-row" style={{margin: 0}}>
                    <div className="pool-card-cell">{enriched.names[0]}:</div>
                    <div className="pool-card-cell">
                        {formatPriceNumber.format(ratio * enriched.liquidityA)}
                    </div>
                </div>
                <div className="pool-card-row" style={{margin: 0}}>
                    <div className="pool-card-cell">{enriched.names[1]}:</div>
                    <div className="pool-card-cell">
                        {formatPriceNumber.format(ratio * enriched.liquidityB)}
                    </div>
                </div>
            </div>
        </Card>
    );
};