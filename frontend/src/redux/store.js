import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import { injectStore } from "../config/axios";

export const store = configureStore({
  reducer: {
    auth: authReducer
  }
});

// inject store vào axios
injectStore(store);