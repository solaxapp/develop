import {Account, PublicKey, SystemProgram, TransactionInstruction,} from "@solana/web3.js";
import {useEffect, useMemo} from "react";
import {AccountLayout, MintLayout, Token} from "@solana/spl-token";
import {
    cache,
    getCachedAccount,
    getMultipleAccounts,
    useCachedPool,
    useUserAccounts,
} from "../../../context/AccountsProvider";
import {programIds, SWAP_HOST_FEE_ADDRESS, SWAP_PROGRAM_OWNER_FEE_ADDRESS, WRAPPED_SOL_MINT,} from "../../ids";
import {
    swapInstruction,
    TokenSwapLayout,
    TokenSwapLayoutLegacyV0 as TokenSwapLayoutV0,
    TokenSwapLayoutV1,
    uint64,
    withdrawInstruction,
} from "../models/TokenSwap";
import * as TokenSwap2 from "../models/TokenSwap2"
import {useConnection} from "@solana/wallet-adapter-react";
import {sendTransaction} from "../../../context/GlobalProvider";
import * as BufferLayout from "buffer-layout";
import {Numberu64} from "@solana/spl-token-swap";
import {LIQUIDITY_TOKEN_PRECISION, PoolOperation} from "../../../constants/app";
import {dispatch, useSelector} from "../../../store/redux";
import {fetchBestPool} from "../../../redux/pools";

//Check is pool exists
export const addLiquidity = async (connection, components, slippage, pool, options,
                                   depositType = "both", notify, walletPubKey, sendTransaction) => {
    if (depositType === "one" && pool) {
        await _addLiquidityExactOneExistingPool(pool, components[0], connection, notify, slippage, walletPubKey,
            sendTransaction);
    } else if (!pool) {
        if (!options) {
            throw new Error("Options are required to create new pool.");
        }
        await _addLiquidityNewPool(connection, components, options, walletPubKey, notify, sendTransaction);
    } else {
        await _addLiquidityExistingPool(pool, components, connection, slippage, walletPubKey, notify, sendTransaction);
    }
};

//Add liquidity to exist pool (one token)
async function _addLiquidityExactOneExistingPool(pool, component, connection, notify, slippage, walletPublicKey,
                                                 walletSendTransaction) {
    notify("info", "Adding Liquidity... Please review transactions to approve.");

    const poolMint = await cache.queryMint(connection, pool.pubkeys.mint);

    if (!poolMint.mintAuthority) {
        throw new Error("Mint doesnt have authority");
    }

    if (!pool.pubkeys.feeAccount) {
        throw new Error("Invalid fee account");
    }

    const accountA = await cache.queryAccount(connection, pool.pubkeys.holdingAccounts[0]);
    const accountB = await cache.queryAccount(connection, pool.pubkeys.holdingAccounts[1]);

    const from = component;

    if (!from.account) {
        throw new Error("Missing account info.");
    }
    const reserve =
        accountA.info.mint.toBase58() === from.mintAddress
            ? accountA.info.amount.toNumber()
            : accountB.info.amount.toNumber();

    const supply = poolMint.supply.toNumber();
    const authority = poolMint.mintAuthority;

    // Uniswap whitepaper: https://uniswap.org/whitepaper.pdf
    // see: https://uniswap.org/docs/v2/advanced-topics/pricing/
    // as well as native uniswap v2 oracle: https://uniswap.org/docs/v2/core-concepts/oracles/
    const amount = from.amount;

    /*
    *
    * const liquidity = Math.min((amount0 * (1 - slippage) * supply) / reserve0,
        (amount1 * (1 - slippage) * supply) / reserve1);
    * */
    const liquidityToken = (amount * (1 - slippage) * supply) / reserve;

    const instructions = [];
    const cleanupInstructions = [];

    const signers = [];

    const accountRentExempt = await connection.getMinimumBalanceForRentExemption(AccountLayout.span);

    console.log("accountRentExempt", accountRentExempt)

    const fromKey = getWrappedAccount(instructions, cleanupInstructions, from.account, walletPublicKey,
        amount + accountRentExempt, signers);

    let toAccount = findOrCreateAccountByMint(walletPublicKey, walletPublicKey, instructions, [],
        accountRentExempt, pool.pubkeys.mint, signers, new Set([pool.pubkeys.feeAccount.toBase58()]));

    console.log("supply", supply)
    console.log("amount", amount)
    console.log("_liquidityTokenTempMath", liquidityToken)

    const isLatestSwap = isLatest(pool.raw.account);
    // create approval for transfer transactions
    const transferAuthority = approveAmount(
        instructions,
        cleanupInstructions,
        fromKey,
        walletPublicKey,
        amount,
        isLatestSwap ? undefined : authority
    );
    if (isLatestSwap) {
        signers.push(transferAuthority);
    }

    instructions.push(TokenSwap2.depositExactOneInstruction(
        pool.pubkeys.account,
        authority,
        transferAuthority.publicKey,
        fromKey,
        pool.pubkeys.holdingAccounts[0],
        pool.pubkeys.holdingAccounts[1],
        pool.pubkeys.mint,
        toAccount,
        pool.pubkeys.program,
        programIds().token,
        amount,
        liquidityToken,
        isLatestSwap
    ))
    // deposit
    // instructions.push(depositExactOneInstruction(
    //     pool.pubkeys.account, authority,
    //     fromKey, pool.pubkeys.holdingAccounts[0], pool.pubkeys.holdingAccounts[1],
    //     pool.pubkeys.mint,
    //     toAccount, pool.pubkeys.program, programIds().token,
    //     amount, liquidityToken));

    let tx = await sendTransaction(connection, instructions.concat(cleanupInstructions), signers, walletPublicKey,
        walletSendTransaction, notify);

    notify("success", "Pool Liquidity provided. Happy trading.", `Transaction - ${tx}`);
}

