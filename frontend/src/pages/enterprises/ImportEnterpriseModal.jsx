import { useEffect, useState } from "react";
import { importEnterprises } from "../../services/enterpriseService";
import { toast } from "react-toastify";
import "./ImportEnterpriseModal.scss"

function ImportEnterpriseModal({ close, reload }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    if (!file) {
      toast.error("Vui lòng chọn file Excel");
      return;
    }

    try {
      setLoading(true); // ✅ bắt đầu loading

      const res = await importEnterprises(file);

      const data = res.data?.data || {};
      const successCount = data.successCount || 0;
      const failCount = data.failCount || 0;
      const errors = data.errors || [];

      if (successCount > 0) {
        toast.success(`Import thành công ${successCount} doanh nghiệp`);
      }

      if (failCount > 0 && errors.length > 0) {
        setTimeout(() => {
         toast.error(
  <div className="custom-toast">
    <div className="toast-header">
      <span>Lỗi import dữ liệu</span>
    </div>

    <div className="toast-body">
      {errors.map((e, i) => (
        <div key={i} className="toast-row">
          Dòng {e.rowNumber}: {e.errorMessage}
        </div>
      ))}
    </div>
  </div>,
  {
    autoClose: false,
    closeButton: true,
    className: "toast-wrapper"
  }
);
        }, 500);
      }

      if (successCount > 0) {
        reload();
        close();
      }

    } catch (err) {
      console.error(err);
      toast.error("Import thất bại");
    } finally {
      setLoading(false);
    }
  };
useEffect(() => {
  document.body.style.overflow = "hidden";
  return () => {
    document.body.style.overflow = "";
  };
}, []);
  return (
    <div className="modal open" onClick={close}>
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Đang import dữ liệu, vui lòng chờ...</p>
        </div>
      )}
  <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>Import doanh nghiệp</h3>

        <input
          type="file"
          accept=".xlsx"
          onChange={(e) => setFile(e.target.files[0])}
        />

        <div className="modal-actions">
          <button className="cancel-btn" onClick={close}>
            Hủy
          </button>

          <button
            className="save-btn"
            onClick={handleImport}
            disabled={loading}
          >
            {loading ? "Đang import..." : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImportEnterpriseModal;