import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../../components/sidebar/Sidebar";
import Header from "../../components/header/Header";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "./MainLayout.module.scss";

function MainLayout() {
   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(
    window.matchMedia("(max-width: 1024px)").matches
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  useEffect(() => {  
    if (!isMobile) {  
    // eslint-disable-next-line
      setIsSidebarOpen(false);  
    }  
  }, [isMobile]);

  useEffect(() => {
  const media = window.matchMedia("(max-width: 1024px)");

  const handleChange = (e) => {
    setIsMobile(e.matches);
  };

  media.addEventListener("change", handleChange);

  return () => media.removeEventListener("change", handleChange);
}, []);
  
  return (
   <div className={styles.mainLayout}>
  <Sidebar
    isOpen={isSidebarOpen}
    isMobile={isMobile}
    onClose={() => setIsSidebarOpen(false)}
  />

  <div
    className={`${styles.mainContent} ${
      isMobile ? styles.fullWidth : ""
    }`}
  >
    <Header onToggleSidebar={() => setIsSidebarOpen(true)} />

    <div
      className={`${styles.pageContent} ${
        isMobile ? styles.mobilePage : ""
      }`}
    >
      <Outlet />
    </div>
  </div>
      <ToastContainer
        position="top-right"
        autoClose={2500}
        hideProgressBar={true}
        closeButton={false}
        newestOnTop
        theme="colored"
      />
    </div>
  );
}

export default MainLayout;