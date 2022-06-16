import * as React from 'react';
import {useState} from 'react';
import {default as MuiAppBar} from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import CssBaseline from '@mui/material/CssBaseline';
import useScrollTrigger from '@mui/material/useScrollTrigger';
import {styled} from "@mui/material/styles";
import {FlexRow} from "../Flex";
import {Avatar, Box, IconButton, ListItemIcon, Menu, MenuItem} from "@mui/material";
import {useTranslation} from "react-i18next";
import SolaxImg from "../../assets/images/mini-solax-w.svg"
import SolaxImgDark from "../../assets/images/mini-solax-d.svg"
import {useLocation, useNavigate} from "react-router-dom";
import {ROUTES, SOLAX_HOME_PAGE} from "../../constants/routes";
import {useWallet} from "@solana/wallet-adapter-react";
import {LAMPORTS_PER_SOL} from "@solana/web3.js";
import {Text} from "../Text";
import {WalletMultiButton} from "@solana/wallet-adapter-react-ui";
import {useSnackbar} from "notistack";
import PermIdentityIcon from '@mui/icons-material/PermIdentity';
import BlockIcon from '@mui/icons-material/Block';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import MobileMenu from "./MobileMenu";
import MenuIcon from '@mui/icons-material/Menu';
import {useThemeConfig} from "../../context/GlobalProvider";
import {useNativeAccount} from "../../context/AccountsProvider";
import {Settings} from "../Slippage";

function ElevationScroll(props) {
    const {children, window} = props;
    const trigger = useScrollTrigger({
        disableHysteresis: true,
        threshold: 0,
        target: window ? window() : undefined,
    });
    return React.cloneElement(children, {
        elevation: trigger ? 4 : 0,
    });
}

const StyledToolbar = styled(Toolbar)(({theme}) => ({
    justifyContent: "space-between",
    padding: `${theme.spacing(0)} ${theme.spacing(2)}`
}))

const LogoWrapper = styled(FlexRow)(() => ({
    cursor: "pointer"
}))
const MenuItemsWrapper = styled(FlexRow)(() => ({}))
const RightWrapper = styled(FlexRow)(() => ({
    alignItems: "center"
}))

const StyledMuiAppBar = styled(MuiAppBar)(({theme}) => ({
    backgroundColor: theme.palette.primary.main,
    boxShadow: "rgba(0, 0, 0, 0.45) 0px 25px 20px -20px",
    backgroundImage: "none"
}))

const Logo = styled('img')(() => ({
    height: 30,
    width: "auto"
}))

const StyledMenuItem = styled(Text)(({theme, active}) => ({
    position: "relative",
    cursor: "pointer",
    opacity: active === "true" ? 1 : 0.5,
    margin: "0px 10px",
    fontWeight: "bold",
    justifyContent: "center",
    "&:hover": {
        opacity: 1,
    },
    "&::before": active === "true" ? {
        position: "absolute",
        content: '""',
        top: "auto",
        bottom: "calc(-1.2rem - 1px)",
        right: 0,
        left: 0,
        borderLeft: 0,
        borderBottom: `3px solid ${theme.palette.common.green}`,
    } : {},
    [theme.breakpoints.down('sm')]: {
        display: "none"
    }
}))

const StyledMenu = styled(Menu)(({theme}) => ({
    "& .MuiList-root": {
        paddingTop: 0
    }
}))

const StyledText = styled(Text)(({theme}) => ({
    [theme.breakpoints.down('sm')]: {
        display: "none"
    }
}))