//Add liquidity to exist pool (both tokens)
async function _addLiquidityExistingPool(pool, components, connection, slippage, walletPublicKey, notify,
                                         walletSendTransaction) {
    notify("info", "Adding Liquidity... Please review transactions to approve.");

    const poolMint = await cache.getMint(pool.pubkeys.mint);
    if (!poolMint.mintAuthority) {
        throw new Error("Mint doesnt have authority");
    }

    if (!pool.pubkeys.feeAccount) {
        throw new Error("Invald fee account");
    }

    const accountA = await cache.getAccount(pool.pubkeys.holdingAccounts[0]);
    console.log("accountA", accountA)
    const accountB = await cache.getAccount(pool.pubkeys.holdingAccounts[1]);
    console.log("accountB", accountB)
    const reserve0 = accountA.info.amount.toNumber();
    console.log("reserve0", reserve0)
    const reserve1 = accountB.info.amount.toNumber();
    console.log("reserve1", reserve1)
    const fromA = accountA.info.mint.toBase58() === components[0].mintAddress
        ? components[0] : components[1];
    console.log("fromA", fromA)
    const fromB = fromA === components[0] ? components[1] : components[0];
    console.log("fromB", fromB)

    if (!fromA.account || !fromB.account) {
        throw new Error("Missing account info.");
    }

    const supply = poolMint.supply.toNumber();
    console.log("supply", supply)
    const authority = poolMint.mintAuthority;
    console.log("authority", authority)

    // Uniswap whitepaper: https://uniswap.org/whitepaper.pdf
    // see: https://uniswap.org/docs/v2/advanced-topics/pricing/
    // as well as native uniswap v2 oracle: https://uniswap.org/docs/v2/core-concepts/oracles/
    const amount0 = fromA.amount;
    console.log("amount0", amount0)
    const amount1 = fromB.amount;
    console.log("amount1", amount1)

    const liquidity = Math.min((amount0 * (1 - slippage) * supply) / reserve0,
        (amount1 * (1 - slippage) * supply) / reserve1);
    console.log("liquidity", liquidity)
    const instructions = [];
    const cleanupInstructions = [];

    const signers = [];

    const accountRentExempt = await connection.getMinimumBalanceForRentExemption(AccountLayout.span);
    console.log("accountRentExempt", accountRentExempt)

    const fromKeyA = getWrappedAccount(instructions, cleanupInstructions, fromA.account, walletPublicKey,
        amount0 + accountRentExempt, signers);
    console.log("fromKeyA", fromKeyA)
    const fromKeyB = getWrappedAccount(instructions, cleanupInstructions, fromB.account, walletPublicKey,
        amount1 + accountRentExempt, signers);
    console.log("fromKeyB", fromKeyB)

    let toAccount = findOrCreateAccountByMint(walletPublicKey, walletPublicKey, instructions, [],
        accountRentExempt, pool.pubkeys.mint, signers, new Set([pool.pubkeys.feeAccount.toBase58()]));
    console.log("toAccount", toAccount)

    // create approval for transfer transactions
    instructions.push(Token.createApproveInstruction(programIds().token, fromKeyA, authority, walletPublicKey,
        [], amount0));

    instructions.push(Token.createApproveInstruction(programIds().token, fromKeyB, authority, walletPublicKey,
        [], amount1));

    const isLatestSwap = isLatest(pool.raw.account);
    const transferAuthority = approveAmount(
        instructions,
        cleanupInstructions,
        fromKeyA,
        walletPublicKey,
        amount0,
        isLatestSwap ? undefined : authority
    );
    if (isLatestSwap) {
        signers.push(transferAuthority);
    }

    instructions.push(TokenSwap2.depositInstruction(
        pool.pubkeys.account,
        authority,
        transferAuthority.publicKey,
        fromKeyA,
        fromKeyB,
        pool.pubkeys.holdingAccounts[0],
        pool.pubkeys.holdingAccounts[1],
        pool.pubkeys.mint,
        toAccount,
        pool.pubkeys.program,
        programIds().token,
        liquidity,
        amount0,
        amount1,
        isLatestSwap
    ))

    // depoist
    // instructions.push(depositInstruction(
    //     pool.pubkeys.account,
    //     authority,
    //     fromKeyA,
    //     fromKeyB,
    //     pool.pubkeys.holdingAccounts[0],
    //     pool.pubkeys.holdingAccounts[1],
    //     pool.pubkeys.mint,
    //     toAccount,
    //     pool.pubkeys.program,
    //     programIds().token,
    //     liquidity,
    //     amount0,
    //     amount1
    // ));

    let tx = await sendTransaction(connection, instructions.concat(cleanupInstructions), signers, walletPublicKey,
        walletSendTransaction, notify);

    notify("success", "Pool Funded. Happy trading.", tx);
}

