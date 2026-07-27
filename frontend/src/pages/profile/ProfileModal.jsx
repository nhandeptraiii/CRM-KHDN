import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { updateUser } from "../../services/userService";
import { getMe } from "../../redux/slices/authSlice";

import "./ProfileModal.scss";

function ProfileModal({ user, close }) {
  const dispatch = useDispatch();
  useEffect(() => {
  document.body.style.overflow = "hidden";

  return () => {
    document.body.style.overflow = "";
  };
}, []);
  const formatDateForInput = (date) => {

    if (!date) return "";

    const [day, month, year] = date.split("-");

    return `${year}-${month}-${day}`;
  };
  // console.log("dateOfBirth from redux:", user?.dateOfBirth);

  const formatDateForServer = (date) => {
    if (!date) return null;

    const [year, month, day] = date.split("-");

    return `${day}-${month}-${year}`;
  };

  const [form, setForm] = useState({
    fullName: user?.fullName || "",
    phone: user?.phone || "",
    gender: user?.gender || "",
    dateOfBirth: formatDateForInput(user?.dateOfBirth),
  });

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setForm({
      ...form,
      [field]: value,
    });
  };

  const isOver18 = (dateString) => {

    if (!dateString) return true;

    const today = new Date();
    const birthDate = new Date(dateString);

    let age = today.getFullYear() - birthDate.getFullYear();

    const m = today.getMonth() - birthDate.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age >= 18;
  };
  const handleSubmit = async () => {

    const newErrors = {};

    if (!form.fullName.trim()) {
      newErrors.fullName = "Vui lòng nhập họ tên";
    }

    if (form.dateOfBirth && !isOver18(form.dateOfBirth)) {
      newErrors.dateOfBirth = "Người dùng phải từ 18 tuổi trở lên";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {

      const data = {
        ...form,
        dateOfBirth: formatDateForServer(form.dateOfBirth),
      };

      await updateUser(user.id, data);

      toast.success("Cập nhật thành công");

      dispatch(getMe());

      close();

    } catch (error) {

      const response = error?.response?.data;

      if (response?.message) {

        // nếu message là array (validation error)
        if (Array.isArray(response.message)) {

          response.message.forEach((err) => {
            toast.error(err.message);
          });

        } else {

          toast.error(response.message);

        }

      } else {

        toast.error("Có lỗi xảy ra khi cập nhật");

      }

    }
  };


return (
  <div className="modal open" onClick={close}>
    <div
      className="modal-box"
      onClick={(e) => e.stopPropagation()}
    >
        <h3>Chỉnh sửa thông tin cá nhân</h3>

        <div className="form-content">

          {/* Họ tên */}
          <div className="form-group">
            <label>
              Họ và tên <span className="required">*</span>
            </label>

            <input
              className={errors.fullName ? "input-error" : ""}
              value={form.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
            />

            {errors.fullName && (
              <span className="error-text">{errors.fullName}</span>
            )}
          </div>

          {/* SĐT + Giới tính */}
          <div className="form-row">

            <div className="form-group">
              <label>Số điện thoại</label>

              <input
                className="input-profile"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Giới tính</label>

              <select
                // className="input-profile"
                value={form.gender || ""}
                onChange={(e) => handleChange("gender", e.target.value)}
              >
                <option value="">Chưa cập nhật</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </select>
            </div>

          </div>

          {/* Ngày sinh */}
          <div className="form-group">
            <label>Ngày sinh</label>

            <input
              // className="input-profile"
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => handleChange("dateOfBirth", e.target.value)}
            />

            {errors.dateOfBirth && (
              <span className="error-text">{errors.dateOfBirth}</span>
            )}
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

export default ProfileModal;