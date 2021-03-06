import LaunchIcon from '@mui/icons-material/Launch';
import {Link} from '@mui/material';
import {styled} from '@mui/material/styles';
import {useSnackbar} from 'notistack';
import {useCallback} from 'react';
import {useNetworkConfig} from "../GlobalProvider";

const Notification = styled('span')(() => ({
    display: 'flex',
    alignItems: 'center',
}));

const StyledLink = styled(Link)(() => ({
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    marginLeft: 16,
    textDecoration: 'underline',
    '&:hover': {
        color: '#000000',
    },
}));

const StyledLaunchIcon = styled(LaunchIcon)(() => ({
    fontSize: 20,
    marginLeft: 8,
}));

export function useNotify() {
    const {network} = useNetworkConfig()
    const {enqueueSnackbar} = useSnackbar();

    return useCallback((variant, message, signature) => {
            enqueueSnackbar(
                <Notification>
                    {message}
                    {signature && (
                        <StyledLink href={`https://explorer.solana.com/tx/${signature}?cluster=${network}`} target="_blank">
                            Transaction
                            <StyledLaunchIcon/>
                        </StyledLink>
                    )}
                </Notification>,
                {variant}
            );
        },
        [enqueueSnackbar, network]
    );
}