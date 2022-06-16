import {
    approveEth,
    attestFromEth,
    attestFromSolana,
    CHAIN_ID_BSC,
    CHAIN_ID_ETH,
    CHAIN_ID_SOLANA,
    CHAIN_ID_TERRA,
    createWrappedOnSolana,
    getEmitterAddressEth,
    getEmitterAddressSolana,
    getForeignAssetSolana,
    getSignedVAA,
    hexToUint8Array,
    isEVMChain,
    nativeToHexString,
    parseSequenceFromLogEth,
    parseSequenceFromLogSolana,
    postVaaSolana,
    redeemOnEth,
    redeemOnEthNative,
    redeemOnSolana,
    transferFromEth,
    transferFromEthNative,
    uint8ArrayToHex
} from "@certusone/wormhole-sdk";
import {ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID} from '@solana/spl-token';
import {
    ETH_BRIDGE_ADDRESS,
    ETH_TOKEN_BRIDGE_ADDRESS,
    getBridgeAddressForChain,
    getTokenBridgeAddressForChain,
    SOL_BRIDGE_ADDRESS,
    SOL_TOKEN_BRIDGE_ADDRESS,
    WORMHOLE_RPC_HOSTS
} from "../../constants/wormhole";
import {Alert} from "@mui/lab";
import React from "react";
import {PublicKey, Transaction} from "@solana/web3.js";
import parseError from "../error";
import {parseUnits} from "ethers/lib.esm/utils";

export const attestEthToSolana = async (network, ethTokenAddress, signer, connection, payerAddress, keypair) => {
    console.log({network})
    console.log({ethTokenAddress})
    console.log({signer})
    console.log({connection})
    console.log({payerAddress})
    console.log({keypair})
    try {
        const receipt = await attestFromEth(
            ETH_TOKEN_BRIDGE_ADDRESS(network),
            signer,
            ethTokenAddress
        );
        // get the sequence from the logs (needed to fetch the vaa)
        const sequence = parseSequenceFromLogEth(
            receipt,
            ETH_BRIDGE_ADDRESS(network)
        );
        const emitterAddress = getEmitterAddressEth(ETH_TOKEN_BRIDGE_ADDRESS(network));
        // poll until the guardian(s) witness and sign the vaa
        const {vaaBytes: signedVAA} = await getSignedVAAWithRetry(
            WORMHOLE_RPC_HOSTS,
            CHAIN_ID_ETH,
            emitterAddress,
            sequence
        );
        // create a keypair for Solana
        await postVaaSolana(
            connection,
            async (transaction) => {
                transaction.partialSign(keypair);
                return transaction;
            },
            SOL_BRIDGE_ADDRESS(network),
            payerAddress,
            Buffer.from(signedVAA)
        );
        // create wormhole wrapped token (mint and metadata) on solana
        const transaction = await createWrappedOnSolana(
            connection,
            SOL_BRIDGE_ADDRESS(network),
            SOL_TOKEN_BRIDGE_ADDRESS(network),
            payerAddress,
            signedVAA
        );
        // sign, send, and confirm transaction
        try {
            transaction.partialSign(keypair);
            const txid = await connection.sendRawTransaction(
                transaction.serialize()
            );
            await connection.confirmTransaction(txid);
        } catch (e) {
            // this could fail because the token is already attested (in an unclean env)
        }
    } catch (e) {
        console.error(e);
    }
}

