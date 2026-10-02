# Logiway backend

Java 21 ve Spring Boot tabanlı modular monolith. Web ve Flutter istemcileri aynı
`/api/v1` API'sini ve PostgreSQL veri modelini kullanır.

## Modüller

Kimlik ve erişim, kullanıcılar, şirketler, sürücüler, araçlar, doğrulama,
yükler, teklifler, eşleşme/sevkiyat, bildirimler ve audit ayrı Maven modülleridir.
`guc-api` çalıştırılabilir uygulamadır. Şema yalnız Flyway migration'larıyla
yönetilir ve Hibernate `validate` modunda çalışır.

## Yerel doğrulama

```shell
mvn test
mvn verify
```

Repository kökündeki `.env.example` dosyasını `.env` olarak kopyalayıp güçlü,
benzersiz secret değerleri tanımlayın. Ardından kökten:

```shell
docker compose up --build
```

Health: `http://localhost:8080/actuator/health`

Development Swagger: `http://localhost:8080/swagger-ui.html`

Production'da CORS allowlist, JWT ve encryption secret'ları environment üzerinden
verilmelidir. Kaynak kodda varsayılan admin hesabı veya production seed bulunmaz.
