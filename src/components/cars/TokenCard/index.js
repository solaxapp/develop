import React from "react";
import {styled} from "@mui/material/styles";
import {FlexCol, FlexRow} from "../../Flex";
import {Divider, Typography} from "@mui/material";
import {useTranslation} from "react-i18next";
import {Text} from "../../Text";

const Card = styled(FlexRow)(({theme}) => ({
    backgroundColor: theme.palette.common.purple,
    minWidth: 250,
    borderRadius: 20,
    boxShadow: "rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px",
    padding: theme.spacing(3),
    margin: theme.spacing(1),
    '&:hover': {
        boxShadow: "box-shadow: rgba(0, 0, 0) 0px 1px 4px"
    }
}))

const TokenImage = styled('img')(() => ({
    width: 30,
    height: 30,
    marginRight: 5
}))

const BackslashWrapper = styled('span')(() => ({
    padding: "0px 5px"
}))

const StyledDivider = styled(Divider)(({theme}) => ({
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
}))

export default function TokenCard({
                                      percentage = 0, firstTokenImage, secondTokenImage, firstFullTokenName,
                                      secondFullTokenName, firstShortTokenName, secondShortTokenName
                                  }) {
    const {t} = useTranslation();
    return (
        <Card>
            <FlexCol style={{width: "100%"}}>
                <FlexCol style={{width: "100%"}}>
                    <FlexRow style={{width: "100%"}}>
                        <TokenImage src={firstTokenImage} alt={firstFullTokenName}/>
                        <Text>{firstShortTokenName}</Text>
                        <BackslashWrapper>
                            /
                        </BackslashWrapper>
                        <TokenImage src={secondTokenImage} alt={secondFullTokenName}/>
                        <Text>{secondShortTokenName}</Text>
                    </FlexRow>
                    <FlexRow style={{width: "100%"}}>
                        <Text>
                            {firstFullTokenName}
                        </Text>
                        <BackslashWrapper>
                            /
                        </BackslashWrapper>
                        <Text>
                            {secondFullTokenName}
                        </Text>
                    </FlexRow>
                </FlexCol>
                <StyledDivider/>
                <FlexRow style={{width: "100%"}}>
                    <Text>
                        {percentage}%
                    </Text>
                    <Text>
                        {t('common.apy')}
                    </Text>
                </FlexRow>
            </FlexCol>
        </Card>
    );
}