export const transferEthToSolana = async (network, ethTokenAddress, signer, connection, payerAddress, solanaPublicKey, keypair) => {
    try {
        // determine destination address - an associated token account
        let asset = await getForeignAssetSolana(
            connection,
            SOL_TOKEN_BRIDGE_ADDRESS(network),
            CHAIN_ID_ETH,
            hexToUint8Array(nativeToHexString(ethTokenAddress, CHAIN_ID_ETH) || "")
        ) || ""
        console.log("ASSET", asset)
        const solanaMintKey = new PublicKey(asset);
        const recipient = await Token.getAssociatedTokenAddress(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            solanaMintKey,
            solanaPublicKey
        );
        // create the associated token account if it doesn't exist
        const associatedAddressInfo = await connection.getAccountInfo(
            recipient
        );
        if (!associatedAddressInfo) {
            const transaction = new Transaction().add(
                await Token.createAssociatedTokenAccountInstruction(
                    ASSOCIATED_TOKEN_PROGRAM_ID,
                    TOKEN_PROGRAM_ID,
                    solanaMintKey,
                    recipient,
                    solanaPublicKey, // owner
                    solanaPublicKey // payer
                )
            );
            const {blockhash} = await connection.getRecentBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = solanaPublicKey;
            // sign, send, and confirm transaction
            transaction.partialSign(keypair);
            const txid = await connection.sendRawTransaction(
                transaction.serialize()
            );
            await connection.confirmTransaction(txid);
        }
        // create a signer for Eth
        const amount = parseUnits("1", 18);
        // approve the bridge to spend tokens
        await approveEth(
            ETH_TOKEN_BRIDGE_ADDRESS(network),
            ethTokenAddress,
            signer,
            amount
        );
        // transfer tokens
        const receipt = await transferFromEth(
            ETH_TOKEN_BRIDGE_ADDRESS(network),
            signer,
            ethTokenAddress,
            amount,
            CHAIN_ID_SOLANA,
            hexToUint8Array(
                nativeToHexString(recipient.toString(), CHAIN_ID_SOLANA) || ""
            )
        );
        // get the sequence from the logs (needed to fetch the vaa)
        const sequence = parseSequenceFromLogEth(
            receipt,
            ETH_BRIDGE_ADDRESS(network)
        );
        const emitterAddress = getEmitterAddressEth(ETH_TOKEN_BRIDGE_ADDRESS(network));
        // poll until the guardian(s) witness and sign the vaa
        const {vaaBytes: signedVAA} = await getSignedVAAWithRetry(
            WORMHOLE_RPC_HOSTS,
            CHAIN_ID_ETH,
            emitterAddress,
            sequence
        );
        // post vaa to Solana
        await postVaaSolana(
            connection,
            async (transaction) => {
                transaction.partialSign(keypair);
                return transaction;
            },
            SOL_BRIDGE_ADDRESS(network),
            payerAddress,
            Buffer.from(signedVAA)
        );
        // redeem tokens on solana
        const transaction = await redeemOnSolana(
            connection,
            SOL_BRIDGE_ADDRESS(network),
            SOL_TOKEN_BRIDGE_ADDRESS(network),
            payerAddress,
            signedVAA
        );
        // sign, send, and confirm transaction
        transaction.partialSign(keypair);
        const txid = await connection.sendRawTransaction(
            transaction.serialize()
        );
        await connection.confirmTransaction(txid);
    } catch (e) {
        console.error(e);
    }
}

export const EthToSolana = async (connection, tokenAddress, recipientWalletAddress, signer, amount, wallet,
                                  payerAddress) => {
    const SOLANA_TOKEN_BRIDGE_ADDRESS = "wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb";
    const ETH_TOKEN_BRIDGE_ADDRESS = "0x3ee18B2214AFF97000D974cf647E7C347E8fa585";
// determine destination address - an associated token account
    const solanaMintKey = new PublicKey(
        (await getForeignAssetSolana(
            connection,
            SOLANA_TOKEN_BRIDGE_ADDRESS,
            CHAIN_ID_ETH,
            hexToUint8Array(nativeToHexString("0x2D8BE6BF0baA74e0A907016679CaE9190e80dD0A", CHAIN_ID_ETH) || "")
        )) || ""
    );
    const recipientAddress = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        solanaMintKey,
        recipientWalletAddress
    );

    // Submit transaction - results in a Wormhole message being published
    const receipt = await transferFromEth(
        ETH_TOKEN_BRIDGE_ADDRESS,
        signer,
        tokenAddress,
        amount,
        CHAIN_ID_SOLANA,
        recipientAddress
    );
// Get the sequence number and emitter address required to fetch the signedVAA of our message
    const sequence = parseSequenceFromLogEth(receipt, ETH_BRIDGE_ADDRESS);
    const emitterAddress = getEmitterAddressEth(ETH_TOKEN_BRIDGE_ADDRESS);

    // Fetch the signedVAA from the Wormhole Network (this may require retries while you wait for confirmation)
    const {signedVAA} = await getSignedVAA(
        WORMHOLE_RPC_HOSTS[getNextRpcHost()],
        CHAIN_ID_ETH,
        emitterAddress,
        sequence
    );

    const SOL_BRIDGE_ADDRESS = "worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth";
