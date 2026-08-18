package com.expensetracker.system.dto;

import java.time.OffsetDateTime;

public class HealthStatusResponse {
    private String status;
    private String database;
    private OffsetDateTime timestamp;
    private long uptimeSeconds;

    public HealthStatusResponse() {}

    public HealthStatusResponse(String status, String database, OffsetDateTime timestamp, long uptimeSeconds) {
        this.status = status;
        this.database = database;
        this.timestamp = timestamp;
        this.uptimeSeconds = uptimeSeconds;
    }

    public static HealthStatusResponseBuilder builder() {
        return new HealthStatusResponseBuilder();
    }

    public static class HealthStatusResponseBuilder {
        private String status;
        private String database;
        private OffsetDateTime timestamp;
        private long uptimeSeconds;

        public HealthStatusResponseBuilder status(String status) { this.status = status; return this; }
        public HealthStatusResponseBuilder database(String database) { this.database = database; return this; }
        public HealthStatusResponseBuilder timestamp(OffsetDateTime timestamp) { this.timestamp = timestamp; return this; }
        public HealthStatusResponseBuilder uptimeSeconds(long uptimeSeconds) { this.uptimeSeconds = uptimeSeconds; return this; }

        public HealthStatusResponse build() {
            return new HealthStatusResponse(status, database, timestamp, uptimeSeconds);
        }
    }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getDatabase() { return database; }
    public void setDatabase(String database) { this.database = database; }
    public OffsetDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(OffsetDateTime timestamp) { this.timestamp = timestamp; }
    public long getUptimeSeconds() { return uptimeSeconds; }
    public void setUptimeSeconds(long uptimeSeconds) { this.uptimeSeconds = uptimeSeconds; }
}
