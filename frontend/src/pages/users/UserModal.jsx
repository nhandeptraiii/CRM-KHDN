// UserModal.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import DatePicker from "react-datepicker";
import dayjs from "dayjs";
import "react-datepicker/dist/react-datepicker.css";
import "./UserModal.scss";

import { createContact, getContactsByEnterprise } from "../../services/enterpriseContactService";
import { createInteraction, updateInteraction } from "../../services/interactionService";
import { getEnterprises } from "../../services/enterpriseService";
import { getServices } from "../../services/servicesService";
import { getUsers } from "../../services/userService";

const getEnterpriseId = (enterprise) =>
  enterprise?.id ?? enterprise?.enterpriseId ?? enterprise?.enterprise_id ?? "";

const getEnterpriseName = (enterprise) =>
  enterprise?.name ?? enterprise?.enterpriseName ?? enterprise?.enterprise_name ?? "";

// Hỗ trợ  API để tránh lỗi 
const getContactId = (contact) => contact?.id ?? contact?.contactId ?? contact?.contact_id ?? "";

const getContactName = (contact) =>
  contact?.fullName ?? contact?.full_name ?? contact?.contactName ?? contact?.contact_name ?? "";

const typeOptions = [
  { value: "PHONE_CALL", label: "Gọi điện" },
  { value: "SEND_MAIL", label: "Gửi Mail" },
  { value: "EMAIL_QUOTE", label: "Gửi báo giá" },
  { value: "ONLINE_MEETING", label: "Họp online" },
  { value: "OFFLINE_MEETING", label: "Gặp trực tiếp" },
  { value: "DEMO", label: "Demo sản phẩm" },
  { value: "CONTRACT_SIGNING", label: "Ký hợp đồng" },
  { value: "CUSTOMER_SUPPORT", label: "Hỗ trợ khách hàng" },
  { value: "OTHER", label: "Khác" },
];

const resultOptions = [
  { value: "PENDING", label: "Chờ xử lý" },
  { value: "NEED_FOLLOW_UP", label: "Cần chăm sóc thêm" },
  { value: "NEXT_APPOINTMENT", label: "Hẹn gặp tiếp" },
  { value: "INTERESTED", label: "Tiềm năng" },
  { value: "IN_PROGRESS", label: "Đang thương thảo" },
  { value: "CLOSED_WON", label: "Chốt thành công" },
  { value: "CLOSED_LOST", label: "Thất bại" },
];


const sanitizeInteractionContent = (value) => {
  if (!value) return "";
  return String(value).replace(/\s*Chức\s*vụ[^:]*:\s*.*$/giu, "").trim();
};


