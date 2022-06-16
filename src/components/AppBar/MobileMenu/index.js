import React from "react"
import {styled} from "@mui/material/styles";
import {CenteredCol, FlexCol, FlexRow} from "../../Flex";
import {useTranslation} from "react-i18next";
import {ROUTES} from "../../../constants/routes";
import {Text} from "../../Text";
import {useLocation} from "react-router-dom";

const Container = styled(FlexCol)(({open}) => ({
    height: "100%",
    width: open === "true" ? "100%" : 0,
    position: "fixed",
    zIndex: 9999,
    top: 0,
    left: 0,
    backgroundColor: "rgba(0,0,0, 0.9)",
    overflowX: "hidden",
    transition: "0.5s",
}))

const ContentWrapper = styled(CenteredCol)(() => ({
    top: "25%",
    position: "relative",
    width: "100%",
}))

const CloseButton = styled(FlexRow)(({theme}) => ({
    color: theme.palette.common.white,
    cursor: "pointer",
    position: "absolute",
    top: 0,
    right: 25,
    fontSize: 50
}))

const MobileMenuItem = styled(Text)(({theme, active}) => ({
    color: theme.palette.common.white,
    fontSize: 25,
    cursor: "pointer",
    margin: 10,
    textAlign: "center",
    opacity: active === "true" ? 1 : 0.5,
    borderBottom: active === "true" ? `3px solid ${theme.palette.common.green}` : "none",
    ":focus": {
        opacity: 1,
    },
    ":hover": {
        opacity: 1,
    },
}))

export default function MobileMenu({open, handleClose, onMenuItemClick}) {
    const {t} = useTranslation();
    const location = useLocation();

    if (!open)
        return null;

    return (
        <Container open={open.toString()}>
            <CloseButton onClick={handleClose}>&times;</CloseButton>
            <ContentWrapper>
                <MobileMenuItem
                    active={(ROUTES.HOME_ROUTE === location.pathname).toString()}
                    onClick={() => onMenuItemClick(ROUTES.HOME_ROUTE)}>
                    {t('swapAppBar.swap')}
                </MobileMenuItem>
                <MobileMenuItem
                    active={(ROUTES.LIQUIDITY_ROUTE === location.pathname).toString()}
                    onClick={() => onMenuItemClick(ROUTES.LIQUIDITY_ROUTE)}>
                    {t('swapAppBar.liquidity')}
                </MobileMenuItem>
                <MobileMenuItem
                    active={(ROUTES.POOLS_ROUTE === location.pathname).toString()}
                    onClick={() => onMenuItemClick(ROUTES.POOLS_ROUTE)}>
                    {t('swapAppBar.pools')}
                </MobileMenuItem>
                <MobileMenuItem
                    active={(ROUTES.FARMS_ROUTE === location.pathname).toString()}
                    onClick={() => onMenuItemClick(ROUTES.FARMS_ROUTE)}>
                    {t('swapAppBar.farms')}
                </MobileMenuItem>
                <MobileMenuItem
                    active={(ROUTES.STAKING_ROUTE === location.pathname).toString()}
                    onClick={() => onMenuItemClick(ROUTES.STAKING_ROUTE)}>
                    {t('swapAppBar.staking')}
                </MobileMenuItem>
            </ContentWrapper>
        </Container>
    );
}