// TODO: add ui to customize curve type
//Add liquidity and create new pool
async function _addLiquidityNewPool(connection, components, options, walletPublicKey, notify, walletSendTransaction) {
    notify('info', 'Creating new pool... Please review transactions to approve.')

    if (components.some((c) => !c.account)) {
        notify('error', 'You need to have balance for all legs in the basket...Please review inputs.')
        return;
    }

    let instructions = [];
    let cleanupInstructions = [];

    const liquidityTokenAccount = new Account();
    // Create account for pool liquidity token
    instructions.push(
        SystemProgram.createAccount({
            fromPubkey: walletPublicKey,
            newAccountPubkey: liquidityTokenAccount.publicKey,
            lamports: await connection.getMinimumBalanceForRentExemption(
                MintLayout.span
            ),
            space: MintLayout.span,
            programId: programIds().token,
        })
    );

    const tokenSwapAccount = new Account();

    const [authority, nonce] = await PublicKey.findProgramAddress(
        [tokenSwapAccount.publicKey.toBuffer()],
        programIds().swap
    );


    // create mint for pool liquidity token
    instructions.push(
        Token.createInitMintInstruction(
            programIds().token,
            liquidityTokenAccount.publicKey,
            LIQUIDITY_TOKEN_PRECISION,
            // pass control of liquidity mint to swap program
            authority,
            // swap program can freeze liquidity token mint
            null
        )
    );

    // Create holding accounts for
    const accountRentExempt = await connection.getMinimumBalanceForRentExemption(
        AccountLayout.span
    );

    const holdingAccounts = [];
    let signers = [];

    components.forEach((leg) => {
        if (!leg.account) {
            return;
        }

        const mintPublicKey = leg.account.info.mint;
        // component account to store tokens I of N in liquidity poll
        holdingAccounts.push(
            createSplAccount(
                instructions,
                walletPublicKey,
                accountRentExempt,
                mintPublicKey,
                authority,
                AccountLayout.span
            )
        );
    });

    // creating depositor pool account
    const depositorAccount = createSplAccount(
        instructions,
        walletPublicKey,
        accountRentExempt,
        liquidityTokenAccount.publicKey,
        walletPublicKey,
        AccountLayout.span
    );

    // creating fee pool account its set from env variable or to creater of the pool
    // creater of the pool is not allowed in some versions of token-swap program
    const feeAccount = createSplAccount(
        instructions,
        walletPublicKey,
        accountRentExempt,
        liquidityTokenAccount.publicKey,
        SWAP_PROGRAM_OWNER_FEE_ADDRESS || walletPublicKey,
        AccountLayout.span
    );

    // create all accounts in one transaction
    let tx = await sendTransaction(connection, instructions, [
        liquidityTokenAccount,
        depositorAccount,
        feeAccount,
        ...holdingAccounts,
        ...signers,
    ], walletPublicKey, walletSendTransaction, notify);

    notify('success', 'Accounts created', tx)
    notify('info', 'Adding Liquidity... Please review transactions to approve.', tx)

    signers = [];
    instructions = [];
    cleanupInstructions = [];

    instructions.push(
        SystemProgram.createAccount({
            fromPubkey: walletPublicKey,
            newAccountPubkey: tokenSwapAccount.publicKey,
            lamports: await connection.getMinimumBalanceForRentExemption(
                TokenSwapLayout.span
            ),
            space: TokenSwapLayout.span,
            programId: programIds().swap,
        })
    );

    components.forEach((leg, i) => {
        if (!leg.account) {
            return;
        }

        // create temporary account for wrapped sol to perform transfer
        const from = getWrappedAccount(
            instructions,
            cleanupInstructions,
            leg.account,
            walletPublicKey,
            leg.amount + accountRentExempt,
            signers
        );

        instructions.push(
            Token.createTransferInstruction(
                programIds().token,
                from,
                holdingAccounts[i].publicKey,
                walletPublicKey,
                [],
                leg.amount
            )
        );
    });

    instructions.push(TokenSwap2.createInitSwapInstruction(
        tokenSwapAccount,
        authority,
        holdingAccounts[0].publicKey,
        holdingAccounts[1].publicKey,
        liquidityTokenAccount.publicKey,
        feeAccount.publicKey,
        depositorAccount.publicKey,
        programIds().token,
        programIds().swap,
        nonce,
        options,
        programIds().swapLayout === TokenSwapLayout
    ))

    // instructions.push(
    //     createInitSwapInstruction(
    //         tokenSwapAccount,
    //         authority,
    //         holdingAccounts[0].publicKey,
    //         holdingAccounts[1].publicKey,
    //         liquidityTokenAccount.publicKey,
    //         feeAccount.publicKey,
    //         depositorAccount.publicKey,
    //         programIds().token,
    //         programIds().swap,
    //         nonce,
    //         options.curveType,
    //         options.tradeFeeNumerator,
    //         options.tradeFeeDenominator,
    //         options.ownerTradeFeeNumerator,
    //         options.ownerTradeFeeDenominator,
    //         options.ownerWithdrawFeeNumerator,
    //         options.ownerWithdrawFeeDenominator
    //     )
    // );

    // All instructions didn't fit in single transaction
    // initialize and provide inital liquidity to swap in 2nd (this prevents loss of funds)
    tx = await sendTransaction(connection, instructions.concat(cleanupInstructions),
        [tokenSwapAccount, ...signers], walletPublicKey, walletSendTransaction, notify);
    notify('success', "Pool Funded. Happy trading.", tx)
}

