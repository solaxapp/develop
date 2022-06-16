import React, {Suspense} from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import {styled} from '@mui/material/styles';
import {CenteredRow} from "./components/Flex";
import {BrowserRouter} from "react-router-dom";
import {SnackbarProvider} from "notistack";
import "./store/i18n"
import {Provider as ReduxProvider} from 'react-redux';
import {store} from "./store/redux";
import {GlobalProvider} from "./context/GlobalProvider";
import {CircularProgress} from "@mui/material";
import {ContextProvider} from "./context";

const Wrapper = styled(CenteredRow)(() => ({
        position: "absolute",
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
    }
))

ReactDOM.render(
    <React.StrictMode>
        <Suspense fallback={
            <Wrapper>
                <CircularProgress/>
            </Wrapper>}>
            <ReduxProvider store={store}>
                <SnackbarProvider maxSnack={3}>
                    <BrowserRouter>
                        <GlobalProvider>
                            <ContextProvider>
                                <App/>
                            </ContextProvider>
                        </GlobalProvider>
                    </BrowserRouter>
                </SnackbarProvider>
            </ReduxProvider>
        </Suspense>
    </React.StrictMode>,
    document.getElementById("root")
);
