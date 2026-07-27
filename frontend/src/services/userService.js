import axios from "../config/axios";

export const getUsers = (
  page = 0,
  size = 10,
  search = "",
  role = "",
  status = ""
) => {
  return axios.get("/users", {
    params: {
      page,
      size,
      search,
      role,
      status,
    },
  });
};

export const getUserById = (id) => {
  return axios.get(`/users/${id}`);
};

export const createUser = (data) => {
  return axios.post("/users", data);
};

export const updateUser = (id, data) => {
  // console.log("data: ", data)
  return axios.put(`/users/${id}`, data);
};

export const deleteUser = (id) => {
  return axios.delete(`/users/${id}`);
};

export const getCurrentUser = () => {
  return axios.get("/users/me");
};

/* =========================================
   CÁC API LIÊN QUAN ĐẾN MẬT KHẨU
========================================= */

// Dành cho mục 2.5: User tự đổi pass của mình
export const updateMyPassword = (data) => {
  // data gồm: { oldPassword, newPassword }
  return axios.put("/users/me/password", data);
};

// Dành cho mục 2.6: Admin reset pass cho user khác
export const resetUserPasswordByAdmin = (id, data) => {
  // data gồm: { newPassword }
  // LƯU Ý: Mình đang đoán URL mục 2.6 của bạn là /users/{id}/reset-password
  // Nếu trong Postman URL của mục 2.6 khác, bạn hãy sửa lại chuỗi này cho khớp nhé!
  return axios.put(`/users/${id}/reset-password`, data);
};