export const removeLiquidity = async (connection, wallet, liquidityAmount, account, pool, walletPublicKey, notify,
                                      walletSendTransaction) => {
    if (!pool) {
        throw new Error("Pool is required");
    }

    notify('info', "Removing Liquidity... Please review transactions to approve.");

    // TODO get min amounts based on total supply and liquidity
    const minAmount0 = 0;
    const minAmount1 = 0;

    const poolMint = await cache.queryMint(connection, pool.pubkeys.mint);
    const accountA = await cache.queryAccount(connection, pool.pubkeys.holdingAccounts[0]);
    const accountB = await cache.queryAccount(
        connection,
        pool.pubkeys.holdingAccounts[1]
    );
    if (!poolMint.mintAuthority) {
        throw new Error("Mint doesnt have authority");
    }
    const authority = poolMint.mintAuthority;

    const signers = [];
    const instructions = [];
    const cleanupInstructions = [];

    const accountRentExempt = await connection.getMinimumBalanceForRentExemption(
        AccountLayout.span
    );

    const toAccounts = [
        await findOrCreateAccountByMint(
            walletPublicKey,
            walletPublicKey,
            instructions,
            cleanupInstructions,
            accountRentExempt,
            accountA.info.mint,
            signers
        ),
        await findOrCreateAccountByMint(
            walletPublicKey,
            walletPublicKey,
            instructions,
            cleanupInstructions,
            accountRentExempt,
            accountB.info.mint,
            signers
        ),
    ];

    const isLatestSwap = isLatest(pool.raw.account);
    const transferAuthority = approveAmount(
        instructions,
        cleanupInstructions,
        account.pubkey,
        walletPublicKey,
        liquidityAmount,
        isLatestSwap ? undefined : authority
    );

    if (isLatestSwap) {
        signers.push(transferAuthority);
    }

    // withdraw
    instructions.push(
        withdrawInstruction(
            pool.pubkeys.account,
            authority,
            transferAuthority.publicKey,
            pool.pubkeys.mint,
            pool.pubkeys.feeAccount,
            account.pubkey,
            pool.pubkeys.holdingAccounts[0],
            pool.pubkeys.holdingAccounts[1],
            toAccounts[0],
            toAccounts[1],
            pool.pubkeys.program,
            programIds().token,
            liquidityAmount,
            minAmount0,
            minAmount1,
            isLatestSwap
        )
    );

    const deleteAccount = liquidityAmount === account.info.amount.toNumber();
    if (deleteAccount) {
        instructions.push(
            Token.createCloseAccountInstruction(
                programIds().token,
                account.pubkey,
                authority,
                walletPublicKey,
                []
            )
        );
    }

    let tx = await sendTransaction(connection, instructions.concat(cleanupInstructions),
        signers, walletPublicKey, walletSendTransaction, notify);

    if (deleteAccount) {
        cache.deleteAccount(account.pubkey);
    }
    notify('success', "Liquidity Returned. Thank you for your support.", tx);

    return [
        accountA.info.mint.equals(WRAPPED_SOL_MINT)
            ? (walletPublicKey)
            : toAccounts[0],
        accountB.info.mint.equals(WRAPPED_SOL_MINT)
            ? (walletPublicKey)
            : toAccounts[1],
    ];
};

