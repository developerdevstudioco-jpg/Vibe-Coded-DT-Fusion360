// src/app/store.js
import { configureStore } from '@reduxjs/toolkit';
import { mainSliceReducer } from "./slices/mainslice.js"

export const store = configureStore({
  reducer: {
    mainSliceReducer
  }
});