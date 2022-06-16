import {configureStore} from '@reduxjs/toolkit'
import {useDispatch as useAppDispatch, useSelector as useAppSelector} from 'react-redux';
// import { persistStore, persistReducer } from 'redux-persist';
import {wormholeReducer} from "../../redux/wormhole";
import {tokensReducer} from "../../redux/tokens";
import {poolsReducer} from "../../redux/pools";

const store = configureStore({
    reducer: {
        tokens: tokensReducer,
        pools: poolsReducer,
        wormhole: wormholeReducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
            immutableCheck: false,
        }),
})


// const persistor = persistStore(store);

const {dispatch} = store;

const useSelector = useAppSelector;

const useDispatch = () => useAppDispatch();

export {store, dispatch, useSelector, useDispatch};
