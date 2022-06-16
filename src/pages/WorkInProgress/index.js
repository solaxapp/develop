import React from "react";
import {styled} from "@mui/material/styles";
import solaX from "../../assets/images/solaX.png";
import {keyframes, Typography} from "@mui/material";
import {PageContainer} from "../../components/Flex";
import {Text} from "../../components/Text";

const StyledPageContainer = styled(PageContainer)(() => ({
    justifyContent: "center",
    alignItems: "center"
}))

const Image = styled('img')(() => ({
    position: "relative",
    width: "100%",
    maxWidth: 600,
    animation: `${moveSlideshow} 2s infinite`,
    animationDirection: "alternate"
}))

const moveSlideshow = keyframes`
    from { 
        top: 0px;
         -webkit-animation-timing-function: ease-in;
    }
    to { 
        top: 100px;
        -webkit-animation-timing-function: ease-out;
    }
`;

export default function WorkInProgress() {
    return (
        <StyledPageContainer>
            <Image src={solaX}/>
            <Text style={{
                fontSize: 30,
                paddingBottom: 100
            }}>Work in progress</Text>
        </StyledPageContainer>
    );
}