export const muiCustomTheme = (mode) => {
    return ({
        palette: {
            mode: mode,
            ...(mode === 'light' ? lightPalette : darkPalette)
        }
    })
};

const darkPalette = {
    primary: {
        main: "rgb(25, 35, 55)",
    },
    secondary: {
        main: "#FFF",
    },
    action: {
        disabled: "rgba(255, 255, 255, 0.3)"
    },
    common: {
        resourcesLink: "#fff",
        contactLink:"#fff",
        brown: "#744E77",
        pureWhite: "#FFF",
        white: "#F0EEF0",
        inputBg: "#F2F2F2",
        grey: "#5a5c5e",
        green: "#00b4b4",
        orange: "#f98787",
        purple: "#beaffa"
    },
}


const lightPalette = {
    primary: {
        main: "rgb(255, 255, 255)",
    },
    secondary: {
        main: "#FFF",
    },
    action: {
        disabled: "rgba(255, 255, 255, 0.3)"
    },
    common: {
        resourcesLink: "rgb(25, 35, 48)",
        contactLink:"rgb(25, 35, 48)",
        brown: "#744E77",
        pureWhite: "#FFF",
        white: "#F0EEF0",
        inputBg: "#F2F2F2",
        grey: "#5a5c5e",
        green: "#00b4b4",
        lightGreen: "#00D2C8",
        orange: "#f98787",
        purple: "#beaffa"
    },
}