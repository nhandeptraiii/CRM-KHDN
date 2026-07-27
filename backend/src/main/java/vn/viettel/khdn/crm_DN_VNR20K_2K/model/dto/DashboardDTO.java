package vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto;

import java.time.LocalDateTime;
import java.util.List;

public class DashboardDTO {

    private long totalUsers;
    private long totalEnterprises;
    private long totalServices;
    private long activeServices;
    private long totalInteractedEnterprises;
    private List<EmployeeInteractionDTO> employeeStats;
    private long totalActiveEmployees;

    // ─── KPI Cards ────────────────────────────────────
    private long totalSme;
    private long totalHkd;
    private long total2000;
    private long total20k;
    private long newEnterprisesLast30Days;
    private long contactedEnterprisesThisMonth;
    private long appointmentsThisWeek;
    private double conversionRate;

    // ─── Phân bổ theo khu vực ─────────────────────────
    private List<RegionDistributionDTO> regionDistribution;

    // ─── Lịch hẹn sắp tới ─────────────────────────────
    private List<AppointmentItemDTO> todayAppointments;
    private List<AppointmentItemDTO> tomorrowAppointments;

    // ─── Lịch tuần (7 ngày T2→CN) ─────────────────────
    private List<DayAppointmentsDTO> weeklyCalendar;

    // ─── Cảnh báo DN chưa tiếp xúc ────────────────────
    private long uncontacted2000Count;
    private long uncontacted20kCount;
    private List<UncontactedEnterpriseDTO> uncontactedEnterprises;

    // ─── MỚI: Lũy kế tiếp xúc so tháng trước ─────────
    private List<MonthlyTrendDTO> monthlyTrend;

    // ══════════════════════════════════════════════════
    // Inner DTOs
    // ══════════════════════════════════════════════════

    public static class MonthlyTrendDTO {
        private int day; // ngày 1..31
        private long cumContacted; // lũy kế DN tiếp xúc tính đến ngày đó (tháng hiện tại)
        private long cumPrev; // lũy kế tháng trước (cùng ngày)

        public MonthlyTrendDTO() {}

        public MonthlyTrendDTO(int day, long cumContacted, long cumPrev) {
            this.day = day;
            this.cumContacted = cumContacted;
            this.cumPrev = cumPrev;
        }

        public int getDay() {
            return day;
        }

        public void setDay(int day) {
            this.day = day;
        }

        public long getCumContacted() {
            return cumContacted;
        }

        public void setCumContacted(long cumContacted) {
            this.cumContacted = cumContacted;
        }

        public long getCumPrev() {
            return cumPrev;
        }

        public void setCumPrev(long cumPrev) {
            this.cumPrev = cumPrev;
        }
    }

    public static class RegionDistributionDTO {
        private String region;
        private long totalEnterprises;
        private long contacted;
        private long notContacted;

        public RegionDistributionDTO() {}

        public RegionDistributionDTO(String region, long totalEnterprises, long contacted,
                long notContacted) {
            this.region = region;
            this.totalEnterprises = totalEnterprises;
            this.contacted = contacted;
            this.notContacted = notContacted;
        }

        public String getRegion() {
            return region;
        }

        public void setRegion(String region) {
            this.region = region;
        }

        public long getTotalEnterprises() {
            return totalEnterprises;
        }

        public void setTotalEnterprises(long totalEnterprises) {
            this.totalEnterprises = totalEnterprises;
        }

        public long getContacted() {
            return contacted;
        }

        public void setContacted(long contacted) {
            this.contacted = contacted;
        }

        public long getNotContacted() {
            return notContacted;
        }

        public void setNotContacted(long notContacted) {
            this.notContacted = notContacted;
        }
    }

    public static class AppointmentItemDTO {
        private Long appointmentId;
        private String enterpriseName;
        private String consultantName;
        private LocalDateTime scheduledTime;
        private String status;
        private String appointmentType;

        public AppointmentItemDTO() {}

        public AppointmentItemDTO(Long appointmentId, String enterpriseName, String consultantName,
                LocalDateTime scheduledTime, String status, String appointmentType) {
            this.appointmentId = appointmentId;
            this.enterpriseName = enterpriseName;
            this.consultantName = consultantName;
            this.scheduledTime = scheduledTime;
            this.status = status;
            this.appointmentType = appointmentType;
        }

