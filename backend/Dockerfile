# syntax=docker/dockerfile:1

# ---------- Build stage ----------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /workspace

# Cache dependencies separately from the source for faster rebuilds.
COPY pom.xml ./
RUN mvn -B -DskipTests dependency:go-offline

COPY src ./src
RUN mvn -B -DskipTests clean package

# ---------- Runtime stage ----------
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Run as a non-root user; receipt uploads go to /app/uploads (mount a volume here).
RUN groupadd --system app \
    && useradd --system --gid app --home-dir /app app \
    && mkdir -p /app/uploads \
    && chown -R app:app /app

COPY --from=build /workspace/target/*.jar /app/app.jar

USER app
EXPOSE 8080

ENV SPRING_PROFILES_ACTIVE=prod \
    JAVA_OPTS=""

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
