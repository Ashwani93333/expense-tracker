package com.expensetracker.period;

import com.expensetracker.exception.BadRequestException;
import com.expensetracker.model.User;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.time.ZoneId;

/**
 * Defines the earliest period an account may record or navigate to.
 *
 * <p>An account cannot reach back before it existed: a user who signs up today has
 * no history in any earlier month, so offering them previous-year navigation or
 * letting them file an expense dated last year only produces empty or misleading
 * screens. The floor is therefore the first day of the month the account was
 * created, and it moves forward with the calendar — nothing already inside an
 * account's own range ever becomes unreachable.
 *
 * <p>Writes are rejected server-side so the rule cannot be bypassed by calling the
 * API directly. Reads are not filtered here: an account's own records are always
 * legitimately readable, and the client simply never offers navigation below the
 * floor.
 */
@Component
public class AccountPeriodPolicy {

    /** First day of the month the account was created. */
    public LocalDate earliestDate(User user) {
        OffsetDateTime createdAt = user.getCreatedAt();
        if (createdAt == null) {
            // Unknown creation time — stay permissive rather than locking anyone out.
            return LocalDate.now().withDayOfMonth(1);
        }
        LocalDate created = createdAt.atZoneSameInstant(ZoneId.systemDefault()).toLocalDate();
        return created.withDayOfMonth(1);
    }

    public YearMonth earliestMonth(User user) {
        return YearMonth.from(earliestDate(user));
    }

    public boolean isDateAllowed(User user, LocalDate date) {
        return date != null && !date.isBefore(earliestDate(user));
    }

    public boolean isMonthAllowed(User user, YearMonth month) {
        return month != null && !month.isBefore(earliestMonth(user));
    }

    /** @param label human name of the thing being dated, used in the error message */
    public void requireDateAllowed(User user, LocalDate date, String label) {
        if (date != null && date.isBefore(earliestDate(user))) {
            throw new BadRequestException(label + " cannot be dated before "
                    + earliestDate(user) + " — your account started then.");
        }
    }

    public void requireMonthAllowed(User user, YearMonth month, String label) {
        if (month != null && month.isBefore(earliestMonth(user))) {
            throw new BadRequestException(label + " cannot be set for "
                    + month + " — your account started in " + earliestMonth(user) + ".");
        }
    }
}