// On Solana, we have to post the signedVAA ourselves
    await postVaaSolana(
        connection, // Solana Mainnet Connection
        wallet,      //Solana Wallet Signer
        SOL_BRIDGE_ADDRESS,
        payerAddress,
        signedVAA
    );

    // Finally, redeem on Solana
    const transaction = await redeemOnSolana(
        connection,
        SOL_BRIDGE_ADDRESS,
        SOL_TOKEN_BRIDGE_ADDRESS,
        payerAddress,
        signedVAA
    );
    const signed = await wallet.signTransaction(transaction);
    const txid = await connection.sendRawTransaction(signed.serialize());
    await connection.confirmTransaction(txid);
}

export const transferTokenFromEth = async (enqueueSnackbar, signer, tokenAddress, decimals, amount, recipientChain,
                                           recipientAddress, isNative, chainId, relayerFee) => {
    console.log("signer", signer)
    console.log("tokenAddress", tokenAddress)
    console.log("decimals", decimals)
    console.log("amount", amount)
    console.log("recipientChain", recipientChain)
    console.log("recipientAddress", recipientAddress)
    console.log("isNative", isNative)
    console.log("chainId", chainId)
    console.log("relayerFee", relayerFee)
    try {
        const baseAmountParsed = parseUnits(amount, decimals);
        const feeParsed = parseUnits(relayerFee || "0", decimals);
        const transferAmountParsed = baseAmountParsed.add(feeParsed);
        console.log(
            "base",
            baseAmountParsed,
            "fee",
            feeParsed,
            "total",
            transferAmountParsed
        );
        const receipt = isNative
            ? await transferFromEthNative(
                getTokenBridgeAddressForChain(chainId),
                signer,
                transferAmountParsed,
                recipientChain,
                recipientAddress,
                feeParsed
            )
            : await transferFromEth(
                getTokenBridgeAddressForChain(chainId),
                signer,
                tokenAddress,
                transferAmountParsed,
                recipientChain,
                recipientAddress,
                feeParsed
            );
        enqueueSnackbar(null, {
            content: <Alert severity="success">Transaction confirmed</Alert>,
        });
        const sequence = parseSequenceFromLogEth(
            receipt,
            getBridgeAddressForChain(chainId)
        );
        const emitterAddress = getEmitterAddressEth(
            getTokenBridgeAddressForChain(chainId)
        );
        enqueueSnackbar(null, {
            content: <Alert severity="info">Fetching VAA</Alert>,
        });
        const {vaaBytes} = await getSignedVAAWithRetry(
            chainId,
            emitterAddress,
            sequence.toString()
        );
        enqueueSnackbar(null, {
            content: <Alert severity="success">Fetched Signed VAA</Alert>,
        });

        let signedVAA = hexToUint8Array(uint8ArrayToHex(vaaBytes))
        const receiptRedeem = isNative
            ? await redeemOnEthNative(
                getTokenBridgeAddressForChain(chainId),
                signer,
                signedVAA
            )
            : await redeemOnEth(
                getTokenBridgeAddressForChain(chainId),
                signer,
                signedVAA
            );
        enqueueSnackbar(null, {
            content: <Alert severity="success">Transaction confirmed</Alert>,
        });
        return ({
            transferTx: {id: receipt.transactionHash, block: receipt.blockNumber},
            signedVAAHex: uint8ArrayToHex(vaaBytes),
            redeemTx: {id: receiptRedeem.transactionHash, block: receiptRedeem.blockNumber}
        })
    } catch (e) {
        console.error(e);
        enqueueSnackbar(null, {
            content: <Alert severity="error">{parseError(e)}</Alert>,
        });
    }
}


export const redeemToken = async (enqueueSnackbar, solConnection, token, terraWallet, targetChainId, signer, network, wallet,
                                  payerAddress, sourceChainId, solPk) => {
    let attest = await attestToken(enqueueSnackbar, solConnection, token.address, terraWallet, signer, network,
        wallet, payerAddress, sourceChainId, solPk);
    console.log("attest", attest);
    if (!attest) {
        return;
    }
    let signedVAA = hexToUint8Array(attest.signedVAAHex);
    let receipt;
    if (isEVMChain(targetChainId) && !!signer && signedVAA) {
        receipt = evmRedeem(enqueueSnackbar, false, targetChainId, signer, signedVAA);
    } else if (targetChainId === CHAIN_ID_SOLANA && !!wallet && !!solPk && signedVAA) {
        receipt = solanaRedeem(enqueueSnackbar, false, signedVAA, solConnection, wallet, payerAddress, network)
    }
    console.log("receipt", receipt)
}

