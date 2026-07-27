import { useEffect, useState } from "react";
import {
  getContactsByEnterprise,
  deleteContact,
  getServiceUsagesByEnterprise,
  addServiceToEnterprise,
  updateServiceUsage,
  getEnterpriseById,
} from "../../services/enterpriseService";
import { getServices } from "../../services/servicesService";
import ContactModal from "./ContactModal";
import EnterpriseModal from "./EnterpriseModal";
import "./EnterpriseDetailModal.scss";

import { toast } from "react-toastify";

function EnterpriseDetailModal({
  enterprise,
  industries,
  reloadEnterprises,
  onEnterpriseUpdated,
  close,
}) {
  const [enterpriseInfo, setEnterpriseInfo] = useState(enterprise);
  const [openEnterpriseEdit, setOpenEnterpriseEdit] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [serviceUsages, setServiceUsages] = useState([]);
  const [services, setServices] = useState([]);
  const [loadingUsages, setLoadingUsages] = useState(false);
  const [addingService, setAddingService] = useState(false);
  const [updatingUsageStatus, setUpdatingUsageStatus] = useState(false);
  const [statusPopupUsage, setStatusPopupUsage] = useState(null);
  const [showAddServiceForm, setShowAddServiceForm] = useState(false);
  const [usageKeyword, setUsageKeyword] = useState("");
  const [addServiceForm, setAddServiceForm] = useState({
    viettelServiceId: "",
    contractNumber: "",
    revenue: "",
    quantity: "",
    startDate: "",
    endDate: "",
    status: "ACTIVE",
  });

  const extractListData = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.content)) return payload.content;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.data?.content)) return payload.data.content;
    return [];
  };

  const getServiceName = (item) => item?.serviceName || item?.service_name || "-";
  const getServiceCode = (item) => item?.serviceCode || item?.service_code || "-";

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("vi-VN");
  };

  const usageStatusLabel = (status) => {
    const map = {
      ACTIVE: "Đang hoạt động",
      EXPIRED: "Gia hạn",
      CANCELLED: "Đã hủy",
    };
    return map[status] || status || "-";
  };

  const parseDateOnly = (value) => {
    if (!value) return null;
    const datePart = String(value).slice(0, 10);
    const parts = datePart.split("-");
    if (parts.length !== 3) return null;
    const [year, month, day] = parts.map(Number);
    if (!year || !month || !day) return null;
    const date = new Date(year, month - 1, day);
    if (Number.isNaN(date.getTime())) return null;
    return date;
  };

  const isRenewAllowed = (usage) => {
    const endDate = parseDateOnly(usage?.endDate);
    if (!endDate) return true;
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return todayStart >= endDate;
  };

  const addDays = (dateValue, days) => {
    const base = new Date(dateValue);
    if (Number.isNaN(base.getTime())) {
      return "";
    }
    base.setDate(base.getDate() + days);
    return base.toISOString().slice(0, 10);
  };

  const industryMap = {};
  industries.forEach((i) => (industryMap[i.code] = i.name));

  useEffect(() => {
    setEnterpriseInfo(enterprise);
  }, [enterprise]);

  const fetchContacts = async () => {
    try {
      const res = await getContactsByEnterprise(enterprise.id);
      setContacts(res.data?.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Không tải được danh sách người đại diện");
    }
  };

  const fetchServiceUsages = async () => {
    setLoadingUsages(true);
    try {
      const res = await getServiceUsagesByEnterprise(enterprise.id, {
        page: 0,
        size: 50,
      });
      setServiceUsages(extractListData(res.data));
    } catch (err) {
      console.error(err);
      toast.error("Không tải được thông tin sử dụng dịch vụ");
    } finally {
      setLoadingUsages(false);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await getServices();
      setServices(extractListData(res.data));
    } catch (err) {
      console.error(err);
      toast.error("Không tải được danh sách dịch vụ Viettel");
    }
  };

  const handleDelete = async (contactId) => {
    const confirmDelete = window.confirm("Bạn có chắc muốn xóa người đại diện này?");
    if (!confirmDelete) return;

    try {
      await deleteContact(enterprise.id, contactId);
      toast.success("Xóa người đại diện thành công");

      fetchContacts();
    } catch (err) {
      console.error(err);
      toast.error("Xóa thất bại");
    }
  };

  const handleChangeAddServiceForm = (field, value) => {
    setAddServiceForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddService = async () => {
    if (!addServiceForm.viettelServiceId) {
      toast.error("Vui lòng chọn dịch vụ Viettel");
      return;
    }
    if (!addServiceForm.revenue) {
      toast.error("Vui lòng nhập doanh thu");
      return;
    }
    if (!addServiceForm.startDate) {
      toast.error("Vui lòng chọn ngày bắt đầu");
      return;
    }
    if (addServiceForm.endDate && addServiceForm.endDate < addServiceForm.startDate) {
      toast.error("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu");
      return;
    }

    setAddingService(true);
    try {
      await addServiceToEnterprise(enterprise.id, {
        viettelServiceId: Number(addServiceForm.viettelServiceId),
        contractNumber: addServiceForm.contractNumber.trim(),
        revenue: Number(addServiceForm.revenue),
        quantity: addServiceForm.quantity ? Number(addServiceForm.quantity) : null,
        startDate: addServiceForm.startDate,
        endDate: addServiceForm.endDate || null,
        status: addServiceForm.status,
      });

      toast.success("Thêm dịch vụ cho doanh nghiệp thành công");
      setAddServiceForm((prev) => ({
        ...prev,
        viettelServiceId: "",
        contractNumber: "",
        revenue: "",
        quantity: "",
        startDate: "",
        endDate: "",
      }));
      setShowAddServiceForm(false);
      fetchServiceUsages();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Thêm dịch vụ thất bại");
    } finally {
      setAddingService(false);
    }
  };

  const openStatusPopup = (usage) => {
    setStatusPopupUsage(usage);
  };

  const closeStatusPopup = () => {
    setStatusPopupUsage(null);
  };

  const handleChangeUsageStatus = async (nextStatus) => {
    if (!statusPopupUsage?.id) return;

    if (nextStatus === "EXPIRED" && !isRenewAllowed(statusPopupUsage)) {
      toast.info("Hợp đồng chưa đến kỳ gia hạn");
      return;
    }

    const payload = {
      status: nextStatus,
    };

    if (nextStatus === "EXPIRED") {
      const currentEndDate = statusPopupUsage.endDate || statusPopupUsage.startDate;
      payload.endDate = addDays(currentEndDate, 30);
    }

    setUpdatingUsageStatus(true);
    try {
      await updateServiceUsage(enterprise.id, statusPopupUsage.id, payload);
      toast.success("Cập nhật trạng thái dịch vụ thành công");
      closeStatusPopup();
      fetchServiceUsages();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Cập nhật trạng thái thất bại");
    } finally {
      setUpdatingUsageStatus(false);
    }
  };

  useEffect(() => {
    fetchContacts();
    fetchServiceUsages();
    fetchServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReloadEnterpriseInfo = async () => {
    try {
      const res = await getEnterpriseById(enterprise.id);
      const refreshedEnterprise = res?.data?.data || res?.data;

      if (refreshedEnterprise) {
        setEnterpriseInfo(refreshedEnterprise);
        onEnterpriseUpdated?.(refreshedEnterprise);
      }

      await reloadEnterprises?.();
    } catch (err) {
      console.error(err);
      toast.error("Không tải lại được thông tin doanh nghiệp");
    }
  };

  const filteredServiceUsages = serviceUsages.filter((usage) => {
    const contractNumber = (usage?.contractNumber || "").toLowerCase();
    return contractNumber.includes(usageKeyword.trim().toLowerCase());
  });

  return (
<div className="modal open" onClick={close}>
  <div className="modal-box large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title-row">
          <h3>Chi tiết doanh nghiệp</h3>
          <button type="button" className="modal-close-btn" onClick={close}>
            ×
          </button>
        </div>

        {/* INFO */}
        <div className="info-header">
          <h4>Thông tin doanh nghiệp</h4>
          <button
            type="button"
            className="info-edit-btn"
            onClick={() => setOpenEnterpriseEdit(true)}
          >
            Sửa thông tin
          </button>
        </div>
<div className="info-grid">
  <div className="info-item">
    <span className="label">Tên</span>
    <span className="value">{enterpriseInfo?.name}</span>
  </div>

  <div className="info-item">
    <span className="label">MST</span>
    <span className="value">{enterpriseInfo?.taxCode}</span>
  </div>

  <div className="info-item">
    <span className="label">Cơ quan thuế</span>
    <span className="value">{enterpriseInfo?.taxAuthority || "-"}</span>
  </div>

  <div className="info-item">
    <span className="label">Cụm / Xã</span>
    <span className="value">{enterpriseInfo?.communeName || enterpriseInfo?.region || "-"}</span>
  </div>

  <div className="info-item">
    <span className="label">Loại DN</span>
    <span className="value">{enterpriseInfo?.type}</span>
  </div>

  <div className="info-item">
    <span className="label">Ngành</span>
    <span className="value">
      {industryMap[enterpriseInfo?.industry] || "-"}
    </span>
  </div>

  <div className="info-item">
    <span className="label">Nhân sự</span>
    <span className="value">{enterpriseInfo?.employeeCount}</span>
  </div>

  <div className="info-item">
    <span className="label">Phone</span>
    <span className="value">{enterpriseInfo?.phone}</span>
  </div>

  <div className="info-item">
    <span className="label">Website</span>
    <span className="value">{enterpriseInfo?.website}</span>
  </div>

  <div className="info-item">
    <span className="label">Email</span>
    <span className="value">{enterpriseInfo?.email || "-"}</span>
  </div>

  <div className="info-item">
    <span className="label">Ngày thành lập</span>
    <span className="value">{enterpriseInfo?.establishedDate || "-"}</span>
  </div>

  <div className="info-item full">
    <span className="label">Nhân viên phụ trách (AM)</span>
    <span className="value">
      {enterpriseInfo?.amName ? `${enterpriseInfo.amName} - ${enterpriseInfo.amPhone || ''}` : "Chưa có AM"}
    </span>
  </div>

  {(enterpriseInfo?.type === 'VNR20K' || enterpriseInfo?.type === 'VNR2000') && (
    <div className="info-item full">
      <span className="label">Nhân viên dự án phụ trách</span>
      <span className="value">
        {enterpriseInfo?.consultantName ? `${enterpriseInfo.consultantName} - ${enterpriseInfo.consultantPhone || ''}` : "Chưa có Consultant"}
      </span>
    </div>
  )}
</div>

        {/* CONTACT */}
        <div className="contact-header">
          <h4>Người đại diện</h4>
          <button
            onClick={() => {
              setEditingContact(null);
              setOpenForm(true);
            }}
          >
            + Thêm
          </button>
        </div>

        <table className="contact-table">
          <thead>
            <tr>
              <th>Tên</th>
              <th>Chức vụ</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Liên hệ chính</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c.id}>
                <td>{c.fullName}</td>
                <td>{c.position}</td>
                <td>{c.email}</td>
                <td>{c.phone}</td>
                 <td>
          {c.isPrimary ? (
            <span className="primary-badge">
              Chính
            </span>
          ) : (
            <span className="secondary-badge">
              Phụ
            </span>
          )}
        </td>
                <td>
                  <div className="action-btns">
                    <button
                      className="edit-btn"
                      onClick={() => {
                        setEditingContact(c);
                        setOpenForm(true);
                      }}
                    >
                      Sửa
                    </button>

                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(c.id)}
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {contacts.length === 0 && (
              <tr>
                <td colSpan="5" className="empty-cell">Doanh nghiệp chưa có người đại diện</td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="usage-section">
          <div className="usage-title-row">
            <h4>Thông tin sử dụng dịch vụ Viettel</h4>
          </div>

          <div className="usage-header">
            <input
              type="text"
              className="usage-search-input"
              placeholder="Tìm theo số hợp đồng..."
              value={usageKeyword}
              onChange={(e) => setUsageKeyword(e.target.value)}
            />
            <button
              type="button"
              className="toggle-add-usage-btn"
              onClick={() => setShowAddServiceForm((prev) => !prev)}
            >
              + Thêm dịch vụ
            </button>
          </div>

          <table className="usage-table">
            <thead>
              <tr>
                <th>Dịch vụ</th>
                <th>Mã DV</th>
                <th>Số hợp đồng</th>
                <th>Doanh thu</th>
                <th>Số lượng</th>
                <th>Ngày bắt đầu</th>
                <th>Ngày kết thúc</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {filteredServiceUsages.map((usage) => (
                <tr key={usage.id}>
                  <td>{usage.serviceName || "-"}</td>
                  <td>{usage.serviceCode || "-"}</td>
                  <td>{usage.contractNumber || "-"}</td>
                  <td>{usage.revenue ? Number(usage.revenue).toLocaleString('vi-VN') + ' VNĐ' : "-"}</td>
                  <td>{usage.quantity || "-"}</td>
                  <td>{formatDate(usage.startDate)}</td>
                  <td>{formatDate(usage.endDate)}</td>
                  <td>
                    <button
                      type="button"
                      className={`usage-status ${(usage.status || "").toLowerCase()}`}
                      onClick={() => openStatusPopup(usage)}
                    >
                      {usageStatusLabel(usage.status)}
                    </button>
                  </td>
                </tr>
              ))}

              {!loadingUsages && filteredServiceUsages.length === 0 && (
                <tr>
                  <td colSpan="8" className="empty-cell">
                    {serviceUsages.length === 0
                      ? "Chưa có bản ghi sử dụng dịch vụ"
                      : "Không tìm thấy số hợp đồng phù hợp"}
                  </td>
                </tr>
              )}

              {loadingUsages && (
                <tr>
                  <td colSpan="8" className="empty-cell">
                    Đang tải dữ liệu dịch vụ...
                  </td>
                </tr>
              )}
            </tbody>
          </table>

        </div>

        {showAddServiceForm && (
          <div className="usage-popup-backdrop" onClick={() => setShowAddServiceForm(false)}>
            <div className="add-usage-popup" onClick={(e) => e.stopPropagation()}>
              <div className="popup-title-row">
                <h5>Thêm dịch vụ</h5>
                <button
                  type="button"
                  className="popup-close-btn"
                  onClick={() => setShowAddServiceForm(false)}
                >
                  ×
                </button>
              </div>

              <div className="add-usage-grid">
                <div className="field">
                  <label>Dịch vụ Viettel</label>
                  <select
                    value={addServiceForm.viettelServiceId}
                    onChange={(e) => handleChangeAddServiceForm("viettelServiceId", e.target.value)}
                  >
                    <option value="">Chọn dịch vụ</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {getServiceCode(service)} - {getServiceName(service)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Số hợp đồng</label>
                  <input
                    type="text"
                    value={addServiceForm.contractNumber}
                    onChange={(e) => handleChangeAddServiceForm("contractNumber", e.target.value)}
                    placeholder="Ví dụ: HD12345/V-CA"
                  />
                </div>

                <div className="field">
                  <label>Doanh thu (*)</label>
                  <input
                    type="number"
                    value={addServiceForm.revenue}
                    onChange={(e) => handleChangeAddServiceForm("revenue", e.target.value)}
                    placeholder="Nhập doanh thu (VNĐ)"
                  />
                </div>

                <div className="field">
                  <label>Số lượng</label>
                  <input
                    type="number"
                    value={addServiceForm.quantity}
                    onChange={(e) => handleChangeAddServiceForm("quantity", e.target.value)}
                    placeholder="Nhập số lượng"
                  />
                </div>

                <div className="field">
                  <label>Ngày bắt đầu</label>
                  <input
                    type="date"
                    value={addServiceForm.startDate}
                    onChange={(e) => handleChangeAddServiceForm("startDate", e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>Trạng thái</label>
                  <select
                    value={addServiceForm.status}
                    onChange={(e) => handleChangeAddServiceForm("status", e.target.value)}
                  >
                    <option value="ACTIVE">Đang hoạt động</option>
                    <option value="EXPIRED">Gia hạn</option>
                    <option value="CANCELLED">Hủy</option>
                  </select>
                </div>

                <div className="field">
                  <label>Ngày kết thúc</label>
                  <input
                    type="date"
                    value={addServiceForm.endDate}
                    onChange={(e) => handleChangeAddServiceForm("endDate", e.target.value)}
                  />
                </div>
              </div>

              <div className="add-usage-actions">
                <button
                  type="button"
                  onClick={() => setShowAddServiceForm(false)}
                  className="add-usage-close-btn"
                  disabled={addingService}
                >
                  Đóng
                </button>
                <button
                  type="button"
                  className="add-usage-btn"
                  onClick={handleAddService}
                  disabled={addingService}
                >
                  {addingService ? "Đang thêm..." : "+ Thêm dịch vụ"}
                </button>
              </div>
            </div>
          </div>
        )}

        {statusPopupUsage && (
          <div className="usage-popup-backdrop" onClick={closeStatusPopup}>
            <div className="usage-popup" onClick={(e) => e.stopPropagation()}>
              <div className="popup-title-row">
                <h5>Cập nhật trạng thái dịch vụ</h5>
                <button type="button" className="popup-close-btn" onClick={closeStatusPopup}>
                  ×
                </button>
              </div>
              <p>
                <b>{statusPopupUsage.serviceName || "Dịch vụ"}</b>
              </p>

              <div className="usage-popup-actions">
                <button
                  type="button"
                  className="btn-active"
                  disabled={updatingUsageStatus}
                  onClick={() => handleChangeUsageStatus("ACTIVE")}
                >
                  Đang hoạt động
                </button>

                <button
                  type="button"
                  className="btn-renew"
                  disabled={updatingUsageStatus}
                  onClick={() => handleChangeUsageStatus("EXPIRED")}
                >
                  Gia hạn
                </button>

                <button
                  type="button"
                  className="btn-cancel"
                  disabled={updatingUsageStatus}
                  onClick={() => handleChangeUsageStatus("CANCELLED")}
                >
                  Hủy
                </button>
              </div>

              <div className="usage-popup-footer">
                <button type="button" onClick={closeStatusPopup} disabled={updatingUsageStatus}>
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {openForm && (
          <ContactModal
            enterpriseId={enterprise.id}
            contact={editingContact}
            close={() => setOpenForm(false)}
            reload={fetchContacts}
          />
        )}

        {openEnterpriseEdit && (
          <EnterpriseModal
            enterprise={enterpriseInfo}
            close={() => setOpenEnterpriseEdit(false)}
            reload={async () => {
              await handleReloadEnterpriseInfo();
              setOpenEnterpriseEdit(false);
            }}
          />
        )}

        <div className="modal-actions">
          <button onClick={close}>Đóng</button>
        </div>
      </div>
    </div>
  );
}

export default EnterpriseDetailModal;