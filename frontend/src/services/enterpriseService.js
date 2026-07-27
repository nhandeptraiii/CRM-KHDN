import axios from "../config/axios";

// Lấy danh sách doanh nghiệp
export const getEnterprises = (
  page = 0,
  size = 10,
  keyword = "",
  status = "",
  region = "",
  type = "",
  consultantId = null
) => {
  return axios.get("/enterprises", {
    params: {
      page,
      size,
      keyword,
      status,
      region,
      type,
      ...(consultantId ? { consultantId } : {}),
    },
  });
};

// Lấy chi tiết doanh nghiệp
export const getEnterpriseById = (id) => {
  return axios.get(`/enterprises/${id}`);
};

// Tạo doanh nghiệp
export const createEnterprise = (data) => {
  return axios.post("/enterprises", data);
};

// Cập nhật doanh nghiệp
export const updateEnterprise = (id, data) => {
  return axios.put(`/enterprises/${id}`, data);
};

// Xóa doanh nghiệp
export const deleteEnterprise = (id) => {
  return axios.delete(`/enterprises/${id}`);
};

//Lấy ngành nghề
export const getIndustries = () => {
  return axios.get("/enterprises/industries");
};

// ===== CONTACT =====

// Lấy danh sách contact theo enterprise
export const getContactsByEnterprise = (enterpriseId) => {
  return axios.get(`/enterprises/${enterpriseId}/contacts`);
};

// Tạo contact
export const createContact = (enterpriseId, data) => {
  return axios.post(`/enterprises/${enterpriseId}/contacts`, data);
};

// Update contact
export const updateContact = (enterpriseId, contactId, data) => {
  return axios.put(
    `/enterprises/${enterpriseId}/contacts/${contactId}`,
    data
  );
};

//Delete contact
export const deleteContact = (enterpriseId, contactId) => {
  return axios.delete(`/enterprises/${enterpriseId}/contacts/${contactId}`);
};

export const importEnterprises = (file) => {
  const formData = new FormData();
  formData.append("file", file);

  return axios.post("/enterprises/import", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const downloadEnterpriseTemplate = () => {
  return axios.get("/enterprises/import/template", {
    responseType: "blob",
  });
};

// export const exportEnterprises = (params) => {
//   return axios.get("/enterprises/export", {
//     params,
//     responseType: "blob",
//   });
// };

export const exportEnterprises = (params) => {
  return axios.get(`/enterprises/export?${params.toString()}`, {
    responseType: "blob",
  });
};

// ===== SERVICE USAGES (CONTRACTS) =====

// 1. Thêm dịch vụ cho doanh nghiệp (Add Service to Enterprise)
export const addServiceToEnterprise = (enterpriseId, data) => {
  return axios.post(`/enterprises/${enterpriseId}/services`, data);
};

// 2. Lấy danh sách dịch vụ (hợp đồng) của doanh nghiệp (Get Service Usages by Enterprise)
export const getServiceUsagesByEnterprise = (enterpriseId, params) => {
  // Có thể truyền thêm params nếu API có hỗ trợ phân trang/filter
  return axios.get(`/enterprises/${enterpriseId}/services`, { params });
};

// 3. Lấy chi tiết một dịch vụ đang sử dụng theo ID (Get Service Usage By ID)
export const getServiceUsageById = (enterpriseId, usageId) => {
  return axios.get(`/enterprises/${enterpriseId}/services/${usageId}`);
};

// 4. Cập nhật thông tin sử dụng dịch vụ (Update Service Usage)
export const updateServiceUsage = (enterpriseId, usageId, data) => {
  return axios.put(`/enterprises/${enterpriseId}/services/${usageId}`, data);
};

// 5. Xóa dịch vụ đang sử dụng (Delete Service Usage - ADMIN ONLY)
export const deleteServiceUsage = (enterpriseId, usageId) => {
  return axios.delete(`/enterprises/${enterpriseId}/services/${usageId}`);
};