const evmRedeem = async (enqueueSnackbar, isNative = false, chainId, signer, signedVAA) => {
    try {
        const receipt = isNative
            ? await redeemOnEthNative(
                getTokenBridgeAddressForChain(chainId),
                signer,
                signedVAA
            )
            : await redeemOnEth(
                getTokenBridgeAddressForChain(chainId),
                signer,
                signedVAA
            );
        enqueueSnackbar(null, {
            content: <Alert severity="success">Transaction confirmed</Alert>,
        });
        return {
            redeemTx: {id: receipt.transactionHash, block: receipt.blockNumber}
        }
    } catch (e) {
        enqueueSnackbar(null, {
            content: <Alert severity="error">{parseError(e)}</Alert>,
        });
    }
}

const solanaRedeem = async (enqueueSnackbar, isNative = false, signedVAA, connection, wallet, payerAddress, network) => {
    // try {
    //     if (!wallet.signTransaction) {
    //         throw new Error("wallet.signTransaction is undefined");
    //     }
    //     await postVaaWithRetry(
    //         connection,
    //         wallet.signTransaction,
    //         SOL_BRIDGE_ADDRESS(network),
    //         payerAddress,
    //         Buffer.from(signedVAA),
    //         MAX_VAA_UPLOAD_RETRIES_SOLANA
    //     );
    //     // TODO: how do we retry in between these steps
    //     const transaction = isNative
    //         ? await redeemAndUnwrapOnSolana(
    //             connection,
    //             SOL_BRIDGE_ADDRESS(network),
    //             SOL_TOKEN_BRIDGE_ADDRESS(network),
    //             payerAddress,
    //             signedVAA
    //         )
    //         : await redeemOnSolana(
    //             connection,
    //             SOL_BRIDGE_ADDRESS(network),
    //             SOL_TOKEN_BRIDGE_ADDRESS,
    //             payerAddress,
    //             signedVAA
    //         );
    //     if (!wallet.signTransaction) {
    //         throw new Error("wallet.signTransaction is undefined");
    //     }
    //     const signed = await wallet.signTransaction(transaction);
    //     const txid = await connection.sendRawTransaction(signed.serialize());
    //     await connection.confirmTransaction(txid);
    //     // TODO: didn't want to make an info call we didn't need, can we get the block without it by modifying the above call?
    //     enqueueSnackbar(null, {
    //         content: <Alert severity="success">Transaction confirmed</Alert>,
    //     });
    //     return({
    //         redeemTx: { id: txid, block: 1 }
    //     })
    // } catch (e) {
    //     enqueueSnackbar(null, {
    //         content: <Alert severity="error">{parseError(e)}</Alert>,
    //     });
    // }
}

