// Enterprises.jsx
import { useEffect, useState, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import "./Enterprises.scss";

import EnterpriseTable from "./EnterpriseTable";
import EnterpriseModal from "./EnterpriseModal";
import EnterpriseDetailModal from "./EnterpriseDetailModal";
import ImportEnterpriseModal from "./ImportEnterpriseModal";
import ExportEnterpriseModal from "./ExportEnterpriseModal";
import { getIndustries } from "../../services/enterpriseService";
import { deleteEnterprise, downloadEnterpriseTemplate, getEnterprises } from "../../services/enterpriseService";
// import "../employees/Employees.scss"
import { toast } from "react-toastify";

const POTENTIAL_STORAGE_KEY = "enterprise_potential_map";

function Enterprises() {
  const [enterprises, setEnterprises] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [industries, setIndustries] = useState([]);

  const [openModal, setOpenModal] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [openImport, setOpenImport] = useState(false);

  const [filterRegion, setFilterRegion] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");

  const [selectedEnterprise, setSelectedEnterprise] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterPotential] = useState("ALL");
  const [filterAssigned, setFilterAssigned] = useState(false); // Bộ lọc tôi phụ trách (CONSULTANT)

  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);

  const [exportLoading, setExportLoading] = useState(false);

  const [openExport, setOpenExport] = useState(false);


  const { role, region, id: userId } = useSelector((state) => state.auth.user || {});

  const getPotentialStorageMap = () => {
    try {
      const raw = localStorage.getItem(POTENTIAL_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      console.error("Cannot parse potential storage", error);
      return {};
    }
  };

  const isPotentialEnterprise = (item) => {
    const raw =
      item?.isPotential ??
      item?.potential ??
      item?.is_potential ??
      item?.potentialFlag ??
      item?.isPotentialCustomer ??
      item?.potentialCustomer;

    if (typeof raw === "boolean") return raw;
    if (typeof raw === "number") return raw === 1;
    if (typeof raw === "string") {
      const normalized = raw.trim().toLowerCase();
      return ["true", "1", "yes", "y", "potential", "tiem_nang"].includes(
        normalized,
      );
    }
    return false;
  };

  const fetchEnterprises = useCallback(async () => {
    try {
      const finalRegion =
        ["MANAGER", "ACCOUNT_MANAGER"].includes(role)
          ? region // 🔥 ép theo region của user
          : (filterRegion === "ALL" ? "" : filterRegion);

      // Resolve type: VNR -> [VNR20K, VNR2000], ALL -> [], others -> [value]
      const resolvedTypes =
        filterType === "VNR"
          ? ["VNR20K", "VNR2000"]
          : filterType === "ALL"
            ? []
            : [filterType];

      const consultantIdParam = (role === "CONSULTANT" && filterAssigned) ? userId : null;
      const res = await getEnterprises(
        currentPage,
        10,
        searchTerm,
        filterStatus === "ALL" ? "" : filterStatus,
        finalRegion,
        resolvedTypes,
        consultantIdParam,
      );

      const data = res.data?.data?.content || [];
      const potentialStorageMap = getPotentialStorageMap();

      const mergedData = data.map((item) => {
        const enterpriseId = String(item?.id ?? "");
        const hasStoragePotential = Object.prototype.hasOwnProperty.call(
          potentialStorageMap,
          enterpriseId,
        );

        if (!hasStoragePotential) return item;

        return {
          ...item,
          isPotential: Boolean(potentialStorageMap[enterpriseId]),
        };
      });

      const filteredByPotential = mergedData.filter((item) => {
        if (filterPotential === "ALL") return true;
        const potential = isPotentialEnterprise(item);
        return filterPotential === "POTENTIAL" ? potential : !potential;
      });

      setEnterprises(filteredByPotential);
      setTotalPages(res.data?.data?.totalPages || 0);
    } catch (err) {
      console.error(err);
    }
  }, [
    currentPage,
    searchTerm,
    filterStatus,
    filterRegion,
    filterType,
    filterPotential,
    filterAssigned,
    role,
    userId,
  ]);

  const fetchIndustries = async () => {
    try {
      const res = await getIndustries();
      setIndustries(res.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await downloadEnterpriseTemplate();

      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "enterprise_template.xlsx";

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      toast.error("Tải file mẫu thất bại");
    }
  };

  const handleDeleteEnterprise = async (enterprise) => {
    const confirmDelete = window.confirm(
      `Bạn có chắc muốn xóa doanh nghiệp ${enterprise?.name || "này"}?`,
    );
    if (!confirmDelete) return;

    try {
      await deleteEnterprise(enterprise.id);
      toast.success("Xóa doanh nghiệp thành công");
      fetchEnterprises();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Xóa doanh nghiệp thất bại");
    }
  };


  useEffect(() => {
    const delay = setTimeout(() => {
      fetchEnterprises();
    }, 400);
    return () => clearTimeout(delay);
  }, [
    currentPage,
    searchTerm,
    filterStatus,
    filterRegion,
    filterType,
    filterPotential,
    filterAssigned,
    role,
    userId,
  ]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {

    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchIndustries();
  }, []);
  useEffect(() => {
    if (hideRegionFilter) {
      setFilterRegion("ALL");
    }
  }, [role]);

  const statusOptions = [
    { value: "ALL", label: "Tất cả trạng thái" },
    { value: "ACTIVE", label: "Hoạt động" },
    { value: "INACTIVE", label: "Ngưng hoạt động" },
  ];

  // const potentialOptions = [
  //   { value: "ALL", label: "Tất cả loại" },
  //   { value: "POTENTIAL", label: "Tiềm năng" },
  //   { value: "NORMAL", label: "Thông thường" },
  // ];

  const regionOptions = [
    { value: "ALL", label: "Tất cả cụm" },
    { value: "CTO", label: "Cần Thơ" },
    { value: "HUG", label: "Hậu Giang" },
    { value: "STG", label: "Sóc Trăng" },
    // { value: "NONE", label: "Không xác định" },
  ];

  const typeOptions = [
    { value: "ALL", label: "Tất cả loại DN" },
    { value: "HKD", label: "Hộ kinh doanh" },
    { value: "VNR", label: "DN VNR (2000 + 20K)" },
    { value: "SME", label: "SME" },
  ];

  // Map giá trị VNR sang 2 type thực tế khi gọi API
  const resolveTypeParam = (value) => {
    if (value === "VNR") return ["VNR20K", "VNR2000"];
    if (value === "ALL") return [];
    return [value];
  };
  const hideRegionFilter = ["MANAGER", "ACCOUNT_MANAGER"].includes(role);

  const getTypeOptionsByRole = () => {
    // FULL quyền
    if (["ADMIN", "OPERATOR", "CONSULTANT"].includes(role)) {
      return typeOptions;
    }

    // MANAGER: xem tất cả loại
    if (role === "MANAGER") {
      return typeOptions;
    }

    // ACCOUNT_MANAGER: chỉ SME + HKD
    if (role === "ACCOUNT_MANAGER") {
      return typeOptions.filter((t) =>
        ["ALL", "SME", "HKD"].includes(t.value)
      );
    }

    return typeOptions;
  };

  const getRegionOptionsByRole = () => {
    // ADMIN / OPERATOR / CONSULTANT: full region
    if (["ADMIN", "OPERATOR", "CONSULTANT"].includes(role)) {
      return regionOptions;
    }

    // MANAGER & ACCOUNT_MANAGER: chỉ region của mình
    if (["MANAGER", "ACCOUNT_MANAGER"].includes(role)) {
      return regionOptions.filter((r) => r.value === region);
    }

    return regionOptions;
  };

  const filteredTypeOptions = getTypeOptionsByRole();
  const filteredRegionOptions = getRegionOptionsByRole();

  return (
    <div className="enterprises-page">
      {" "}
      {/* ✅ dùng chung class */}
      <div className="header">
        <h2>Quản lý doanh nghiệp</h2>

        <div className="enterprise-header-actions" ref={dropdownRef}>
          {/* Autofill fix giống Employee */}
          <input
            type="text"
            style={{ position: "absolute", opacity: 0, width: 0 }}
          />
          <input
            type="password"
            style={{ position: "absolute", opacity: 0, width: 0 }}
          />
          <div className="enterprise-header-filters">
            {/* SEARCH */}
            <div className="enterprise-search-box">
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
                placeholder="Tìm tên doanh nghiệp, MST..."
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
            <div className="enterprise-dropdown">
              <div
                className={`enterprise-dropdown-trigger ${openDropdown === "status" ? "active" : ""}`}
                onClick={() =>
                  setOpenDropdown(openDropdown === "status" ? null : "status")
                }
              >
                <span>
                  {statusOptions.find((o) => o.value === filterStatus)?.label}
                </span>
                <svg
                  className={`icon-chevron ${openDropdown === "status" ? "open" : ""}`}
                  viewBox="0 0 24 24"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>

              {openDropdown === "status" && (
                <div className="enterprise-dropdown-menu">
                  {statusOptions.map((opt) => (
                    <div
                      key={opt.value}
                      className={`enterprise-dropdown-item ${filterStatus === opt.value ? "selected" : ""}`}
                      onClick={() => {
                        setFilterStatus(opt.value);
                        setOpenDropdown(null);
                      }}
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* REGION */}
            {!hideRegionFilter && (
              <div className="enterprise-dropdown">
                <div
                  className={`enterprise-dropdown-trigger ${openDropdown === "region" ? "active" : ""}`}
                  onClick={() =>
                    setOpenDropdown(openDropdown === "region" ? null : "region")
                  }
                >
                  <span>
                    {filteredRegionOptions.find((o) => o.value === filterRegion)?.label}
                  </span>
                  <svg
                    className={`icon-chevron ${openDropdown === "region" ? "open" : ""}`}
                    viewBox="0 0 24 24"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>

                {openDropdown === "region" && (
                  <div className="enterprise-dropdown-menu">
                    {filteredRegionOptions.map((opt) => (
                      <div
                        key={opt.value}
                        className={`enterprise-dropdown-item ${filterRegion === opt.value ? "selected" : ""
                          }`}
                        onClick={() => {
                          setFilterRegion(opt.value);
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
            )}
            {/* TYPE */}
            <div className="enterprise-dropdown">
              <div
                className={`enterprise-dropdown-trigger ${openDropdown === "type" ? "active" : ""
                  }`}
                onClick={() => {
                  // if (role === "CONSULTANT") return;
                  setOpenDropdown(openDropdown === "type" ? null : "type");
                }}
              >
                <span>
                  {filteredTypeOptions.find((o) => o.value === filterType)?.label}    </span>
                <svg
                  className={`icon-chevron ${openDropdown === "type" ? "open" : ""
                    }`}
                  viewBox="0 0 24 24"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>

              {openDropdown === "type" && (
                <div className="enterprise-dropdown-menu">
                  {filteredTypeOptions.map((opt) => (
                    <div
                      key={opt.value}
                      className={`enterprise-dropdown-item ${filterType === opt.value ? "selected" : ""
                        }`}
                      onClick={() => {
                        setFilterType(opt.value);
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

            {/* POTENTIAL DROPDOWN (đã ẩn) */}

            {/* BỘ LỌC: TÔI PHỤ TRÁCH (chỉ CONSULTANT) */}
            {/* {role === "CONSULTANT" && (
            <button
              className={`add-btn filter-assigned-btn ${filterAssigned ? "active-assigned" : ""}`}
              onClick={() => {
                setFilterAssigned((prev) => !prev);
                setCurrentPage(0);
              }}
              title={filterAssigned ? "Đang lọc: Tôi phụ trách" : "Xem DN tôi phụ trách"}
            >
              {filterAssigned ? "✓ Tôi phụ trách" : "Tôi phụ trách"}
            </button>
            )} */}

            {role === "CONSULTANT" && (
              <label className="enterprise-assigned-filter">
                  <input
                      type="checkbox"
                      checked={filterAssigned}
                      onChange={() => {
                          setFilterAssigned((prev) => !prev);
                          setCurrentPage(0);
                      }}
                  />

                  <span>Chỉ doanh nghiệp tôi phụ trách</span>
              </label>
            )}
          </div>
          <div className="enterprise-header-buttons">
            {/* BUTTONS */}

            {role !== "ACCOUNT_MANAGER" && (
              <>
                <button className="add-btn" onClick={() => setOpenImport(true)}>
                  Import Excel
                </button>
                <button className="add-btn" onClick={handleDownloadTemplate}>
                  Tải file mẫu
                </button>
                {/* <button className="add-btn" onClick={handleExport} disabled={exportLoading}>
                {exportLoading ? "Đang xuất file..." : "Xuất Excel"}
              </button> */}
                <button
                  className="add-btn"
                  onClick={() => setOpenExport(true)}
                >
                  Xuất Excel
                </button>
              </>
            )}
            {exportLoading && (
              <div className="export-overlay">
                <div className="export-box">
                  <div className="spinner"></div>
                  <p>Đang xuất file, vui lòng chờ...</p>
                </div>
              </div>
            )}
            <button className="add-btn" onClick={() => {
              setSelectedEnterprise(null);
              setOpenModal(true);
            }}>
              + Thêm doanh nghiệp
            </button>
          </div>
        </div>
      </div>
      <div className="table-card">
        <EnterpriseTable
          enterprises={enterprises}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          onEdit={(e) => {
            setSelectedEnterprise(e);
            setOpenModal(true);
          }}
          onView={(e) => {
            setSelectedEnterprise(e);
            setOpenDetail(true);
          }}
          onDelete={handleDeleteEnterprise}
        />
      </div>
      {openModal && (
        <EnterpriseModal
          enterprise={selectedEnterprise}
          close={() => {
            setOpenModal(false);
            setSelectedEnterprise(null);
          }}
          reload={fetchEnterprises}
        />
      )}
      {openDetail && (
        <EnterpriseDetailModal
          enterprise={selectedEnterprise}
          industries={industries} // ✅ BẮT BUỘC
          reloadEnterprises={fetchEnterprises}
          onEnterpriseUpdated={setSelectedEnterprise}
          close={() => setOpenDetail(false)}
        />
      )}
      {openImport && (
        <ImportEnterpriseModal
          close={() => setOpenImport(false)}
          reload={fetchEnterprises}
        />
      )}
      {openExport && (
        <ExportEnterpriseModal
          close={() => setOpenExport(false)}
        />
      )}
    </div>
  );
}

export default Enterprises;
