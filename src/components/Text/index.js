import {styled, Typography} from "@mui/material";

export const Text = styled(Typography)(()=>({
    fontFamily: "Encode Sans, sans-serif"
}))

export const WhiteText = styled(Text)(({theme})=>({
    color: theme.palette.common.white,
    zIndex: 3
}))