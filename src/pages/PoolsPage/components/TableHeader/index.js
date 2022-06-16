import {TableCell, TableHead, TableRow, TableSortLabel} from "@mui/material";
import {styled} from "@mui/material/styles";

export const StyledTableHead = styled(TableHead)(({theme}) => ({
    "& th":{
        background: "#111a2f",
        boxShadow: "inset 0px 0px 40px #00000029, 0px 0px 20px #00000029",
    }
}))

export function TableHeader(props) {
    const {headCells, order, orderBy, onRequestSort} = props;

    const createSortHandler = (property) => (event) => {
        onRequestSort(event, property);
    };

    return (
        <StyledTableHead>
            <TableRow>
                {headCells.map((headCell) => (
                    <TableCell
                        key={headCell.id}
                        align={headCell.align ? headCell.align : 'left'}
                        padding={headCell.disablePadding ? 'none' : 'normal'}
                        sortDirection={orderBy === headCell.id ? order : false}>
                        <TableSortLabel
                            active={orderBy === headCell.id}
                            direction={orderBy === headCell.id ? order : 'asc'}
                            onClick={createSortHandler(headCell.id)}>
                            {headCell.label}
                        </TableSortLabel>
                    </TableCell>
                ))}
            </TableRow>
        </StyledTableHead>
    );
}
