import { useState } from "react";
import { createContact, updateContact } from "../../services/enterpriseService";
import { toast } from "react-toastify";
import "./ContactModal.scss"

function ContactModal({ enterpriseId, contact, close, reload }) {
  const [form, setForm] = useState({
    fullName: contact?.fullName || "",
    position: contact?.position || "",
    email: contact?.email || "",
    phone: contact?.phone || "",
    isPrimary: contact?.isPrimary || false,
  });

  const handleSubmit = async () => {
    try {
      if (contact) {
        await updateContact(enterpriseId, contact.id, form);
        toast.success("Cập nhật contact thành công");
      } else {
        await createContact(enterpriseId, form);
        toast.success("Thêm contact thành công");
      }

      reload();
      close();
    } catch (err) {
      toast.error("Có lỗi xảy ra", err);
    }
  };

  return (
<div className="modal open">
      <div className="modal-box">
        <h4>{contact ? "Sửa" : "Thêm"} người đại diện</h4>

        <div className="form-group">
          <input
            placeholder="Tên"
            value={form.fullName}
            onChange={(e) =>
              setForm({ ...form, fullName: e.target.value })
            }
          />
        </div>

        <div className="form-group">
          <input
            placeholder="Chức vụ"
            value={form.position}
            onChange={(e) =>
              setForm({ ...form, position: e.target.value })
            }
          />
        </div>

        <div className="form-group">
          <input
            placeholder="Email"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />
        </div>

        <div className="form-group">
          <input
            placeholder="Phone"
            value={form.phone}
            onChange={(e) =>
              setForm({ ...form, phone: e.target.value })
            }
          />
        </div>

        <div className="form-group checkbox">
  <label className="checkbox-label">
    <input
      type="checkbox"
      checked={form.isPrimary}
      onChange={(e) =>
        setForm({ ...form, isPrimary: e.target.checked })
      }
    />
    <span>Liên hệ chính</span>
  </label>
</div>

        {/* ACTIONS */}
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

export default ContactModal;