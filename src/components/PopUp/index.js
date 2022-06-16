import {styled} from "@mui/styles";
import {FlexCol, FlexRow} from "../Flex";
import CloseButton from "../buttons/Close";
import {Text} from "../Text"

const Wrapper = styled(FlexCol)(() => ({
    padding: "10px 50px",
    alignItems: "center",
    position: "fixed",
    width: "100%",
    zIndex: 9999999,
    top: 80,
}))

const Container = styled(FlexRow)(() => ({
    padding: "0px 0px 20px 20px",
    maxWidth: 800,
    backgroundColor: "rgb(25, 35, 48,0.5)",
    borderRadius: 10
}))

const DismissContainer = styled(FlexRow)(() => ({
    alignSelf: "flex-start"
}))

const StyledText = styled(Text)(() => ({
    paddingTop: 20,
    paddingRight: 20,
    fontSize: 20,
    color: "white",
}))

export default function PopUp({text, onClose}) {
    return (
        <Wrapper>
            <Container>
                <StyledText>
                    {text}
                </StyledText>
                <DismissContainer>
                    <CloseButton onClose={onClose}/>
                </DismissContainer>
            </Container>
        </Wrapper>
    );
}