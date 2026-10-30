FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY backend ./backend
WORKDIR /workspace/backend
RUN mvn -q -DskipTests package

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S logiway && adduser -S logiway -G logiway
COPY --from=build /workspace/backend/guc-api/target/guc-api-*.jar /app/app.jar
COPY backend/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN mkdir -p /app/data/uploads && chown -R logiway:logiway /app
RUN chmod +x /app/docker-entrypoint.sh
USER logiway
EXPOSE 8080
ENTRYPOINT ["/app/docker-entrypoint.sh"]
