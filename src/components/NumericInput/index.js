import {Input} from "@mui/material";

export function NumericInput(props){
    const onChange = (e) => {
        const { value } = e.target;
        const reg = /^-?\d*(\.\d*)?$/;
        if (reg.test(value) || value === "" || value === "-") {
            this.props.onChange(value);
        }
    };

    // '.' at the end or only '-' in the input box.
    const onBlur = (event) => {
        const { value, onBlur, onChange } = event;
        let valueTemp = value;
        if (value.charAt(value.length - 1) === "." || value === "-") {
            valueTemp = value.slice(0, -1);
        }
        if (value.startsWith(".") || value.startsWith("-.")) {
            valueTemp = valueTemp.replace(".", "0.");
        }
        onChange(valueTemp.replace(/0*(\d+)/, "$1"));
        if (onBlur) {
            onBlur();
        }
    };

    return (
        <Input
            {...props}
            onChange={onChange}
            onBlur={onBlur}
            maxLength={25}
        />
    );
}