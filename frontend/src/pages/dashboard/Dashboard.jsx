import { useEffect, useState, useMemo, useCallback } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  RadialBarChart,
  RadialBar,
  Legend,
} from "recharts";
import {
  Users,
  TrendingUp,
  Briefcase,
  Calendar,
  AlertCircle,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  X,
  Clock,
  Building2,
  User,
  ChevronRight,
  BarChart2,
} from "lucide-react";
import {
  getDashboardMetrics,
} from "../../services/dashboardService";
import styles from "./Dashboard.module.scss";

/* ─── Appointment type labels ─── */
const APPOINTMENT_TYPE_LABEL = {
  EMAIL_QUOTE: "Gửi báo giá",
  CONTRACT_SIGNING: "Ký hợp đồng",
  PHONE_CALL: "Gọi điện",
  DIRECT_VISIT: "Gặp trực tiếp",
  DEMO: "Demo sản phẩm",
  FOLLOW_UP: "Theo dõi",
  CONSULTATION: "Tư vấn",
  NEGOTIATION: "Đàm phán",
  ONLINE_MEETING: "Trực tuyến",
  OFFLINE_MEETING: "Trực tiếp",
  CUSTOMER_SUPPORT: "Hỗ trợ",
  OTHER: "Khác",
};
const getTypeLabel = (type) => APPOINTMENT_TYPE_LABEL[type] ?? type ?? "";

const STATUS_LABEL = {
  CONFIRMED: "Đã xác nhận",
  REJECTED: "Đã hủy",
  SCHEDULED: "Lên lịch",
  REMINDED: "Đã nhắc nhở",
  PENDING: "Chờ xác nhận",
};

/* ─── Format helpers ─── */
const formatTime = (scheduledTime) => {
  if (!scheduledTime) return "--:--";
  if (Array.isArray(scheduledTime)) {
    const [, , , h = 0, m = 0] = scheduledTime;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  const d = new Date(scheduledTime);
  if (isNaN(d)) return "--:--";
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const [, month, day] = parts;
    return `${day}/${month}`;
  }
  return dateStr;
};

const formatFullDate = (dateStr) => {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateStr;
};

/* ─── Region config ─── */
const REGION_CONFIG = {
  CTO: {
    label: "Cần Thơ",
    color: "#c8102e",
    lightColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  HUG: {
    label: "Hậu Giang",
    color: "#e53e3e",
    lightColor: "#fff5f5",
    borderColor: "#fed7d7",
  },
  STG: {
    label: "Sóc Trăng",
    color: "#f87171",
    lightColor: "#fef2f2",
    borderColor: "#fca5a5",
  },
};

const ENTERPRISE_TYPE_LABEL = {
  SME: "SME",
  HKD: "HKD",
  VNR2000: "VNR 2000",
  VNR20K: "VNR 20K",
};

const TYPE_COLORS = {
  SME: "#c8102e",
  HKD: "#f87171",
  VNR2000: "#1d4ed8",
  VNR20K: "#7c3aed",
};

/* ─────────────────────────────────────────────────────────────────────────────
   DeltaBadge
─────────────────────────────────────────────────────────────────────────── */
const DeltaBadge = ({ current, previous, invertColor = false }) => {
  if (previous == null) return null;
  const diff = current - previous;
  const pct =
    previous === 0
      ? diff !== 0
        ? 100
        : 0
      : Math.abs(Math.round((diff / previous) * 100));

  if (diff > 0) {
    return (
      <span
        className={`${styles.deltaBadge} ${invertColor ? styles.deltaUpInvert : styles.deltaUp}`}
      >
        <ArrowUpRight size={11} strokeWidth={2.5} />+{diff}&nbsp;·&nbsp;{pct}
        %&nbsp;
        <span className={styles.deltaSuffix}>vs tháng trước</span>
      </span>
    );
  }
  if (diff < 0) {
    return (
      <span
        className={`${styles.deltaBadge} ${invertColor ? styles.deltaDownInvert : styles.deltaDown}`}
      >
        <ArrowDownRight size={11} strokeWidth={2.5} />
        {diff}&nbsp;·&nbsp;{pct}%&nbsp;
        <span className={styles.deltaSuffix}>vs tháng trước</span>
      </span>
    );
  }
  return (
    <span className={`${styles.deltaBadge} ${styles.deltaFlat}`}>
      <Minus size={11} strokeWidth={2.5} />
      Không đổi&nbsp;<span className={styles.deltaSuffix}>vs tháng trước</span>
    </span>
  );
};

/* ─── Tooltips ─── */
const BarTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className={styles.barTooltip}>
      <span className={styles.barTooltipName}>{d.employeeName}</span>
      <span className={styles.barTooltipVal}>
        {d.interactionCount} doanh nghiệp
      </span>
    </div>
  );
};

const RegionTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const cfg = REGION_CONFIG[d.region] || {};
  return (
    <div className={styles.barTooltip}>
      <span className={styles.barTooltipName}>{cfg.label || d.region}</span>
      <span className={styles.barTooltipVal}>
        Tổng: {d.totalEnterprises} DN
      </span>
      <span className={styles.barTooltipSub}>
        Đã tiếp xúc: {d.contacted} DN
      </span>
      <span className={styles.barTooltipSub}>
        Chưa tiếp xúc: {d.notContacted} DN
      </span>
    </div>
  );
};

const TrendTooltip = ({ active, payload, label, month }) => {
  if (!active || !payload?.length) return null;
  const cur = payload.find((p) => p.dataKey === "cumContacted");
  const prev = payload.find((p) => p.dataKey === "cumPrev");
  const diff = (cur?.value ?? 0) - (prev?.value ?? 0);
  return (
    <div className={styles.trendTooltip}>
      <span className={styles.trendTooltipDay}>
        Ngày {label} tháng {month}
      </span>
      <div className={styles.trendTooltipRow}>
        <span style={{ color: "#c8102e" }}>Tháng {month}</span>
        <strong>{cur?.value ?? 0} DN</strong>
      </div>
      <div className={styles.trendTooltipRow}>
        <span style={{ color: "#94a3b8" }}>Tháng trước</span>
        <strong>{prev?.value ?? 0} DN</strong>
      </div>
      <div className={`${styles.trendTooltipRow} ${styles.trendTooltipDiff}`}>
        <span>Chênh lệch</span>
        <strong style={{ color: diff >= 0 ? "#16a34a" : "#c8102e" }}>
          {diff >= 0 ? "+" : ""}
          {diff} DN
        </strong>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   AppointmentDetailModal
─────────────────────────────────────────────────────────────────────────── */
const AppointmentDetailModal = ({ appointment, dayLabel, date, onClose }) => {
  if (!appointment) return null;

  const statusClass = appointment.status?.toLowerCase();
  const statusLabel = STATUS_LABEL[appointment.status] || appointment.status;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <div className={styles.modalDateBadge}>
              <span className={styles.modalTime}>
                {formatTime(appointment.scheduledTime)}
              </span>
              <span className={styles.modalDateText}>
                {formatFullDate(date)}
              </span>
              <span className={styles.modalDow}>{dayLabel}</span>
            </div>
            <div>
              <h3 className={styles.modalTitle}>
                {appointment.enterpriseName}
              </h3>
              <span
                className={`${styles.modalStatus} ${styles[`status_${statusClass}`]}`}
              >
                {statusLabel}
              </span>
            </div>
          </div>
          <button className={styles.modalCloseBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          <div className={styles.modalInfoGrid}>
            <div className={styles.modalInfoItem}>
              <div className={styles.modalInfoIcon}>
                <User size={14} />
              </div>
              <div>
                <span className={styles.modalInfoLabel}>Tư vấn viên</span>
                <span className={styles.modalInfoValue}>
                  {appointment.consultantName || "—"}
                </span>
              </div>
            </div>
            <div className={styles.modalInfoItem}>
              <div className={styles.modalInfoIcon}>
                <Clock size={14} />
              </div>
              <div>
                <span className={styles.modalInfoLabel}>Thời gian</span>
                <span className={styles.modalInfoValue}>
                  {formatTime(appointment.scheduledTime)} ·{" "}
                  {formatFullDate(date)}
                </span>
              </div>
            </div>
            <div className={styles.modalInfoItem}>
              <div className={styles.modalInfoIcon}>
                <Briefcase size={14} />
              </div>
              <div>
                <span className={styles.modalInfoLabel}>Hình thức</span>
                <span className={styles.modalInfoValue}>
                  {getTypeLabel(appointment.appointmentType)}
                </span>
              </div>
            </div>
            <div className={styles.modalInfoItem}>
              <div className={styles.modalInfoIcon}>
                <Building2 size={14} />
              </div>
              <div>
                <span className={styles.modalInfoLabel}>Doanh nghiệp</span>
                <span className={styles.modalInfoValue}>
                  {appointment.enterpriseName || "—"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.modalCloseAction} onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   RegionDetailCard — card cho CTO / HUG / STG
─────────────────────────────────────────────────────────────────────────── */
const RegionDetailCard = ({ data, month }) => {
  const cfg = REGION_CONFIG[data.region] || {
    label: data.region,
    color: "#c8102e",
  };
  const contactPct =
    data.totalEnterprises > 0
      ? Math.round((data.contacted / data.totalEnterprises) * 100)
      : 0;

  // Cluster bar data
  const clusterData = (data.clusters || []).map((c) => ({
    name: c.clusterName,
    total: c.total,
    contacted: c.contacted,
    notContacted: c.total - c.contacted,
  }));

  // Type pie data
  const typeData = Object.entries(data.byType || {})
    .map(([type, count]) => ({
      name: ENTERPRISE_TYPE_LABEL[type] || type,
      value: count,
      color: TYPE_COLORS[type] || "#94a3b8",
    }))
    .filter((d) => d.value > 0);

  return (
    <div className={styles.regionDetailCard}>
      {/* Card header */}
      <div className={styles.rdcHeader} style={{ borderLeftColor: cfg.color }}>
        <div className={styles.rdcHeaderLeft}>
          <div
            className={styles.rdcRegionDot}
            style={{ background: cfg.color }}
          />
          <div>
            <h4 className={styles.rdcTitle}>{cfg.label}</h4>
            <span className={styles.rdcSubtitle}>Tháng {month}</span>
          </div>
        </div>
        <div className={styles.rdcKpi}>
          <span className={styles.rdcKpiVal} style={{ color: cfg.color }}>
            {data.contacted}
          </span>
          <span className={styles.rdcKpiLabel}>
            / {data.totalEnterprises} DN
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className={styles.rdcProgressWrap}>
        <div className={styles.rdcProgressBg}>
          <div
            className={styles.rdcProgressFill}
            style={{ width: `${contactPct}%`, background: cfg.color }}
          />
        </div>
        <span className={styles.rdcProgressPct}>{contactPct}% đã tiếp xúc</span>
      </div>

      {/* Two columns: cluster chart + type donut */}
      <div className={styles.rdcCharts}>
        {/* Cluster stacked bar */}
        <div className={styles.rdcClusterSection}>
          <span className={styles.rdcChartTitle}>
            <BarChart2 size={12} /> Tiếp xúc theo cụm
          </span>
          {clusterData.length > 0 ? (
            <ResponsiveContainer
              width="100%"
              height={clusterData.length * 32 + 24}
            >
              <BarChart
                data={clusterData}
                layout="vertical"
                margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                barSize={10}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  width={80}
                />
                <Tooltip
                  formatter={(val, name) => [
                    val,
                    name === "contacted" ? "Đã tiếp xúc" : "Chưa tiếp xúc",
                  ]}
                  contentStyle={{ fontSize: 11, padding: "4px 10px" }}
                />
                <Bar
                  dataKey="contacted"
                  name="Đã tiếp xúc"
                  fill={cfg.color}
                  radius={[0, 3, 3, 0]}
                  stackId="a"
                />
                <Bar
                  dataKey="notContacted"
                  name="Chưa tiếp xúc"
                  fill="#f1f5f9"
                  radius={[0, 3, 3, 0]}
                  stackId="a"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className={styles.rdcEmpty}>Không có dữ liệu</p>
          )}
        </div>

        {/* Type donut */}
        <div className={styles.rdcTypeSection}>
          <span className={styles.rdcChartTitle}>Theo loại DN</span>
          {typeData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={110}>
                <PieChart>
                  <Pie
                    data={typeData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={28}
                    outerRadius={44}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {typeData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [`${val} DN`]}
                    contentStyle={{ fontSize: 11, padding: "4px 10px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className={styles.rdcTypeLegend}>
                {typeData.map((d, i) => (
                  <div key={i} className={styles.rdcTypeLegendItem}>
                    <span
                      className={styles.rdcTypeDot}
                      style={{ background: d.color }}
                    />
                    <span className={styles.rdcTypeName}>{d.name}</span>
                    <span className={styles.rdcTypeVal}>{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className={styles.rdcEmpty}>Không có dữ liệu</p>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   Main Dashboard Component
─────────────────────────────────────────────────────────────────────────── */
function Dashboard() {
  const [displayMetrics, setDisplayMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  // Modal state
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedDayLabel, setSelectedDayLabel] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [dashRes] = await Promise.all([
          getDashboardMetrics(filter.month, filter.year)
        ]);
        const actualData = dashRes.data?.data || dashRes.data;
        if (isMounted) {
          setDisplayMetrics(actualData);
        }
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [filter]);

  const handleAppointmentClick = useCallback((app, dayLabel, date) => {
    setSelectedAppointment(app);
    setSelectedDayLabel(dayLabel);
    setSelectedDate(date);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedAppointment(null);
  }, []);

  /* ── Derived data ── */
  const interactionPct = useMemo(() => {
    if (!displayMetrics?.totalEnterprises) return 0;
    return Math.round(
      (displayMetrics.totalInteractedEnterprises /
        displayMetrics.totalEnterprises) *
        100,
    );
  }, [displayMetrics]);

  // FIX: pie data must always sum correctly; use explicit two-slice approach
  const interactionPieData = useMemo(() => {
    if (!displayMetrics)
      return [
        { name: "Đã tương tác", value: 0 },
        { name: "Chưa", value: 1 },
      ];
    const contacted = displayMetrics.totalInteractedEnterprises || 0;
    const total = displayMetrics.totalEnterprises || 0;
    const notContacted = Math.max(0, total - contacted);
    // Ensure we never have both zero (pie would render nothing)
    if (total === 0) return [{ name: "Chưa tương tác", value: 1 }];
    return [
      { name: "Đã tương tác", value: contacted },
      { name: "Chưa tương tác", value: notContacted },
    ];
  }, [displayMetrics]);

  const weeklyAppointments = useMemo(() => {
    if (!displayMetrics?.weeklyCalendar?.length) return [];
    return displayMetrics.weeklyCalendar.flatMap((day) =>
      (day.appointments || []).map((app) => ({
        ...app,
        _dayLabel: day.dayOfWeek,
        _date: day.date,
      })),
    );
  }, [displayMetrics]);

  const trendStats = useMemo(() => {
    const trend = displayMetrics?.monthlyTrend;
    if (!trend?.length)
      return { curMtd: 0, prevMtd: 0, diff: 0, pct: 0, completionPct: 0 };
    const last = trend[trend.length - 1];
    const curMtd = last.cumContacted;
    const prevMtd = last.cumPrev;
    const diff = curMtd - prevMtd;
    const pct = prevMtd > 0 ? Math.round((diff / prevMtd) * 100) : 0;
    const daysInMonth = new Date(filter.year, filter.month, 0).getDate();
    const avgPerDay = prevMtd > 0 ? prevMtd / trend.length : 0;
    const projected = Math.round(avgPerDay * daysInMonth);
    const completionPct =
      projected > 0 ? Math.round((curMtd / projected) * 100) : 0;
    return { curMtd, prevMtd, diff, pct, completionPct };
  }, [displayMetrics, filter]);

  if (isLoading || !displayMetrics) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner} />
        <span>Đang tải dữ liệu...</span>
      </div>
    );
  }

  const PIE_COLORS = ["#c8102e", "#f1f5f9"];
  const REGION_COLORS = ["#c8102e", "#e53e3e", "#f87171", "#fca5a5"];
  const prev = displayMetrics.previousMonth ?? {};

  return (
    <div className={styles.dashboardContainer}>
      {/* ── APPOINTMENT MODAL ── */}
      {selectedAppointment && (
        <AppointmentDetailModal
          appointment={selectedAppointment}
          dayLabel={selectedDayLabel}
          date={selectedDate}
          onClose={closeModal}
        />
      )}

      {/* ── HEADER ── */}
      <header className={styles.dashboardHeader}>
        <div>
          <h1 className={styles.title}>CRM Analytics</h1>
          <p className={styles.subtitle}>
            Hiệu suất kinh doanh tháng {filter.month}/{filter.year}
          </p>
        </div>
        <div className={styles.filterGroup}>
          <div className={styles.selectWrapper}>
            <select
              className={styles.filterSelect}
              value={filter.month}
              onChange={(e) => setFilter({ ...filter, month: +e.target.value })}
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  Tháng {i + 1}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.selectWrapper}>
            <select
              className={styles.filterSelect}
              value={filter.year}
              onChange={(e) => setFilter({ ...filter, year: +e.target.value })}
            >
              {[2024, 2025, 2026].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* ── KPI ROW ── */}
      <div className={styles.kpiRow}>
        {/* Hero card */}
        <div className={styles.interactionCard}>
          <div className={styles.interactionMeta}>
            <label className={styles.cardLabel}>Tỷ lệ tương tác DN</label>
            <div className={styles.interactionValue}>
              {displayMetrics.totalInteractedEnterprises}
            </div>
            <div className={styles.interactionSub}>
              Trên tổng số <strong>{displayMetrics.totalEnterprises}</strong>{" "}
              doanh nghiệp
            </div>
            <DeltaBadge
              current={displayMetrics.totalInteractedEnterprises}
              previous={prev.totalInteractedEnterprises}
              invertColor
            />
          </div>
          <div className={styles.pieWrap}>
            <PieChart width={110} height={110}>
              <Pie
                data={interactionPieData}
                innerRadius={36}
                outerRadius={50}
                dataKey="value"
                stroke="none"
                startAngle={90}
                endAngle={-270}
              >
                {interactionPieData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={i === 0 ? "#ffffff" : "rgba(255,255,255,0.2)"}
                  />
                ))}
              </Pie>
            </PieChart>
            <span className={styles.pct}>{interactionPct}%</span>
          </div>
        </div>

        {/* Mini KPI cards */}
        <div className={styles.miniCard}>
          <Building2 className={styles.miniIcon} size={16} />
          <label>Tổng số DN</label>
          <div className={styles.miniVal}>{displayMetrics.totalEnterprises ?? 0}</div>
        </div>

        <div className={styles.miniCard} style={{ padding: "12px 16px" }}>
          <BarChart2 className={styles.miniIcon} size={16} />
          <label>Phân loại DN</label>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginTop: "6px" }}>
            {[
              { key: "totalSme",  label: "SME",     color: "#e53e3e" },
              { key: "totalHkd",  label: "HKD",     color: "#f87171" },
              { key: "total2000", label: "VNR 2000", color: "#1d4ed8" },
              { key: "total20k",  label: "VNR 20K",  color: "#7c3aed" },
            ].map(({ key, label, color }) => (
              <div
                key={key}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "11px",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "5px", color: "#555" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block", flexShrink: 0 }} />
                  {label}
                </span>
                <span style={{ fontWeight: 700, color }}>{displayMetrics[key] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.miniCard}>
          <TrendingUp className={styles.miniIcon} size={16} />
          <label>Tiếp xúc trong tháng</label>
          <div className={styles.miniVal}>
            {displayMetrics.contactedEnterprisesThisMonth ?? 0}
          </div>
          <DeltaBadge
            current={displayMetrics.contactedEnterprisesThisMonth ?? 0}
            previous={prev.contactedEnterprisesThisMonth}
          />
        </div>

        <div className={styles.miniCard}>
          <Calendar className={styles.miniIcon} size={16} />
          <label>Lịch hẹn tuần này</label>
          <div className={styles.miniVal}>
            {displayMetrics.appointmentsThisWeek ?? 0}
          </div>
          <DeltaBadge
            current={displayMetrics.appointmentsThisWeek ?? 0}
            previous={prev.appointmentsThisWeek}
          />
        </div>
      </div>

      {/* ── MONTHLY TREND ── */}
      {displayMetrics.monthlyTrend?.length > 0 && (
        <div className={styles.trendBox}>
          <div className={styles.trendHeader}>
            <h3 className={styles.sectionTitle}>
              <TrendingUp size={16} strokeWidth={2} />
              Lũy kế tiếp xúc DN trong tháng
            </h3>
            <div className={styles.trendLegend}>
              <span
                className={styles.legendLine}
                style={{ background: "#c8102e" }}
              />
              <span>Tháng {filter.month}</span>
              <span
                className={styles.legendLine}
                style={{
                  background:
                    "repeating-linear-gradient(to right,#94a3b8 0,#94a3b8 5px,transparent 5px,transparent 8px)",
                }}
              />
              <span>Tháng trước</span>
            </div>
          </div>

          <div className={styles.trendStats}>
            <div className={styles.trendStat}>
              <span className={styles.trendStatLabel}>
                Tháng {filter.month} (MTD)
              </span>
              <span className={styles.trendStatVal}>{trendStats.curMtd}</span>
              {trendStats.prevMtd > 0 && (
                <span
                  className={`${styles.trendDelta} ${trendStats.diff >= 0 ? styles.trendDeltaUp : styles.trendDeltaDown}`}
                >
                  {trendStats.diff >= 0 ? "▲" : "▼"}&nbsp;
                  {trendStats.diff >= 0 ? "+" : ""}
                  {trendStats.diff}&nbsp; ({trendStats.diff >= 0 ? "+" : ""}
                  {trendStats.pct}% vs tháng trước)
                </span>
              )}
            </div>
            <div className={styles.trendStat}>
              <span className={styles.trendStatLabel}>
                Tháng trước (cùng kỳ)
              </span>
              <span className={styles.trendStatVal}>{trendStats.prevMtd}</span>
            </div>
            <div className={styles.trendStat}>
              <span className={styles.trendStatLabel}>
                Tỷ lệ hoàn thành dự kiến
              </span>
              <span
                className={`${styles.trendStatVal} ${trendStats.completionPct >= 100 ? styles.trendStatGreen : ""}`}
              >
                {trendStats.completionPct}%
              </span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={180}>
            <LineChart
              data={displayMetrics.monthlyTrend}
              margin={{ top: 8, right: 16, left: -8, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f0f0f0"
              />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                interval={Math.floor(displayMetrics.monthlyTrend.length / 8)}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<TrendTooltip month={filter.month} />}
                cursor={{ stroke: "#e2e8f0", strokeWidth: 1 }}
              />
              <Line
                type="monotone"
                dataKey="cumContacted"
                stroke="#c8102e"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, fill: "#c8102e", strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="cumPrev"
                stroke="#94a3b8"
                strokeWidth={1.5}
                strokeDasharray="5 3"
                dot={false}
                activeDot={{ r: 3, fill: "#94a3b8", strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── BOTTOM GRID ── */}
      <div className={styles.bottomGrid}>
        {/* Hiệu suất nhân viên */}
        <div className={styles.chartBox}>
          <h3 className={styles.sectionTitle}>Hiệu suất tiếp xúc nhân viên</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={displayMetrics.employeeStats}
              margin={{ top: 8, right: 16, left: -8, bottom: 0 }}
              barSize={36}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f0f0f0"
              />
              <XAxis
                dataKey="employeeName"
                tick={{ fontSize: 12, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<BarTooltip />}
                cursor={{ fill: "rgba(200,16,46,0.06)" }}
              />
              <Bar
                dataKey="interactionCount"
                fill="#c8102e"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ── Phân bổ khu vực — FIX: dùng fixed width PieChart thay vì ResponsiveContainer ── */}
        <div className={styles.chartBox}>
          <h3 className={styles.sectionTitle}>
            <MapPin size={16} strokeWidth={2} />
            Phân bổ theo khu vực
          </h3>
          <div className={styles.regionSummary}>
            {displayMetrics.regionDistribution?.map((r, i) => {
              const cfg = REGION_CONFIG[r.region] || {};
              const pct = r.totalEnterprises
                ? Math.round((r.contacted / r.totalEnterprises) * 100)
                : 0;
              return (
                <div key={r.region} className={styles.regionRow}>
                  <span
                    className={styles.regionDot}
                    style={{
                      background: REGION_COLORS[i % REGION_COLORS.length],
                    }}
                  />
                  <span className={styles.regionName}>
                    {cfg.label || r.region}
                  </span>
                  <span className={styles.regionContacted}>
                    Tiếp xúc <strong>{r.contacted}</strong>/{r.totalEnterprises}{" "}
                    DN trong tháng
                  </span>
                  <span className={styles.regionPct}>{pct}%</span>
                </div>
              );
            })}
          </div>
          {/* FIX: sử dụng div có chiều cao cố định và overflow hidden để tránh lỗi layout */}
          <div className={styles.pieChartWrap}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={displayMetrics.regionDistribution}
                  dataKey="totalEnterprises"
                  nameKey="region"
                  cx="50%"
                  cy="50%"
                  outerRadius={72}
                  innerRadius={30}
                  paddingAngle={2}
                  label={({ region, percent }) => {
                    const cfg = REGION_CONFIG[region] || {};
                    return percent > 0.03
                      ? `${cfg.label || region} ${(percent * 100).toFixed(0)}%`
                      : "";
                  }}
                  labelLine={{ stroke: "#cbd5e1", strokeWidth: 1 }}
                >
                  {displayMetrics.regionDistribution?.map((_, i) => (
                    <Cell
                      key={i}
                      fill={REGION_COLORS[i % REGION_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<RegionTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lịch hẹn trong tuần — clickable */}
        <div className={styles.listBox}>
          <h3 className={styles.sectionTitle}>
            <Calendar size={16} strokeWidth={2} />
            Lịch hẹn trong tuần
          </h3>
          <div className={styles.scrollList}>
            {weeklyAppointments.length ? (
              weeklyAppointments.map((app, idx) => (
                <div
                  key={idx}
                  className={`${styles.appItem} ${styles.appItemClickable}`}
                  onClick={() =>
                    handleAppointmentClick(app, app._dayLabel, app._date)
                  }
                >
                  <div className={styles.appDateBadge}>
                    <span className={styles.appTime}>
                      {formatTime(app.scheduledTime)}
                    </span>
                    <span className={styles.appDate}>
                      {formatDate(app._date)}
                    </span>
                    <span className={styles.appDow}>{app._dayLabel}</span>
                  </div>
                  <div className={styles.appInfo}>
                    <strong>{app.enterpriseName}</strong>
                    <p>
                      {getTypeLabel(app.appointmentType) || app.consultantName}
                    </p>
                  </div>
                  <ChevronRight size={14} className={styles.appChevron} />
                </div>
              ))
            ) : (
              <p className={styles.emptyNote}>
                Không có lịch hẹn nào trong tuần này.
              </p>
            )}
          </div>
        </div>

        {/* Cảnh báo DN chưa tiếp xúc */}
        <div className={`${styles.listBox} ${styles.warningBox}`}>
          <h3 className={styles.sectionTitle}>
            <AlertCircle
              size={16}
              strokeWidth={2}
              className={styles.warnIcon}
            />
            Cảnh báo DN 2000/20K chưa tiếp xúc
          </h3>
          <div className={styles.warnSummary}>
            Các doanh nghiệp thuộc danh sách ưu tiên <strong>VNR2000</strong> và{" "}
            <strong>VNR20K</strong> chưa có{" "}
            <strong>bất kỳ lần tiếp xúc nào</strong> được ghi nhận. Cần ưu tiên
            liên hệ sớm.
          </div>
          <div className={styles.scrollList}>
            {displayMetrics.uncontactedEnterprises?.length ? (
              displayMetrics.uncontactedEnterprises.map((ent) => (
                <div key={ent.enterpriseId} className={styles.warningItem}>
                  <div className={styles.warnBadge}>{ent.type}</div>
                  <div className={styles.entMain}>
                    <strong>{ent.enterpriseName}</strong>
                    <span>
                      <MapPin
                        size={10}
                        style={{ display: "inline", marginRight: 3 }}
                      />
                      {ent.region} · {ent.consultantName}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className={styles.emptyNote}>
                Không có doanh nghiệp nào cần cảnh báo.
              </p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

export default Dashboard;
