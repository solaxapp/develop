import ToggleConnectedButton from "../../../../components/buttons/ToggleConnectedButton";
import {isEVMChain} from "@certusone/wormhole-sdk";
import {useEthereumProvider} from "../../../../context/EtherumProvider";
import MetaMaskIcon from "../../../../assets/icons/MetaMask.png"
import {Text} from "../../../../components/Text";

export default function KeyAndBalance({chainId}) {
    if (isEVMChain(chainId)) {
        return (
            <>
                <EthereumSignerKey/>
            </>
        );
    }
    return null;
}


const EthereumSignerKey = () => {
    const {connect, disconnect, signerAddress, providerError} = useEthereumProvider();
    return (
        <>
            <ToggleConnectedButton
                walletIcon={MetaMaskIcon}
                connect={connect}
                disconnect={disconnect}
                connected={!!signerAddress}
                pk={signerAddress || ""}
            />
            {providerError ? (
                <Text variant="body2" color="error">
                    {providerError}
                </Text>
            ) : null}
        </>
    );
};