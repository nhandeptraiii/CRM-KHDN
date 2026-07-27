import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "./AppointmentConfirmModal.scss";
import { confirmAppointment } from "../../services/appointmentService";
import { getServices } from "../../services/servicesService";

function AppointmentConfirmModal({ appointment, close, reload }) {
  const [result, setResult] = useState("PENDING");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState([]);

  const [services, setServices] = useState([]);
  const [newUsages, setNewUsages] = useState([
    {
      viettelServiceId: "",
      contractNumber: "",
      revenue: "",
      startDate: "",
      quantity: "",
    },
  ]);

  const RESULT_OPTIONS = [
    { value: "PENDING", label: "Chờ xử lý" },
    { value: "NEED_FOLLOW_UP", label: "Cần chăm sóc thêm" },
    { value: "NEXT_APPOINTMENT", label: "Hẹn gặp lại" },
    { value: "INTERESTED", label: "Khách hàng tiềm năng" },
    { value: "IN_PROGRESS", label: "Đang thương thảo" },
    { value: "CLOSED_WON", label: "Chốt hợp đồng" },
    { value: "CLOSED_LOST", label: "Thất bại" },
  ];
  // const getResultLabel = (value) => {
  //   return RESULT_OPTIONS.find((x) => x.value === value)?.label || value;
  // };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await getServices({ page: 0, size: 100 });
        setServices(res.data.data.content);
      } catch (err) {
        console.error(err);
      }
    };

    fetchServices();
  }, []);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);

    // Gộp với file cũ
    const newFiles = [...photos, ...files];

    // Giới hạn 4 ảnh
    if (newFiles.length > 4) {
      toast.warning("Chỉ được tối đa 4 ảnh!");
      return;
    }

    // Kiểm tra ảnh
    const invalidFiles = newFiles.filter(
      (file) => !file.type.startsWith("image/")
    );

    if (invalidFiles.length > 0) {
      toast.error("Chỉ được upload file ảnh!");
      return;
    }

    setPhotos(newFiles);
  };

  const handleSubmit = async () => {
    if (!result) {
      toast.warning("Vui lòng chọn kết quả cuộc hẹn!");
      return;
    }


    try {
      const formData = new FormData();
      if (result === "CLOSED_WON") {
        // Validate revenue
        for (let i = 0; i < newUsages.length; i++) {
          if (!newUsages[i].revenue) {
            toast.error(`Vui lòng nhập doanh thu cho dịch vụ ở dòng ${i + 1}`);
            return;
          }
        }

        const formatted = newUsages.map((item) => ({
          viettelServiceId: Number(item.viettelServiceId),
          contractNumber: item.contractNumber,
          revenue: Number(item.revenue),
          startDate: item.startDate,
          quantity: Number(item.quantity),
        }));

        formData.append("newUsages", JSON.stringify(formatted));
      }
      if (photos.length > 4) {
        toast.warning("Tối đa 4 ảnh!");
        return;
      }

      const invalidFiles = photos.filter(
        (file) => !file.type.startsWith("image/")
      );

      if (invalidFiles.length > 0) {
        toast.error("Chỉ được gửi file ảnh!");
        return;
      }
      formData.append("result", result);
      formData.append("description", description);

      photos.forEach((file) => {
        formData.append("photos", file);
      });

      await confirmAppointment(appointment.id, formData);

      toast.success("Xác nhận lịch hẹn thành công!");
      await reload();
      close();
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.message || "Có lỗi xảy ra khi xác nhận!"
      );
    }
  };

  return (
  <div className="modal open" onClick={close}>
    <div
      className="modal-box confirm-box"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="modal-title-row">
        <h3>Xác nhận hoàn thành lịch hẹn</h3>
        <button className="modal-close-btn" onClick={close}>
          ×
        </button>
      </div>
      {/* <span>{getResultLabel(result)}</span> */}
      <div className="form-group">
        <label>Kết quả cuộc hẹn</label>
        <select value={result} onChange={(e) => setResult(e.target.value)}>
          {RESULT_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>Mô tả chi tiết</label>
        <textarea
          rows="4"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Nhập ghi chú, kết quả hoặc vấn đề tồn tại..."
        />
      </div>

      <div className="form-group">
        <label>Tài liệu/Hình ảnh minh chứng</label>
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          accept="image/*"
          className="file-input"
        />
        {photos.length > 0 && (
          <div className="file-list">
            {photos.map((file, idx) => (
              <div key={idx} className="file-item">
                📄 {file.name}
              </div>
            ))}
          </div>
        )}
      </div>
      {result === "CLOSED_WON" && (
        <div className="form-group">
          <label>Dịch vụ triển khai</label>
          <div className="usage-list">
            {newUsages.map((item, index) => (
              <div key={index} className="usage-card">
                <div className="usage-grid">
                  <div className="field">
                    <label>Dịch vụ</label>
                    <select
                      value={item.viettelServiceId}
                      onChange={(e) => {
                        const updated = [...newUsages];
                        updated[index].viettelServiceId = e.target.value;
                        setNewUsages(updated);
                      }}
                    >
                      <option value="">-- Chọn dịch vụ --</option>
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.serviceName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label>Số hợp đồng</label>
                    <input
                      type="text"
                      value={item.contractNumber}
                      onChange={(e) => {
                        const updated = [...newUsages];
                        updated[index].contractNumber = e.target.value;
                        setNewUsages(updated);
                      }}
                    />
                  </div>

                  <div className="field">
                    <label>Doanh thu (*)</label>
                    <input
                      type="number"
                      value={item.revenue}
                      placeholder="Nhập doanh thu (VNĐ)"
                      onChange={(e) => {
                        const updated = [...newUsages];
                        updated[index].revenue = e.target.value;
                        setNewUsages(updated);
                      }}
                    />
                  </div>

                  <div className="field">
                    <label>Ngày bắt đầu</label>
                    <input
                      type="date"
                      value={item.startDate}
                      onChange={(e) => {
                        const updated = [...newUsages];
                        updated[index].startDate = e.target.value;
                        setNewUsages(updated);
                      }}
                    />
                  </div>

                  <div className="field">
                    <label>Số lượng</label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {
                        const updated = [...newUsages];
                        updated[index].quantity = e.target.value;
                        setNewUsages(updated);
                      }}
                    />
                  </div>
                </div>

                {newUsages.length > 1 && (
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => {
                      const updated = newUsages.filter((_, i) => i !== index);
                      setNewUsages(updated);
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              className="add-btn"
              onClick={() =>
                setNewUsages([
                  ...newUsages,
                  {
                    viettelServiceId: "",
                    contractNumber: "",
                    revenue: "",
                    startDate: "",
                    quantity: "",
                  },
                ])
              }
            >
              + Thêm dịch vụ
            </button>
          </div>
        </div>
      )}
      <div className="modal-actions">
        <button className="cancel-btn" onClick={close}>
          Hủy
        </button>

        <button className="save-btn" onClick={handleSubmit}>
          Xác nhận
        </button>
      </div>
    </div>
  </div>
);
}
export default AppointmentConfirmModal;