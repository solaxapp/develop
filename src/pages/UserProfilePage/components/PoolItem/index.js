import React, {useEffect, useMemo} from "react";
import {useCurrencyPairState} from "../../../../context/CurrencyPairProvider";
import {useMint} from "../../../../context/AccountsProvider";
import {Tooltip, Typography} from "@mui/material";
import {getPoolName} from "../../../../helper/token";
import {styled} from "@mui/material/styles";
import {CenteredCol, CenteredRow, FlexCol} from "../../../../components/Flex";
import {useTranslation} from "react-i18next";
import {useEnrichedPools} from "../../../../context/MarketProvider";
import PoolChart from "../../../../components/Charts/PoolChart";
import {useAllTokensContext} from "../../../../context/TokensProvider";
import {Text} from "../../../../components/Text";

const PoolCard = styled(FlexCol)(({theme}) => ({
    padding: 10,
    margin: 10,
    background: "#131E34 0% 0% no-repeat padding-box",
    boxShadow: "inset 0px 0px 40px #00000029, 0px 0px 20px #00000029",
    borderRadius: 25,
}))

export default function PoolItem({item}) {
    const {t} = useTranslation();
    const {A, B} = useCurrencyPairState();
    const {tokenMap} = useAllTokensContext();
    const mint = useMint(item.account.info.mint.toBase58());
    const amount = item.account.info.amount.toNumber() / Math.pow(10, mint?.decimals || 0);

    useEffect(() => {
        A.setMint(item.pool.pubkeys.holdingMints[0].toBase58());
        B.setMint(item.pool.pubkeys.holdingMints[1].toBase58());
    }, [A, B, item]);

    const {pool} = item;
    const pools = useMemo(() => [pool].filter((p) => p), [
        pool,
    ]);
    const enriched = useEnrichedPools(pools)[0];

    if (!enriched) {
        return null;
    }
    return (
        <PoolCard>
            <CenteredCol>
                <Text>{getPoolName(tokenMap, item.pool)}</Text>
                <CenteredRow>
                    <Text>{amount?.toFixed(4)}</Text>
                    <Tooltip title={t('common.feeAccount')}>
                        <Text>
                            {item.isFeeAccount ? " (F) " : " "}
                        </Text>
                    </Tooltip>
                </CenteredRow>
            </CenteredCol>
            <PoolChart pool={pool}/>
            {/*<RemoveLiquidity instance={item}/>*/}
        </PoolCard>
    );
}