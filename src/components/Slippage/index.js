import React from "react";
import {Card, CardContent, CardHeader, MenuItem, Select, styled, ToggleButton, ToggleButtonGroup} from "@mui/material";
import {WalletAdapterNetwork} from "@solana/wallet-adapter-base";
import {useNetworkConfig, useSlippageConfig} from "../../context/GlobalProvider";
import {CenteredCol} from "../Flex";

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({theme}) => ({
    "& .Mui-selected": {
        color: "#6f8fd0 !important",
        // color: theme.palette.common.white,
        border: `1px solid ${theme.palette.common.white}`,
        borderLeft: `1px solid ${theme.palette.common.white} !important`
    }
}))

const StyledCard = styled(Card)(() => ({
    width: "100%"
}))

const StyledSelect = styled(Select)(({theme}) => ({
    width: "100%"
}))

const Slippage = () => {
    const {slippage, setSlippage} = useSlippageConfig();

    const onChangeSlippage = (e) => {
        const {value} = e.target;
        setSlippage(value)
    }

    return (
        <StyledToggleButtonGroup
            color="primary"
            value={slippage}
            exclusive
            onChange={onChangeSlippage}>
            {[0.1, 0.5, 1.0, 1.5, 2.0].map((item) => {
                return (
                    <ToggleButton
                        key={item.toString()}
                        value={item}>
                        {item}%
                    </ToggleButton>
                );
            })}
        </StyledToggleButtonGroup>
    );
};

export const Settings = () => {
    const {network, changeNetwork} = useNetworkConfig();
    const networks = [WalletAdapterNetwork.Testnet, WalletAdapterNetwork.Devnet, WalletAdapterNetwork.Mainnet]
    return (
        <CenteredCol>
            <Card>
                <CardHeader title="Slippage:"/>
                <CardContent>
                    <Slippage/>
                </CardContent>
            </Card>
            <StyledCard>
                <CardHeader title="Network"/>
                <CardContent>
                    <StyledSelect
                        value={network}
                        onChange={(e)=> changeNetwork(e.target.value)}>
                        {networks.map((value, index) => (
                            <MenuItem key={index} value={value}>{value}</MenuItem>
                        ))}
                    </StyledSelect>
                </CardContent>
            </StyledCard>
        </CenteredCol>
    );
};
