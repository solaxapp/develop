import {DEFAULT_SLIPPAGE} from "../constants/app";

const SLIPPAGE_NAME = "solax_slippage"
const NETWORK_NAME = "solax_network"

export function setSessionLanguage(language) {
    localStorage.setItem("language", language)
}

export function getSavedLanguage() {
    return localStorage.getItem("language")
        ? localStorage.getItem("language")
        : "lat";
}

export function getSavedNetwork() {
    return localStorage.getItem(NETWORK_NAME) || "testnet"
}

export function setSavedNetwork(network) {
    localStorage.setItem(NETWORK_NAME, network)
}

export function getSavedTheme() {
    return localStorage.getItem("theme") || "dark"
}

export function setSavedTheme(theme) {
    localStorage.setItem("theme", theme)
}

export function getSavedSlippage() {
    return localStorage.getItem(SLIPPAGE_NAME) || DEFAULT_SLIPPAGE
}

export function setSavedSlippage(slippage) {
    localStorage.setItem(SLIPPAGE_NAME, slippage);
}