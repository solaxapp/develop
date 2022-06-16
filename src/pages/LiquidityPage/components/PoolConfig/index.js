import {Card, FlexCol, FlexRow} from "../../../../components/Flex";
import {Dialog, IconButton, MenuItem, Select} from "@mui/material";
import React, {useState} from "react";
import {Text} from "../../../../components/Text";
import {ENABLE_FEES_INPUT} from "../../../../helper/ids";
import {CurveType} from "../../../../constants/app";
import {styled} from "@mui/material/styles";
import SettingsIcon from '@mui/icons-material/Settings';
import {useTranslation} from "react-i18next";

const StyledIconButton = styled(IconButton)(({theme}) => ({}))

const Title = styled(Text)(({theme}) => ({
    textAlign: "center",
    marginBottom: 20,
    fontSize: 20
}))

const FeeWrapper = styled(FlexRow)(({theme}) => ({
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 5,
    marginBottom: 5,
    flexWrap: "wrap"
}))

const InputWrapper = styled(FlexRow)(() => ({
    border: "1px solid #434343",
    alignItems: "center",
    padding: "0px 10px"
}))

const StyledInput = styled('input')(({theme}) => ({
    color: theme.palette.common.purple,
    minHeight: 50,
    textAlign: "end",
    fontWeight: "bold",
    background: "#111a2f",
    border: "none",
    outline: "none",
    "& :active": {
        border: "none",
        outline: "none"
    },
    "& :focus": {
        border: "none",
        outline: "none"
    }
}))
export const DEFAULT_DENOMINATOR = 10_000;

export default function PoolConfig({options, setOptions, action}) {
    const {t} = useTranslation();
    const [openDialog, setOpenDialog] = useState(false);
    const {
        tradeFeeNumerator,
        tradeFeeDenominator,
        ownerTradeFeeNumerator,
        ownerTradeFeeDenominator,
        ownerWithdrawFeeNumerator,
        ownerWithdrawFeeDenominator,
    } = options.fees;

    const handleOpenDialog = () => {
        setOpenDialog(true);
    }

    const handleCloseDialog = () => {
        setOpenDialog(false);
    }

    const onCurveTypeChange = (e) => {
        const {value} = e.target
        setOptions({
            ...options,
            curveType: parseInt(value),
        })
    }

    return (
        <>
            <StyledIconButton
                onClick={handleOpenDialog}>
                <SettingsIcon/>
            </StyledIconButton>
            <Dialog
                onClose={handleCloseDialog}
                open={openDialog}>
                <Card style={{
                    minWidth: 450,
                    padding: 30,
                    mixBlendMode: "normal",
                }}>
                    <Title>{t('poolConfig.title')}</Title>
                    {ENABLE_FEES_INPUT &&
                    <FlexCol>
                        <FeeWrapper>
                            <Text>{t('poolConfig.lps')}</Text>
                            <FeeInput
                                numerator={tradeFeeNumerator}
                                denominator={tradeFeeDenominator}
                                set={(numerator, denominator) =>
                                    setOptions({
                                        ...options,
                                        fees: {
                                            ...options.fees,
                                            tradeFeeNumerator: numerator,
                                            tradeFeeDenominator: denominator,
                                        },
                                    })
                                }
                            />
                        </FeeWrapper>
                        <FeeWrapper>
                            <Text>{t('poolConfig.owner')}</Text>
                            <FeeInput
                                numerator={ownerTradeFeeNumerator}
                                denominator={ownerTradeFeeDenominator}
                                set={(numerator, denominator) =>
                                    setOptions({
                                        ...options,
                                        fees: {
                                            ...options.fees,
                                            ownerTradeFeeNumerator: numerator,
                                            ownerTradeFeeDenominator: denominator,
                                        },
                                    })
                                }
                            />
                        </FeeWrapper>
                        <FeeWrapper>
                            <Text>{t('poolConfig.withdraw')}</Text>
                            <FeeInput
                                numerator={ownerWithdrawFeeNumerator}
                                denominator={ownerWithdrawFeeDenominator}
                                set={(numerator, denominator) =>
                                    setOptions({
                                        ...options,
                                        fees: {
                                            ...options.fees,
                                            ownerWithdrawFeeNumerator: numerator,
                                            ownerWithdrawFeeDenominator: denominator,
                                        },
                                    })
                                }
                            />
                        </FeeWrapper>
                    </FlexCol>}
                    <FeeWrapper>
                        <Text>{t('poolConfig.curve')}</Text>
                        <Select
                            defaultValue="0"
                            onChange={onCurveTypeChange}>
                            <MenuItem value={CurveType.ConstantProduct.toString()}>
                                {t('poolConfig.cProduct')}
                            </MenuItem>
                            <MenuItem value={CurveType.ConstantPrice.toString()}>
                                {t('poolConfig.cPrice')}
                            </MenuItem>
                            <MenuItem value={CurveType.ConstantProductWithOffset.toString()}>
                                {t('poolConfig.offsetCProduct')}
                            </MenuItem>
                        </Select>
                    </FeeWrapper>
                    {options.curveType === CurveType.ConstantPrice && (
                        <PriceParameters
                            options={options}
                            setOptions={setOptions}/>
                    )}
                    {action}
                </Card>
            </Dialog>
        </>
    );
}

const FeeInput = (props) => {
    const [value, setValue] = useState(((props.numerator / props.denominator) * 100).toString());

    const onInputChange = (e) => {
        const {value} = e.target
        setValue(value);

        const val = parseFloat(value);
        if (Number.isFinite(val)) {
            const numerator = (val * DEFAULT_DENOMINATOR) / 100;
            props.set(numerator, DEFAULT_DENOMINATOR);
        }
    }

    return (
        <InputWrapper>
            <StyledInput
                type="number"
                value={value}
                onChange={onInputChange}
            />
            %
        </InputWrapper>
    );
};

const PriceParameters = ({options, setOptions}) => {
    const {t} = useTranslation();
    const [value, setValue] = useState("0");

    const onInputChange = (e) => {
        const {value} = e.target
        setValue(value);
        setOptions({
            ...options,
            token_b_price: parseInt(value),
        });
    }

    return (
        <FeeWrapper>
            <Text>{t('poolConfig.tokenBPrice')}</Text>
            <InputWrapper>
                <StyledInput
                    type="number"
                    value={value}
                    onChange={onInputChange}
                />
            </InputWrapper>
        </FeeWrapper>
    );
};