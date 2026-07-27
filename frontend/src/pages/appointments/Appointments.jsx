import { useEffect, useState, useCallback, useRef } from "react";
import "./Appointments.scss";

import AppointmentTable from "./AppointmentTable";
import AppointmentModal from "./AppointmentModal";
import AppointmentDetailModal from "./AppointmentDetailModal";
import AppointmentConfirmModal from "./AppointmentConfirmModal";

import {
  getAppointments,
  cancelAppointment,
} from "../../services/appointmentService";
import { toast } from "react-toastify";

function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [openModal, setOpenModal] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);

  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await getAppointments(
        currentPage,
        10,
        "",
        "",
        filterStatus === "ALL" ? "" : filterStatus,
      );

      const data = res.data?.data?.content || res.data?.content || [];

      let filteredData = data;

      if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        filteredData = data.filter(
          (item) =>
            item.enterpriseName?.toLowerCase().includes(lowerTerm) ||
            item.contactName?.toLowerCase().includes(lowerTerm) ||
            item.purpose?.toLowerCase().includes(lowerTerm) ||
            item.appointmentType?.toLowerCase().includes(lowerTerm) ||
            item.location?.toLowerCase().includes(lowerTerm),
        );
      }

      setAppointments(filteredData);
      setTotalPages(res.data?.data?.totalPages || res.data?.totalPages || 0);
    } catch (err) {
      console.error("Fetch Error:", err);
      toast.error("Lỗi khi tải danh sách lịch hẹn");
    }
  }, [currentPage, filterStatus, searchTerm]);

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchAppointments();
    }, 400);
    return () => clearTimeout(delay);
  }, [currentPage, filterStatus, searchTerm, fetchAppointments]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDeleteAppointment = async (appointment) => {
    const confirmDelete = window.confirm("Bạn có chắc muốn huỷ lịch hẹn này?");
    if (!confirmDelete) return;

    try {
      await cancelAppointment(appointment.id);
      toast.success("Huỷ lịch hẹn thành công");
      fetchAppointments();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Huỷ lịch hẹn thất bại");
    }
  };

  const statusOptions = [
    { value: "ALL", label: "Tất cả trạng thái" },
    { value: "SCHEDULED", label: "Lên lịch" },
    { value: "REMINDED", label: "Đã nhắc" },
    { value: "CONFIRMED", label: "Đã xác nhận" },
    { value: "REJECTED", label: "Từ chối" },
  ];

  return (
    <div className="appointment-page">
      <div className="header">
        <h2>Quản lý lịch hẹn</h2>

        <div className="header-actions" ref={dropdownRef}>
          {/* Prevent auto-fill */}
          <input
            type="text"
            style={{ position: "absolute", opacity: 0, width: 0 }}
          />
          <input
            type="password"
            style={{ position: "absolute", opacity: 0, width: 0 }}
          />

          {/* SEARCH */}
          <div className="search-box">
            <svg
              className="icon-search"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>

            <input
              type="text"
              placeholder="Tìm kiếm công ty, liên hệ..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(0);
              }}
            />

            {searchTerm && (
              <svg
                className="icon-clear"
                viewBox="0 0 24 24"
                onClick={() => setSearchTerm("")}
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            )}
          </div>

          {/* DROPDOWN - TRẠNG THÁI */}
          <div className="custom-dropdown">
            <div
              className={`dropdown-trigger ${
                openDropdown === "status" ? "active" : ""
              }`}
              onClick={() =>
                setOpenDropdown(openDropdown === "status" ? null : "status")
              }
            >
              <span>
                {statusOptions.find((o) => o.value === filterStatus)?.label}
              </span>
              <svg
                className={`icon-chevron ${
                  openDropdown === "status" ? "open" : ""
                }`}
                viewBox="0 0 24 24"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>

            {openDropdown === "status" && (
              <div className="dropdown-menu">
                {statusOptions.map((opt) => (
                  <div
                    key={opt.value}
                    className={`dropdown-item ${
                      filterStatus === opt.value ? "selected" : ""
                    }`}
                    onClick={() => {
                      setFilterStatus(opt.value);
                      setCurrentPage(0);
                      setOpenDropdown(null);
                    }}
                  >
                    {opt.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* BUTTONS */}
          <button
            className="add-btn"
            onClick={() => {
              setSelectedAppointment(null);
              setOpenModal(true);
            }}
          >
            + Thêm lịch hẹn
          </button>
        </div>
      </div>

      <div className="table-card">
        <AppointmentTable
          appointments={appointments}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          onEdit={(e) => {
            setSelectedAppointment(e);
            setOpenModal(true);
          }}
          onView={(e) => {
            setSelectedAppointment(e);
            setOpenDetail(true);
          }}
          onDelete={handleDeleteAppointment}
          onConfirm={(e) => {
            setSelectedAppointment(e);
            setOpenConfirm(true);
          }}
        />
      </div>

      {openModal && (
        <AppointmentModal
          appointment={selectedAppointment}
          close={() => {
            setOpenModal(false);
            setSelectedAppointment(null);
          }}
          reload={fetchAppointments}
        />
      )}

      {openDetail && (
        <AppointmentDetailModal
          appointment={selectedAppointment}
          close={() => {
            setOpenDetail(false);
            setSelectedAppointment(null);
          }}
        />
      )}

      {openConfirm && (
        <AppointmentConfirmModal
          appointment={selectedAppointment}
          close={() => {
            setOpenConfirm(false);
            setSelectedAppointment(null);
          }}
          reload={fetchAppointments}
        />
      )}
    </div>
  );
}

export default Appointments;
