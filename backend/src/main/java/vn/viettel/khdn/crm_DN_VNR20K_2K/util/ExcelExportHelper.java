package vn.viettel.khdn.crm_DN_VNR20K_2K.util;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

import java.util.List;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ResEnterpriseDTO;

public class ExcelExportHelper {

    public static String[] HEADERS = {
            "STT", "Tên doanh nghiệp (*)", "Mã số thuế (*)", "Cơ quan thuế", "Lĩnh vực", "Số nhân viên",
            "Địa chỉ", "Website", "Điện thoại", "Email doanh nghiệp", "Ngày thành lập", "Loại hình",
            "DT < 500tr (X)", "DT 500tr - 1 tỷ (X)", "DT > 1 tỷ (X)",
            "Tên xã", "Ghi chú",
            "Họ tên NĐD", "Email NĐD", "SĐT NĐD", "Chức vụ NĐD",
            "AM phụ trách", "NV tư vấn phụ trách", "Dịch vụ Viettel"
    };

    public static String SHEET_NAME = "Doanh Nghiep";

    public static class EnterpriseExportStreamer implements AutoCloseable {
        private SXSSFWorkbook workbook;
        private Sheet sheet;
        private int rowIdx = 1;

        public EnterpriseExportStreamer() {
            // Keep maximum 500 rows in memory, exceeding rows will be flushed to disk
            workbook = new SXSSFWorkbook(500);
            sheet = workbook.createSheet(SHEET_NAME);

            // Style for Header
            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            Font font = workbook.createFont();
            font.setBold(true);
            font.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(font);

            // Row for Header
            Row headerRow = sheet.createRow(0);
            for (int col = 0; col < HEADERS.length; col++) {
                Cell cell = headerRow.createCell(col);
                cell.setCellValue(HEADERS[col]);
                cell.setCellStyle(headerStyle);
            }
        }

        public void writeChunk(List<ResEnterpriseDTO> enterprises) {
            for (ResEnterpriseDTO enterprise : enterprises) {
                Row row = sheet.createRow(rowIdx);

                row.createCell(0).setCellValue(rowIdx); // STT
                row.createCell(1).setCellValue(enterprise.getName());
                row.createCell(2).setCellValue(enterprise.getTaxCode());

                row.createCell(3)
                        .setCellValue(enterprise.getTaxAuthority() != null ? enterprise.getTaxAuthority() : "");
                row.createCell(4).setCellValue(
                        enterprise.getIndustry() != null ? enterprise.getIndustry().getDisplayName() : "");
                row.createCell(5).setCellValue(
                        enterprise.getEmployeeCount() != null ? enterprise.getEmployeeCount().toString() : "");
                row.createCell(6).setCellValue(enterprise.getAddress() != null ? enterprise.getAddress() : "");
                row.createCell(7).setCellValue(enterprise.getWebsite() != null ? enterprise.getWebsite() : "");

                row.createCell(8).setCellValue(enterprise.getPhone() != null ? enterprise.getPhone() : "");
                row.createCell(9).setCellValue(enterprise.getEmail() != null ? enterprise.getEmail() : "");
                row.createCell(10).setCellValue(
                        enterprise.getEstablishedDate() != null ? enterprise.getEstablishedDate().toString() : "");
                row.createCell(11).setCellValue(enterprise.getType() != null ? enterprise.getType().name() : "");

                row.createCell(12).setCellValue(enterprise
                        .getRevenueRange() == vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.RevenueRange.UNDER_500M ? "X"
                                : "");
                row.createCell(13).setCellValue(enterprise
                        .getRevenueRange() == vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.RevenueRange.FROM_500M_TO_1B
                                ? "X"
                                : "");
                row.createCell(14)
                        .setCellValue(enterprise
                                .getRevenueRange() == vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.RevenueRange.OVER_1B
                                        ? "X"
                                        : "");

                row.createCell(15).setCellValue(enterprise.getCommuneName() != null ? enterprise.getCommuneName() : "");
                row.createCell(16).setCellValue(enterprise.getNote() != null ? enterprise.getNote() : "");
                row.createCell(17)
                        .setCellValue(enterprise.getContactFullName() != null ? enterprise.getContactFullName() : "");
                row.createCell(18)
                        .setCellValue(enterprise.getContactEmail() != null ? enterprise.getContactEmail() : "");
                row.createCell(19)
                        .setCellValue(enterprise.getContactPhone() != null ? enterprise.getContactPhone() : "");
                row.createCell(20)
                        .setCellValue(enterprise.getContactPosition() != null ? enterprise.getContactPosition() : "");
                row.createCell(21).setCellValue(enterprise.getAmName() != null ? enterprise.getAmName() : "");
                row.createCell(22)
                        .setCellValue(enterprise.getConsultantName() != null ? enterprise.getConsultantName() : "");
                row.createCell(23)
                        .setCellValue(
                                enterprise.getUsedViettelServices() != null ? enterprise.getUsedViettelServices() : "");

                rowIdx++;
            }
        }

