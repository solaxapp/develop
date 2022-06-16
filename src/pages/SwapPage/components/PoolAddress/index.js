import {CenteredRow} from "../../../../components/Flex";
import {ExplorerLink} from "../../../../components/ExplorerLink";
import {IconButton, Popover, Typography} from "@mui/material";
import {getTokenName} from "../../../../helper/token";
import {useState} from "react";
import InfoIcon from '@mui/icons-material/Info';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {styled} from "@mui/material/styles";
import {useAllTokensContext} from "../../../../context/TokensProvider";

const Container = styled(CenteredRow)(() => ({
    padding: 10,
    background: "#36486b 0% 0% no-repeat padding-box",
}))

const Label = styled(Text)(() => ({
    fontWeight: "bold",
    paddingRight: 3
}))

const StyledIconButton = styled(IconButton)(({theme}) => ({
    width: "fit-content",
    alignSelf: "center"
}))

const Address = ({address, label}) => {
    return (
        <Container>
            {label && <Label>{label}:</Label>}
            <ExplorerLink address={address} code={true} type="address"/>
            <IconButton
                onClick={() => navigator.clipboard.writeText(address)}>
                <ContentCopyIcon/>
            </IconButton>
        </Container>
    );
};

export const PoolAddress = ({pool, style, label = "Address"}) => {
    if (!pool?.pubkeys.account) {
        return null;
    }

    return (
        <Address
            address={pool.pubkeys.account.toBase58()}
            style={style}
            label={label}
        />
    );
};

export const AccountsAddress = ({pool, style}) => {
    const {tokenMap} = useAllTokensContext();

    if (!pool) {
        return null;
    }

    const account1 = pool?.pubkeys.holdingAccounts[0];
    const account2 = pool?.pubkeys.holdingAccounts[1];
    const mint1 = pool?.pubkeys.holdingMints[0];
    const mint2 = pool?.pubkeys.holdingMints[1];
    let aName, bName;
    if (mint1) {
        aName = getTokenName(tokenMap, mint1.toBase58());
    }
    if (mint2) {
        bName = getTokenName(tokenMap, mint2.toBase58());
    }

    return (
        <>
            {account1 && (
                <Address
                    address={account1.toBase58()}
                    style={style}
                    label={aName}
                />
            )}
            {account2 && (
                <Address
                    address={account2.toBase58()}
                    style={style}
                    label={bName}
                />
            )}
        </>
    );
};

export const AddressesPopover = ({pool}) => {
    const [anchorEl, setAnchorEl] = useState(null);
    if (!pool) {
        return <>
            <StyledIconButton>
                <InfoIcon/>
            </StyledIconButton>
        </>;
    }

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);
    const id = open ? 'simple-popover' : undefined

    return (
        <>
            <StyledIconButton
                aria-describedby={id}
                onClick={handleClick}>
                <InfoIcon/>
            </StyledIconButton>
            <Popover
                id={id}
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}>
                <>
                    <PoolAddress
                        pool={pool}
                        showLabel={true}
                        label={"Pool"}/>
                    <AccountsAddress
                        pool={pool}/>
                </>
            </Popover>
        </>
    );
};
