import {FlexCol, PageContainer, PageTitle, SwapWrapper} from "../../components/Flex";
import React from "react";
import {useTranslation} from "react-i18next";
import {styled} from "@mui/material/styles";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import {TableHeader} from "./components/TableHeader";
import {nFormatter} from "../../helper/other";
import {CircularProgress} from "@mui/material";
import {getPoolName} from "../../helper/token";
import {useAllTokensContext} from "../../context/TokensProvider";
import {useAllPoolsContext} from "../../context/PoolsProvider";

export const Wrapper = styled(SwapWrapper)(({theme}) => ({
    marginTop: 100,
    padding: "0 250px",
    marginBottom: 250,
    zIndex: 1,
    [theme.breakpoints.down('md')]: {
        marginBottom: 200,
        padding: "0 100px",
    },
    [theme.breakpoints.down('sm')]: {
        marginBottom: 100,
        padding: "0 0",
    },
}))

export const Card = styled(FlexCol)(({theme}) => ({
    width: "100%",
    backgroundColor: theme.palette.primary.main,
    padding: 50,
    background: "#131E34 0% 0% no-repeat padding-box",
    boxShadow: "inset 0px 0px 40px #00000029, 0px 0px 20px #00000029",
    mixBlendMode: "darken",
    borderRadius: 6,
    [theme.breakpoints.down('md')]: {
        padding: "30px 30px",
    },
    [theme.breakpoints.down('sm')]: {
        padding: "20px 10px",
    },
}))

export const StyledCircularProgress = styled(CircularProgress)(({theme}) => ({
    color: theme.palette.common.white
}))

export const StyledTableContainer = styled(TableContainer)(({theme}) => ({
    width: "100%",
    maxHeight: "30rem",
    overflowY: "auto",
    overflowX: "auto",
    "::-webkit-scrollbar-track": {
        boxShadow: "inset 0 0 6px rgba(0,0,0,0.3)",
        backgroundColor: "#F5F5F5",
    },
    "::-webkit-scrollbar": {
        width: 10,
        backgroundColor: "#F5F5F5",
    },
    "::-webkit-scrollbar-thumb": {
        backgroundImage: "-webkit-gradient(linear,left bottom,left top,color-stop(0.30,#00c1bc),color-stop(0.50, #ff9999),color-stop(0.70,#a59be1))"
    }
}))

const columns = (t) => [
    {
        id: 'name',
        label: t('common.pools'),
        align: 'center',
        minWidth: 200
    },
    {
        id: 'liquidity',
        label: t('common.liquidity'),
        align: 'center',
        minWidth: 200,
        format: (value) => {
            return `$${nFormatter(value, 2)}`
        },
    },
    {
        id: 'volume30d',
        label: t('poolsPage.volume30'),
        minWidth: 200,
        align: 'center',
        format: (value) => {
            return `$${nFormatter(value, 2)}`
        },
    },
    {
        id: 'fee30d',
        label: t('poolsPage.fees30'),
        minWidth: 200,
        align: 'center',
        format: (value) => {
            return `$${nFormatter(value, 2)}`
        },
    },
    {
        id: 'apr30d',
        label: t('poolsPage.apr30'),
        minWidth: 200,
        align: 'center',
        format: (value) => `${value.toFixed(2)}%`,
    },
];

function descendingComparator(a, b, orderBy) {
    if (b[orderBy] < a[orderBy]) {
        return -1;
    }
    if (b[orderBy] > a[orderBy]) {
        return 1;
    }
    return 0;
}

function getComparator(order, orderBy) {
    return order === 'desc'
        ? (a, b) => descendingComparator(a, b, orderBy)
        : (a, b) => -descendingComparator(a, b, orderBy);
}

// This method is created for cross-browser compatibility, if you don't
// need to support IE11, you can use Array.prototype.sort() directly
function stableSort(array, comparator) {
    const stabilizedThis = array.map((el, index) => [el, index]);
    stabilizedThis.sort((a, b) => {
        const order = comparator(a[0], b[0]);
        if (order !== 0) {
            return order;
        }
        return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
}

export default function PoolsPage() {
    const {t} = useTranslation();
    const {pools, loading} = useAllPoolsContext();
    const {tokenMap} = useAllTokensContext();

    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);
    const [order, setOrder] = React.useState('asc');
    const [orderBy, setOrderBy] = React.useState('calories');
    let parsed = pools.map(item => {
        const name = getPoolName(tokenMap, item)
        return ({
            name: name,
            liquidity: 0,
            volume30d: 0,
            apr30d: 0,
            fee30d: 0
        });
    })

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };

    const handleRequestSort = (event, property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    return (
        <PageContainer>
            <Wrapper>
                <PageTitle>{t('poolsPage.title')}</PageTitle>
                <Card>
                    <StyledTableContainer>
                        <Table stickyHeader aria-label="sticky table">
                            <TableHeader
                                headCells={columns(t)}
                                order={order}
                                orderBy={orderBy}
                                onRequestSort={handleRequestSort}
                                rowCount={parsed.length}/>
                            <TableBody>
                                {loading ?
                                    <TableRow style={{
                                        height: 100
                                    }}>
                                        <TableCell colSpan={5} style={{
                                            textAlign: "center",
                                        }}>
                                            <StyledCircularProgress/>
                                        </TableCell>
                                    </TableRow> :
                                    (stableSort(parsed, getComparator(order, orderBy))
                                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                        .map((row, index) => {
                                            return (
                                                <TableRow
                                                    hover
                                                    role="checkbox"
                                                    tabIndex={-1}
                                                    key={`table-row-${index}`}>
                                                    {columns(t).map((column) => {
                                                        const value = row[column.id];
                                                        return (
                                                            <TableCell
                                                                key={column.id}
                                                                align={column.align}>
                                                                {column.format && typeof value === 'number'
                                                                    ? column.format(value)
                                                                    : value}
                                                            </TableCell>
                                                        );
                                                    })}
                                                </TableRow>
                                            )
                                        }))}
                            </TableBody>
                        </Table>
                    </StyledTableContainer>
                    <TablePagination
                        rowsPerPageOptions={[10, 25, 100]}
                        component="div"
                        count={parsed.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </Card>
            </Wrapper>
        </PageContainer>
    )
}