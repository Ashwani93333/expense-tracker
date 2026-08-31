package com.expensetracker.common;

import com.expensetracker.exception.BadRequestException;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

/**
 * Shared utility for resolving date ranges from flexible query parameters.
 *
 * Priority: dateFrom+dateTo > year > month > current month (default)
 */
public final class DateRangeResolver {

    private DateRangeResolver() {}

    /**
     * Resolves a date range from optional filter parameters.
     *
     * @param month  format YYYY-MM (optional)
     * @param year   format YYYY (optional)
     * @param dateFrom format YYYY-MM-DD (optional)
     * @param dateTo   format YYYY-MM-DD (optional)
     * @return LocalDate[]{start, end} inclusive
     */
    public static LocalDate[] resolve(String month, String year, String dateFrom, String dateTo) {
        // Priority 1: explicit dateFrom + dateTo
        if (isNotBlank(dateFrom) && isNotBlank(dateTo)) {
            LocalDate start = parseDate(dateFrom, "dateFrom");
            LocalDate end = parseDate(dateTo, "dateTo");
            if (end.isBefore(start)) {
                throw new BadRequestException("dateTo must not be before dateFrom");
            }
            return new LocalDate[]{start, end};
        }
        if (isNotBlank(dateFrom) || isNotBlank(dateTo)) {
            throw new BadRequestException("Both dateFrom and dateTo must be provided together");
        }

        // Priority 2: year (full calendar year)
        if (isNotBlank(year)) {
            int y = parseYear(year);
            return new LocalDate[]{LocalDate.of(y, 1, 1), LocalDate.of(y, 12, 31)};
        }

        // Priority 3: month (YYYY-MM)
        if (isNotBlank(month)) {
            return parseMonthRange(month);
        }

        // Default: current month
        LocalDate now = LocalDate.now();
        return new LocalDate[]{now.withDayOfMonth(1), now.withDayOfMonth(now.lengthOfMonth())};
    }

    /**
     * Parses a month string (YYYY-MM) into start/end of that month.
     */
    public static LocalDate[] parseMonthRange(String month) {
        if (month == null || month.isBlank()) {
            LocalDate now = LocalDate.now();
            return new LocalDate[]{now.withDayOfMonth(1), now.withDayOfMonth(now.lengthOfMonth())};
        }
        String[] parts = month.split("-");
        if (parts.length != 2) {
            throw new BadRequestException("month parameter must be in YYYY-MM format");
        }
        int y = Integer.parseInt(parts[0]);
        int m = Integer.parseInt(parts[1]);
        LocalDate first = LocalDate.of(y, m, 1);
        return new LocalDate[]{first, first.withDayOfMonth(first.lengthOfMonth())};
    }

    /**
     * Parses a year string (YYYY) into Jan 1 – Dec 31 of that year.
     */
    public static LocalDate[] parseYearRange(String year) {
        int y = parseYear(year);
        return new LocalDate[]{LocalDate.of(y, 1, 1), LocalDate.of(y, 12, 31)};
    }

    /**
     * Returns a human-readable label for the resolved range.
     */
    public static String describeRange(LocalDate start, LocalDate end) {
        if (start.getDayOfMonth() == 1 && end.getDayOfMonth() == end.lengthOfMonth()) {
            // Full month
            return start.format(DateTimeFormatter.ofPattern("MMMM yyyy"));
        }
        if (start.getMonthValue() == 1 && start.getDayOfMonth() == 1
                && end.getMonthValue() == 12 && end.getDayOfMonth() == 31) {
            // Full year
            return String.valueOf(start.getYear());
        }
        // Custom range
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd MMM yyyy");
        return start.format(fmt) + " – " + end.format(fmt);
    }

    private static LocalDate parseDate(String value, String paramName) {
        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException e) {
            throw new BadRequestException(paramName + " must be in YYYY-MM-DD format");
        }
    }

    private static int parseYear(String year) {
        try {
            int y = Integer.parseInt(year.trim());
            if (y < 2000 || y > 2100) {
                throw new BadRequestException("year must be between 2000 and 2100");
            }
            return y;
        } catch (NumberFormatException e) {
            throw new BadRequestException("year parameter must be a valid integer (YYYY)");
        }
    }

    private static boolean isNotBlank(String s) {
        return s != null && !s.isBlank();
    }
}
