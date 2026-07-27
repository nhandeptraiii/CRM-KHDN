package vn.viettel.khdn.crm_DN_VNR20K_2K.service;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.DashboardDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.DashboardDTO.AppointmentItemDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.DashboardDTO.DayAppointmentsDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.DashboardDTO.MonthlyTrendDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.DashboardDTO.RegionDistributionDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.DashboardDTO.UncontactedEnterpriseDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.EmployeeInteractionDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.EnterpriseTypeEnum;
import vn.viettel.khdn.crm_DN_VNR20K_2K.repository.AppointmentRepository;
import vn.viettel.khdn.crm_DN_VNR20K_2K.repository.EnterpriseRepository;
import vn.viettel.khdn.crm_DN_VNR20K_2K.repository.InteractionRepository;
import vn.viettel.khdn.crm_DN_VNR20K_2K.repository.UserRepository;
import vn.viettel.khdn.crm_DN_VNR20K_2K.repository.ViettelServiceRepository;

@Service
public class DashboardService {

    private final UserRepository userRepo;
    private final EnterpriseRepository enterpriseRepo;
    private final ViettelServiceRepository serviceRepo;
    private final InteractionRepository interactionRepo;
    private final AppointmentRepository appointmentRepo;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private static final List<EnterpriseTypeEnum> PRIORITY_TYPES =
            Arrays.asList(EnterpriseTypeEnum.VNR2000, EnterpriseTypeEnum.VNR20K);