export const transferBscToSol = async (enqueueSnackbar, connection, signer, wallet, network, tokenAddress, amount,
                                       solWalletAddress, payerAddress) => {
    try {
        console.log("tokenAddress before", tokenAddress)
        tokenAddress = "0x6d20E3CE6650f7Dc474A64301A8793070828929c";
        console.log("tokenAddress after", tokenAddress)
        let assetSolana = (await getForeignAssetSolana(
            connection,
            SOL_TOKEN_BRIDGE_ADDRESS(network),
            CHAIN_ID_BSC,
            hexToUint8Array(nativeToHexString(tokenAddress, CHAIN_ID_BSC) || "")
        )) || ""
        console.log("ASSET SOLANA", assetSolana)


        // determine destination address - an associated token account
        const solanaMintKey = new PublicKey(assetSolana);
        const recipientAddress = await Token.getAssociatedTokenAddress(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            solanaMintKey,
            solWalletAddress
        );

// Submit transaction - results in a Wormhole message being published
        const receipt = await transferFromEth(
            ETH_TOKEN_BRIDGE_ADDRESS(network),
            signer,
            tokenAddress,
            amount,
            CHAIN_ID_SOLANA,
            recipientAddress
        );
        enqueueSnackbar(null, {
            content: <Alert severity="success">Transaction confirmed</Alert>,
        });
// Get the sequence number and emitter address required to fetch the signedVAA of our message
        const sequence = parseSequenceFromLogEth(receipt, ETH_BRIDGE_ADDRESS);
        const emitterAddress = getEmitterAddressEth(ETH_TOKEN_BRIDGE_ADDRESS);
// Fetch the signedVAA from the Wormhole Network (this may require retries while you wait for confirmation)
        enqueueSnackbar(null, {
            content: <Alert severity="info">Fetching VAA</Alert>,
        });
        const {signedVAA} = await getSignedVAA(
            WORMHOLE_RPC_HOSTS[getNextRpcHost()],
            CHAIN_ID_BSC,
            emitterAddress,
            sequence
        );

// On Solana, we have to post the signedVAA ourselves
        await postVaaSolana(
            connection,
            wallet,
            SOL_BRIDGE_ADDRESS(network),
            payerAddress,
            signedVAA
        );
// Finally, redeem on Solana
        const transaction = await redeemOnSolana(
            connection,
            SOL_BRIDGE_ADDRESS(network),
            SOL_TOKEN_BRIDGE_ADDRESS(network),
            payerAddress,
            signedVAA
        );
        const signed = await wallet.signTransaction(transaction);
        const txid = await connection.sendRawTransaction(signed.serialize());
        await connection.confirmTransaction(txid);
        enqueueSnackbar(null, {
            content: <Alert severity="success">Transaction confirmed</Alert>,
        });
    } catch (e) {
        console.error("transferEthToSol", e)
        enqueueSnackbar(null, {
            content: <Alert severity="error">{parseError(e)}</Alert>,
        });
    }
}

//sourceAsset - source token address
export const attestToken = async (enqueueSnackbar, solConnection, sourceAsset, terraWallet,
                                  signer, network, wallet, payerAddress, sourceChainId, solPK) => {
    console.log("attestToken")
    let attest;
    // Submit transaction - results in a Wormhole message being published
    if (isEVMChain(sourceChainId) && !!signer) {
        console.log("EVM ATTEST")
        attest = await evmAttest(enqueueSnackbar, sourceChainId, signer, sourceAsset)
    } else if (sourceChainId === CHAIN_ID_SOLANA && !!wallet && !!solPK) {
        console.log("SOLANA ATTEST")
        attest = solanaAttest(enqueueSnackbar, solConnection, solPK, sourceAsset, wallet);
    } else if (sourceChainId === CHAIN_ID_TERRA && !!terraWallet) {
        console.log("TERRA ATTEST")
        attest = terraAttest(enqueueSnackbar, terraWallet, sourceAsset, /*terraFeeDenom*/);
    }
    console.log('attest', attest)
    return attest;
}

const evmAttest = async (enqueueSnackbar, sourceChainId, signer, sourceAsset) => {
    try {
        console.log("START evmAttest")
        console.log("sourceChainId", sourceChainId)
        console.log("sourceAsset", sourceAsset)
        let parsedChain = getTokenBridgeAddressForChain(sourceChainId)
        console.log("parsedChain", parsedChain)
        const receipt = await attestFromEth(
            parsedChain,
            signer,
            sourceAsset
        );
        console.log("receipt", receipt)
        enqueueSnackbar(null, {
            content: <Alert severity="success">Transaction confirmed</Alert>,
        });
        const sequence = parseSequenceFromLogEth(
            receipt,
            getBridgeAddressForChain(sourceChainId)
        );
        const emitterAddress = getEmitterAddressEth(
            getTokenBridgeAddressForChain(sourceChainId)
        );
        enqueueSnackbar(null, {
            content: <Alert severity="info">Fetching VAA</Alert>,
        });
        const {vaaBytes} = await getSignedVAAWithRetry(
            sourceChainId,
            emitterAddress,
            sequence
        );
        enqueueSnackbar(null, {
            content: <Alert severity="success">Fetched Signed VAA</Alert>,
        });
        return (
            {
                attestTx: {id: receipt.transactionHash, block: receipt.blockNumber},
                signedVAAHex: uint8ArrayToHex(vaaBytes)
            }
        )
    } catch (e) {
        console.error(e);
        enqueueSnackbar(null, {
            content: <Alert severity="error">{parseError(e)}</Alert>,
        });
    }
}

