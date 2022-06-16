export const colorWarning = (value = 0, valueCheckpoints = [1, 3, 5, 100]) => {
    const defaultIndex = 1;
    const colorCodes = ["#27ae60", "inherit", "#f3841e", "#ff3945"];
    if (value > valueCheckpoints[valueCheckpoints.length - 1]) {
        return colorCodes[defaultIndex];
    }
    const closest = [...valueCheckpoints].sort((a, b) => {
        const first = a - value < 0 ? Number.POSITIVE_INFINITY : a - value;
        const second = b - value < 0 ? Number.POSITIVE_INFINITY : b - value;
        if (first < second) {
            return -1;
        } else if (first > second) {
            return 1;
        }
        return 0;
    })[0];
    const index = valueCheckpoints.indexOf(closest);
    if (index !== -1) {
        return colorCodes[index];
    }
    return colorCodes[defaultIndex];
};

export function nFormatter(num, digits) {
    const lookup = [
        {value: 1, symbol: ""},
        {value: 1e3, symbol: "k"},
        {value: 1e6, symbol: "M"},
        {value: 1e9, symbol: "G"},
        {value: 1e12, symbol: "T"},
        {value: 1e15, symbol: "P"},
        {value: 1e18, symbol: "E"}
    ];
    const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
    let item = lookup.slice().reverse().find(function (item) {
        return num >= item.value;
    });
    return item ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol : "0";
}