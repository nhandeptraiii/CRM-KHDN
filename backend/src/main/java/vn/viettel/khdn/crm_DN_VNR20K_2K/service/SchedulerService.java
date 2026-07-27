package vn.viettel.khdn.crm_DN_VNR20K_2K.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import vn.viettel.khdn.crm_DN_VNR20K_2K.model.Appointment;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.AppointmentStatus;
import vn.viettel.khdn.crm_DN_VNR20K_2K.repository.AppointmentRepository;

@Component
public class SchedulerService {

    private final AppointmentRepository appointmentRepository;
    private final EmailService emailService;
    private final long reminderWindowMinutes;

    public SchedulerService(
            AppointmentRepository appointmentRepository,
            EmailService emailService,
            @Value("${crm.appointment.reminder-window-minutes:30}") long reminderWindowMinutes) {
        this.appointmentRepository = appointmentRepository;
        this.emailService = emailService;
        this.reminderWindowMinutes = Math.max(reminderWindowMinutes, 1);
    }

    // Default: run every 15 minutes. Override in properties for testing.
    @Scheduled(fixedDelayString = "${crm.scheduler.delay-ms:900000}")
    public void checkAndSendReminders() {
        Instant now = Instant.now();
        sendReminder24h(now);
        sendReminder1h(now);
    }

    private void sendReminder24h(Instant now) {
        Instant[] range = calculateRange(now, 24 * 60);
        List<Appointment> appointments = appointmentRepository.findRemindable24h(range[0], range[1]);
        for (Appointment appointment : appointments) {
            processReminder(appointment, 1440, () -> appointment.setReminder24hSent(true), "24h");
        }
    }

    private void sendReminder1h(Instant now) {
        Instant[] range = calculateRange(now, 60);
        List<Appointment> appointments = appointmentRepository.findRemindable1h(range[0], range[1]);
        for (Appointment appointment : appointments) {
            processReminder(appointment, 60, () -> appointment.setReminder1hSent(true), "1h");
        }
    }

    private void processReminder(Appointment appointment, int leadMinutes, Runnable setFlag, String label) {
        try {
            String email = appointment.getConsultant().getEmail();
            boolean sent = emailService.sendAppointmentReminder(email, appointment, leadMinutes);
            if (!sent) {
                return;
            }

            setFlag.run();
            appointment.setStatus(AppointmentStatus.REMINDED);
            appointmentRepository.save(appointment);
            System.out.println("[Scheduler] Sent " + label + " reminder for appointment ID="
                    + appointment.getId() + " to " + email);
        } catch (Exception e) {
            System.err.println("[Scheduler] Failed " + label + " reminder for appointment ID="
                    + appointment.getId() + ": " + e.getMessage());
        }
    }

    private Instant[] calculateRange(Instant now, long targetMinutes) {
        long halfWindow = reminderWindowMinutes / 2;
        long fromOffset = Math.max(0, targetMinutes - halfWindow);
        Instant from = now.plus(fromOffset, ChronoUnit.MINUTES);
        Instant to = now.plus(targetMinutes + halfWindow, ChronoUnit.MINUTES);
        return new Instant[] { from, to };
    }
}