const solanaAttest = async (enqueueSnackbar, solConnection, solPK, sourceAsset, wallet) => {
    try {
        const transaction = await attestFromSolana(
            solConnection,
            SOL_BRIDGE_ADDRESS,
            SOL_TOKEN_BRIDGE_ADDRESS,
            solPK.toString(),
            sourceAsset
        );
        const signed = await wallet.signTransaction(transaction);
        const txid = await solConnection.sendRawTransaction(signed.serialize());
        await solConnection.confirmTransaction(txid);
        enqueueSnackbar(null, {
            content: <Alert severity="success">Transaction confirmed</Alert>,
        });
        const info = await solConnection.getTransaction(txid);
        if (!info) {
            // TODO: error state
            throw new Error("An error occurred while fetching the transaction info");
        }
        const sequence = parseSequenceFromLogSolana(info);
        const emitterAddress = await getEmitterAddressSolana(
            SOL_TOKEN_BRIDGE_ADDRESS
        );
        enqueueSnackbar(null, {
            content: <Alert severity="info">Fetching VAA</Alert>,
        });
        const {vaaBytes} = await getSignedVAAWithRetry(
            CHAIN_ID_SOLANA,
            emitterAddress,
            sequence
        );
        enqueueSnackbar(null, {
            content: <Alert severity="success">Fetched Signed VAA</Alert>,
        });
        return ({
            attestTx: {id: txid, block: info.slot},
            signedVAAHex: uint8ArrayToHex(vaaBytes)
        })
    } catch (e) {
        console.error(e);
        enqueueSnackbar(null, {
            content: <Alert severity="error">{parseError(e)}</Alert>,
        });
    }
}

const terraAttest = async () => {
    throw new Error("COMING SOON")
    // try {
    //     const msg = await attestFromTerra(
    //         TERRA_TOKEN_BRIDGE_ADDRESS,
    //         wallet.terraAddress,
    //         asset
    //     );
    //     const result = await postWithFees(wallet, [msg], "Create Wrapped", [
    //         feeDenom,
    //     ]);
    //     const info = await waitForTerraExecution(result);
    //     dispatch(setAttestTx({ id: info.txhash, block: info.height }));
    //     enqueueSnackbar(null, {
    //         content: <Alert severity="success">Transaction confirmed</Alert>,
    //     });
    //     const sequence = parseSequenceFromLogTerra(info);
    //     if (!sequence) {
    //         throw new Error("Sequence not found");
    //     }
    //     const emitterAddress = await getEmitterAddressTerra(
    //         TERRA_TOKEN_BRIDGE_ADDRESS
    //     );
    //     enqueueSnackbar(null, {
    //         content: <Alert severity="info">Fetching VAA</Alert>,
    //     });
    //     const { vaaBytes } = await getSignedVAAWithRetry(
    //         CHAIN_ID_TERRA,
    //         emitterAddress,
    //         sequence
    //     );
    //     dispatch(setSignedVAAHex(uint8ArrayToHex(vaaBytes)));
    //     enqueueSnackbar(null, {
    //         content: <Alert severity="success">Fetched Signed VAA</Alert>,
    //     });
    // } catch (e) {
    //     console.error(e);
    //     enqueueSnackbar(null, {
    //         content: <Alert severity="error">{parseError(e)}</Alert>,
    //     });
    // }
}

export let CURRENT_WORMHOLE_RPC_HOST = -1;

export const getNextRpcHost = () =>
    ++CURRENT_WORMHOLE_RPC_HOST % WORMHOLE_RPC_HOSTS.length;

export async function getSignedVAAWithRetry(emitterChain, emitterAddress, sequence, retryAttempts) {
    let result;
    let attempts = 0;
    while (!result) {
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 1000));
        try {
            result = await getSignedVAA(
                WORMHOLE_RPC_HOSTS[getNextRpcHost()],
                emitterChain,
                emitterAddress,
                sequence
            );
        } catch (e) {
            if (retryAttempts !== undefined && attempts > retryAttempts) {
                throw e;
            }
        }
    }
    return result;
}
