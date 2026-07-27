// AppointmentModal.jsx
import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import DatePicker from "react-datepicker";
import dayjs from "dayjs";
import "react-datepicker/dist/react-datepicker.css";
import "./AppointmentModal.scss";
import {
  createAppointment,
  updateAppointment,
} from "../../services/appointmentService";
import {
  getContactsByEnterprise,
  createContact,
  getEnterprises,
  getEnterpriseById,
} from "../../services/enterpriseService";

function AppointmentModal({ appointment, close, reload }) {
  const [form, setForm] = useState({
    enterpriseId: appointment?.enterpriseId || "",
    contactId: appointment?.contactId || "",
    appointmentType: appointment?.appointmentType || "ONLINE_MEETING",
    scheduledTime: appointment?.scheduledTime || "",
    location: appointment?.location || "",
    purpose: appointment?.purpose || "",
  });

  const [contacts, setContacts] = useState([]);
  const [showCreateContactForm, setShowCreateContactForm] = useState(false);
  const [creatingContact, setCreatingContact] = useState(false);
  const [contactForm, setContactForm] = useState({
    fullName: "",
    position: "",
    email: "",
    phone: "",
    isPrimary: false,
  });
  const [createContactErrors, setCreateContactErrors] = useState({});

  const [enterpriseOptions, setEnterpriseOptions] = useState([]);
  const [loadingEnterprise, setLoadingEnterprise] = useState(false);
  const [page, setPage] = useState(0);

  const [openEnterpriseDropdown, setOpenEnterpriseDropdown] = useState(false);
  const [searchEnterprise, setSearchEnterprise] = useState("");

  const [selectedEnterpriseObj, setSelectedEnterpriseObj] = useState(null);

  const [inputValue, setInputValue] = useState("");

  const enterpriseDropdownRef = useRef(null);
  const cacheRef = useRef({});


  // Handle datetime conversion for backend requirement format (dd/MM/yyyy HH:mm)
  // Input type datetime-local has format "YYYY-MM-DDThh:mm"
const parseInitDateTime = (str) => {
  if (!str) return null;

  const [date, time] = str.split(" ");
  if (!date || !time) return null;

  const [day, month, year] = date.split("/");

  return new Date(`${year}-${month}-${day}T${time}`);
};


const [dtLocal, setDtLocal] = useState(
  parseInitDateTime(appointment?.scheduledTime)
);
<DatePicker
  selected={dtLocal}
  onChange={(date) => {
    setDtLocal(date);

    if (date) {
      const formatted = dayjs(date).format("DD/MM/YYYY HH:mm");
      handleChange("scheduledTime", formatted);
    } else {
      handleChange("scheduledTime", "");
    }
  }}
  showTimeSelect
  showTimeSelectOnly={false}
  timeFormat="HH:mm"
  timeIntervals={15}
  dateFormat="dd/MM/yyyy HH:mm"
  placeholderText="Chọn thời gian"
  className="input"
  inline
/>

  useEffect(() => {
    const fetchContacts = async () => {
      if (!form.enterpriseId) {
        setContacts([]);
        return;
      }

      try {
        const res = await getContactsByEnterprise(form.enterpriseId);
        const list = res.data?.data || res.data || [];
        setContacts(list);

        // Không hiện warning nếu chưa có người liên hệ
      } catch (err) {
        console.error(err);
        setContacts([]);
      }
    };

    fetchContacts();
  }, [form.enterpriseId]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      const run = async () => {
        const keyword = searchEnterprise.trim().toLowerCase();

        if (keyword.length < 2) {
          setEnterpriseOptions([]);
          return;
        }

        if (cacheRef.current[keyword]) {
          setEnterpriseOptions(cacheRef.current[keyword]);
          return;
        }

        setLoadingEnterprise(true);

        try {
          const res = await getEnterprises(
            0,
            10,
            keyword,
            "",
            "",
            ""
          );

          const data = res.data?.data?.content || [];
          setEnterpriseOptions(data);

          cacheRef.current[keyword] = data;
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingEnterprise(false);
        }
      };

      run();
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchEnterprise]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        enterpriseDropdownRef.current &&
        !enterpriseDropdownRef.current.contains(event.target)
      ) {
        setOpenEnterpriseDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const loadSelectedEnterprise = async () => {
      if (!appointment?.enterpriseId) return;

      try {
        const res = await getEnterpriseById(appointment.enterpriseId);

        const enterprise = res.data?.data || res.data;

        if (enterprise) {
          setSelectedEnterpriseObj(enterprise);
          setInputValue(enterprise.name);
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadSelectedEnterprise();
  }, [appointment]);

  const handleLoadMore = async () => {
    if (loadingEnterprise) return;

    const nextPage = page + 1;
    const keyword = searchEnterprise.trim().toLowerCase();

    const res = await getEnterprises(
      nextPage,
      10,
      keyword,
      "",
      "",
      ""
    );

    const newData = res.data?.data?.content || [];

    setEnterpriseOptions((prev) => {
      const combined = [...prev, ...newData];

      return Array.from(
        new Map(combined.map((item) => [item.id, item])).values()
      );
    });

    setPage(nextPage);
  };



  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const validateContactForm = () => {
    const nextErrors = {};

    if (!contactForm.fullName.trim()) {
      nextErrors.fullName = "Vui lòng nhập họ tên người liên hệ";
    }

    if (!contactForm.position.trim()) {
      nextErrors.position = "Vui lòng nhập chức vụ";
    }

    if (!contactForm.phone.trim()) {
      nextErrors.phone = "Vui lòng nhập số điện thoại";
    }

    if (
      contactForm.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactForm.email.trim())
    ) {
      nextErrors.email = "Email không đúng định dạng";
    }

    if (
      contactForm.phone.trim() &&
      !/^[0-9+\s-]{8,20}$/.test(contactForm.phone.trim())
    ) {
      nextErrors.phone = "Số điện thoại không hợp lệ";
    }

    setCreateContactErrors(nextErrors);

    return {
      isValid: Object.keys(nextErrors).length === 0,
      nextErrors,
    };
  };

  const handleCreateContact = async () => {
    if (!form.enterpriseId) {
      toast.error("Vui lòng chọn doanh nghiệp trước khi tạo người liên hệ");
      return;
    }

    const { isValid, nextErrors } = validateContactForm();

    if (!isValid) {
      // show 1 số lỗi chính
      if (nextErrors.fullName) toast.error(nextErrors.fullName);
      else if (nextErrors.phone) toast.error(nextErrors.phone);
      else if (nextErrors.position) toast.error(nextErrors.position);

      return;
    }

    try {
      setCreatingContact(true);

      const payload = {
        fullName: contactForm.fullName.trim(),
        position: contactForm.position.trim(),
        email: contactForm.email.trim(),
        phone: contactForm.phone.trim(),
        isPrimary: contactForm.isPrimary,
      };

      const created = await createContact(form.enterpriseId, payload);

      const res = await getContactsByEnterprise(form.enterpriseId);
      const list = res.data?.data || res.data || [];
      setContacts(list);

      const createdId = created?.id;
      if (createdId) {
        setForm((prev) => ({
          ...prev,
          contactId: createdId,
        }));
      }

      // reset
      setContactForm({
        fullName: "",
        position: "",
        email: "",
        phone: "",
        isPrimary: false,
      });

      setCreateContactErrors({});
      setShowCreateContactForm(false);

      toast.success("Tạo người liên hệ thành công");
    } catch (err) {
      console.error(err);

      const res = err?.response?.data;

      // ✅ Nếu BE trả validation dạng array
      if (Array.isArray(res?.message)) {
        // map lỗi vào UI (input đỏ + text dưới)
        const backendErrors = {};
        res.message.forEach((e) => {
          if (e?.field) {
            backendErrors[e.field] = e.message;
          }
        });

        setCreateContactErrors(backendErrors);

        // show toast list lỗi
        toast.error(
          <div style={{ maxHeight: 250, overflowY: "auto" }}>
            {res.message.map((e, i) => (
              <div key={i}>
                {e.message}
              </div>
            ))}
          </div>,
          {
            autoClose: false,
            closeButton: true,
          }
        );
      } else {
        toast.error(res?.message || "Có lỗi xảy ra");
      }
    } finally {
      setCreatingContact(false);
    }
  };


  
  const handleSubmit = async () => {
    if (!form.enterpriseId || !form.appointmentType || !form.scheduledTime) {
      toast.warning("Vui lòng điền đủ thông tin bắt buộc!");
      return;
    }

    try {
      if (appointment?.id) {
        await updateAppointment(appointment.id, form);
        toast.success("Cập nhật lịch hẹn thành công!");
      } else {
        await createAppointment(form);
        toast.success("Tạo lịch hẹn thành công!");
      }
      reload();
      close();
    } catch (err) {
      console.error(err);

      const res = err?.response?.data;

      // Nếu là validation error dạng array
      if (Array.isArray(res?.message)) {
        toast.error(
          <div style={{ maxHeight: 250, overflowY: "auto" }}>
            {res.message.map((e, i) => (
              <div key={i}>
                {e.message}
              </div>
            ))}
          </div>,
          {
            autoClose: false,
            closeButton: true,
          }
        );
      } else {
        // fallback lỗi thường
        toast.error(res?.message || "Có lỗi xảy ra");
      }
    }
  };

  return (
    <div className="modal open">
      <div className="modal-box">
        <div className="modal-title-row">
          <h3>{appointment ? "Cập nhật lịch hẹn" : "Thêm lịch hẹn mới"}</h3>
          <button type="button" className="modal-close-btn" onClick={close}>
            ×
          </button>
        </div>

        <div className="form-grid">
          <div className="form-col">
            <div className="form-group">
              <div className="form-group" ref={enterpriseDropdownRef}>
                <label>Doanh nghiệp *</label>

                <input
                  className="select-box"
                  placeholder="Tìm doanh nghiệp..."
                  value={inputValue}
                  onFocus={() => {
                    setOpenEnterpriseDropdown(true);
                    setSearchEnterprise(""); // 🔥 reset để search mới
                  }}
                  onChange={(e) => {
                    const val = e.target.value;

                    setInputValue(val);        // hiển thị text
                    setSearchEnterprise(val);  // dùng để search API

                    handleChange("enterpriseId", ""); // reset chọn cũ
                    setSelectedEnterpriseObj(null);   // 🔥 QUAN TRỌNG
                  }}
                />

                {openEnterpriseDropdown && (
                  <div className="select-dropdown">
                    <div
                      className="options"
                      onScroll={(e) => {
                        const bottom =
                          e.target.scrollHeight - e.target.scrollTop <=
                          e.target.clientHeight + 5;

                        if (bottom && !loadingEnterprise) {
                          handleLoadMore();
                        }
                      }}
                    >
                      {loadingEnterprise ? (
                        <div className="option">Đang tìm...</div>
                      ) : searchEnterprise.length > 0 &&
                        searchEnterprise.length < 2 ? (
                        <div className="option">Nhập ít nhất 2 ký tự</div>
                      ) : enterpriseOptions.length === 0 ? (
                        <div className="option">Vui lòng nhập tên doanh nghiệp</div>
                      ) : (
                        enterpriseOptions.map((enterprise) => (
                          <div
                            key={enterprise.id}
                            className="option"
                            onClick={() => {
                              handleChange("enterpriseId", enterprise.id);

                              setSelectedEnterpriseObj(enterprise); // 🔥 thêm dòng này
                              setInputValue(enterprise.name);
                              setSearchEnterprise(""); // reset keyword
                              setOpenEnterpriseDropdown(false);
                            }}
                          >
                            {enterprise.name}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Người liên hệ</label>
              <select
                value={form.contactId}
                onChange={(e) => handleChange("contactId", e.target.value)}
              >
                <option value="">{selectedEnterpriseObj?.name || "-- Chọn người liên hệ --"}</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} - {c.position}
                  </option>
                ))}
              </select>
            </div>


            <div className="form-group">
              <label>Hình thức *</label>
              <select
                value={form.appointmentType}
                onChange={(e) =>
                  handleChange("appointmentType", e.target.value)
                }
              >
                <option value="ONLINE_MEETING">Online</option>
                <option value="OFFLINE_MEETING">
                  Offline (Gặp gỡ trực tiếp)
                </option>
                <option value="PHONE_CALL">Gọi điện thoại</option>
                <option value="SEND_MAIL">Gửi Mail</option>
                <option value="EMAIL_QUOTE">Gửi báo giá</option>
                {/* <option value="CONTRACT_SIGNING">Ký hợp đồng</option> */}
                <option value="CUSTOMER_SUPPORT">Hỗ trợ khách hàng</option>
                <option value="OTHER">Khác</option>
              </select>
            </div>
          </div>

          <div className="form-col">
            <div className="form-group">
              <label>Thời gian (Bắt buộc) *</label>
              <DatePicker
  selected={dtLocal ? new Date(dtLocal) : null}
  onChange={(date) => {
    setDtLocal(date);

    if (date) {
      const formatted = dayjs(date).format("DD/MM/YYYY HH:mm");
      handleChange("scheduledTime", formatted);
    } else {
      handleChange("scheduledTime", "");
    }
  }}
  showTimeSelect
  timeFormat="HH:mm"
  timeIntervals={15}
  dateFormat="dd/MM/yyyy HH:mm"
  placeholderText="Chọn thời gian"
  className="input"
/>
            </div>

            <div className="form-group">
              <label>Địa điểm</label>
              <input
                type="text"
                value={form.location}
                placeholder="Nhập địa điểm (vd: Văn phòng, Link Google Meet,...)"
                onChange={(e) => handleChange("location", e.target.value)}
              />
            </div>
          </div>
          {showCreateContactForm && (
            <div className="form-group full-width">

              <div className="contact-inline-form">
                <h4>Thêm người liên hệ</h4>

                <div className="contact-grid">

                  <div className="form-group">
                    <input
                      className={createContactErrors.fullName ? "input-error" : ""}
                      placeholder="Họ tên *"
                      value={contactForm.fullName}
                      onChange={(e) =>
                        setContactForm({ ...contactForm, fullName: e.target.value })
                      }
                    />
                    {createContactErrors.fullName && (
                      <span className="error-text">{createContactErrors.fullName}</span>
                    )}
                  </div>


                  <div className="form-group">
                    <input
                      className={createContactErrors.position ? "input-error" : ""}
                      placeholder="Chức vụ"
                      value={contactForm.position}
                      onChange={(e) =>
                        setContactForm({ ...contactForm, position: e.target.value })
                      }
                    />
                    {createContactErrors.position && (
                      <span className="error-text">{createContactErrors.position}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <input
                      className={createContactErrors.email ? "input-error" : ""}
                      placeholder="Email"
                      value={contactForm.email}
                      onChange={(e) =>
                        setContactForm({ ...contactForm, email: e.target.value })
                      }
                    />
                    {createContactErrors.email && (
                      <span className="error-text">{createContactErrors.email}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <input
                      className={createContactErrors.phone ? "input-error" : ""}
                      placeholder="SĐT"
                      value={contactForm.phone}
                      onChange={(e) =>
                        setContactForm({ ...contactForm, phone: e.target.value })
                      }
                    />
                    {createContactErrors.phone && (
                      <span className="error-text">{createContactErrors.phone}</span>
                    )}
                  </div>
                  <div className="form-group full-width">
  <label className="checkbox-primary">
    <input
      type="checkbox"
      checked={contactForm.isPrimary}
      onChange={(e) =>
        setContactForm({
          ...contactForm,
          isPrimary: e.target.checked,
        })
      }
    />
    <span>Đặt làm người liên hệ chính</span>
  </label>
</div>
                </div>

                <button onClick={handleCreateContact} disabled={creatingContact}>
                  {creatingContact ? "Đang tạo..." : "Tạo người liên hệ"}
                </button>
              </div>
            </div>

          )}

        </div>
        <div className="form-group full-width">
          <label>Mục đích / Ghi chú</label>
          <textarea
            rows="4"
            value={form.purpose}
            onChange={(e) => handleChange("purpose", e.target.value)}
            placeholder="Mô tả mục đích lịch hẹn..."
          ></textarea>
        </div>

        <div className="modal-actions">
          <button className="cancel-btn" onClick={close}>
            Hủy
          </button>
          <button className="save-btn" onClick={handleSubmit}>
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}

export default AppointmentModal;