export default function AppBar() {
    const {theme, changeTheme} = useThemeConfig();
    const {t} = useTranslation();
    const {enqueueSnackbar} = useSnackbar();
    const location = useLocation();
    const navigate = useNavigate();
    const {publicKey, connected, disconnect} = useWallet();
    const {account} = useNativeAccount();
    const [anchorEl, setAnchorEl] = useState(null);
    const [openMobileMenu, setOpenMobileMenu] = useState(false);
    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const onMenuItemClick = (page) => {
        navigate(page);
        handleMobileMenuClose()
    }

    const goToProfile = () => {
        navigate(ROUTES.USER_PROFILE);
    }

    const onHomeClicked = () => {
        const newWindow = window.open(SOLAX_HOME_PAGE, '_blank', 'noopener,noreferrer')
        if (newWindow) newWindow.opener = null
    }

    const disconnectWallet = () => {
        disconnect().then(_ => {

        })
    }

    const copyWalletAddress = () => {
        navigator.clipboard.writeText(publicKey.toBase58())
        enqueueSnackbar(t('messages.successCopyWalletAddress'), {variant: "success"})
    }

    const handleMobileMenuOpen = () => {
        setOpenMobileMenu(true);
    };

    const handleMobileMenuClose = () => {
        setOpenMobileMenu(false);
    };

    return (
        <React.Fragment>
            <CssBaseline/>
            <ElevationScroll>
                <StyledMuiAppBar>
                    <StyledToolbar>
                        <LogoWrapper onClick={onHomeClicked}>
                            <Logo src={theme === "light" ? SolaxImgDark : SolaxImg} alt="logo"/>
                        </LogoWrapper>
                        <MenuItemsWrapper>
                            <StyledMenuItem
                                active={(ROUTES.HOME_ROUTE === location.pathname).toString()}
                                onClick={() => onMenuItemClick(ROUTES.HOME_ROUTE)}>
                                {t('swapAppBar.swap')}
                            </StyledMenuItem>
                            <StyledMenuItem
                                active={(ROUTES.LIQUIDITY_ROUTE === location.pathname).toString()}
                                onClick={() => onMenuItemClick(ROUTES.LIQUIDITY_ROUTE)}>
                                {t('swapAppBar.liquidity')}
                            </StyledMenuItem>
                            <StyledMenuItem
                                active={(ROUTES.POOLS_ROUTE === location.pathname).toString()}
                                onClick={() => onMenuItemClick(ROUTES.POOLS_ROUTE)}>
                                {t('swapAppBar.pools')}
                            </StyledMenuItem>
                            <StyledMenuItem
                                active={(ROUTES.FARMS_ROUTE === location.pathname).toString()}
                                onClick={() => onMenuItemClick(ROUTES.FARMS_ROUTE)}>
                                {t('swapAppBar.farms')}
                            </StyledMenuItem>
                            <StyledMenuItem
                                active={(ROUTES.STAKING_ROUTE === location.pathname).toString()}
                                onClick={() => onMenuItemClick(ROUTES.STAKING_ROUTE)}>
                                {t('swapAppBar.staking')}
                            </StyledMenuItem>
                        </MenuItemsWrapper>
                        <RightWrapper>
                            {connected && (
                                <>
                                    <StyledText>{((account.lamports || 0) / LAMPORTS_PER_SOL).toFixed(6)} SOL</StyledText>
                                    <IconButton
                                        onClick={handleClick}
                                        size="small"
                                        sx={{ml: 2}}
                                        aria-controls={open ? 'account-menu' : undefined}
                                        aria-haspopup="true"
                                        aria-expanded={open ? 'true' : undefined}>
                                        <Avatar sx={{width: 32, height: 32}}>
                                            <PermIdentityIcon/>
                                        </Avatar>
                                    </IconButton>
                                    <StyledMenu
                                        anchorEl={anchorEl}
                                        id="account-menu"
                                        open={open}
                                        onClose={handleClose}
                                        onClick={handleClose}
                                        transformOrigin={{horizontal: 'right', vertical: 'top'}}
                                        anchorOrigin={{horizontal: 'right', vertical: 'bottom'}}>
                                        <Settings/>
                                        <MenuItem
                                            onClick={goToProfile}>
                                            <ListItemIcon>
                                                <PermIdentityIcon/>
                                            </ListItemIcon>
                                            {t('swapAppBar.profile')}
                                        </MenuItem>
                                        <MenuItem onClick={copyWalletAddress}>
                                            <ListItemIcon>
                                                <AccountBalanceWalletIcon/>
                                            </ListItemIcon>
                                            {publicKey.toBase58().substring(0, 15)}...
                                        </MenuItem>
                                        {/*<MenuItem onClick={changeTheme}>*/}
                                        {/*    <ListItemIcon>*/}
                                        {/*        {theme === 'dark' ? <Brightness7Icon/> : <Brightness4Icon/>}*/}
                                        {/*    </ListItemIcon>*/}
                                        {/*    {t('swapAppBar.theme')}*/}
                                        {/*</MenuItem>*/}
                                        <MenuItem onClick={disconnectWallet}>
                                            <ListItemIcon>
                                                <BlockIcon/>
                                            </ListItemIcon>
                                            {t('common.disconnectWallet')}
                                        </MenuItem>
                                    </StyledMenu>
                                </>)}
                            {!connected && (
                                <WalletMultiButton/>
                            )}
                            <Box sx={{display: {xs: 'flex', sm: 'none'}}}>
                                <IconButton
                                    size="large"
                                    onClick={handleMobileMenuOpen}
                                    color="inherit">
                                    <MenuIcon/>
                                </IconButton>
                            </Box>
                        </RightWrapper>
                    </StyledToolbar>
                </StyledMuiAppBar>
            </ElevationScroll>
            <MobileMenu
                open={openMobileMenu}
                handleClose={handleMobileMenuClose}
                onMenuItemClick={onMenuItemClick}/>
        </React.Fragment>
    );
}