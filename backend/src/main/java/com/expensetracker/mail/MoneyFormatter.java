package com.expensetracker.mail;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.Locale;

/** Formats monetary values as Indian Rupees with Indian digit grouping. */
public final class MoneyFormatter {

    private static final NumberFormat INR = NumberFormat.getCurrencyInstance(new Locale("en", "IN"));

    private MoneyFormatter() {}

    public static String format(BigDecimal amount) {
        if (amount == null) return INR.format(BigDecimal.ZERO);
        return INR.format(amount);
    }

    public static String format(double amount) {
        return INR.format(amount);
    }
}
