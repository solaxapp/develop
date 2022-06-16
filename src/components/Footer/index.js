import React from "react";
import {CenteredRow, FlexCol, FlexRow} from "../Flex";
import {styled} from "@mui/material/styles";
import FooterLogo from "./../../assets/images/footerLogo.svg"
import FooterLogoDark from "./../../assets/images/footerLogo-d.svg"
import DiscordIcon from "./../../assets/images/discord.svg"
import DiscordIconDark from "./../../assets/images/discord-d.svg"
import TwitterIcon from "./../../assets/images/twiter.svg"
import TwitterIconDark from "./../../assets/images/twiter-d.svg"
import FooterBg from "./../../assets/images/FooterBackground.svg"
import {useTranslation} from "react-i18next";
import {DISCORD_URL, MEDIUM_URL, TWITTER_URL} from "../../constants/other";
import solaXBigLogoBlueCut from "../../assets/images/solaXBigLogoBlueCut.png";
import {useThemeConfig} from "../../context/GlobalProvider";
import MediumIcon from "./../../assets/images/mediumLogo.svg"
import {Text} from "../Text"


const FooterWrapper = styled(FlexCol)(({theme}) => ({
    position: "relative",
    zIndex: 1,
}))

const FooterBackground = styled('img')(({theme}) => ({
    zIndex: 1,
    width: "100%",
    height: "auto"
}))

const Container = styled(FlexRow)(({theme}) => ({
    backgroundColor: theme.palette.primary.main,
    padding: "60px 0px",
    justifyContent: "space-around",
    zIndex: 1,
    [theme.breakpoints.down('md')]: {
        flexWrap: "wrap",
        justifyContent: "center"
    },
}))

const BreakpointsWrapper = styled(FlexRow)(({theme}) => ({
    [theme.breakpoints.down('md')]: {
        flexWrap: "wrap",
        justifyContent: "center"
    },
}))

const Logo = styled('img')(({theme}) => ({
    height: 60,
    width: "auto",
    margin: "0px 20px"
}))

const ResourcesTitle = styled(Text)(({theme}) => ({
    fontSize: 30,
    color: theme.palette.common.purple,
    textTransform: "uppercase"
}))

const ContactTitle = styled(Text)(({theme}) => ({
    fontSize: 30,
    color: theme.palette.common.orange,
    textTransform: "uppercase"
}))

const Wrapper = styled(FlexCol)(({theme}) => ({
    zIndex: 1,
    margin: "0px 20px",
    [theme.breakpoints.down('md')]: {
        flexWrap: "wrap",
        alignItems: "center"
    },
}))

const SocialWrapper = styled(FlexCol)(({theme}) => ({
    fontSize: 30,
    zIndex: 3,
    color: theme.palette.common.lightGreen,
    minWidth: 350,
    justifyContent: "flex-start",
    alignItems: "flex-start",
    [theme.breakpoints.down('md')]: {
        flexWrap: "wrap",
        alignItems: "center",
        minWidth: 0,
    },
}))

const SocialTitle = styled(Text)(({theme}) => ({
    fontSize: 30,
    color: theme.palette.common.lightGreen,
    textTransform: "uppercase"
}))

const ResourcesLink = styled('a')(({theme, green}) => ({
    textDecoration: "unset",
    fontSize: 12,
    color: green === "true" ? theme.palette.common.green : theme.palette.common.white,
    cursor: "pointer",
    ":hover": {
        color: theme.palette.common.purple,
    }
}))

const ContactLink = styled('a')(({theme}) => ({
    textDecoration: "unset",
    fontSize: 12,
    color: theme.palette.common.contactLink,
    cursor: "pointer",
    ":hover": {
        color: theme.palette.common.orange,
    }
}))

const SocialIcon = styled('img')(({theme}) => ({
    height: 30,
    width: "auto",
    cursor: "pointer",
    margin: 10,
}))

const A = styled('a')(() => ({
    cursor: "pointer",
}))

const FloatLogo = styled('img')(({theme}) => ({
    zIndex: 2,
    width: "auto",
    height: "50rem",
    position: "absolute",
    bottom: 0,
    right: 0,
    [theme.breakpoints.down('md')]: {
        display: "none",
    },
}))

const ResourcesLinkText = styled('span')(({theme, green}) => ({
    textDecoration: "unset",
    fontSize: 12,
    color: green === "true" ? theme.palette.common.green : theme.palette.common.white,
    cursor: "pointer",
    ":hover": {
        color: "#BEAFFA",
    }
}))

export default function Footer() {
    const {theme} = useThemeConfig();
    const {t} = useTranslation();
    return (
        <FooterWrapper>
            <Container>
                <BreakpointsWrapper>
                    <Logo src={theme === "light" ? FooterLogoDark : FooterLogo} alt="Sola-x"/>
                    <Wrapper>
                        <ResourcesTitle>{t('common.resources')}</ResourcesTitle>
                        {t('footer.resources', {returnObjects: true}).map((value, index) => FooterLink(value, index))}
                    </Wrapper>
                    <Wrapper>
                        <ContactTitle>{t('common.contact')}</ContactTitle>
                        {t('footer.contact', {returnObjects: true}).map((value, index) => {
                            return (
                                <ContactLink
                                    key={`resourece-item-${index}`}
                                    href={value.link}
                                    rel='noopener noreferrer'
                                    target="_blank">
                                    {value.title}
                                </ContactLink>
                            );
                        })}
                    </Wrapper>
                </BreakpointsWrapper>
                <SocialWrapper>
                    <SocialTitle>{t('common.social')}</SocialTitle>
                    <CenteredRow>
                        <A href={MEDIUM_URL}
                           rel='noopener noreferrer'
                           target="_blank">
                            <SocialIcon
                                src={MediumIcon}
                                alt="medium-icon"/>
                        </A>
                        <A href={DISCORD_URL}
                           rel='noopener noreferrer'
                           target="_blank">
                            <SocialIcon
                                src={theme === "light" ? DiscordIconDark : DiscordIcon}
                                alt="discord-icon"/>
                        </A>
                        <A href={TWITTER_URL}
                           rel='noopener noreferrer'
                           target="_blank">
                            <SocialIcon
                                src={theme === "light" ? TwitterIconDark : TwitterIcon}
                                alt="twitter-icon"/>
                        </A>
                    </CenteredRow>
                </SocialWrapper>
                <FloatLogo src={solaXBigLogoBlueCut} alt="solax-blue-logo"/>
            </Container>
            <FooterBackground
                src={FooterBg}
                alt="footer-background"
            />
        </FooterWrapper>
    );
}

const FooterLink = (item, index) => {
    if (item.link === "" || item.link === "#") {
        return (
            <ResourcesLinkText
                key={`resourece-item-${index}`}
                green={item.isGreen}>
                {item.title}
            </ResourcesLinkText>
        )
    }
    return (<ResourcesLink
        green={item.isGreen}
        key={`resourece-item-${index}`}
        href={item.link}
        rel='noopener noreferrer'
        target={"_blank"}>
        {item.title}
    </ResourcesLink>)
}