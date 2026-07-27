import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import "./Users.scss";

import UserTable from "./UserTable";
import UserModal from "./UserModal";
import UserDrawer from "./UserDrawer";

import { deleteInteraction, getAllInteractions, getEnterpriseInteractionSummary, getInteractions } from "../../services/interactionService";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { deleteContact, deleteEnterprise, getEnterprises } from "../../services/enterpriseService";
import { getContactsByEnterprise } from "../../services/enterpriseContactService";

const POTENTIAL_STORAGE_KEY = "enterprise_potential_map";

const getListFromResponse = (res) => {
 
  if (Array.isArray(res?.data?.data?.content)) return res.data.data.content;
  if (Array.isArray(res?.data?.content)) return res.data.content;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.data)) return res.data;
  return [];
};

const getTimeValue = (value) => {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};

const sanitizeInteractionContent = (value) => {
  if (!value) return "-";
  const cleaned = String(value).replace(/\s*Chức\s*vụ[^:]*:\s*.*$/iu, "").trim();
  return cleaned || "-";
};

const getErrorMessage = (error, fallback = "Không thể xóa doanh nghiệp") => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
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
    return ["true", "1", "yes", "y", "potential", "tiem_nang"].includes(normalized);
  }
  return false;
};

function Users() {
  // Dữ liệu bảng chính — danh sách doanh nghiệp (server-side pagination)
  const [enterpriseSummaries, setEnterpriseSummaries] = useState([]);
  const [currentPage, setCurrentPage] = useState(0); // 0-indexed (giống BE)
  const [totalPages, setTotalPages] = useState(0);
  const PAGE_SIZE = 10;

  // Lưu toàn bộ interactions riêng cho export Excel
  const [allInteractionsForExport, setAllInteractionsForExport] = useState([]);

  // Dữ liệu doanh nghiệp dùng cho form thêm tiếp xúc
  const [enterprises, setEnterprises] = useState([]);

  const [openModal, setOpenModal] = useState(false);
  const [selectedInteraction, setSelectedInteraction] = useState(null);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [viewingInteraction, setViewingInteraction] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // --- Fetch trang hiện tại (server-side pagination) ---
  const fetchPage = useCallback(async (page = 0) => {
    try {
      setIsLoading(true);
      const res = await getEnterpriseInteractionSummary({ page, size: PAGE_SIZE });
      const data = res?.data?.data || res?.data || {};
      setEnterpriseSummaries(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch (error) {
      console.error(error);
      toast.error("Không tải được danh sách tiếp xúc");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reload trang hiện tại (sau khi thêm/sửa/xóa)
  const reloadCurrentPage = useCallback(() => {
    fetchPage(currentPage);
  }, [fetchPage, currentPage]);

  const fetchEnterprises = useCallback(async () => {
    try {
      const res = await getEnterprises(0, 200);
      setEnterprises(getListFromResponse(res));
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchPage(currentPage);
  }, [fetchPage, currentPage]);

  useEffect(() => {
    fetchEnterprises();
  }, [fetchEnterprises]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleCreate = () => {
    setSelectedInteraction(null);
    setOpenModal(true);
  };

  const TYPE_MAP = {
    PHONE_CALL: "Gọi điện",
    SEND_MAIL: "Gửi Mail",
    EMAIL_QUOTE: "Gửi báo giá",
    ONLINE_MEETING: "Họp online",
    OFFLINE_MEETING: "Gặp trực tiếp",
    DEMO: "Demo sản phẩm",
    CONTRACT_SIGNING: "Ký hợp đồng",
    CUSTOMER_SUPPORT: "Hỗ trợ khách hàng",
    OTHER: "Khác",
  };

  const RESULT_MAP_EXPORT = {
    PENDING: "Chờ xử lý",
    NEED_FOLLOW_UP: "Cần chăm sóc",
    NEXT_APPOINTMENT: "Hẹn lần sau",
    INTERESTED: "Tiềm năng",
    IN_PROGRESS: "Đang thương thảo",
    CLOSED_WON: "Ký hợp đồng",
    CLOSED_LOST: "Thất bại",
  };

  const handleExportExcel = async () => {
    try {
      toast.info("Đang tải dữ liệu để xuất...");
      const allItems = await getAllInteractions();

      if (!allItems || allItems.length === 0) {
        toast.warning("Không có dữ liệu để xuất!");
        return;
      }

      // ── 1. Gom nhóm tiếp xúc theo doanh nghiệp ────────────────────────
      const groupedMap = new Map();
      allItems.forEach((item) => {
        const entId = item.enterpriseId ?? item.enterpriseName;
        if (!groupedMap.has(entId)) {
          groupedMap.set(entId, {
            enterpriseName: item.enterpriseName || "-",
            interactions: [],
          });
        }
        groupedMap.get(entId).interactions.push(item);
      });

      // ── 2. Tạo workbook ExcelJS ────────────────────────────────────────
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "CRM Viettel";
      const sheet = workbook.addWorksheet("Danh Sach Tiep Xuc");

      // ── 3. Định nghĩa cột ─────────────────────────────────────────────
      sheet.columns = [
        { key: "stt",         header: "STT",                  width: 6  },
        { key: "dn",          header: "Tên doanh nghiệp",      width: 36 },
        { key: "soLan",       header: "Số lần tiếp xúc",       width: 14 },
        { key: "ngayTX",      header: "Ngày tiếp xúc",         width: 20 },
        { key: "hinhThuc",    header: "Hình thức",             width: 18 },
        { key: "nguoiTX",     header: "Người tiếp xúc",        width: 24 },
        { key: "diaDiem",     header: "Địa điểm",              width: 22 },
        { key: "mucDich",     header: "Mục đích / Nội dung",   width: 34 },
        { key: "ketQua",      header: "Kết quả",               width: 22 },
        { key: "nvPhuTrach",  header: "Nhân viên phụ trách",   width: 24 },
        { key: "dichVu",      header: "Dịch vụ ký kết",        width: 24 },
        { key: "soHD",        header: "Số hợp đồng",           width: 20 },
        { key: "doanhThu",    header: "Doanh thu (VNĐ)",       width: 18 },
      ];

      // ── 4. Style Header ────────────────────────────────────────────────
      const headerRow = sheet.getRow(1);
      headerRow.height = 24;
      headerRow.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1565C0" } };
        cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
        cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
        cell.border = {
          top:    { style: "thin", color: { argb: "FFFFFFFF" } },
          bottom: { style: "thin", color: { argb: "FFFFFFFF" } },
          left:   { style: "thin", color: { argb: "FFFFFFFF" } },
          right:  { style: "thin", color: { argb: "FFFFFFFF" } },
        };
      });

      // ── 5. Ghi từng doanh nghiệp ──────────────────────────────────────
      let stt = 1;
      let excelRowIdx = 2; // dòng 1 là header

      Array.from(groupedMap.values()).forEach((group) => {
        const sortedTX = [...group.interactions].sort((a, b) => {
          const ta = a.interactionTime ? new Date(a.interactionTime).getTime() : 0;
          const tb = b.interactionTime ? new Date(b.interactionTime).getTime() : 0;
          return ta - tb; // cũ → mới
        });

        const dnStartRow = excelRowIdx;
        const totalRows  = sortedTX.length;

        sortedTX.forEach((item, idx) => {
          const isWon = item.result === "CLOSED_WON";

          // Format ngày
          const ngayTX = item.interactionTime
            ? new Date(item.interactionTime).toLocaleString("vi-VN", {
                day: "2-digit", month: "2-digit", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })
            : "-";

          const rowData = {
            stt:        idx === 0 ? stt : "",          // chỉ hiện ở dòng đầu (sẽ merge)
            dn:         idx === 0 ? group.enterpriseName : "",
            soLan:      idx === 0 ? totalRows : "",
            ngayTX,
            hinhThuc:   TYPE_MAP[item.interactionType] || item.interactionType || "-",
            nguoiTX:    item.contactName || "-",
            diaDiem:    item.location || "-",
            mucDich:    sanitizeInteractionContent(item.description),
            ketQua:     RESULT_MAP_EXPORT[item.result] || item.result || "-",
            nvPhuTrach: item.consultantName || "-",
            // Cột hợp đồng: chỉ điền nếu CLOSED_WON
            dichVu:     isWon ? (item.serviceName  || item.viettelServiceName || "-") : "",
            soHD:       isWon ? (item.contractNumber || "-") : "",
            doanhThu:   isWon ? (item.revenue ?? "") : "",
          };

          const excelRow = sheet.addRow(rowData);
          excelRow.height = 18;

          // Style từng ô
          excelRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            // Border cho tất cả ô
            cell.border = {
              top:    { style: "thin", color: { argb: "FFD1D5DB" } },
              bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
              left:   { style: "thin", color: { argb: "FFD1D5DB" } },
              right:  { style: "thin", color: { argb: "FFD1D5DB" } },
            };
            cell.alignment = { vertical: "middle", wrapText: colNumber === 8 };

            // Cột A-C (STT, Tên DN, Số lần): nền xanh nhạt + bold
            if (colNumber <= 3) {
              cell.fill   = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE3F2FD" } };
              cell.font   = { bold: true, size: 10 };
              cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
            } else if (colNumber >= 11) {
              // Cột hợp đồng (K-M): nền vàng nhạt
              cell.fill = {
                type: "pattern", pattern: "solid",
                fgColor: { argb: isWon ? "FFFFF9C4" : "FFFAFAFA" },
              };
            } else {
              cell.font = { size: 10 };
            }

            // Dòng CLOSED_WON: chữ xanh lá đậm cho cột Kết quả
            if (colNumber === 9 && isWon) {
              cell.font = { bold: true, color: { argb: "FF2E7D32" }, size: 10 };
            }

            // Format số doanh thu
            if (colNumber === 13 && isWon && rowData.doanhThu !== "") {
              cell.numFmt = '#,##0';
            }
          });

          excelRowIdx++;
        });

        // ── Merge ô A-C dọc cho cùng 1 DN ──
        if (totalRows > 1) {
          const endRow = dnStartRow + totalRows - 1;
          sheet.mergeCells(dnStartRow, 1, endRow, 1); // STT
          sheet.mergeCells(dnStartRow, 2, endRow, 2); // Tên DN
          sheet.mergeCells(dnStartRow, 3, endRow, 3); // Số lần
        }

        stt++;
      });

      // ── 6. Freeze header ──────────────────────────────────────────────
      sheet.views = [{ state: "frozen", xSplit: 0, ySplit: 1 }];

      // ── 7. Xuất file ──────────────────────────────────────────────────
      const buffer = await workbook.xlsx.writeBuffer();
      const blob   = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const today   = new Date();
      const dateStr = `${today.getDate().toString().padStart(2, "0")}${(today.getMonth() + 1).toString().padStart(2, "0")}${today.getFullYear()}`;
      saveAs(blob, `DanhSach_TiepXuc_${dateStr}.xlsx`);

      toast.success(`Đã xuất ${stt - 1} doanh nghiệp thành công!`);
    } catch (err) {
      console.error(err);
      toast.error("Xuất file thất bại!");
    }
  };

  const handleView = (item) => {
    // Khi click Xem chi tiết, truyền enterpriseId để UserDrawer tự load interactions
    setViewingInteraction(item);
    setOpenDrawer(true);
  };

  const handleDeleteEnterprise = async (interaction) => {
    const enterpriseId = interaction?.enterpriseId;

    if (!enterpriseId) {
      toast.error("Không tìm thấy doanh nghiệp để xóa");
      return;
    }

    const isConfirmed = window.confirm(
      `Bạn có chắc muốn xóa doanh nghiệp ${interaction.enterpriseName || "này"}?`
    );
    if (!isConfirmed) return;

    try {
      await deleteEnterprise(enterpriseId);
      toast.success("Xóa doanh nghiệp thành công");
      await Promise.all([fetchInteractions(), fetchEnterprises()]);
    } catch (error) {
      console.error(error);

      try {
        const relatedInteractionIds = [];
        let page = 0;
        const size = 200;

        while (true) {
          const response = await getInteractions({ page, size, enterpriseId });
          const batch = getListFromResponse(response);

          relatedInteractionIds.push(
            ...batch.map((item) => item?.id).filter((id) => id !== null && id !== undefined)
          );

          if (batch.length < size) break;
          page += 1;
        }

        if (relatedInteractionIds.length > 0) {
          await Promise.allSettled(relatedInteractionIds.map((id) => deleteInteraction(id)));
        }

        const relatedContacts = await getContactsByEnterprise(enterpriseId);
        if (relatedContacts.length > 0) {
          await Promise.allSettled(
            relatedContacts
              .map((contact) => contact?.id)
              .filter((id) => id !== null && id !== undefined)
              .map((contactId) => deleteContact(enterpriseId, contactId))
          );
        }

        await deleteEnterprise(enterpriseId);
        toast.success("Xóa doanh nghiệp thành công");
        await Promise.all([fetchInteractions(), fetchEnterprises()]);
      } catch (fallbackError) {
        console.error(fallbackError);
        toast.error(getErrorMessage(fallbackError));
      }
    }
  };

  return (
    <div className="users-page">
      <div className="header">
        <h2>Quản lý tiếp xúc</h2>

        <div className="header-actions">
          <div className="search-box">
            <svg
              className="icon-search"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="search"
              placeholder="Tìm doanh nghiệp, nhân viên, người liên hệ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button type="button" className="export-excel-btn" onClick={handleExportExcel}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
            Xuất Excel
          </button>

          <button type="button" className="add-btn" onClick={handleCreate}>
            + Thêm tiếp xúc
          </button>
        </div>
      </div>

      <div className="table-card">
        <UserTable
          interactions={enterpriseSummaries}
          onView={handleView}
          onDeleteEnterprise={handleDeleteEnterprise}
          isLoading={isLoading}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      {openModal && (
        <UserModal
          interaction={selectedInteraction}
          enterprises={enterprises}
          close={() => setOpenModal(false)}
          reload={reloadCurrentPage}
        />
      )}

      <UserDrawer
        open={openDrawer}
        interaction={viewingInteraction}
        onClose={() => setOpenDrawer(false)}
        onReload={reloadCurrentPage}
      />

    </div>
  );
}

export default Users;
