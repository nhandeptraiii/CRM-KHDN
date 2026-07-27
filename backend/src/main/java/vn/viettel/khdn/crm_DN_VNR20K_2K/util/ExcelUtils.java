package vn.viettel.khdn.crm_DN_VNR20K_2K.util;

import java.io.InputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.web.multipart.MultipartFile;

import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ReqEnterpriseCreateDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.Industry;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.EnterpriseTypeEnum;

public class ExcelUtils {
    public static String EXCEL_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    public static boolean hasExcelFormat(MultipartFile file) {
        return EXCEL_TYPE.equals(file.getContentType());
    }

    public static LocalDate parseFlexibleDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank())
            return null;

        String[] patterns = {
                "dd-MM-yyyy", "dd/MM/yyyy", "dd.MM.yyyy",
                "yyyy-MM-dd", "yyyy/MM/dd",
                "d/M/yyyy", "d-M-yyyy",
                "dd-MM-yy",
                "MM-dd-yyyy", "MM/dd/yyyy",
                "M-d-yyyy", "M/d/yyyy"
        };

        for (String pattern : patterns) {
            try {
                return LocalDate.parse(dateStr.trim(), DateTimeFormatter.ofPattern(pattern));
            } catch (DateTimeParseException ignored) {
            }
        }
        return null;
    }

    private static String getCellValueAsString(Cell cell) {
        if (cell == null)
            return null;
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    // Trả về định dạng chuẩn if it's a date in excel
                    return cell.getLocalDateTimeCellValue().format(DateTimeFormatter.ofPattern("dd-MM-yyyy"));
                }
                // Convert double to String without scientific notation or decimal .0
                double val = cell.getNumericCellValue();
                if (val == (long) val) {
                    return String.valueOf((long) val);
                } else {
                    return String.valueOf(val);
                }
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            default:
                return null;
        }
    }

    private static Integer getCellValueAsInteger(Cell cell) {
        if (cell == null)
            return null;
        if (cell.getCellType() == CellType.NUMERIC) {
            return (int) cell.getNumericCellValue();
        } else if (cell.getCellType() == CellType.STRING) {
            try {
                return Integer.parseInt(cell.getStringCellValue().trim());
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    // Trả về danh sách DTO, KHÔNG bao gồm báo lỗi (Xử lý lỗi ở Service)
    public static List<ReqEnterpriseCreateDTO> excelToEnterprises(InputStream is) {
        List<ReqEnterpriseCreateDTO> enterprises = new ArrayList<>();
        try (Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(0);

            // Bỏ qua dòng Header (index 0)
            int rowIndex = 0;
            for (Row row : sheet) {
                if (rowIndex == 0) {
                    rowIndex++;
                    continue;
                }

                ReqEnterpriseCreateDTO dto = new ReqEnterpriseCreateDTO();

                // Cột 1: Tên doanh nghiệp
                dto.setName(getCellValueAsString(row.getCell(1)));

                // Cột 2: Mã số thuế
                dto.setTaxCode(getCellValueAsString(row.getCell(2)));

                // Cột 3: Cơ quan thuế
                dto.setTaxAuthority(getCellValueAsString(row.getCell(3)));

                // Cột 4: Lĩnh vực
                String industryStr = getCellValueAsString(row.getCell(4));
                dto.setIndustry(Industry.fromValue(industryStr));

                // Cột 5: Số nhân viên
                dto.setEmployeeCount(getCellValueAsInteger(row.getCell(5)));

                // Cột 6: Địa chỉ
                dto.setAddress(getCellValueAsString(row.getCell(6)));

                // Cột 7: Website
                dto.setWebsite(getCellValueAsString(row.getCell(7)));

                // Cột 8: Điện thoại
                dto.setPhone(getCellValueAsString(row.getCell(8)));

                // Cột 9: Email doanh nghiệp
                dto.setEmail(getCellValueAsString(row.getCell(9)));

                // Cột 10: Ngày thành lập
                dto.setEstablishedDate(parseFlexibleDate(getCellValueAsString(row.getCell(10))));

                // Cột 11: Loại hình
                String typeStr = getCellValueAsString(row.getCell(11));
                if (typeStr != null && !typeStr.isBlank()) {
                    try {
                        dto.setType(EnterpriseTypeEnum.valueOf(typeStr.trim().toUpperCase()));
                    } catch (IllegalArgumentException e) {
                    }
                }

                // Cột 12, 13, 14: Đánh dấu check "X" Doanh thu
                String rev1 = getCellValueAsString(row.getCell(12));
                String rev2 = getCellValueAsString(row.getCell(13));
                String rev3 = getCellValueAsString(row.getCell(14));

                if (rev1 != null && rev1.trim().equalsIgnoreCase("X")) {
                    dto.setRevenueRange(vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.RevenueRange.UNDER_500M);
                } else if (rev2 != null && rev2.trim().equalsIgnoreCase("X")) {
                    dto.setRevenueRange(vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.RevenueRange.FROM_500M_TO_1B);
                } else if (rev3 != null && rev3.trim().equalsIgnoreCase("X")) {
                    dto.setRevenueRange(vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.RevenueRange.OVER_1B);
                }

                // Cột 15: Xã
                dto.setCommuneName(getCellValueAsString(row.getCell(15)));

                // Cột 16: Ghi chú
                dto.setNote(getCellValueAsString(row.getCell(16)));

                // Cột 17: Họ tên NĐD
                dto.setContactFullName(getCellValueAsString(row.getCell(17)));

                // Cột 18: Email NĐD
                dto.setContactEmail(getCellValueAsString(row.getCell(18)));

                // Cột 19: SĐT NĐD
                dto.setContactPhone(getCellValueAsString(row.getCell(19)));

                // Cột 20: Chức vụ NĐD
                dto.setContactPosition(getCellValueAsString(row.getCell(20)));

                enterprises.add(dto);
            }
        } catch (Exception e) {
            throw new RuntimeException("Lỗi đọc file Excel: " + e.getMessage());
        }

        return enterprises;
    }
}
