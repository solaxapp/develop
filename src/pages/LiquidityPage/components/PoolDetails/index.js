import React, {useMemo} from "react";
import {useEnrichedPools} from "../../../../context/MarketProvider";
import {useMint, useUserAccounts} from "../../../../context/AccountsProvider";
import {Card, CenteredRow} from "../../../../components/Flex";
import {useTranslation} from "react-i18next";
import {Table, TableBody, TableCell, TableHead, TableRow} from "@mui/material";
import {formatPriceNumber} from "../../../../helper/token";
import {PoolIcon} from "../../../../components/TokenIcon";
import {Text} from "../../../../components/Text";
import PoolChart from "../../../../components/Charts/PoolChart";

export function PoolDetails({pool}) {
    const {t} = useTranslation();
    const pools = useMemo(() => [pool].filter((p) => p), [
        pool,
    ]);
    const enriched = useEnrichedPools(pools)[0];

    const {userAccounts} = useUserAccounts();
    const lpMint = useMint(pool.pubkeys.mint);
    const ratio =
        userAccounts
            .filter((f) => pool.pubkeys.mint.equals(f.info.mint))
            .reduce((acc, item) => item.info.amount.toNumber() + acc, 0) /
        (lpMint?.supply.toNumber() || 0);


    if (!pool || !enriched) {
        return null;
    }

    const baseMintAddress = pool.pubkeys.holdingMints[0].toBase58();
    const quoteMintAddress = pool.pubkeys.holdingMints[1].toBase58();

    return (
        <Card style={{
            padding: "10px 0px",
            mixBlendMode: "normal",
        }}>
            <CenteredRow>
                <PoolIcon mintA={baseMintAddress} mintB={quoteMintAddress}/>
                <Text>{enriched.name}</Text>
            </CenteredRow>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>
                            {enriched.names[0]} {t('common.per')} {enriched.names[1]}
                        </TableCell>
                        <TableCell>
                            {enriched.names[1]} {t('common.per')} {enriched.names[0]}
                        </TableCell>
                        <TableCell>{t('poolDetails.share')}</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    <TableRow>
                        <TableCell>
                            {formatPriceNumber.format(
                                parseFloat(enriched.liquidityA) / parseFloat(enriched.liquidityB)
                            )}
                        </TableCell>
                        <TableCell>
                            {formatPriceNumber.format(
                                parseFloat(enriched.liquidityB) / parseFloat(enriched.liquidityA)
                            )}
                        </TableCell>
                        <TableCell>
                            {ratio * 100 < 0.001 && ratio > 0 ? "<" : ""}
                            &nbsp;{formatPriceNumber.format(ratio * 100)}%
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
            <PoolChart pool={pool}/>
        </Card>
    );
}