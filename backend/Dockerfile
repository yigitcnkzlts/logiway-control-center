FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY backend ./backend
WORKDIR /workspace/backend
RUN mvn -q -DskipTests package

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S logiway && adduser -S logiway -G logiway
COPY --from=build /workspace/backend/guc-api/target/guc-api-*.jar /app/app.jar
RUN mkdir -p /app/data/uploads && chown -R logiway:logiway /app
USER logiway
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
