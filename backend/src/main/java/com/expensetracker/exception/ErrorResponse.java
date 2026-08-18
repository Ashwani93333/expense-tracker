package com.expensetracker.exception;

import java.time.OffsetDateTime;
import java.util.Map;

public class ErrorResponse {
    private OffsetDateTime timestamp;
    private int status;
    private String error;
    private String message;
    private String path;
    private Map<String, String> validationErrors;

    public ErrorResponse() {}

    public ErrorResponse(OffsetDateTime timestamp, int status, String error, String message, String path, Map<String, String> validationErrors) {
        this.timestamp = timestamp;
        this.status = status;
        this.error = error;
        this.message = message;
        this.path = path;
        this.validationErrors = validationErrors;
    }

    public static ErrorResponseBuilder builder() {
        return new ErrorResponseBuilder();
    }

    public static class ErrorResponseBuilder {
        private OffsetDateTime timestamp;
        private int status;
        private String error;
        private String message;
        private String path;
        private Map<String, String> validationErrors;

        public ErrorResponseBuilder timestamp(OffsetDateTime timestamp) { this.timestamp = timestamp; return this; }
        public ErrorResponseBuilder status(int status) { this.status = status; return this; }
        public ErrorResponseBuilder error(String error) { this.error = error; return this; }
        public ErrorResponseBuilder message(String message) { this.message = message; return this; }
        public ErrorResponseBuilder path(String path) { this.path = path; return this; }
        public ErrorResponseBuilder validationErrors(Map<String, String> validationErrors) { this.validationErrors = validationErrors; return this; }

        public ErrorResponse build() {
            return new ErrorResponse(timestamp, status, error, message, path, validationErrors);
        }
    }

    public OffsetDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(OffsetDateTime timestamp) { this.timestamp = timestamp; }
    public int getStatus() { return status; }
    public void setStatus(int status) { this.status = status; }
    public String getError() { return error; }
    public void setError(String error) { this.error = error; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }
    public Map<String, String> getValidationErrors() { return validationErrors; }
    public void setValidationErrors(Map<String, String> validationErrors) { this.validationErrors = validationErrors; }
}
