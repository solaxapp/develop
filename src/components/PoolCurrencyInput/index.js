import {getPoolName, getTokenName} from "../../helper/token";
import {PoolIcon, TokenIcon} from "../TokenIcon";
import {Card} from "../Flex";
import {NumericInput} from "../NumericInput";
import {TokenDisplay} from "../TokenDisplay";
import {useAllTokensContext} from "../../context/TokensProvider";

export const PoolCurrencyInput = ({mint, amount, title, pool, onInputChange, onMintChange, balance,}) => {
    const {tokenMap} = useAllTokensContext();
    let name;
    let icon;
    if (pool) {
        name = getPoolName(tokenMap, pool);
        const sorted = pool.pubkeys.holdingMints
            .map((a) => a.toBase58())
            .sort();
        icon = <PoolIcon mintA={sorted[0]} mintB={sorted[1]}/>;
    } else {
        name = getTokenName(tokenMap, mint, true, 3);
        icon = <TokenIcon mintAddress={mint}/>;
    }
    return (
        <Card
            className="ccy-input"
            style={{borderRadius: 20}}
            bodyStyle={{padding: 0}}
        >
            <div className="ccy-input-header">
                <div className="ccy-input-header-left">{title}</div>
                {balance && (
                    <div
                        className="ccy-input-header-right"
                        onClick={(e) => onInputChange && onInputChange(balance)}
                    >
                        Balance: {balance.toFixed(6)}
                    </div>
                )}
            </div>
            <div className="ccy-input-header" style={{padding: "0px 10px 5px 7px"}}>
                <NumericInput
                    value={amount}
                    onChange={(val) => {
                        if (onInputChange) {
                            onInputChange(val);
                        }
                    }}
                    style={{
                        fontSize: 20,
                        boxShadow: "none",
                        borderColor: "transparent",
                        outline: "transparent",
                    }}
                    placeholder="0.00"
                />

                <div className="ccy-input-header-right" style={{display: "felx"}}>
                    <TokenDisplay key={mint} mintAddress={mint} name={name} icon={icon}/>
                </div>
            </div>
        </Card>
    );
};
