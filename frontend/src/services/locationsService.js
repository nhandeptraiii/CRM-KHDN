import axios from "../config/axios";
export const getClusters = (region) => {
  const params = {};
  if (region) params.region = region;

  return axios.get("/locations/clusters", { params });
};

export const getCommunes = (clusterId) => {
  const params = {};
  if (clusterId) params.clusterId = clusterId;

  return axios.get("/locations/communes", { params });
};

export const searchCommunes = (keyword) => {
  return axios.get("/locations/communes/search", { params: { keyword } });
};