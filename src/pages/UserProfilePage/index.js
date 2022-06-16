import React, {useEffect, useState} from "react";
import {styled} from "@mui/material/styles";
import {CenteredCol, CenteredRow, FlexCol, PageContainer, PageTitle} from "../../components/Flex";
import {useTranslation} from "react-i18next";
import {useOwnedPools} from "../../helper/crypto/Pools";
import PoolItem from "./components/PoolItem";
import {useConnection, useWallet} from "@solana/wallet-adapter-react";
import {getParsedProgramAccounts} from "../../helper/solana";
import NoContents from "../../components/NoContents";
import {ROUTES} from "../../constants/routes";
import TokenItems from "./components/TokenItems";
import {Text} from "../../components/Text"

const Wrapper = styled(CenteredCol)(({theme}) => ({
    marginTop: 100,
    marginBottom: 350,
    [theme.breakpoints.down('md')]: {
        marginBottom: 200,
    },
    [theme.breakpoints.down('sm')]: {
        marginBottom: 100,
    },
}))

const SubTitle = styled(Text)(({theme}) => ({
    fontSize: 30,
    color: theme.palette.common.white,
    fontWeight: "bold"
}))

const Card = styled(FlexCol)(({theme}) => ({
    padding: 50,
    width: "100%"
}))

const PoolsWrapper = styled(CenteredRow)(({theme}) => ({
    flexWrap: "wrap"
}))

export default function UserProfilePage() {
    const {publicKey} = useWallet();
    const {connection} = useConnection();
    const {t} = useTranslation();
    const pools = useOwnedPools();
    const [walletTokens, setWalletTokens] = useState([]);
    const [loadingTokens, setLoadingTokens] = useState(true);

    useEffect(() => {
        setLoadingTokens(true);
        getParsedProgramAccounts(connection, publicKey).then(value => {
            setWalletTokens(value)
            setLoadingTokens(false);
        })
    }, [publicKey, connection]);

    return (
        <PageContainer>
            <Wrapper>
                <PageTitle>{t('userProfilePage.title')}</PageTitle>
                <Card>
                    <SubTitle>Pools</SubTitle>
                    <PoolsWrapper>
                        {pools && pools.length > 0 ?
                            (pools.map((pool, index) => {
                                    return (
                                        <PoolItem
                                            key={`pool-${index}`}
                                            item={pool}
                                        />
                                    )
                                }
                            ))
                            : <NoContents
                                link={ROUTES.POOLS_ROUTE}
                                linkText={t('userProfilePage.poolLinkText')}
                                text={t('userProfilePage.noPools')}/>
                        }
                    </PoolsWrapper>
                </Card>
                <Card>
                    <SubTitle>Tokens</SubTitle>
                    {walletTokens && walletTokens.length > 0 ?
                        <TokenItems
                            tokens={walletTokens}
                            loading={loadingTokens}/>
                        : <NoContents
                            text={t('userProfilePage.noTokens')}/>
                    }
                </Card>
            </Wrapper>
        </PageContainer>
    );
}