export const removeExactOneLiquidity = async (connection, wallet, account, liquidityAmount, tokenAmount, tokenMint,
                                              pool, slippage, walletPublicKey, notify, walletSendTransaction) => {
    if (!pool) {
        throw new Error("Pool is required");
    }
    notify('info', "Removing Liquidity...Please review transactions to approve.");
    // Maximum number of LP tokens
    // needs to be different math because the new instruction
    const liquidityMaxAmount = liquidityAmount * (1 + slippage);

    const poolMint = await cache.queryMint(connection, pool.pubkeys.mint);
    const accountA = await cache.queryAccount(
        connection,
        pool.pubkeys.holdingAccounts[0]
    );
    const accountB = await cache.queryAccount(
        connection,
        pool.pubkeys.holdingAccounts[1]
    );
    if (!poolMint.mintAuthority) {
        throw new Error("Mint doesnt have authority");
    }

    const tokenMatchAccount =
        tokenMint === pool.pubkeys.holdingMints[0].toBase58() ? accountA : accountB;
    const authority = poolMint.mintAuthority;

    const signers = [];
    const instructions = [];
    const cleanupInstructions = [];

    const accountRentExempt = await connection.getMinimumBalanceForRentExemption(
        AccountLayout.span
    );

    const toAccount = await findOrCreateAccountByMint(
        walletPublicKey,
        walletPublicKey,
        instructions,
        cleanupInstructions,
        accountRentExempt,
        tokenMatchAccount.info.mint,
        signers
    );

    const isLatestSwap = isLatest(pool.raw.account);
    const transferAuthority = approveAmount(
        instructions,
        cleanupInstructions,
        account.pubkey,
        walletPublicKey,
        account.info.amount.toNumber(), // liquidityAmount <- need math tuning
        isLatestSwap ? undefined : authority
    );
    if (isLatestSwap) {
        signers.push(transferAuthority);
    }

    // withdraw exact one
    instructions.push(
        withdrawExactOneInstruction(
            pool.pubkeys.account,
            authority,
            transferAuthority.publicKey,
            pool.pubkeys.mint,
            account.pubkey,
            pool.pubkeys.holdingAccounts[0],
            pool.pubkeys.holdingAccounts[1],
            toAccount,
            pool.pubkeys.feeAccount,
            pool.pubkeys.program,
            programIds().token,
            tokenAmount,
            liquidityMaxAmount,
            isLatestSwap
        )
    );

    let tx = await sendTransaction(connection, instructions.concat(cleanupInstructions),
        signers, walletPublicKey, walletSendTransaction, notify);
    notify('success', "Liquidity Returned. Thank you for your support.", tx);

    return tokenMatchAccount.info.mint.equals(WRAPPED_SOL_MINT)
        ? (walletPublicKey)
        : toAccount;
};

export const swap = async (connection, components, SLIPPAGE, pool, walletPublicKey, notify,
                           walletSendTransaction) => {
    if (!pool || !components[0].account) {
        notify("error", "Pool doesn't exsist. Swap trade cancelled")
        return;
    }

    // Uniswap whitepaper: https://uniswap.org/whitepaper.pdf
    // see: https://uniswap.org/docs/v2/advanced-topics/pricing/
    // as well as native uniswap v2 oracle: https://uniswap.org/docs/v2/core-concepts/oracles/
    const amountIn = components[0].amount; // these two should include slippage
    const minAmountOut = components[1].amount * (1 - SLIPPAGE);
    const holdingA =
        pool.pubkeys.holdingMints[0].toBase58() ===
        components[0].account.info.mint.toBase58()
            ? pool.pubkeys.holdingAccounts[0]
            : pool.pubkeys.holdingAccounts[1];
    const holdingB =
        holdingA === pool.pubkeys.holdingAccounts[0]
            ? pool.pubkeys.holdingAccounts[1]
            : pool.pubkeys.holdingAccounts[0];

    const poolMint = await cache.queryMint(connection, pool.pubkeys.mint);
    if (!poolMint.mintAuthority || !pool.pubkeys.feeAccount) {
        throw new Error("Mint doesnt have authority");
    }
    const authority = poolMint.mintAuthority;

    const instructions = [];
    const cleanupInstructions = [];
    const signers = [];

    const accountRentExempt = await connection.getMinimumBalanceForRentExemption(AccountLayout.span);

    const fromAccount = getWrappedAccount(
        instructions,
        cleanupInstructions,
        components[0].account,
        walletPublicKey,
        amountIn + accountRentExempt,
        signers
    );

    let toAccount = findOrCreateAccountByMint(
        walletPublicKey,
        walletPublicKey,
        instructions,
        cleanupInstructions,
        accountRentExempt,
        new PublicKey(components[1].mintAddress),
        signers
    );
    // create approval for transfer transactions
    instructions.push(
        Token.createApproveInstruction(
            programIds().token,
            fromAccount,
            authority,
            walletPublicKey,
            [],
            amountIn
        )
    );

    let hostFeeAccount = SWAP_HOST_FEE_ADDRESS
        ? findOrCreateAccountByMint(
            walletPublicKey,
            SWAP_HOST_FEE_ADDRESS,
            instructions,
            cleanupInstructions,
            accountRentExempt,
            pool.pubkeys.mint,
            signers
        )
        : undefined;

    // swap
    instructions.push(
        swapInstruction(
            pool.pubkeys.account,
            authority,
            fromAccount,
            holdingA,
            holdingB,
            toAccount,
            pool.pubkeys.mint,
            pool.pubkeys.feeAccount,
            pool.pubkeys.program,
            programIds().token,
            amountIn,
            minAmountOut,
            hostFeeAccount
        )
    );

    let tx = await sendTransaction(connection, instructions.concat(cleanupInstructions), signers, walletPublicKey,
        walletSendTransaction, notify);

    notify("success", "Trade executed.", tx);
};

