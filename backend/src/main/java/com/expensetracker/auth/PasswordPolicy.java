package com.expensetracker.auth;

import java.util.regex.Pattern;

/**
 * Central definition of the application password policy.
 *
 * Requirements:
 *  - at least 8 characters (and no more than 100)
 *  - at least one uppercase letter (A-Z)
 *  - at least one symbol (any non-alphanumeric character)
 */
public final class PasswordPolicy {

    public static final String PATTERN = "^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,100}$";

    public static final String MESSAGE =
            "Password must be at least 8 characters long and include at least one uppercase letter and one symbol";

    private static final Pattern COMPILED = Pattern.compile(PATTERN);

    private PasswordPolicy() {
    }

    public static boolean isValid(String password) {
        return password != null && COMPILED.matcher(password).matches();
    }
}