        public ByteArrayInputStream getInputStream() throws IOException {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }

        @Override
        public void close() throws IOException {
            workbook.dispose(); // Dispose of temporary files backing this workbook on disk
            workbook.close();
        }
    }

    public static ByteArrayInputStream enterprisesToExcel(List<ResEnterpriseDTO> enterprises) throws IOException {
        try (EnterpriseExportStreamer streamer = new EnterpriseExportStreamer()) {
            streamer.writeChunk(enterprises);
            return streamer.getInputStream();
        }
    }

    public static ByteArrayInputStream createTemplateExcel() throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream();) {
            Sheet sheet = workbook.createSheet(SHEET_NAME);

            String[] headersArr = HEADERS;

            // Style for Header
            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_GREEN.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            // Row for Header
            Row headerRow = sheet.createRow(0);
            for (int col = 0; col < headersArr.length; col++) {
                Cell cell = headerRow.createCell(col);
                cell.setCellValue(headersArr[col]);
                cell.setCellStyle(headerStyle);
            }

            // Thêm 1 dòng ví dụ
            Row exampleRow = sheet.createRow(1);
            exampleRow.createCell(0).setCellValue(1);
            exampleRow.createCell(1).setCellValue("Công ty TNHH Mẫu");
            exampleRow.createCell(2).setCellValue("0123456789");
            exampleRow.createCell(3).setCellValue("Cục Thuế TP Hà Nội");
            exampleRow.createCell(4).setCellValue("Công nghệ, phần mềm"); // Industry
            exampleRow.createCell(5).setCellValue(50);
            exampleRow.createCell(6).setCellValue("Hà Nội");
            exampleRow.createCell(7).setCellValue("https://example.com");
            exampleRow.createCell(8).setCellValue("0901234567");
            exampleRow.createCell(9).setCellValue("email@company.com");
            exampleRow.createCell(10).setCellValue("2024-01-01"); // Ngày thành lập
            exampleRow.createCell(11).setCellValue("HKD"); // Type
            exampleRow.createCell(12).setCellValue(""); // DT < 500tr
            exampleRow.createCell(13).setCellValue("X"); // DT 500tr - 1 tỷ
            exampleRow.createCell(14).setCellValue(""); // DT > 1 tỷ

            exampleRow.createCell(15).setCellValue("Phường An Thới Đông"); // Tên xã
            exampleRow.createCell(16).setCellValue("Đây là dữ liệu mẫu, vui lòng xóa dòng này trước khi import");
            exampleRow.createCell(17).setCellValue("Nguyễn Văn Mẫu");
            exampleRow.createCell(18).setCellValue("mau@example.com");
            exampleRow.createCell(19).setCellValue("0901234567");
            exampleRow.createCell(20).setCellValue("Giám đốc");
            exampleRow.createCell(21).setCellValue(""); // AM phụ trách
            exampleRow.createCell(22).setCellValue(""); // Consultant phụ trách
            exampleRow.createCell(23).setCellValue(""); // Dịch vụ Viettel

            // Auto size columns
            for (int col = 0; col < headersArr.length; col++) {
                sheet.autoSizeColumn(col);
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }
}