export const isLatest = (swap) => {
    return swap.data.length === TokenSwapLayout.span;
};

export const getHoldings = (connection, accounts) => {
    return accounts.map((acc) =>
        cache.getAccount(connection, new PublicKey(acc))
    );
};

export const toPoolInfo = (item, program, toMerge) => {
    const mint = new PublicKey(item.data.tokenPool);
    return {
        pubkeys: {
            account: item.pubkey,
            program: program,
            mint,
            holdingMints: [],
            holdingAccounts: [item.data.tokenAccountA, item.data.tokenAccountB].map(
                (a) => new PublicKey(a)
            ),
        },
        legacy: false,
        raw: item,
    };
};

export const usePoolForBasket = (mints = []) => {
    const {connection} = useConnection();
    const {pools} = useCachedPool();
    const sortedMints = useMemo(() => [...mints].sort(), [mints]);
    const {bestPool} = useSelector(state => state.pools);

    useEffect(() => {
        dispatch(fetchBestPool({
            connection: connection,
            sortedMints: sortedMints,
            pools: pools
        }))
    }, [pools, connection, mints, sortedMints])

    console.log("VRCA",{bestPool} )
    return {bestPool};
};

export const useOwnedPools = () => {
    const {pools} = useCachedPool();
    const {userAccounts} = useUserAccounts();

    const map = userAccounts.reduce((acc, item) => {
        const key = item.info.mint.toBase58();
        acc.set(key, [...(acc.get(key) || []), item]);
        return acc;
    }, new Map());

    return pools
        .filter((p) => map.has(p.pubkeys.mint.toBase58()))
        .map((item) => {
            let feeAccount = item.pubkeys.feeAccount?.toBase58();
            return map.get(item.pubkeys.mint.toBase58())?.map((a) => {
                return {
                    account: a,
                    isFeeAccount: feeAccount === a.pubkey.toBase58(),
                    pool: item,
                };
            });
        }).flat();
};


function findOrCreateAccountByMint(payer, owner, instructions, cleanupInstructions, accountRentExempt,
                                   mint, // use to identify same type
                                   signers,
                                   excluded
) {
    const accountToFind = mint.toBase58();
    const account = getCachedAccount(
        (acc) => {
            return (
                acc.info.mint.toBase58() === accountToFind &&
                acc.info.owner.toBase58() === owner.toBase58() &&
                (excluded === undefined || !excluded.has(acc.pubkey.toBase58()))
            )
        }
    );
    const isWrappedSol = accountToFind === WRAPPED_SOL_MINT.toBase58();

    let toAccount;
    if (account && !isWrappedSol) {
        toAccount = account.pubkey;
    } else {
        // creating depositor pool account
        const newToAccount = createSplAccount(
            instructions,
            payer,
            accountRentExempt,
            mint,
            owner,
            AccountLayout.span
        );

        toAccount = newToAccount.publicKey;
        signers.push(newToAccount);

        if (isWrappedSol) {
            cleanupInstructions.push(
                Token.createCloseAccountInstruction(
                    programIds().token,
                    toAccount,
                    payer,
                    payer,
                    []
                )
            );
        }
    }

    return toAccount;
}

function estimateProceedsFromInput(
    inputQuantityInPool,
    proceedsQuantityInPool,
    inputAmount
) {
    return (
        (proceedsQuantityInPool * inputAmount) / (inputQuantityInPool + inputAmount)
    );
}

function estimateInputFromProceeds(
    inputQuantityInPool,
    proceedsQuantityInPool,
    proceedsAmount
) {
    if (proceedsAmount >= proceedsQuantityInPool) {
        return "Not possible";
    }

    return (
        (inputQuantityInPool * proceedsAmount) /
        (proceedsQuantityInPool - proceedsAmount)
    );
}

