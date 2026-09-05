package com.expensetracker.auth;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

class PasswordPolicyTest {

    @ParameterizedTest
    @ValueSource(strings = {
            "Pass@123",
            "Strong#Password2026",
            "xY1!aaaaaaaa",
            "PASSWORD_1",
            "Aa!2345678",
    })
    void compliesWithPolicy(String password) {
        assertThat(PasswordPolicy.isValid(password)).as("password '%s' should be valid", password).isTrue();
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "",           // empty
            "short",      // too short
            "alllowercase8",  // no uppercase, no symbol
            "ALLUPPER123",// no symbol
            "low@case",   // no uppercase
            "Pass@12",    // only 7 chars
    })
    void rejectsNonCompliantPasswords(String password) {
        assertThat(PasswordPolicy.isValid(password)).as("password '%s' should be invalid", password).isFalse();
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "NOLOWER@8",   // plenty long, uppercase, symbol (@)
            "SPACES INCLUDED !",
    })
    void acceptsPoliciesWithVariousSymbols(String password) {
        assertThat(PasswordPolicy.isValid(password)).as("password '%s' should be valid", password).isTrue();
    }
}