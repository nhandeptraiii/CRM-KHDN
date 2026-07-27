import axiosClient from "../config/axios";

export const getDashboardMetrics = (month, year) => {
    return axiosClient.get("/dashboard", {
        params: { month, year },
    });
};

