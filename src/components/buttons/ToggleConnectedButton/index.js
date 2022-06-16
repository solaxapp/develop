import {Button, Tooltip} from "@mui/material";
import {LinkOff} from "@mui/icons-material";
import {styled} from "@mui/material/styles";

const StyledButton = styled(Button)(({theme}) => ({
    display: "flex",
    margin: `${theme.spacing(1)}px auto`,
    width: "100%",
    maxWidth: 400,
}))

const Icon = styled('img')(() => ({
    height: 24,
    width: 24,
}))

const ToggleConnectedButton = ({connect, disconnect, connected, pk, walletIcon,}) => {
    const is0x = pk.startsWith("0x");
    return connected ? (
        <Tooltip title={pk}>
            <StyledButton
                color="primary"
                variant="contained"
                size="small"
                onClick={disconnect}
                startIcon={
                    walletIcon ? (<Icon src={walletIcon} alt="Wallet"/>) : (<LinkOff/>)
                }>
                Disconnect {pk.substring(0, is0x ? 6 : 3)}...
                {pk.substr(pk.length - (is0x ? 4 : 3))}
            </StyledButton>
        </Tooltip>
    ) : (
        <StyledButton
            color="primary"
            variant="contained"
            size="small"
            onClick={connect}
            startIcon={
                walletIcon ? (<Icon src={walletIcon} alt="Wallet"/>) : (<LinkOff/>)
            }>
            Connect MetaMask
        </StyledButton>
    );
};

export default ToggleConnectedButton;