export async function calculateDependentAmount(connection, independent, amount, pool, op) {
    console.log("PPOOOOOLL", pool)
    const poolMint = await cache.getMint(pool.pubkeys.mint);
    const accountA = await cache.queryAccount(
        connection,
        pool.pubkeys.holdingAccounts[0]
    );
    const amountA = accountA.info.amount.toNumber();

    const accountB = await cache.queryAccount(
        connection,
        pool.pubkeys.holdingAccounts[1]
    );
    let amountB = accountB.info.amount.toNumber();
    if (!poolMint.mintAuthority) {
        throw new Error("Mint doesnt have authority");
    }

    if (poolMint.supply.eqn(0)) {
        return;
    }

    let offsetAmount = 0;
    const offsetCurve = pool.raw?.data?.curve?.offset;
    if (offsetCurve) {
        offsetAmount = offsetCurve.token_b_offset;
        amountB = amountB + offsetAmount;
    }

    const mintA = await cache.queryMint(connection, accountA.info.mint);
    const mintB = await cache.queryMint(connection, accountB.info.mint);

    if (!mintA || !mintB) {
        return;
    }

    const isFirstIndependent = accountA.info.mint.toBase58() === independent;
    const depPrecision = Math.pow(
        10,
        isFirstIndependent ? mintB.decimals : mintA.decimals
    );
    const indPrecision = Math.pow(
        10,
        isFirstIndependent ? mintA.decimals : mintB.decimals
    );
    const indAdjustedAmount = amount * indPrecision;

    let indBasketQuantity = isFirstIndependent ? amountA : amountB;

    let depBasketQuantity = isFirstIndependent ? amountB : amountA;

    var depAdjustedAmount;

    const constantPrice = pool.raw?.data?.curve?.constantPrice;
    if (constantPrice) {
        depAdjustedAmount = (amount * depPrecision) / constantPrice.token_b_price;
    } else {
        switch (+op) {
            case PoolOperation.Add:
                depAdjustedAmount =
                    (depBasketQuantity / indBasketQuantity) * indAdjustedAmount;
                break;
            case PoolOperation.SwapGivenProceeds:
                depAdjustedAmount = estimateInputFromProceeds(
                    depBasketQuantity,
                    indBasketQuantity,
                    indAdjustedAmount
                );
                break;
            case PoolOperation.SwapGivenInput:
                depAdjustedAmount = estimateProceedsFromInput(
                    indBasketQuantity,
                    depBasketQuantity,
                    indAdjustedAmount
                );
                break;
            default:
                console.error("Error in switch case")
        }
    }

    if (typeof depAdjustedAmount === "string") {
        return depAdjustedAmount;
    }
    if (depAdjustedAmount === undefined) {
        return undefined;
    }
    return depAdjustedAmount / depPrecision;
}


function getWrappedAccount(instructions, cleanupInstructions, toCheck, payer, amount, signers) {
    if (!toCheck.info.isNative) {
        return toCheck.pubkey;
    }

    const account = new Account();
    instructions.push(
        SystemProgram.createAccount({
            fromPubkey: payer,
            newAccountPubkey: account.publicKey,
            lamports: amount,
            space: AccountLayout.span,
            programId: programIds().token,
        })
    );

    instructions.push(
        Token.createInitAccountInstruction(
            programIds().token,
            WRAPPED_SOL_MINT,
            account.publicKey,
            payer
        )
    );

    cleanupInstructions.push(
        Token.createCloseAccountInstruction(
            programIds().token,
            account.publicKey,
            payer,
            payer,
            []
        )
    );

    signers.push(account);

    return account.publicKey;
}

function createSplAccount(instructions, payer, accountRentExempt,
                          mint, owner, space) {
    const account = new Account();
    instructions.push(
        SystemProgram.createAccount({
            fromPubkey: payer,
            newAccountPubkey: account.publicKey,
            lamports: accountRentExempt,
            space,
            programId: programIds().token,
        })
    );

    instructions.push(Token.createInitAccountInstruction(programIds().token, mint, account.publicKey, owner));

    return account;
}

function approveAmount(instructions, cleanupInstructions, account, owner, amount, delegate) {
    const tokenProgram = programIds().token;
    const transferAuthority = new Account();

    instructions.push(
        Token.createApproveInstruction(tokenProgram, account, delegate ?? transferAuthority.publicKey,
            owner, [], amount));

    cleanupInstructions.push(Token.createRevokeInstruction(tokenProgram, account, owner, []));

    return transferAuthority;
}

export const withdrawExactOneInstruction = (tokenSwap, authority, transferAuthority, poolMint, sourcePoolAccount,
                                            fromA, fromB, userAccount, feeAccount, swapProgramId, tokenProgramId,
                                            sourceTokenAmount, maximumTokenAmount, isLatest) => {
    const dataLayout = BufferLayout.struct([
        BufferLayout.u8("instruction"),
        uint64("sourceTokenAmount"),
        uint64("maximumTokenAmount"),
    ]);

    const data = Buffer.alloc(dataLayout.span);
    dataLayout.encode({
        instruction: 5, // WithdrawExactOne instruction
        sourceTokenAmount: new Numberu64(sourceTokenAmount).toBuffer(),
        maximumTokenAmount: new Numberu64(maximumTokenAmount).toBuffer(),
    }, data);

    const keys = isLatest
        ? [
            {pubkey: tokenSwap, isSigner: false, isWritable: false},
            {pubkey: authority, isSigner: false, isWritable: false},
            {pubkey: transferAuthority, isSigner: true, isWritable: false},
            {pubkey: poolMint, isSigner: false, isWritable: true},
            {pubkey: sourcePoolAccount, isSigner: false, isWritable: true},
            {pubkey: fromA, isSigner: false, isWritable: true},
            {pubkey: fromB, isSigner: false, isWritable: true},
            {pubkey: userAccount, isSigner: false, isWritable: true},
        ]
        : [
            {pubkey: tokenSwap, isSigner: false, isWritable: false},
            {pubkey: authority, isSigner: false, isWritable: false},
            {pubkey: poolMint, isSigner: false, isWritable: true},
            {pubkey: sourcePoolAccount, isSigner: false, isWritable: true},
            {pubkey: fromA, isSigner: false, isWritable: true},
            {pubkey: fromB, isSigner: false, isWritable: true},
            {pubkey: userAccount, isSigner: false, isWritable: true},
        ];

    if (feeAccount) {
        keys.push({pubkey: feeAccount, isSigner: false, isWritable: true});
    }
    keys.push({pubkey: tokenProgramId, isSigner: false, isWritable: false});

    return new TransactionInstruction({
        keys,
        programId: swapProgramId,
        data,
    });
};

