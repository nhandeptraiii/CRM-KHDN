import { useState } from "react";
import { toast } from "react-toastify";
import "./ChangePasswordModal.scss";
import { updateMyPassword } from "../../services/userService";

function ChangePasswordModal({ close }) {

    const [form, setForm] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {

        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        if (!form.oldPassword || !form.newPassword || !form.confirmPassword) {
            toast.error("Vui lòng nhập đầy đủ thông tin");
            return;
        }

        if (form.newPassword.length < 6) {
            toast.error("Mật khẩu mới phải từ 6 ký tự");
            return;
        }

        if (form.newPassword !== form.confirmPassword) {
            toast.error("Xác nhận mật khẩu không khớp");
            return;
        }

        try {

            setLoading(true);

            await updateMyPassword({
                oldPassword: form.oldPassword,
                newPassword: form.newPassword,
            });

            toast.success("Đổi mật khẩu thành công");

            close();

        } catch (error) {

            toast.error(
                error?.response?.data?.message ||
                "Đổi mật khẩu thất bại"
            );

        } finally {

            setLoading(false);
        }
    };

    return (
    <div className="modal open" onClick={close}>
        <div
            className="modal-box password-sidebar"
            onClick={(e) => e.stopPropagation()}
        >
            <h3>Đổi mật khẩu</h3>

            <form
                className="form-content"
                onSubmit={handleSubmit}
            >

                <div className="form-group">
                    <label>Mật khẩu cũ</label>

                    <input
                        type="password"
                        name="oldPassword"
                        value={form.oldPassword}
                        onChange={handleChange}
                        placeholder="Nhập mật khẩu cũ"
                    />
                </div>

                <div className="form-group">
                    <label>Mật khẩu mới</label>

                    <input
                        type="password"
                        name="newPassword"
                        value={form.newPassword}
                        onChange={handleChange}
                        placeholder="Nhập mật khẩu mới"
                    />
                </div>

                <div className="form-group">
                    <label>Xác nhận mật khẩu mới</label>

                    <input
                        type="password"
                        name="confirmPassword"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        placeholder="Nhập lại mật khẩu mới"
                    />
                </div>

                <div className="modal-actions">
                    <button
                        type="button"
                        className="cancel-btn"
                        onClick={close}
                    >
                        Hủy
                    </button>

                    <button
                        type="submit"
                        className="save-btn"
                        disabled={loading}
                    >
                        {loading ? "Đang xử lý..." : "Đổi mật khẩu"}
                    </button>
                </div>
            </form>
        </div>
    </div>
);
}

export default ChangePasswordModal;