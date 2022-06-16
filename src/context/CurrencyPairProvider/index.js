import React, {useContext, useEffect, useMemo, useState,} from "react";
import {cache, useAccountByMint} from "../AccountsProvider";
import {convert, getTokenName} from "../../helper/token";
import {CHAINS, CurveType, DEFAULT_DENOMINATOR, PoolOperation} from "../../constants/app";
import {useConnection} from "@solana/wallet-adapter-react";
import {calculateDependentAmount, usePoolForBasket} from "../../helper/crypto/Pools";
import {useAllTokensContext} from "../TokensProvider";
import {default_input_token} from "../../components/CurrencyInput";

const CurrencyPairContext = React.createContext(null);

const convertAmount = (amount, mint) => {
    if (!mint || !mint.decimals)
        return 0;
    return parseFloat(amount) * Math.pow(10, mint.decimals);
};

export const useCurrencyLeg = (config, defaultMint) => {
    const {tokenMap} = useAllTokensContext();
    const [amount, setAmount] = useState("");
    const [token, setToken] = useState(defaultMint || default_input_token);
    let isEth = token.chain === CHAINS.eth || token.chain === CHAINS.bnb
    const account = useAccountByMint(token.address);
    const mint = isEth ? console.log("MINT FOR ETH") : cache.getMint(token.address);

    return useMemo(() => ({
            isEth: isEth,
            mintAddress: token.address,
            account: account,
            token: token,
            mint: mint,
            amount: amount,
            name: getTokenName(tokenMap, token.address),
            icon: token.icon,
            setAmount: setAmount,
            setMint: setToken,
            convertAmount: () => convertAmount(amount, mint),
            sufficientBalance: () =>
                account !== undefined &&
                (convert(account, mint) >= parseFloat(amount) ||
                    config.curveType === CurveType.ConstantProductWithOffset),
        }),
        [token, account, mint, amount, tokenMap, setAmount, setToken, config]
    );
};

export function CurrencyPairProvider({children = null}) {
    const {connection} = useConnection();
    const [lastTypedAccount, setLastTypedAccount] = useState("");
    const [poolOperation, setPoolOperation] = useState(PoolOperation.Add);

    const [options, setOptions] = useState({
        curveType: CurveType.ConstantProduct,
        fees: {
            tradeFeeNumerator: 25,
            tradeFeeDenominator: DEFAULT_DENOMINATOR,
            ownerTradeFeeNumerator: 5,
            ownerTradeFeeDenominator: DEFAULT_DENOMINATOR,
            ownerWithdrawFeeNumerator: 0,
            ownerWithdrawFeeDenominator: 0,
            hostFeeNumerator: 20,
            hostFeeDenominator: 100,
        },
    });

    const base = useCurrencyLeg(options);
    const mintAddressA = base.mintAddress;
    const amountA = base.amount;
    const setAmountA = base.setAmount;

    const quote = useCurrencyLeg(options);
    const mintAddressB = quote.mintAddress;
    const amountB = quote.amount;
    const setAmountB = quote.setAmount;

    const {bestPool} = usePoolForBasket([base.mintAddress, quote.mintAddress]);

    //Update token when amount is changed
    useEffect(() => {
        if (base.isEth) {
            console.log("CALCULATE ETH DEPENDENT")
        } else {
            console.log("calculateDependent")
            calculateDependent();
        }
    }, [setAmountB, setAmountA, amountA, amountB, lastTypedAccount, bestPool]);

    const calculateDependent = async () => {
        if (bestPool && mintAddressA && mintAddressB) {
            let setDependent;
            let amount;
            let independent;
            if (lastTypedAccount === mintAddressA) {
                independent = mintAddressA;
                setDependent = setAmountB;
                amount = parseFloat(amountA);
            } else {
                independent = mintAddressB;
                setDependent = setAmountA;
                amount = parseFloat(amountB);
            }

            const result = await calculateDependentAmount(connection, independent, amount, bestPool, poolOperation);
            if (typeof result === "string") {
                setDependent(result);
            } else if (result !== undefined && Number.isFinite(result)) {
                setDependent(result.toFixed(6));
            } else {
                setDependent("");
            }
        }
    }

    return (
        <CurrencyPairContext.Provider
            value={{
                A: base,
                B: quote,
                lastTypedAccount,
                setLastTypedAccount,
                setPoolOperation,
                options,
                setOptions,
            }}>
            {children}
        </CurrencyPairContext.Provider>
    );
}

export const useCurrencyPairState = () => {
    return useContext(CurrencyPairContext);
};
