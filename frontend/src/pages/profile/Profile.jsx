import { useSelector } from "react-redux";
import { useState } from "react";
import "./Profile.scss";

import ProfileModal from "./ProfileModal";
import ChangePasswordModal from "./ChangePasswordModal";

function Profile() {

    const user = useSelector((state) => state.auth.user);

    const [openModal, setOpenModal] = useState(false);
    const [openPasswordModal, setOpenPasswordModal] = useState(false);

    const formatDate = (date) => {

        if (!date) return "";

        const [day, month, year] = date.split("-");

        return `${day}/${month}/${year}`;
    };

    const formatCreatedAt = (date) => {

        if (!date) return "";

        const d = new Date(date);

        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();

        return `${day}/${month}/${year}`;
    };

    return (
        <div className="profile-page">
            <div className="profile-card">

                <div className="profile-header">
                    <div className="avatar">
                        {user?.fullName?.charAt(0)}
                    </div>

                    <div>
                        <h2>{user?.fullName}</h2>
                        <span className="role">{user?.role}</span>
                    </div>
                </div>

                <div className="profile-body">

                    <div className="info-item">
                        <label>Email</label>
                        <span>{user?.email}</span>
                    </div>

                    <div className="info-item">
                        <label>Số điện thoại</label>
                        <span>{user?.phone || "Chưa cập nhật"}</span>
                    </div>

                    <div className="info-item">
                        <label>Ngày sinh</label>
                        <span>
                            {formatDate(user?.dateOfBirth) || "Chưa cập nhật"}
                        </span>
                    </div>

                    <div className="info-item">
                        <label>Giới tính</label>
                        <span>{user?.gender || "Chưa cập nhật"}</span>
                    </div>

                    <div className="info-item">
                        <label>Trạng thái</label>
                        <span>{user?.status}</span>
                    </div>

                    <div className="info-item">
                        <label>Ngày tạo</label>
                        <span>{formatCreatedAt(user?.createdAt)}</span>
                    </div>

                    <div className="profile-actions">
                        <button
                            className="edit-btn-pf"
                            onClick={() => setOpenModal(true)}
                        >
                            Chỉnh sửa thông tin
                        </button>

                        <button
                            className="password-btn"
                            onClick={() => setOpenPasswordModal(true)}
                        >
                            Đổi mật khẩu
                        </button>
                    </div>
                </div>
            </div>

            {openModal && (
                <ProfileModal
                    user={user}
                    close={() => setOpenModal(false)}
                />
            )}

            {openPasswordModal && (
                <ChangePasswordModal
                    close={() => setOpenPasswordModal(false)}
                />
            )}
        </div>
    );
}

export default Profile;