    public DashboardService(UserRepository userRepo, EnterpriseRepository enterpriseRepo,
            ViettelServiceRepository serviceRepo, InteractionRepository interactionRepo,
            AppointmentRepository appointmentRepo) {
        this.userRepo = userRepo;
        this.enterpriseRepo = enterpriseRepo;
        this.serviceRepo = serviceRepo;
        this.interactionRepo = interactionRepo;
        this.appointmentRepo = appointmentRepo;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Public: getDashboard — toàn bộ dashboard
    // ══════════════════════════════════════════════════════════════════════════

    public DashboardDTO getDashboard(int month, int year) {
        DashboardDTO dto = new DashboardDTO();

        // --- Phần cũ ---
        dto.setTotalUsers(userRepo.count());
        dto.setTotalEnterprises(enterpriseRepo.count());
        dto.setTotalInteractedEnterprises(enterpriseRepo.countInteractedEnterprises());
        dto.setTotalServices(serviceRepo.count());
        dto.setActiveServices(serviceRepo.countActiveServices());

        List<EmployeeInteractionDTO> employeeStats =
                interactionRepo.countInteractionsByMonthAndYear(month, year);
        dto.setEmployeeStats(employeeStats);
        dto.setTotalActiveEmployees(employeeStats.size());

        // --- Phần mới ---
        fillKpiCards(dto, month, year);
        dto.setRegionDistribution(buildRegionDistribution(month, year));

        LocalDate today = LocalDate.now(ZONE);
        dto.setTodayAppointments(fetchAppointmentsForDay(today));
        dto.setTomorrowAppointments(fetchAppointmentsForDay(today.plusDays(1)));

        dto.setWeeklyCalendar(buildWeeklyCalendar());
        fillUncontactedWarning(dto);

        // --- Lũy kế tháng ---
        dto.setMonthlyTrend(buildMonthlyTrend(month, year));

        return dto;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Public: getEmployeeStatistics
    // ══════════════════════════════════════════════════════════════════════════

    public List<EmployeeInteractionDTO> getEmployeeStatistics() {
        return interactionRepo.countInteractionsByEmployee();
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Public: các endpoint tách riêng
    // ══════════════════════════════════════════════════════════════════════════

    public List<RegionDistributionDTO> getRegionDistribution(int month, int year) {
        return buildRegionDistribution(month, year);
    }

    public DashboardDTO getUpcomingAppointments() {
        DashboardDTO dto = new DashboardDTO();
        LocalDate today = LocalDate.now(ZONE);
        dto.setTodayAppointments(fetchAppointmentsForDay(today));
        dto.setTomorrowAppointments(fetchAppointmentsForDay(today.plusDays(1)));
        return dto;
    }

    public DashboardDTO getWeeklyCalendarOnly() {
        DashboardDTO dto = new DashboardDTO();
        dto.setWeeklyCalendar(buildWeeklyCalendar());
        return dto;
    }

    public DashboardDTO getUncontactedWarningOnly() {
        DashboardDTO dto = new DashboardDTO();
        fillUncontactedWarning(dto);
        return dto;
    }

    /**
     * Endpoint riêng cho lũy kế — GET /dashboard/monthly-trend?month=4&year=2026
     */
    public List<MonthlyTrendDTO> getMonthlyTrend(int month, int year) {
        return buildMonthlyTrend(month, year);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Private helpers
    // ══════════════════════════════════════════════════════════════════════════

    private void fillKpiCards(DashboardDTO dto, int month, int year) {
        dto.setTotalSme(enterpriseRepo.countByType(EnterpriseTypeEnum.SME));
        dto.setTotalHkd(enterpriseRepo.countByType(EnterpriseTypeEnum.HKD));
        dto.setTotal2000(enterpriseRepo.countByType(EnterpriseTypeEnum.VNR2000));
        dto.setTotal20k(enterpriseRepo.countByType(EnterpriseTypeEnum.VNR20K));

        Instant thirtyDaysAgo = Instant.now().minus(30, ChronoUnit.DAYS);
        dto.setNewEnterprisesLast30Days(enterpriseRepo.countNewEnterprisesSince(thirtyDaysAgo));

        dto.setContactedEnterprisesThisMonth(
                interactionRepo.countContactedEnterprisesInMonth(month, year));

        Instant weekStart =
                LocalDate.now(ZONE).with(DayOfWeek.MONDAY).atStartOfDay(ZONE).toInstant();
        Instant weekEnd = weekStart.plus(7, ChronoUnit.DAYS);
        dto.setAppointmentsThisWeek(appointmentRepo.countAppointmentsInRange(weekStart, weekEnd));

        long total = appointmentRepo.countTotalInMonth(month, year);
        long confirmed = appointmentRepo.countConfirmedInMonth(month, year);
        dto.setConversionRate(
                total > 0 ? Math.round((confirmed * 100.0 / total) * 10.0) / 10.0 : 0.0);
    }

    private List<RegionDistributionDTO> buildRegionDistribution(int month, int year) {
        Map<String, Long> totalMap = new HashMap<>();
        for (Object[] row : enterpriseRepo.countGroupByRegion()) {
            String region = row[0] != null ? row[0].toString() : "Khác";
            totalMap.put(region, ((Number) row[1]).longValue());
        }

        Map<String, Long> contactedMap = new HashMap<>();
        for (Object[] row : appointmentRepo.countContactedByRegionInMonth(month, year)) {
            String region = row[0] != null ? row[0].toString() : "Khác";
            contactedMap.put(region, ((Number) row[1]).longValue());
        }

        return totalMap.entrySet().stream().map(e -> {
            long total = e.getValue();
            long contacted = contactedMap.getOrDefault(e.getKey(), 0L);
            return new RegionDistributionDTO(e.getKey(), total, contacted, total - contacted);
        }).sorted((a, b) -> a.getRegion().compareTo(b.getRegion())).collect(Collectors.toList());
    }

    private List<AppointmentItemDTO> fetchAppointmentsForDay(LocalDate date) {
        Instant start = date.atStartOfDay(ZONE).toInstant();
        Instant end = date.plusDays(1).atStartOfDay(ZONE).toInstant();

        return appointmentRepo.findAppointmentsInDay(start, end).stream()
                .map(row -> new AppointmentItemDTO(((Number) row[0]).longValue(),
                        row[1] != null ? row[1].toString() : "",
                        row[2] != null ? row[2].toString() : "",
                        row[3] != null ? ((Instant) row[3]).atZone(ZONE).toLocalDateTime() : null,
                        row[4] != null ? row[4].toString() : "",
                        row[5] != null ? row[5].toString() : ""))
                .collect(Collectors.toList());
    }

    private List<DayAppointmentsDTO> buildWeeklyCalendar() {
        LocalDate weekStart = LocalDate.now(ZONE).with(DayOfWeek.MONDAY);
        List<DayAppointmentsDTO> days = new ArrayList<>();

        for (int i = 0; i < 7; i++) {
            LocalDate date = weekStart.plusDays(i);
            List<AppointmentItemDTO> items = fetchAppointmentsForDay(date);
            days.add(new DayAppointmentsDTO(date.format(DATE_FMT),
                    getDayOfWeekVi(date.getDayOfWeek()), items.size(), items));
        }
        return days;
    }

    private void fillUncontactedWarning(DashboardDTO dto) {
        Instant threshold = LocalDate.now(ZONE).minusMonths(3).atStartOfDay(ZONE).toInstant();

        dto.setUncontacted2000Count(
                enterpriseRepo.countUncontactedByType(EnterpriseTypeEnum.VNR2000, threshold));
        dto.setUncontacted20kCount(
                enterpriseRepo.countUncontactedByType(EnterpriseTypeEnum.VNR20K, threshold));

        List<UncontactedEnterpriseDTO> list = enterpriseRepo
                .findUncontactedEnterprises2000And20K(PRIORITY_TYPES, threshold).stream()
                .map(row -> new UncontactedEnterpriseDTO(((Number) row[0]).longValue(),
                        row[1] != null ? row[1].toString() : "",
                        row[2] != null ? row[2].toString() : "",
                        row[3] != null ? row[3].toString() : "",
                        row[4] != null ? row[4].toString() : "",
                        row[5] != null ? row[5].toString() : ""))
                .collect(Collectors.toList());
        dto.setUncontactedEnterprises(list);
    }

    /**
     * Xây dựng danh sách lũy kế tiếp xúc DN theo từng ngày trong tháng, so sánh song song với tháng
     * trước (cùng ngày).
     *
     * Logic: - Truy vấn số DN CONFIRMED group by DAY() cho tháng hiện tại và tháng trước. - Tích
     * lũy từ ngày 1 đến hôm nay (nếu là tháng hiện tại) hoặc cuối tháng.
     */
    private List<MonthlyTrendDTO> buildMonthlyTrend(int month, int year) {
        // Tính Instant range cho tháng hiện tại
        Instant startCurrent = LocalDate.of(year, month, 1).atStartOfDay(ZONE).toInstant();
        Instant startNext =
                LocalDate.of(year, month, 1).plusMonths(1).atStartOfDay(ZONE).toInstant();

        // Tháng trước
        int prevMonth = month == 1 ? 12 : month - 1;
        int prevYear = month == 1 ? year - 1 : year;
        Instant startPrev = LocalDate.of(prevYear, prevMonth, 1).atStartOfDay(ZONE).toInstant();
        Instant startPrevNext =
                LocalDate.of(prevYear, prevMonth, 1).plusMonths(1).atStartOfDay(ZONE).toInstant();

        // Query
        Map<Integer, Long> currentMap = new HashMap<>();
        for (Object[] row : interactionRepo.countContactedByDayInMonth(startCurrent, startNext)) {
            currentMap.put(((Number) row[0]).intValue(), ((Number) row[1]).longValue());
        }

        Map<Integer, Long> prevMap = new HashMap<>();
        for (Object[] row : interactionRepo.countContactedByDayInMonth(startPrev, startPrevNext)) {
            prevMap.put(((Number) row[0]).intValue(), ((Number) row[1]).longValue());
        }

        // Số ngày vẽ
        int daysInMonth = LocalDate.of(year, month, 1).lengthOfMonth();
        LocalDate today = LocalDate.now(ZONE);
        int maxDay =
                (month == today.getMonthValue() && year == today.getYear()) ? today.getDayOfMonth()
                        : daysInMonth;

        List<MonthlyTrendDTO> result = new ArrayList<>();
        long cumCurrent = 0, cumPrev = 0;
        for (int d = 1; d <= maxDay; d++) {
            cumCurrent += currentMap.getOrDefault(d, 0L);
            cumPrev += prevMap.getOrDefault(d, 0L);
            result.add(new MonthlyTrendDTO(d, cumCurrent, cumPrev));
        }
        return result;
    }

    private String getDayOfWeekVi(DayOfWeek dow) {
        return switch (dow) {
            case MONDAY -> "Thứ 2";
            case TUESDAY -> "Thứ 3";
            case WEDNESDAY -> "Thứ 4";
            case THURSDAY -> "Thứ 5";
            case FRIDAY -> "Thứ 6";
            case SATURDAY -> "Thứ 7";
            case SUNDAY -> "Chủ nhật";
        };
    }
}
