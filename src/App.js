import React from "react";
import {createTheme} from "@mui/material";
import {muiCustomTheme} from "./assets/theme";
import {ThemeProvider} from '@mui/material/styles';
import {Route, Routes} from "react-router-dom";
import {ROUTES} from "./constants/routes";
import SwapPage from "./pages/SwapPage";
import Layout from "./layout";
import WorkInProgress from "./pages/WorkInProgress";
import UserProfilePage from "./pages/UserProfilePage";
import LiquidityPage from "./pages/LiquidityPage";
import ReactGA from "react-ga";
import PoolsPage from "./pages/PoolsPage";
import {useThemeConfig} from "./context/GlobalProvider";

const TRACKING_ID = "G-5Y289MQWHR"; // OUR_TRACKING_ID

function App() {
    const {theme} = useThemeConfig();
    const createdTheme = createTheme(muiCustomTheme(theme));

    ReactGA.initialize(TRACKING_ID);
    ReactGA.pageview(window.location.pathname + window.location.search);

    // return (<>RADI</>)

    return (
        <ThemeProvider theme={createdTheme}>
            <Routes>
                <Route
                    path={ROUTES.HOME_ROUTE}
                    element={
                        <Layout/>
                    }>
                    <Route
                        index
                        element={
                            <SwapPage/>
                        }/>
                    <Route
                        path={ROUTES.LIQUIDITY_ROUTE}
                        element={
                            <LiquidityPage/>
                        }/>
                    <Route
                        path={ROUTES.USER_PROFILE}
                        element={
                            <UserProfilePage/>
                        }/>
                    <Route
                        path={ROUTES.FARMS_ROUTE}
                        element={
                            <WorkInProgress/>
                        }/>
                    <Route
                        path={ROUTES.STAKING_ROUTE}
                        element={
                            <WorkInProgress/>
                        }/>
                    <Route
                        path={ROUTES.POOLS_ROUTE}
                        element={
                            <PoolsPage/>
                        }/>
                </Route>
            </Routes>
        </ThemeProvider>
    );
}

export default App;
