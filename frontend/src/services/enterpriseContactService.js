
import axios from "../config/axios";


const extractListFromResponse = (res) => {

  if (Array.isArray(res?.data?.data?.content)) return res.data.data.content;
  if (Array.isArray(res?.data?.content)) return res.data.content;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.data)) return res.data;
  return [];
};


const normalizeContact = (item) => {
  if (!item || typeof item !== "object") return null;

  const id = item.id ?? item.contactId ?? item.contact_id ?? null;
  const fullName = item.fullName ?? item.full_name ?? item.contactName ?? item.contact_name ?? "";

  return {
    ...item,
    id,
    fullName,
    
    position: item.position ?? item.contactPosition ?? item.contact_position ?? "",
  };
};


const extractItemFromResponse = (res) => {
  if (res?.data?.data) return res.data.data;
  return res?.data;
};

// Lấy danh sách contact theo enterpriseId
export const getContactsByEnterprise = async (enterpriseId) => {
  const res = await axios.get(`/enterprises/${enterpriseId}/contacts`);
  return extractListFromResponse(res)
    .map(normalizeContact)
    // Lọc bỏ contact không hợp lệ
    .filter((contact) => contact && contact.id !== null && contact.id !== undefined);
};


export const createContact = async (enterpriseId, contactData) => {
  const res = await axios.post(`/enterprises/${enterpriseId}/contacts`, contactData);
  return normalizeContact(extractItemFromResponse(res));
};