        public Long getAppointmentId() {
            return appointmentId;
        }

        public void setAppointmentId(Long appointmentId) {
            this.appointmentId = appointmentId;
        }

        public String getEnterpriseName() {
            return enterpriseName;
        }

        public void setEnterpriseName(String enterpriseName) {
            this.enterpriseName = enterpriseName;
        }

        public String getConsultantName() {
            return consultantName;
        }

        public void setConsultantName(String consultantName) {
            this.consultantName = consultantName;
        }

        public LocalDateTime getScheduledTime() {
            return scheduledTime;
        }

        public void setScheduledTime(LocalDateTime scheduledTime) {
            this.scheduledTime = scheduledTime;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public String getAppointmentType() {
            return appointmentType;
        }

        public void setAppointmentType(String appointmentType) {
            this.appointmentType = appointmentType;
        }
    }

    public static class DayAppointmentsDTO {
        private String date; // yyyy-MM-dd
        private String dayOfWeek; // Thứ 2, Thứ 3, ...
        private long count;
        private List<AppointmentItemDTO> appointments;

        public DayAppointmentsDTO() {}

        public DayAppointmentsDTO(String date, String dayOfWeek, long count,
                List<AppointmentItemDTO> appointments) {
            this.date = date;
            this.dayOfWeek = dayOfWeek;
            this.count = count;
            this.appointments = appointments;
        }

        public String getDate() {
            return date;
        }

        public void setDate(String date) {
            this.date = date;
        }

        public String getDayOfWeek() {
            return dayOfWeek;
        }

        public void setDayOfWeek(String dayOfWeek) {
            this.dayOfWeek = dayOfWeek;
        }

        public long getCount() {
            return count;
        }

        public void setCount(long count) {
            this.count = count;
        }

        public List<AppointmentItemDTO> getAppointments() {
            return appointments;
        }

        public void setAppointments(List<AppointmentItemDTO> appointments) {
            this.appointments = appointments;
        }
    }

    public static class UncontactedEnterpriseDTO {
        private Long enterpriseId;
        private String enterpriseName;
        private String taxCode;
        private String type; // "2000" hoặc "20K"
        private String region;
        private String consultantName;

        public UncontactedEnterpriseDTO() {}

        public UncontactedEnterpriseDTO(Long enterpriseId, String enterpriseName, String taxCode,
                String type, String region, String consultantName) {
            this.enterpriseId = enterpriseId;
            this.enterpriseName = enterpriseName;
            this.taxCode = taxCode;
            this.type = type;
            this.region = region;
            this.consultantName = consultantName;
        }

        public Long getEnterpriseId() {
            return enterpriseId;
        }

        public void setEnterpriseId(Long enterpriseId) {
            this.enterpriseId = enterpriseId;
        }

        public String getEnterpriseName() {
            return enterpriseName;
        }

        public void setEnterpriseName(String enterpriseName) {
            this.enterpriseName = enterpriseName;
        }

        public String getTaxCode() {
            return taxCode;
        }

        public void setTaxCode(String taxCode) {
            this.taxCode = taxCode;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public String getRegion() {
            return region;
        }

        public void setRegion(String region) {
            this.region = region;
        }

        public String getConsultantName() {
            return consultantName;
        }

        public void setConsultantName(String consultantName) {
            this.consultantName = consultantName;
        }
    }

    // ══════════════════════════════════════════════════
    // Getters / Setters
    // ══════════════════════════════════════════════════

    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public long getTotalEnterprises() {
        return totalEnterprises;
    }

    public void setTotalEnterprises(long totalEnterprises) {
        this.totalEnterprises = totalEnterprises;
    }

    public long getTotalServices() {
        return totalServices;
    }

    public void setTotalServices(long totalServices) {
        this.totalServices = totalServices;
    }

    public long getActiveServices() {
        return activeServices;
    }

    public void setActiveServices(long activeServices) {
        this.activeServices = activeServices;
    }

    public long getTotalInteractedEnterprises() {
        return totalInteractedEnterprises;
    }

