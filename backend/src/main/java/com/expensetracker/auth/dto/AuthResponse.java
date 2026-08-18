package com.expensetracker.auth.dto;

public class AuthResponse {
    private String token;
    private String tokenType = "Bearer";
    private UserDto user;

    public AuthResponse() {}

    public AuthResponse(String token, String tokenType, UserDto user) {
        this.token = token;
        this.tokenType = tokenType != null ? tokenType : "Bearer";
        this.user = user;
    }

    public static AuthResponseBuilder builder() {
        return new AuthResponseBuilder();
    }

    public static class AuthResponseBuilder {
        private String token;
        private String tokenType = "Bearer";
        private UserDto user;

        public AuthResponseBuilder token(String token) { this.token = token; return this; }
        public AuthResponseBuilder tokenType(String tokenType) { this.tokenType = tokenType; return this; }
        public AuthResponseBuilder user(UserDto user) { this.user = user; return this; }

        public AuthResponse build() {
            return new AuthResponse(token, tokenType, user);
        }
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public String getTokenType() { return tokenType; }
    public void setTokenType(String tokenType) { this.tokenType = tokenType; }
    public UserDto getUser() { return user; }
    public void setUser(UserDto user) { this.user = user; }
}
