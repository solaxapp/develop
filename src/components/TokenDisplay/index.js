import {convert} from "../../helper/token";
import {TokenIcon} from "../TokenIcon";
import {cache, useAccountByMint} from "../../context/AccountsProvider";

export const TokenDisplay = ({name, mintAddress, icon, showBalance,}) => {
    const tokenMint = cache.getMint(mintAddress);
    const tokenAccount = useAccountByMint(mintAddress);

    let balance = 0;
    let hasBalance = false;
    if (showBalance) {
        if (tokenAccount && tokenMint) {
            balance = convert(tokenAccount, tokenMint);
            hasBalance = balance > 0;
        }
    }

    return (
        <>
            <div
                title={mintAddress}
                key={mintAddress}
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <div style={{display: "flex", alignItems: "center"}}>
                    {icon || <TokenIcon mintAddress={mintAddress}/>}
                    {name}
                </div>
                {showBalance ? (
                    <span
                        title={balance.toString()}
                        key={mintAddress}
                        className="token-balance"
                    >
            &nbsp;{" "}
                        {hasBalance
                            ? balance < 0.001
                                ? "<0.001"
                                : balance.toFixed(3)
                            : "-"}
          </span>
                ) : null}
            </div>
        </>
    );
};