    public void setTotalInteractedEnterprises(long totalInteractedEnterprises) {
        this.totalInteractedEnterprises = totalInteractedEnterprises;
    }

    public List<EmployeeInteractionDTO> getEmployeeStats() {
        return employeeStats;
    }

    public void setEmployeeStats(List<EmployeeInteractionDTO> employeeStats) {
        this.employeeStats = employeeStats;
    }

    public long getTotalActiveEmployees() {
        return totalActiveEmployees;
    }

    public void setTotalActiveEmployees(long totalActiveEmployees) {
        this.totalActiveEmployees = totalActiveEmployees;
    }

    public long getTotalSme() {
        return totalSme;
    }

    public void setTotalSme(long totalSme) {
        this.totalSme = totalSme;
    }

    public long getTotalHkd() {
        return totalHkd;
    }

    public void setTotalHkd(long totalHkd) {
        this.totalHkd = totalHkd;
    }

    public long getTotal2000() {
        return total2000;
    }

    public void setTotal2000(long total2000) {
        this.total2000 = total2000;
    }

    public long getTotal20k() {
        return total20k;
    }

    public void setTotal20k(long total20k) {
        this.total20k = total20k;
    }

    public long getNewEnterprisesLast30Days() {
        return newEnterprisesLast30Days;
    }

    public void setNewEnterprisesLast30Days(long newEnterprisesLast30Days) {
        this.newEnterprisesLast30Days = newEnterprisesLast30Days;
    }

    public long getContactedEnterprisesThisMonth() {
        return contactedEnterprisesThisMonth;
    }

    public void setContactedEnterprisesThisMonth(long contactedEnterprisesThisMonth) {
        this.contactedEnterprisesThisMonth = contactedEnterprisesThisMonth;
    }

    public long getAppointmentsThisWeek() {
        return appointmentsThisWeek;
    }

    public void setAppointmentsThisWeek(long appointmentsThisWeek) {
        this.appointmentsThisWeek = appointmentsThisWeek;
    }

    public double getConversionRate() {
        return conversionRate;
    }

    public void setConversionRate(double conversionRate) {
        this.conversionRate = conversionRate;
    }

    public List<RegionDistributionDTO> getRegionDistribution() {
        return regionDistribution;
    }

    public void setRegionDistribution(List<RegionDistributionDTO> regionDistribution) {
        this.regionDistribution = regionDistribution;
    }

    public List<AppointmentItemDTO> getTodayAppointments() {
        return todayAppointments;
    }

    public void setTodayAppointments(List<AppointmentItemDTO> todayAppointments) {
        this.todayAppointments = todayAppointments;
    }

    public List<AppointmentItemDTO> getTomorrowAppointments() {
        return tomorrowAppointments;
    }

    public void setTomorrowAppointments(List<AppointmentItemDTO> tomorrowAppointments) {
        this.tomorrowAppointments = tomorrowAppointments;
    }

    public List<DayAppointmentsDTO> getWeeklyCalendar() {
        return weeklyCalendar;
    }

    public void setWeeklyCalendar(List<DayAppointmentsDTO> weeklyCalendar) {
        this.weeklyCalendar = weeklyCalendar;
    }

    public long getUncontacted2000Count() {
        return uncontacted2000Count;
    }

    public void setUncontacted2000Count(long uncontacted2000Count) {
        this.uncontacted2000Count = uncontacted2000Count;
    }

    public long getUncontacted20kCount() {
        return uncontacted20kCount;
    }

    public void setUncontacted20kCount(long uncontacted20kCount) {
        this.uncontacted20kCount = uncontacted20kCount;
    }

    public List<UncontactedEnterpriseDTO> getUncontactedEnterprises() {
        return uncontactedEnterprises;
    }

    public void setUncontactedEnterprises(List<UncontactedEnterpriseDTO> uncontactedEnterprises) {
        this.uncontactedEnterprises = uncontactedEnterprises;
    }

    public List<MonthlyTrendDTO> getMonthlyTrend() {
        return monthlyTrend;
    }

    public void setMonthlyTrend(List<MonthlyTrendDTO> monthlyTrend) {
        this.monthlyTrend = monthlyTrend;
    }
}
