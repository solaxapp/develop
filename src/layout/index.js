import {Outlet} from "react-router-dom";
import AppBar from "../components/AppBar";
import * as React from "react";
import Footer from "../components/Footer";
import PopUp from "../components/PopUp";
import {useState} from "react";
import {useTranslation} from "react-i18next";

require('@solana/wallet-adapter-react-ui/styles.css');

export default function Layout() {
    const {t} = useTranslation();
    const [showPopUp, setShowPopUp] = useState(true);
    return (
        <>
            <AppBar/>
            {showPopUp && <PopUp text={t('messages.popUpMessage')} onClose={() => setShowPopUp(false)}/>}
            <Outlet/>
            <Footer/>
        </>
    );
}