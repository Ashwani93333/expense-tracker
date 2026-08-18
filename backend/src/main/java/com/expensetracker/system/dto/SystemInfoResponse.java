package com.expensetracker.system.dto;

public class SystemInfoResponse {
    private String applicationName;
    private String version;
    private String environment;
    private String javaVersion;
    private String springBootVersion;

    public SystemInfoResponse() {}

    public SystemInfoResponse(String applicationName, String version, String environment, String javaVersion, String springBootVersion) {
        this.applicationName = applicationName;
        this.version = version;
        this.environment = environment;
        this.javaVersion = javaVersion;
        this.springBootVersion = springBootVersion;
    }

    public static SystemInfoResponseBuilder builder() {
        return new SystemInfoResponseBuilder();
    }

    public static class SystemInfoResponseBuilder {
        private String applicationName;
        private String version;
        private String environment;
        private String javaVersion;
        private String springBootVersion;

        public SystemInfoResponseBuilder applicationName(String applicationName) { this.applicationName = applicationName; return this; }
        public SystemInfoResponseBuilder version(String version) { this.version = version; return this; }
        public SystemInfoResponseBuilder environment(String environment) { this.environment = environment; return this; }
        public SystemInfoResponseBuilder javaVersion(String javaVersion) { this.javaVersion = javaVersion; return this; }
        public SystemInfoResponseBuilder springBootVersion(String springBootVersion) { this.springBootVersion = springBootVersion; return this; }

        public SystemInfoResponse build() {
            return new SystemInfoResponse(applicationName, version, environment, javaVersion, springBootVersion);
        }
    }

    public String getApplicationName() { return applicationName; }
    public void setApplicationName(String applicationName) { this.applicationName = applicationName; }
    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }
    public String getEnvironment() { return environment; }
    public void setEnvironment(String environment) { this.environment = environment; }
    public String getJavaVersion() { return javaVersion; }
    public void setJavaVersion(String javaVersion) { this.javaVersion = javaVersion; }
    public String getSpringBootVersion() { return springBootVersion; }
    public void setSpringBootVersion(String springBootVersion) { this.springBootVersion = springBootVersion; }
}
