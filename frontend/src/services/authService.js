import axiosClient from "../config/axios";

export const loginApi = (data) => {
  // console.log("data: ", data)
  return axiosClient.post("/login", data);
};
export const getMeApi = () => {
  return axiosClient.get("/users/me");
};
export const logoutApi = () => {
  return axiosClient.post("/logout");
};