import React from "react";
import {getTokenIcon, getTokenName} from "../../../../helper/token";
import {TokenIcon} from "../../../../components/TokenIcon";
import {CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow} from "@mui/material";
import {useTranslation} from "react-i18next";
import {useAllTokensContext} from "../../../../context/TokensProvider";

const TokenRow = ({token, tokenMap}) => {
    const mint = token.account.data.parsed.info.mint
    let name = getTokenName(tokenMap, mint, false);
    let iconExist = getTokenIcon(tokenMap, mint)
    let amount = token.account.data.parsed.info.tokenAmount.uiAmountString
    if (iconExist) {
        return (
            <TableRow>
                <TableCell>
                    <TokenIcon
                        style={{
                            width: 50,
                            height: "auto",
                            borderRadius: 50,
                            objectFit: "cover"
                        }}
                        mintAddress={mint}
                        icon={getTokenIcon(tokenMap, token.account.data.parsed.info.mint)}/>
                </TableCell>
                <TableCell>{name}</TableCell>
                <TableCell>{mint}</TableCell>
                <TableCell>{amount}</TableCell>
            </TableRow>
        )
    }
    return null;
}

export default function TokenItems({tokens, loading}) {
    const {t} = useTranslation();
    const {tokenMap} = useAllTokensContext();
    return (
        <TableContainer>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>{t('userProfilePage.tokenIcon')}</TableCell>
                        <TableCell>{t('userProfilePage.tokenName')}</TableCell>
                        <TableCell>{t('userProfilePage.tokenAddress')}</TableCell>
                        <TableCell>{t('userProfilePage.tokenAmount')}</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {loading ? <TableRow>
                            <TableCell colSpan={4}>
                                <CircularProgress/>
                            </TableCell>
                        </TableRow> :
                        tokens.map((token, index) => <TokenRow
                            key={`token-item-${index}`}
                            token={token}
                            tokenMap={tokenMap}/>)}
                </TableBody>
            </Table>
        </TableContainer>
    );
}