const getErrorForTransaction = async (connection, txid) => {
    // wait for all confirmation before geting transaction
    await connection.confirmTransaction(txid, "max");

    const tx = await connection.getParsedConfirmedTransaction(txid);

    const errors = [];
    if (tx?.meta && tx.meta.logMessages) {
        tx.meta.logMessages.forEach((log) => {
            const regex = /Error: (.*)/gm;
            let m;
            while ((m = regex.exec(log)) !== null) {
                // This is necessary to avoid infinite loops with zero-width matches
                if (m.index === regex.lastIndex) {
                    regex.lastIndex++;
                }

                if (m.length > 1) {
                    errors.push(m[1]);
                }
            }
        });
    }

    return errors;
};

export const queryPools = async (connection, swapId, isLegacy = false) => {
    let poolsArray = [];
    (await connection.getProgramAccounts(swapId))
        .filter(
            (item) =>
                item.account.data.length === TokenSwapLayout.span ||
                item.account.data.length === TokenSwapLayoutV1.span ||
                item.account.data.length === TokenSwapLayoutV0.span
        )
        .map((item) => {
            let result = {
                data: undefined,
                account: item.account,
                pubkey: item.pubkey,
                init: async () => {
                },
            };

            const layout =
                item.account.data.length === TokenSwapLayout.span
                    ? TokenSwapLayout
                    : item.account.data.length === TokenSwapLayoutV1.span
                        ? TokenSwapLayoutV1
                        : TokenSwapLayoutV0;

            // handling of legacy layout can be removed soon...
            if (layout === TokenSwapLayoutV0) {
                result.data = layout.decode(item.account.data);
                let pool = toPoolInfo(result, swapId);
                pool.legacy = isLegacy;
                poolsArray.push(pool);

                result.init = async () => {
                    try {
                        // TODO: this is not great
                        // Ideally SwapLayout stores hash of all the mints to make finding of pool for a pair easier
                        const holdings = await Promise.all(
                            getHoldings(connection, [
                                result.data.tokenAccountA,
                                result.data.tokenAccountB,
                            ])
                        );

                        pool.pubkeys.holdingMints = [
                            holdings[0].info.mint,
                            holdings[1].info.mint,
                        ];
                    } catch (err) {
                        console.log(err);
                    }
                };
            } else {
                result.data = layout.decode(item.account.data);

                let pool = toPoolInfo(result, swapId);
                pool.legacy = isLegacy;
                pool.pubkeys.feeAccount = new PublicKey(result.data.feeAccount);
                pool.pubkeys.holdingMints = [
                    new PublicKey(result.data.mintA),
                    new PublicKey(result.data.mintB),
                ];

                poolsArray.push(pool);
            }

            return result;
        });

    const toQuery = [...poolsArray
        .map(
            (p) =>
                [
                    ...p.pubkeys.holdingAccounts.map((h) => h.toBase58()),
                    ...p.pubkeys.holdingMints.map((h) => h.toBase58()),
                    p.pubkeys.feeAccount?.toBase58(), // used to calculate volume approximation
                    p.pubkeys.mint.toBase58(),
                ].filter((p) => p)
        )
        .flat()
        .filter(acc => cache.get(acc) === undefined)
        .reduce((acc, item) => {
            acc.add(item);
            return acc;
        }, new Set())
        .keys()]
        .sort();

    // This will pre-cache all accounts used by pools
    // All those accounts are updated whenever there is a change
    await getMultipleAccounts(connection, toQuery, "single").then(
        ({keys, array}) => {
            return array.map((obj, index) => {
                if (!obj) {
                    return undefined;
                }

                const pubKey = new PublicKey(keys[index]);
                if (obj.data.length === AccountLayout.span) {
                    return cache.addAccount(pubKey, obj);
                } else if (obj.data.length === MintLayout.span) {
                    if (!cache.getMint(pubKey)) {
                        return cache.addMint(pubKey, obj);
                    }
                }

                return obj;
            }).filter(a => !!a);
        }
    );
    return poolsArray;
};