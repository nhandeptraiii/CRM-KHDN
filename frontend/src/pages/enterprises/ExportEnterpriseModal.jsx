import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

import { exportEnterprises } from "../../services/enterpriseService";

import "./ExportEnterpriseModal.scss";

function ExportEnterpriseModal({ close }) {
  const { role, region } = useSelector(
    (state) => state.auth.user || {}
  );

  const [loading, setLoading] = useState(false);

  const [selectedRegions, setSelectedRegions] = useState(
    role === "MANAGER" ? [region] : []
  );

  const [selectedTypes, setSelectedTypes] = useState([]);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const regionOptions = [
    { value: "CTO", label: "Cần Thơ" },
    { value: "HUG", label: "Hậu Giang" },
    { value: "STG", label: "Sóc Trăng" },
  ];

  const typeOptions = [
    { value: "SME", label: "SME" },
    { value: "HKD", label: "Hộ kinh doanh" },
    { value: "VNR20K", label: "VNR20K" },
    { value: "VNR2000", label: "VNR2000" },
  ];

  const toggleValue = (value, values, setValues) => {
    if (values.includes(value)) {
      setValues(values.filter((v) => v !== value));
    } else {
      setValues([...values, value]);
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      selectedRegions.forEach((r) => {
        params.append("region", r);
      });

      selectedTypes.forEach((t) => {
        params.append("type", t);
      });

      const res = await exportEnterprises(params);

      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download = "enterprises.xlsx";

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);

      toast.success("Xuất file thành công");

      close();
    } catch (err) {
      console.error(err);
      toast.error("Xuất file thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal open" onClick={close}>
      <div
        className="modal-box export-modal-box"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-title-row">
          <h3>Xuất Excel doanh nghiệp</h3>

          <button
            type="button"
            className="modal-close-btn"
            onClick={close}
          >
            ×
          </button>
        </div>

        {/* REGION */}
        <div className="export-section">
          <label className="section-title">
            Khu vực
          </label>

          <div className="checkbox-grid">
            {(role === "MANAGER"
              ? regionOptions.filter(
                  (r) => r.value === region
                )
              : regionOptions
            ).map((item) => (
              <label
                key={item.value}
                className="checkbox-item"
              >
                <input
                  type="checkbox"
                  checked={selectedRegions.includes(
                    item.value
                  )}
                  disabled={role === "MANAGER"}
                  onChange={() =>
                    toggleValue(
                      item.value,
                      selectedRegions,
                      setSelectedRegions
                    )
                  }
                />

                <span>{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* TYPE */}
        <div className="export-section">
          <label className="section-title">
            Loại doanh nghiệp
          </label>

          <div className="checkbox-grid">
            {typeOptions.map((item) => (
              <label
                key={item.value}
                className="checkbox-item"
              >
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(
                    item.value
                  )}
                  onChange={() =>
                    toggleValue(
                      item.value,
                      selectedTypes,
                      setSelectedTypes
                    )
                  }
                />

                <span>{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="modal-actions">
          <button
            className="cancel-btn"
            onClick={close}
          >
            Hủy
          </button>

          <button
            className="save-btn"
            onClick={handleExport}
            disabled={loading}
          >
            {loading
              ? "Đang xuất..."
              : "Xuất Excel"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExportEnterpriseModal;