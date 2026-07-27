
import axios from "../config/axios";

// Lấy danh sách các interaction 
export const getInteractions = ({
  page = 0,
  size = 200,
  enterpriseId,
  consultantId,
  type,
  result,
} = {}) => {
  return axios.get("/interactions", {
    params: {
      page,
      size,
      enterpriseId: enterpriseId || undefined,
      consultantId: consultantId || undefined,
      type: type || undefined,
      result: result || undefined,
    },
  });
};

// Lấy toàn bộ interactions bằng cách tự động phân trang (dùng cho export Excel)
export const getAllInteractions = async () => {
  const PAGE_SIZE = 200;
  let page = 0;
  let allItems = [];

  while (true) {
    const res = await getInteractions({ page, size: PAGE_SIZE });

    // Hỗ trợ nhiều dạng response từ BE
    const content =
      res?.data?.data?.content ||
      res?.data?.content ||
      res?.data?.data ||
      res?.data ||
      [];

    if (!Array.isArray(content) || content.length === 0) break;

    allItems = allItems.concat(content);

    // Nếu lấy được ít hơn PAGE_SIZE thì đã hết trang
    if (content.length < PAGE_SIZE) break;

    page += 1;
  }

  return allItems;
};

/**
 * Lấy danh sách doanh nghiệp kèm thống kê tiếp xúc — phân trang phía server.
 * Mỗi phần tử = 1 doanh nghiệp: { enterpriseId, enterpriseName, interactionCount, latestInteractionDate, consultantName }
 */
export const getEnterpriseInteractionSummary = ({ page = 0, size = 10 } = {}) => {
  return axios.get("/interactions/enterprise-summary", {
    params: { page, size },
  });
};


export const getInteractionById = (id) => {
  return axios.get(`/interactions/${id}`);
};

// Tạo mới một interaction
export const createInteraction = (data) => {
  return axios.post("/interactions", data);
};


export const updateInteraction = (id, data) => {
  return axios.put(`/interactions/${id}`, data);
};


export const deleteInteraction = (id) => {
  return axios.delete(`/interactions/${id}`);
};

export const updateInteractionDescription = async (id, description) => {
  return axios.put(`/interactions/${id}`, {
    description,
  });
};

export const getInteractionImageUrl = (path) => {
  if (!path) return null;

  // import.meta.env.DEV là biến tự động của Vite. 
  // Nó sẽ là true khi bạn gõ 'npm run dev', và false khi bạn 'npm run build'
  if (import.meta.env.DEV) {
    return `http://localhost:8080/uploads/${path}`;
  }

  // Trên môi trường Server Production, chỉ cần dùng đường dẫn tương đối.
  // Nginx sẽ tự động hiểu và gắn tên miền https://crmkhdncto.id.vn vào.
  return `/uploads/${path}`;
};