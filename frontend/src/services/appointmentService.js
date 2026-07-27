import axios from "../config/axios";

// Lấy danh sách lịch hẹn (có phân trang và filter)
export const getAppointments = (
  page = 0,
  size = 10,
  enterpriseId = "",
  consultantId = "",
  status = ""
) => {
  return axios.get("/appointments", {
    params: {
      page,
      size,
      enterpriseId,
      consultantId,
      status,
    },
  });
};

// Lấy chi tiết lịch hẹn
export const getAppointmentById = (id) => {
  return axios.get(`/appointments/${id}`);
};

// Tạo lịch hẹn mới
export const createAppointment = (data) => {
  return axios.post("/appointments", data);
};

// Cập nhật lịch hẹn
export const updateAppointment = (id, data) => {
  return axios.put(`/appointments/${id}`, data);
};

// Huỷ/Từ chối lịch hẹn
export const cancelAppointment = (id) => {
  return axios.delete(`/appointments/${id}`);
};

// Xác nhận hoàn thành lịch hẹn (dùng multipart/form-data do có upload file)
export const confirmAppointment = (id, formData) => {
  return axios.post(`/appointments/${id}/confirm`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};
