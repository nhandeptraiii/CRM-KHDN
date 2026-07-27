import { NavLink } from "react-router-dom";
//import { useSelector } from "react-redux";
import styles from "./Sidebar.module.scss";
import logo from "../../assets/images/logo.png";


function Sidebar({ isOpen, isMobile, onClose }) {
  
  return (
    <>
      {/* overlay mobile */}
      <div
        className={`${styles.overlay} ${
          isMobile && isOpen ? styles.show : ""
        }`}
        onClick={onClose}
      />

      <div
        className={`${styles.sidebar} ${
          isMobile
            ? isOpen
              ? styles.open
              : styles.mobileHidden
            : ""
        }`}
      >
        <div className={styles.logoContainer}>
          <img src={logo} alt="logo" />
        </div>

        <nav className={styles.menu}>
          <NavLink to="/" onClick={onClose} className={({ isActive }) => isActive ? styles.active : ""}>
            Dashboard
          </NavLink>

          <NavLink to="/employees" onClick={onClose} className={({ isActive }) => isActive ? styles.active : ""}>
            Quản lý nhân viên
          </NavLink>

          <NavLink to="/services" onClick={onClose} className={({ isActive }) => isActive ? styles.active : ""}>
            Quản lý dịch vụ
          </NavLink>

          <NavLink to="/enterprises" onClick={onClose} className={({ isActive }) => isActive ? styles.active : ""}>
            Quản lý doanh nghiệp
          </NavLink>

          <NavLink to="/appointments" onClick={onClose} className={({ isActive }) => isActive ? styles.active : ""}>
            Quản lý lịch hẹn
          </NavLink>

          <NavLink to="/users" onClick={onClose} className={({ isActive }) => isActive ? styles.active : ""}>
            Quản lý tiếp xúc
          </NavLink>
        </nav>
      </div>
    </>
  );
}

export default Sidebar;