import React from "react";
import {IconButton, Popover} from "@mui/material";
import {Text} from "../../../../components/Text";
import {styled} from "@mui/material/styles";
import InfoIcon from "@mui/icons-material/Info";
import {useTranslation} from "react-i18next";

const StyledText = styled(Text)(() => ({
    padding: 10,
    background: "#36486b 0% 0% no-repeat padding-box",
}))

const StyledPopover = styled(Popover)(() => ({
    width: "80%",
}))

const StyledIconButton = styled(IconButton)(({theme}) => ({}))

export default function LiquidityDescription() {
    const {t} = useTranslation();
    const [liquidityDescAnchor, setLiquidityDescAnchor] = React.useState(null);

    const handleDescOpen = (event) => {
        setLiquidityDescAnchor(event.currentTarget)
    }

    const handleCloseAnchors = () => {
        setLiquidityDescAnchor(null)
    }
    const open = Boolean(liquidityDescAnchor);
    const id = open ? 'simple-popover' : undefined

    return (
        <>
            <StyledIconButton
                aria-describedby={id}
                onClick={handleDescOpen}>
                <InfoIcon/>
            </StyledIconButton>
            <StyledPopover
                open={open}
                anchorEl={liquidityDescAnchor}
                onClose={handleCloseAnchors}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}>
                <StyledText>
                    {t('liquidityPage.liquidityDescription')}
                </StyledText>
            </StyledPopover>
        </>
    );
}