function UserModal({ interaction, close, reload }) {
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [showCreateContactForm, setShowCreateContactForm] = useState(false);
  const [creatingContact, setCreatingContact] = useState(false);
  const [createContactErrors, setCreateContactErrors] = useState({});
  const [errors, setErrors] = useState({});

  const [enterpriseOptions, setEnterpriseOptions] = useState([]);
  const [loadingEnterprise, setLoadingEnterprise] = useState(false);
  const [page, setPage] = useState(0);

const [usages, setUsages] = useState([
  {
    viettelServiceId: "",
    contractNumber: "",
    revenue: "",
    startDate: "",
    quantity: "",
  },
]);
  const [selectedEnterpriseObj, setSelectedEnterpriseObj] = useState(null);

  const [openEnterpriseDropdown, setOpenEnterpriseDropdown] = useState(false);
  const [searchEnterprise, setSearchEnterprise] = useState("");
  const [inputValue, setInputValue] = useState(interaction?.enterpriseName || interaction?.enterprise?.name || "");
  const enterpriseDropdownRef = useRef(null);

  const noContactToastEnterpriseRef = useRef("");

  const [contactForm, setContactForm] = useState({
    fullName: "",
    position: "",
    email: "",
    phone: "",
    isPrimary: false,
  });

  const [form, setForm] = useState({
    enterpriseId: interaction?.enterpriseId ? String(interaction.enterpriseId) : "",
    contactId: interaction?.contactId ? String(interaction.contactId) : "",
    contactPosition: "",
    interactionType: interaction?.interactionType || "PHONE_CALL",
    interactionTime: interaction?.interactionTime || "",
    futureInteractionDate: "",
    location: interaction?.location || "",
    description: sanitizeInteractionContent(interaction?.description || ""),
    consultantId: interaction?.consultantId || "",
  });

  const [consultants, setConsultants] = useState([]);
  useEffect(() => {
    const fetchConsultants = async () => {
      try {
        const res = await getUsers(0, 1000, "", "CONSULTANT");
        if (res.data?.data?.content) {
          setConsultants(res.data.data.content);
        }
      } catch (error) {
        console.error("Lỗi lấy danh sách consultant:", error);
      }
    };
    fetchConsultants();
  }, []);

  const [services, setServices] = useState([]);
const [loadingServices, setLoadingServices] = useState(false);

useEffect(() => {
  const fetchServices = async () => {
    try {
      setLoadingServices(true);

      const res = await getServices({
        page: 0,
        size: 100,
      });

      const data = res.data?.data?.content || [];

      // chỉ lấy service active
      const activeServices = data.filter((s) => s.isActive);

      setServices(activeServices);
    } catch (err) {
      console.error(err);
      toast.error("Không tải được dịch vụ");
    } finally {
      setLoadingServices(false);
    }
  };

  fetchServices();
}, []);

const updateUsageField = (index, field, value) => {
  const updated = [...usages];
  updated[index][field] = value;
  setUsages(updated);
};

const addUsage = () => {
  setUsages([
    ...usages,
    {
      viettelServiceId: "",
      contractNumber: "",
      revenue: "",
      startDate: "",
      quantity: "",
    },
  ]);
};

const removeUsage = (index) => {
  setUsages(usages.filter((_, i) => i !== index));
};

  // console.log("form", form)

  const parseInitDateTime = (str) => {
    if (!str) return null;
    const d = new Date(str);
    if (!Number.isNaN(d.getTime())) return d;
    return null;
  };

  const [dtInteraction, setDtInteraction] = useState(
    parseInitDateTime(interaction?.interactionTime)
  );


  const selectedEnterprise = useMemo(() => {
    if (!Array.isArray(enterpriseOptions)) return null;

    return enterpriseOptions.find(
      (e) => String(getEnterpriseId(e)) === String(form.enterpriseId)
    );
  }, [enterpriseOptions, form.enterpriseId]);

  const selectedEnterpriseName = (getEnterpriseName(selectedEnterprise) || "").trim().toLowerCase();
  const isViettelEnterprise =
    selectedEnterpriseName === "vt" || selectedEnterpriseName.includes("viettel");

  useEffect(() => {
    setPage(0);
  }, [searchEnterprise]);
  useEffect(() => {
    const run = async () => {
      if (!form.enterpriseId) {
        setContacts([]);
        noContactToastEnterpriseRef.current = "";
        return;
      }

      setLoadingContacts(true);
      try {

        const list = await getContactsByEnterprise(form.enterpriseId);
        setContacts(list);

        if (form.contactId) {
          // Khi mở form edit, đồng bộ lại chức vụ từ contact đang chọn (nếu có).
          const selected = list.find(
            (contact) => String(getContactId(contact)) === String(form.contactId)
          );
          handleChange("contactPosition", selected?.position || "");
        }
      } catch (error) {
        console.error(error);
        setContacts([]);
        noContactToastEnterpriseRef.current = "";
        toast.error("Không tải được danh bạ liên hệ");
      } finally {
        setLoadingContacts(false);
      }
    };

    run();
  }, [form.enterpriseId]);

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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Bỏ tự động mở form thêm liên hệ

  const cacheRef = useRef({});

  useEffect(() => {
    const debounce = setTimeout(() => {
      const run = async () => {
        const keyword = searchEnterprise.trim().toLowerCase();

        // nếu nhập < 2 ký tự thì bỏ qua
        if (keyword.length < 2) {
          setEnterpriseOptions([]);
          return;
        }

        // check cache
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
            "",   // status
            "",   // region
            ""    // type → để rỗng để search tất cả
          );
          // console.log("searchEnterprise:", searchEnterprise);

          const data = res.data?.data?.content || [];

          const safeData = Array.isArray(data) ? data : [];
          setEnterpriseOptions(safeData);

          // cache lại
          cacheRef.current[keyword] = safeData;
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

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleContactFormChange = (field, value) => {
    setContactForm((prev) => ({ ...prev, [field]: value }));
    if (createContactErrors[field]) {
      setCreateContactErrors((prev) => ({ ...prev, [field]: "" }));
    }
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

    if (contactForm.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactForm.email.trim())) {
      nextErrors.email = "Email không đúng định dạng";
    }

    if (contactForm.phone.trim() && !/^[0-9+\s-]{8,20}$/.test(contactForm.phone.trim())) {
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
      if (nextErrors.phone === "Vui lòng nhập số điện thoại") {
        toast.error("Vui lòng nhập số điện thoại");
      }
      // if (nextErrors.email === "Không có gmail") {
      //   toast.error("Không có gmail");
      // }
      return;
    }

    setCreatingContact(true);
    try {
      const payload = {
        fullName: contactForm.fullName.trim(),
        position: contactForm.position.trim() || "",
        email: contactForm.email.trim() || "",
        phone: contactForm.phone.trim() || "",
        isPrimary: Boolean(contactForm.isPrimary),
      };

      const created = await createContact(form.enterpriseId, payload);
      const latestContacts = await getContactsByEnterprise(form.enterpriseId);
      setContacts(latestContacts);

      const createdId = String(getContactId(created));
      if (createdId) {
        handleChange("contactId", createdId);
        const selected = latestContacts.find(
          (contact) => String(getContactId(contact)) === createdId
        );
        handleChange("contactPosition", selected?.position || payload.position || "");
      }

      setContactForm({
        fullName: "",
        position: "",
        email: "",
        phone: "",
        isPrimary: false,
      });
      setCreateContactErrors({});
      toast.success("Tạo người liên hệ thành công");
    } catch (error) {
      console.error(error);

      const responseData = error?.response?.data;

      // Trường hợp BE trả về dạng mảng lỗi
      if (Array.isArray(responseData?.message)) {
        responseData.message.forEach((err) => {
          if (err?.message) {
            toast.error(err.message);
          }
        });
      }
      // Trường hợp BE trả về message string
      else if (typeof responseData?.message === "string") {
        toast.error(responseData.message);
      }
      // fallback
      else {
        toast.error("Có lỗi xảy ra");
      }
    } finally {
      setCreatingContact(false);
    }
  };

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

    setEnterpriseOptions(prev => {
      const combined = [
        ...(Array.isArray(prev) ? prev : []),
        ...(Array.isArray(newData) ? newData : [])
      ];

      // 🔥 remove duplicate theo id
      const unique = Array.from(
        new Map(combined.map(item => [getEnterpriseId(item), item])).values()
      );

      return unique;
    });

    cacheRef.current[keyword] = [
      ...(cacheRef.current[keyword] || []),
      ...newData
    ];

    setPage(nextPage);
  };

  const validate = () => {

    const nextErrors = {};

    if (!form.enterpriseId) nextErrors.enterpriseId = "Vui lòng chọn doanh nghiệp";
    
    const isVNR = selectedEnterprise?.type === "VNR2000" || selectedEnterprise?.type === "VNR20K";
    if (isVNR && !selectedEnterprise?.consultantId && !form.consultantId && !interaction?.consultantId) {
      nextErrors.consultantId = "Vui lòng chọn người phụ trách";
    }
    if (!form.interactionType) nextErrors.interactionType = "Vui lòng chọn loại tiếp xúc";
    if (!form.interactionTime) nextErrors.interactionTime = "Vui lòng chọn ngày tiếp xúc";

    if (interaction && form.futureInteractionDate && form.interactionTime) {
      const parsedInteraction = parseInitDateTime(form.interactionTime);
      const currentDate = parsedInteraction ? parsedInteraction.getTime() : 0;
      const futureDate = new Date(`${form.futureInteractionDate}T00:00:00`).getTime();
      if (!Number.isNaN(currentDate) && !Number.isNaN(futureDate) && futureDate <= currentDate) {
        nextErrors.futureInteractionDate = "Ngày tương lai phải lớn hơn ngày tiếp xúc";
      }
    }
    if (!form.description.trim()) {
      nextErrors.description = "Vui lòng nhập nội dung trao đổi";
    }
    if (form.location && form.location.trim().length > 255) {
      nextErrors.location = "Địa điểm tối đa 255 ký tự";
    }
    if (form.description && form.description.trim().length > 20000) {
      nextErrors.description = "Nội dung tối đa 20000 ký tự";
    }

    setErrors(nextErrors);
    return {
      isValid: Object.keys(nextErrors).length === 0,
      nextErrors,
    };
  };



  const handleSubmit = async () => {
    const { isValid, nextErrors } = validate();
    if (!isValid) {
      if (nextErrors.enterpriseId) {
        toast.error(nextErrors.enterpriseId);
      }
      if (nextErrors.consultantId) {
        toast.error(nextErrors.consultantId);
      }
      if (nextErrors.interactionType) {
        toast.error(nextErrors.interactionType);
      }
      if (nextErrors.interactionTime) {
        toast.error(nextErrors.interactionTime);
      }
      if (nextErrors.futureInteractionDate) {
        toast.error(nextErrors.futureInteractionDate);
      }
      if (nextErrors.location) {
        toast.error(nextErrors.location);
      }
      if (nextErrors.description) {
        toast.error(nextErrors.description);
      }
      return;
    }

    if (form.result === "CLOSED_WON") {
      for (let i = 0; i < usages.length; i++) {
        if (!usages[i].revenue) {
          toast.error(`Vui lòng nhập doanh thu cho dịch vụ ở dòng ${i + 1}`);
          return;
        }
      }
    }

    //  tạo mới và cập nhật.
    const basePayload = {
      enterpriseId: Number(form.enterpriseId),
      contactId: form.contactId ? Number(form.contactId) : null,
      interactionType: form.interactionType,
      result: form.result,
      interactionTime: form.interactionTime,
      location: form.location?.trim() || null,
      description: sanitizeInteractionContent(form.description) || null,
      consultantId: form.consultantId ? Number(form.consultantId) : null,
      newUsages: form.result === "CLOSED_WON" ? usages.map(u => ({ ...u, revenue: Number(u.revenue) })) : [],
    };

    try {
      if (interaction) {
        await updateInteraction(interaction.id, basePayload);

        if (form.futureInteractionDate) {
          await createInteraction({
            enterpriseId: Number(interaction.enterpriseId || form.enterpriseId),
            contactId: form.contactId ? Number(form.contactId) : interaction.contactId ?? null,
            interactionType: form.interactionType,
            interactionTime: form.interactionTime,
            location: form.location.trim() || null,
            description: sanitizeInteractionContent(form.description) || null,
            result: interaction?.result || "PENDING",
          });
        }

        toast.success("Cập nhật tiếp xúc thành công");
      } else {

        await createInteraction(basePayload);
        toast.success("Thêm tiếp xúc thành công");
      }

      await reload();
      close();
    } catch (error) {
      const responseData = error?.response?.data;

      if (Array.isArray(responseData?.message)) {
        responseData.message.forEach((err) => {
          toast.error(err.message);
        });

        // map lỗi vào form luôn
        const backendErrors = {};
        responseData.message.forEach((err) => {
          if (err?.field) {
            backendErrors[err.field] = err.message;
          }
        });

        setErrors(backendErrors);
      } else if (typeof responseData?.message === "string") {
        toast.error(responseData.message);
      } else {
        const responseData = error?.response?.data;

        if (Array.isArray(responseData?.message)) {
          responseData.message.forEach((err) => {
            toast.error(err.message);
          });

          // map lỗi vào form luôn
          const backendErrors = {};
          responseData.message.forEach((err) => {
            if (err?.field) {
              backendErrors[err.field] = err.message;
            }
          });

          setErrors(backendErrors);
        } else if (typeof responseData?.message === "string") {
          toast.error(responseData.message);
        } else {
          toast.error("Có lỗi xảy ra");
        }
      }
    }
  };

  return (
    <div className={`modal ${true ? "open" : ""}`} onClick={close}>
      <div className="modal-box users-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{interaction ? "Cập nhật tiếp xúc" : "Thêm tiếp xúc"}</h3>

        <div className="section-title">Thông tin tiếp xúc</div>
        {/* {!interaction && enterprises.length === 0 && (
          <p className="form-hint-warning">
            Chưa có doanh nghiệp trong hệ thống. Hãy tạo doanh nghiệp trước khi thêm tiếp xúc.
          </p>
        )} */}

        <div className="form-grid">
          <div className="form-group" ref={enterpriseDropdownRef}>
            <label>
              Doanh nghiệp <span className="required">*</span>
            </label>

            <input
              className={`select-box ${errors.enterpriseId ? "input-error" : ""}`}
              placeholder="Tìm doanh nghiệp..."
              value={inputValue}
              onFocus={() => {
                setOpenEnterpriseDropdown(true);
                setSearchEnterprise("");
              }} onChange={(e) => {
                const val = e.target.value;
                setInputValue(val);
                setSearchEnterprise(val);
                handleChange("enterpriseId", ""); // reset chọn cũ khi gõ
              }}
            />

            {openEnterpriseDropdown && !interaction && (
              <div className="select-dropdown">

                <div className="options"
                  onScroll={(e) => {
                    const bottom =
                      e.target.scrollHeight - e.target.scrollTop <= e.target.clientHeight + 5;
                    if (bottom && !loadingEnterprise) {
                      handleLoadMore();
                    }
                  }}
                >
                  {loadingEnterprise ? (
                    <div className="option">Đang tìm...</div>
                  ) : searchEnterprise.length > 0 && searchEnterprise.length < 2 ? (
                    <div className="option">Nhập ít nhất 2 ký tự</div>
                  ) : !Array.isArray(enterpriseOptions) || enterpriseOptions.length === 0 ? (
                    <div className="option">Vui lòng nhập từ khóa tìm kiếm</div>
                  ) : (
                    enterpriseOptions.map((enterprise) => (
                      <div
                        key={getEnterpriseId(enterprise)}
                        className={`option ${String(form.enterpriseId) === String(getEnterpriseId(enterprise))
                          ? "selected"
                          : ""
                          }`}
                        onClick={() => {
                          const id = getEnterpriseId(enterprise);
                          const name = getEnterpriseName(enterprise);

                          handleChange("enterpriseId", id);
                          setSelectedEnterpriseObj(enterprise);

                          setInputValue(name);
                          setSearchEnterprise(name);
                          setOpenEnterpriseDropdown(false);

                          // reset dữ liệu liên hệ
                          handleChange("contactId", "");
                          handleChange("contactPosition", "");

                          noContactToastEnterpriseRef.current = "";
                          setShowCreateContactForm(false);
                          setContactForm({
                            fullName: "",
                            position: "",
                            email: "",
                            phone: "",
                            isPrimary: false,
                          });
                          setCreateContactErrors({});

                          setOpenEnterpriseDropdown(false);
                        }}
                      >
                        {getEnterpriseName(enterprise)}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {errors.enterpriseId && (
              <span className="error-text">{errors.enterpriseId}</span>
            )}

          </div>

          <div className="form-group">
            <label>Người liên hệ</label>
            <select
              value={form.contactId}
              onChange={(e) => {
                const selectedContactId = e.target.value;
                handleChange("contactId", selectedContactId);
              }}
              disabled={!form.enterpriseId || loadingContacts}
            >
              <option value="">{loadingContacts ? "Đang tải..." : (getEnterpriseName(selectedEnterprise) || "Chọn người liên hệ")}</option>
              {contacts.map((contact) => (
                <option key={getContactId(contact)} value={getContactId(contact)}>
                  {getContactName(contact)}{contact.position ? ` - ${contact.position}` : ""}
                </option>
              ))}
            </select>

            {form.enterpriseId && !loadingContacts && !isViettelEnterprise && (
              <button
                type="button"
                className="link-add-contact-btn"
                onClick={() => setShowCreateContactForm((prev) => !prev)}
              >
                {showCreateContactForm ? "Ẩn form thêm người liên hệ" : "+ Thêm người liên hệ"}
              </button>
            )}
          </div>

          {form.enterpriseId && !loadingContacts && showCreateContactForm && !isViettelEnterprise && (
            <div className="form-group full-width contact-inline-module">
              <div className="contact-inline-header">
                <strong>Thêm nhanh người liên hệ</strong>
                <span>
                  {contacts.length === 0
                    ? "Doanh nghiệp này chưa có người liên hệ. Tạo mới ngay tại đây."
                    : "Bạn có thể thêm nhiều người liên hệ cho cùng doanh nghiệp ngay tại đây."}
                </span>
              </div>

              <div className="contact-inline-grid">
                <div className="form-group">
                  <label>
                    Họ tên <span className="required">*</span>
                  </label>
                  <input
                    className={createContactErrors.fullName ? "input-error" : ""}
                    value={contactForm.fullName}
                    onChange={(e) => handleContactFormChange("fullName", e.target.value)}
                    placeholder="VD: Nguyễn Văn F"
                  />
                  {createContactErrors.fullName && (
                    <span className="error-text">{createContactErrors.fullName}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Chức vụ</label>
                  <input
                    className={createContactErrors.position ? "input-error" : ""}
                    value={contactForm.position}
                    onChange={(e) => handleContactFormChange("position", e.target.value)}
                    placeholder="VD: Nhân viên"
                  />
                  {createContactErrors.position && (
                    <span className="error-text">{createContactErrors.position}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    className={createContactErrors.email ? "input-error" : ""}
                    value={contactForm.email}
                    onChange={(e) => handleContactFormChange("email", e.target.value)}
                    placeholder="VD: nguyenvanF@gmail.com"
                  />
                  {createContactErrors.email && (
                    <span className="error-text">{createContactErrors.email}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input
                    className={createContactErrors.phone ? "input-error" : ""}
                    value={contactForm.phone}
                    onChange={(e) => handleContactFormChange("phone", e.target.value)}
                    placeholder="VD: 0987654321"
                  />
                  {createContactErrors.phone && (
                    <span className="error-text">{createContactErrors.phone}</span>
                  )}
                </div>
              </div>

              <label className="inline-checkbox">
                <input
                  type="checkbox"
                  checked={contactForm.isPrimary}
                  onChange={(e) => handleContactFormChange("isPrimary", e.target.checked)}
                />
                Người liên hệ chính
              </label>

              <div className="contact-inline-actions">
                <button
                  type="button"
                  className="cancel-inline-btn"
                  onClick={() => {
                    setShowCreateContactForm(false);
                    setContactForm({
                      fullName: "",
                      position: "",
                      email: "",
                      phone: "",
                      isPrimary: false,
                    });
                    setCreateContactErrors({});
                  }}
                  disabled={creatingContact}
                >
                  Đóng form
                </button>
                <button
                  type="button"
                  className="save-btn"
                  onClick={handleCreateContact}
                  disabled={creatingContact}
                >
                  {creatingContact ? "Đang tạo..." : "Tạo người liên hệ"}
                </button>
              </div>
            </div>
          )}

          {(selectedEnterprise?.type === "VNR2000" || selectedEnterprise?.type === "VNR20K") && (
            <div className="form-group">
              <label>
                Người phụ trách <span className="required">*</span>
              </label>
              {interaction?.consultantId ? (
                <input
                  className="input"
                  disabled
                  value={interaction.consultantName || "Đã có người phụ trách"}
                />
              ) : selectedEnterprise?.consultantId ? (
                <input
                  className="input"
                  disabled
                  value={selectedEnterprise.consultantName || "Đã có người phụ trách"}
                />
              ) : (
                <select
                  className={errors.consultantId ? "input-error" : ""}
                  value={form.consultantId}
                  onChange={(e) => handleChange("consultantId", e.target.value)}
                >
                  <option value="">Chọn người phụ trách</option>
                  {consultants.map(c => (
                    <option key={c.id} value={c.id}>{c.fullName}</option>
                  ))}
                </select>
              )}
              {errors.consultantId && <span className="error-text">{errors.consultantId}</span>}
            </div>
          )}

          <div className="form-group">
            <label>
              Loại tiếp xúc <span className="required">*</span>
            </label>
            <select
              className={errors.interactionType ? "input-error" : ""}
              value={form.interactionType}
              onChange={(e) => handleChange("interactionType", e.target.value)}
            >
              {typeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.interactionType && (
              <span className="error-text">{errors.interactionType}</span>
            )}
          </div>
          <div className="form-group">
            <label>
              Ngày tiếp xúc <span className="required">*</span>
            </label>
            <DatePicker
              selected={dtInteraction}
              onChange={(date) => {
                setDtInteraction(date);

                if (date) {
                  const formatted = date.toISOString();
                  handleChange("interactionTime", formatted);
                } else {
                  handleChange("interactionTime", "");
                }
              }}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              dateFormat="dd/MM/yyyy HH:mm"
              placeholderText="Chọn thời gian"
              className={`input ${errors.interactionTime ? "input-error" : ""}`}
            />
            {errors.interactionTime && <span className="error-text">{errors.interactionTime}</span>}
          </div>
          <div className="form-group">
            <label>Địa điểm</label>
            <input
              className={errors.location ? "input-error" : ""}
              value={form.location}
              onChange={(e) => handleChange("location", e.target.value)}
              placeholder="VD: Văn phòng Viettel"
            />
            {errors.location && <span className="error-text">{errors.location}</span>}
          </div>
          <div className="form-group">
            <label>Kết quả</label>
            <select
              value={form.result}
              onChange={(e) => handleChange("result", e.target.value)}
            >
              {resultOptions.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          {form.result === "CLOSED_WON" && (
  <div className="form-group full-width">
    <h4>Dịch vụ đã ký</h4>

<div className="usage-list">
  {usages.map((item, index) => (
    <div key={index} className="usage-card">
      <div className="usage-grid">

        <div className="field">
          <label>Dịch vụ</label>
          <select
            value={item.viettelServiceId}
            onChange={(e) =>
              updateUsageField(index, "viettelServiceId", Number(e.target.value))
            }
          >
            <option value="">
              {loadingServices ? "Đang tải..." : "Chọn dịch vụ"}
            </option>

            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.serviceName} ({s.serviceCode})
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Số hợp đồng</label>
          <input
            value={item.contractNumber}
            onChange={(e) =>
              updateUsageField(index, "contractNumber", e.target.value)
            }
          />
        </div>

        <div className="field">
          <label>Doanh thu (*)</label>
          <input
            type="number"
            value={item.revenue}
            onChange={(e) =>
              updateUsageField(index, "revenue", e.target.value)
            }
            placeholder="VNĐ"
          />
        </div>

        <div className="field">
          <label>Ngày bắt đầu</label>
          <input
            type="date"
            value={item.startDate}
            onChange={(e) =>
              updateUsageField(index, "startDate", e.target.value)
            }
          />
        </div>

        <div className="field">
          <label>Số lượng</label>
          <input
            type="number"
            value={item.quantity}
            onChange={(e) =>
              updateUsageField(index, "quantity", Number(e.target.value))
            }
          />
        </div>

      </div>

      {usages.length > 1 && (
        <button
          type="button"
          className="remove-btn"
          onClick={() => removeUsage(index)}
        >
          ✕
        </button>
      )}
    </div>
  ))}

  <button type="button" className="add-btn" onClick={addUsage}>
    + Thêm dịch vụ
  </button>
</div>

    {/* 🔥 SHOW ERROR */}
    {errors["newUsages[0].viettelServiceId"] && (
      <span className="error-text">
        {errors["newUsages[0].viettelServiceId"]}
      </span>
    )}
  </div>
)}

          <div className="form-group full-width">
            <label>Nội dung trao đổi</label>
            <textarea
              className={errors.description ? "input-error" : ""}
              rows="3"
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Mô tả nội dung tiếp xúc"
            />
            {errors.description && <span className="error-text">{errors.description}</span>}
          </div>

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

export default UserModal;
