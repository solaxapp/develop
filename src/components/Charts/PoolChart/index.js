import {useEnrichedPools} from "../../../context/MarketProvider";
import {useEffect, useMemo, useRef} from "react";
import * as echarts from "echarts";
import {formatNumber, formatUSD} from "../../../helper/token";
import {styled} from "@mui/material/styles";

const ChartWrapper = styled('div')(({theme}) => ({
    maxWidth: 430,
    minWidth: 300,
    height: 180,
}))

export default function PoolChart({pool}) {
    const charRef = useRef(null);
    const pools = useMemo(() => [pool].filter((p) => p), [
        pool,
    ]);
    const enriched = useEnrichedPools(pools)[0];

    // dispose chart
    useEffect(() => {
        const div = charRef.current;
        return () => {
            let instance = div && echarts.getInstanceByDom(div);
            instance && instance.dispose();
        };
    }, []);

    useEffect(() => {
        if (!charRef.current || !enriched) {
            return;
        }

        let instance = echarts.getInstanceByDom(charRef.current);
        if (!instance) {
            instance = echarts.init(charRef.current);
        }

        const data = [
            {
                name: enriched.names[0],
                tokens: enriched.liquidityAinUsd,
                value: enriched.liquidityA,
            },
            {
                name: enriched.names[1],
                tokens: enriched.liquidityBinUsd,
                value: enriched.liquidityB,
            },
        ];
        instance.setOption({
            tooltip: {
                trigger: "item",
                formatter: function (params) {
                    // let val = formatUSD.format(params.value);
                    let tokenAmount = formatNumber.format(params.data.tokens);
                    return `${params.name}: \n${params.value}\n(${tokenAmount})`;
                },
            },
            series: [{
                name: "Liquidity",
                type: "pie",
                label: {
                    fontSize: 14,
                    show: true,
                    formatter: function (params) {
                        let val = formatUSD.format(params.value);
                        let tokenAmount = formatNumber.format(params.data.tokens);
                        return `{c|${params.name}}\n{r|${tokenAmount}}\n{r|${val}}`;
                    },
                    rich: {
                        c: {
                            color: "#999",
                            lineHeight: 22,
                            align: "center",
                        },
                        r: {
                            color: "#999",
                            align: "right",
                        },
                    },
                    color: "rgba(255, 255, 255, 0.5)",
                },
                itemStyle: {
                    normal: {
                        borderColor: "#000",
                    },
                },
                data,
            },
            ],
        });
    }, [enriched]);

    if (!enriched) {
        return null;
    }
    return <ChartWrapper ref={charRef}/>
}