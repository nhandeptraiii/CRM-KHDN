# Stage 1: Build the application
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app
# Copy gradle wrapper and properties
COPY gradlew .
COPY gradle gradle
COPY build.gradle.kts .
COPY settings.gradle.kts .
# Grant execution rights to the gradlew script
RUN chmod +x gradlew
# Download dependencies (this step will be cached)
RUN ./gradlew dependencies --no-daemon || true
# Copy the source code
COPY src src
# Build the application
RUN ./gradlew build -x test --no-daemon

# Stage 2: Run the application
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
# Copy the jar from the builder stage
COPY --from=builder /app/build/libs/*.jar app.jar
# Create uploads directory if needed
RUN mkdir -p uploads
# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
