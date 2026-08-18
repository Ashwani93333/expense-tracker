package com.expensetracker.group.dto;

public class JoinGroupRequest {
    /** Either the short invite_code or a full invite token */
    private String code;
    /** Alternative: long token from email invite */
    private String token;

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
}
