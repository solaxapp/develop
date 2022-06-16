import {styled} from '@mui/material/styles';
import {Button, Typography} from "@mui/material";
import {Text} from "../Text"
export const Flex = styled('div')(() => ({
    display: 'flex'
}));

export const FlexRow = styled(Flex)(() => ({
    display: 'flex',
    flexDirection: "row"
}));

export const SpaceBFlexRow = styled(FlexRow)(() => ({
    justifyContent: "space-between"
}));


export const FlexCol = styled(Flex)(() => ({
    display: 'flex',
    flexDirection: "column"
}));

export const CenteredRow = styled(FlexRow)(() => ({
    justifyContent: "center",
    alignItems: "center"
}));

export const CenteredCol = styled(FlexCol)(() => ({
    justifyContent: "center",
    alignItems: "center"
}));

export const Grow1 = styled(FlexRow)(() => ({
    flexGrow: 1
}))

export const SpaceBFlexCol = styled(FlexCol)(() => ({
    alignItems: "space-between"
}));

export const PageContainer = styled(FlexCol)(()=>({
    width: "100%",
    minHeight: "50rem",
    background: "radial-gradient(circle, rgba(21,35,52,0.908000700280112) 0%, rgba(36,45,64,1) 53%, rgba(21,35,52,1) 100%)",
}))

export const SwapWrapper = styled(CenteredCol)(({theme}) => ({
    marginTop: 100,
    marginBottom: 300,
    zIndex: 1,
    [theme.breakpoints.down('md')]: {
        marginBottom: 200,
    },
    [theme.breakpoints.down('sm')]: {
        marginBottom: 100,
    },
}))

export const Card = styled(FlexCol)(({theme}) => ({
    backgroundColor: theme.palette.primary.main,
    padding: 50,
    background: "#131E34 0% 0% no-repeat padding-box",
    boxShadow: "inset 0px 0px 40px #00000029, 0px 0px 20px #00000029",
    mixBlendMode: "darken",
    borderRadius: 6,
    [theme.breakpoints.down('md')]: {
        padding: "30px 30px",
    },
    [theme.breakpoints.down('sm')]: {
        padding: "20px 10px",
    },
}))

export const WalletButton = styled(Button)(() => ({
    marginTop: 10,
    minWidth: 200,
    background: "#111a2f",
    boxShadow: "inset 0px 0px 40px #00000029, 0px 0px 20px #00000029",
    borderStyle: "inset",
    cursor: "pointer",
    color: "white",
}))

export const PageTitle = styled(Text)(({theme}) => ({
    fontSize: 100,
    padding: 10,
    color: theme.palette.common.white,
    fontWeight: "bold",
    textAlign: "center",
    [theme.breakpoints.down('md')]: {
        fontSize: 80,
    },
}))
