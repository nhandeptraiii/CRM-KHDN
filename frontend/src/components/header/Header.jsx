import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import Person from "@mui/icons-material/Person";
import Logout from "@mui/icons-material/Logout";
import { logout } from "../../redux/slices/authSlice";
import { logoutApi } from "../../services/authService";

import styles from "./Header.module.scss";

function Header({ onToggleSidebar }) {
    const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const menuRef = useRef();

  const role = user?.roles?.[0]?.name;

  const toggleMenu = () => {
    setOpen(!open);
  };

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch (e) {
      console.log(e);
    }

    dispatch(logout());
    localStorage.removeItem("token");

    navigate("/login");
  };

  const handleProfile = () => {
    navigate("/profile");
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!menuRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  return (
    <div className={styles.header}>
      <div className={styles.leftSection}>
        <button className={styles.menuBtn} onClick={onToggleSidebar}>
          ☰
        </button>

        <h3 className={styles.title}>
          HỆ THỐNG QUẢN LÝ TIẾP XÚC DOANH NGHIỆP
        </h3>
      </div>
      <div className={styles.userSection} ref={menuRef}>
        <div className={styles.userInfo} onClick={toggleMenu}>
          <div className={styles.avatarHeader}>
            {user?.fullName?.charAt(0)}
          </div>

          <div className={styles.userText}>
            <span className={styles.name}>{user?.fullName}</span>
            <span className={styles.role}>{role}</span>
          </div>

          <span
            className={`${styles.dropdownIcon} ${
              open ? styles.rotate : ""
            }`}
          >
            ▼
          </span>
        </div>

        {open && (
          <div className={styles.dropdownMenu}>
            <div
              className={styles.dropdownItem}
              onClick={handleProfile}
            >
              <Person fontSize="small" />
              Thông tin cá nhân
            </div>

            <div
              className={`${styles.dropdownItem} ${styles.logout}`}
              onClick={handleLogout}
            >
              <Logout fontSize="small" />
              Đăng xuất
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Header;