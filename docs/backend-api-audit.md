# Logiway backend API audit

Tarih: 9 Kasım 2026

İncelenen kaynak: `backend/` (14 Maven modülü)

Hariç tutulan: frontend ve `guc-backend-worktree/`

## Doğrulama özeti

- `mvn -f backend/pom.xml -pl guc-identity-access -am test`: **BUILD SUCCESS**; `guc-identity-access` 43 testi ve `guc-shared` 23 testi geçti.
- `mvn -f backend/pom.xml test`: **BUILD FAILURE**; `guc-companies` test derlemesi, `guc-shared` exception/event paketlerini çözemediği için duruyor. Bu nedenle devamındaki modüllerin testleri bu koşuda çalışmadı.
- Docker daemon erişilebilir değil. `AuthFlowIntegrationTest` (`-Dguc.integration=true`) ve PostgreSQL/Redis E2E zinciri çalıştırılamadı.
- İstenen kayıt → giriş → JWT → kullanıcı/şirket erişimi → yük oluşturma/listeleme → teklif/sevkiyat listeleme API senaryosu bu nedenle çalıştırılmış sayılmaz. Production'a yazma isteği gönderilmedi.
- Render uygulama loglarına bu ortamdan erişim yoktur. Daha önceki HTTP 500 için gerçek production exception/log kanıtı bulunmadığından Redis veya PostgreSQL kaynaklı olduğu iddia edilmemiştir.
- Postman koleksiyonu ve environment, API metot/yol/env değişkenleri ve JSON geçerliliği açısından statik olarak kontrol edilmiştir; canlı HTTP isteği çalıştırılmamıştır.

`Çalışıyor mu?` sütunu kaynak kodu ve test kapsamı incelemesini gösterir; yalnızca yukarıdaki iki modülün testleri bu turda yeniden çalıştırılmıştır. Birim testinin bulunması API'nin canlıda veya gerçek PostgreSQL/Redis ile doğrulandığı anlamına gelmez.

## Endpoint envanteri

| Endpoint | HTTP | Modül | Mevcut mu? | Çalışıyor mu? | Eksik iş |
|---|---:|---|---|---|---|
| `/api/v1/auth/register` | POST | Identity | Evet | Birim testli; E2E bekliyor | Docker ile üç rol ve şirket event zinciri |
| `/api/v1/auth/login` | POST | Identity | Evet | Birim testli; E2E bekliyor | PostgreSQL/Redis E2E |
| `/api/v1/auth/refresh` | POST | Identity | Evet | Birim testli; rotasyon testi var | E2E refresh/reuse testi atlandı |
| `/api/v1/auth/logout` | POST | Identity | Evet | Birim testli | Canlı session iptali smoke testi |
| `/api/v1/me` | GET | Identity | Evet | JWT testli | E2E rol/claim doğrulaması |
| `/api/v1/users/me` | GET | Users | Evet | Birim testli | Tek bir `/me` sözleşmesine yön verme |
| `/api/v1/sessions` | GET | Identity | Evet | Birim testli | Postman negatif sahiplik testi |
| `/api/v1/sessions/{sessionId}` | DELETE | Identity | Evet | Birim testli | E2E başka kullanıcı oturumu testi |
| `/api/v1/devices` | GET | Identity | Evet | Birim testli | — |
| `/api/v1/auth/mfa/enroll` | POST | Identity | Evet | Bu turda HTTP E2E yok | MFA secret/QR kurulumu |
| `/api/v1/auth/mfa/enable` | POST | Identity | Evet | Bu turda HTTP E2E yok | MFA kodu ile aktivasyon |
| `/api/v1/auth/mfa/disable` | POST | Identity | Evet | Bu turda HTTP E2E yok | MFA kodu ile kapatma |
| `/api/v1/auth/mfa/verify` | POST | Identity | Evet | Birim testli; E2E bekliyor | MFA login zinciri |
| `/api/v1/companies` | POST | Companies | Evet | Birim testli | Aynı kullanıcının mükerrer şirket politikasını netleştir |
| `/api/v1/companies/mine` | GET | Companies | Evet | Birim testli | — |
| `/api/v1/companies/{id}` | GET/PATCH | Companies | Evet | Üyelik/yönetici kontrolü testli | — |
| `/api/v1/companies/{id}/dashboard` | GET | Companies | Evet | Birim testli | Gerçek DB performans testi |
| `/api/v1/companies/{id}/members` | GET | Companies | Evet | Üyelik kontrolü birim testli | Production tenant negatif smoke testi |
| `/api/v1/companies/{id}/invitations` | GET/POST | Companies | Evet | OWNER/ADMIN kuralları birim testli | E-posta bildirim teslimatı |
| `/api/v1/companies/invitations/mine` | GET | Companies | Evet | JWT e-posta eşleşmesi kodda var | E2E davet kabul testi |
| `/api/v1/companies/invitations/{invitationId}/accept` | POST | Companies | Evet | E-posta bağlama/son kullanma birim testli | Eşzamanlı kabul DB testi |
| `/api/v1/companies/{id}/members/{userId}/role` | PATCH | Companies | Evet | OWNER koruması birim testli | Audit event geçmişi |
| `/api/v1/companies/{id}/members/{userId}` | DELETE | Companies | Evet | OWNER koruması birim testli | Audit event geçmişi |
| `/api/v1/loads` | POST | Loads | Evet | Birim testli | E2E company membership testi |
| `/api/v1/loads?mine=true` | GET | Loads | Evet | Repository/service testli | Büyük veri sayfalama testi |
| `/api/v1/loads/{id}` | GET/PATCH | Loads | Evet | Sahiplik davranışı testli | — |
| `/api/v1/loads/{id}/publish` | POST | Loads | Evet | Doğrulanmış şirket kuralı testli | Verification E2E zinciri |
| `/api/v1/loads/{id}/cancel` | POST | Loads | Evet | Birim testli | Kabul edilmiş teklif sonrası yarış testi |
| `/api/v1/loads/{loadId}/offers` | POST/GET | Offers | Evet | Birim testli | DB eşzamanlı teklif testi |
| `/api/v1/offers/incoming` | GET | Offers | Evet | Üyelik kontrolü kodda var | E2E tenant izolasyonu |
| `/api/v1/offers/mine` | GET | Offers | Evet | Birim testli | — |
| `/api/v1/offers/{id}/accept` | POST | Offers | Evet | Birim testli | Aynı ilana eşzamanlı iki kabul E2E testi |
| `/api/v1/offers/{id}/counter` | POST | Offers | Evet | Birim testli | Optimistic version çatışma E2E testi |
| `/api/v1/offers/{id}/rounds` | GET | Offers | Evet | Birim testli | — |
| `/api/v1/offers/{id}/reject` | POST | Offers | Evet | Birim testli | — |
| `/api/v1/offers/{id}/withdraw` | POST | Offers | Evet | Birim testli | — |
| `/api/v1/matches` | GET | Matching | Evet | Birim testli | — |
| `/api/v1/matches/{id}` | GET | Matching | Evet | Katılımcı filtresi kodda var | E2E tenant negatif testi |
| `/api/v1/shipments` | GET | Matching | Evet | Birim testli | — |
| `/api/v1/shipments/{id}/status` | POST | Matching | Evet | Geçiş/katılımcı kontrolü testli | Rol bazlı geçiş yetkisi daraltılmalı |
| `/api/v1/matches/{matchId}/messages` | GET/POST | Matching | Evet | Katılımcı kontrolü testli | Okundu bilgisi, ek dosya, sayfalama yok |
| `/api/v1/verification/applications/{id}/documents` | POST | Verification | Evet | Birim testli | Bu operasyon belgesi değil |
| Sevkiyat/CMR/fatura/dekont belge API'si | — | Documents | **Hayır** | — | Ayrı güvenli operasyon belgesi modeli/API'si |
| `/api/v1/payments/ledger` | GET | Matching | Evet | Kod denetlendi | Controller entegrasyon testi yok |
| `/api/v1/payments/matches/{matchId}/hold` | POST | Matching | Evet | Sahiplik kontrolü kodda var | Provider/idempotency entegrasyonu |
| `/api/v1/payments/{id}/confirm` | POST | Matching | Evet, ADMIN | Kod denetlendi | Webhook imzası/provider mutabakatı yok |
| `/api/v1/auth/password/*` | — | Identity | **Hayır** | — | Şifre sıfırlama/değiştirme endpoint'i yok |
| `/api/v1/auth/email/verify` | — | Identity | **Hayır** | — | E-posta doğrulama endpoint'i yok |

### Diğer backend modülleri

| Endpoint | HTTP | Modül | Mevcut mu? | Erişim/eksik iş |
|---|---:|---|---|---|
| `/api/v1/users/admin/ping` | GET | Users | Evet | Yalnız ADMIN |
| `/api/v1/admin/overview` | GET | Companies/Admin dashboard | Evet | Yalnız ADMIN |
| `/api/v1/drivers/profile` | POST | Drivers | Evet | Kimliği doğrulanmış kullanıcı; sahiplik/şirket E2E testi gerekli |
| `/api/v1/drivers/me` | GET/PATCH | Drivers | Evet | Kullanıcının kendi sürücü profili |
| `/api/v1/vehicles` | POST | Vehicles | Evet | Oluşturma; şirket sahipliği E2E testi gerekli |
| `/api/v1/vehicles/mine` | GET | Vehicles | Evet | Kullanıcının araçları |
| `/api/v1/vehicles/{id}` | GET/PATCH/DELETE | Vehicles | Evet | Sahiplik kuralları gerçek DB ile test edilmeli |
| `/api/v1/notifications` | GET | Notifications | Evet | Sayfalı liste; okunmamış sayısı ve tümünü-okundu yok |
| `/api/v1/notifications/{id}/read` | POST | Notifications | Evet | Tekil okundu |
| `/api/v1/devices/push-token` | POST/DELETE | Matching/Devices | Evet | Push token ekle/devre dışı bırak |
| `/api/v1/tracking/matches/{matchId}/positions` | POST | Matching/Tracking | Evet | Atanmış şoför konum yazar |
| `/api/v1/tracking/matches/{matchId}/latest` | GET | Matching/Tracking | Evet | Eşleşme katılımcısı son konumu okur |
| `/api/v1/verification/applications` | POST | Verification | Evet | Başvuru oluştur |
| `/api/v1/verification/applications/mine` | GET | Verification | Evet | Kullanıcının başvuruları |
| `/api/v1/verification/applications/{id}/submit` | POST | Verification | Evet | Başvuruyu gönder |
| `/api/v1/verification/applications/{id}/approve` | POST | Verification | Evet | Yalnız MODERATOR/ADMIN |
| `/api/v1/verification/applications/{id}/reject` | POST | Verification | Evet | Yalnız MODERATOR/ADMIN |
| `/api/v1/verification/applications/{id}/documents` | POST | Verification | Evet | Yalnız doğrulama dosyası; sevkiyat belgesi değil |

## Authentication bulguları

- Argon2id encoder kullanılıyor ve `bcprov-jdk18on` runtime bağımlılığı mevcut; encode/matches testi başarılı.
- JWT access token, opaque refresh token hashleme, refresh rotasyonu, family reuse detection, session revoke, MFA ve hesap kilidi uygulanmış.
- Kayıt rolleri: `SHIPPER`, `LOGISTICS_COMPANY`, `INDEPENDENT_DRIVER`, `FLEET_OWNER`.
- Register DTO'su rolü bu dört rol ile sınırlar; ADMIN/MODERATOR self-registration kabul edilmez. Şirket kayıtları event listener ile şirket ve OWNER üyeliği oluşturur.
- Şirket hesaplarında `companyName` ve iki harfli `companyCountry` zorunlu. Kayıt event'i şirket ve OWNER üyeliğini oluşturuyor.
- Argon2 encoder ve JWT/session davranışı hedefli auth testlerinden geçti. Gerçek register/login/refresh DB+Redis akışı Docker olmadığından sınanmadı.
- `/api/v1/me` ile `/api/v1/users/me` iki ayrı “me” sözleşmesi sunuyor; frontend açısından sözleşme belirsizliği yaratabilir.
- Controller'da password reset/change ve email verification route'u yok.

## Redis ve PostgreSQL

- Redis yalnızca varsayım değil: login/register/MFA rate limit her istekte `StringRedisTemplate.increment` çağırıyor. Redis erişilemezse yakalama/fallback yok; exception 500'e dönüşebilir ve auth akışını kesebilir. En küçük güvenli düzeltme; bağlantı hatasını ayrı gözlemlemek, açık bir fail-closed/fail-open politikası seçmek ve bunun testini eklemektir. Güvenlik limiti kaldırılmamalıdır.
- PostgreSQL/Redis'e bu turda bağlantı kurulmadı; health ve Render loglarına erişim yok. PostgreSQL veya Redis tarafında gözlenen gerçek exception yok.
- Login/register/MFA rate limit doğrudan Redis `INCR` kullanıyor, Redis hatasında fallback/catch yok. Bu hata üstteki generic exception handler tarafından 500'e çevrilebilir; mevcut production 500'ün nedeni olduğu kanıtlanmadı. Rate limit'i kaldırmak doğru çözüm değildir.
- Flyway V1–V19 ve `ddl-auto=validate` kullanılıyor. V18 çapraz modül foreign key'lerini `NOT VALID` ekliyor: mevcut satırlar doğrulanmış değildir, fakat yeni/updated satırlar kısıta tabidir. Production orphan sorguları sonrası `VALIDATE CONSTRAINT` gerekir. Polimorfik `offers.offerer_id` ve `vehicles.owner_id` DB foreign key'i ile tek tabloya bağlanamıyor; uygulama sahiplik kontrolünde kalıyor.
- `matches.load_id` ve `matches.offer_id` unique; shipment tarafında match/load/accepted offer unique ve aktif araç/şoför partial unique indeksleri çift atamayı engelliyor.

## Güvenlik ve veri izolasyonu

Olumlu:

- Varsayılan politika authenticated; yalnızca sağlık, OpenAPI ve auth başlangıç endpointleri açık.
- Company get/update, load taslak yönetimi, gelen teklifler, match/chat/shipment ve ödeme hold işlemlerinde üyelik/katılımcı kontrolü var.
- Refresh token veritabanında hashli; access ve MFA token tipleri ayrılmış.
- CORS production ortamında Vercel originlerine sınırlandırılmış.
- Match chat PostgreSQL `match_messages` tablosuna yazıyor ve okuma/yazmada match katılımcı kontrolü yapıyor; mesaj sayfalama, okunma durumu ve dosya desteği yok.

Bloker/iyileştirme:

1. Mevcut shipment geçişleri role göre ayrılmış: operasyon adımlarını atanmış şoför/taşıyıcı, iptali yalnızca yük veren veya taşıyıcı OWNER/ADMIN yapabilir. Production smoke testi hâlâ gereklidir.
2. Eksik foreign key'ler V18 additive migration ile `NOT VALID` olarak eklenmiş; production orphan audit sonrasında validation tamamlanmalıdır.
3. Payment hold gerçek ödeme değildir. Idempotency key, provider webhook doğrulaması, mutabakat ve iade/iptal modeli olmadan “ödendi” semantiği kullanılmamalı.
4. Operasyon belgeleri için authorization, malware scan, object storage ve süreli indirme URL'si henüz yok.
5. Company member API'si artık mevcut; frontend ekip ekranının canlı moda bağlanması ve rol değişiklikleri için audit event geçmişi eklenmesi gerekiyor.

## Postman dosyaları

- `docs/postman/Logiway-Backend.postman_collection.json`
- `docs/postman/Logiway-Local.postman_environment.json`

Environment gizli değer içermez. `accessToken`, `refreshToken`, `email` ve `password` kullanıcı tarafından local/test ortamında girilmelidir. Production üzerinde Register veya veri değiştiren istekler gereksiz yere çalıştırılmamalıdır.

## Önerilen geliştirme sırası

1. Docker açık ortamda mevcut `AuthFlowIntegrationTest` ve Postman smoke akışını çalıştır; auth/Redis/PostgreSQL gerçek exception kanıtını al.
2. V18 constraint'leri için production orphan audit ve ardından additive `VALIDATE CONSTRAINT` migration; tenant negatif entegrasyon testleri.
3. Company Members API'sini frontend canlı ekip ekranına bağla; davet bildirimi ve audit event geçmişi ekle.
4. Shipment role-based transition matrisi için production smoke ve concurrency testleri.
5. Operasyon belgeleri API'si.
6. Ödeme ledger'ını provider/idempotency/webhook modeliyle tamamla.
7. Mesajlarda sayfalama, okundu bilgisi ve güvenli ek dosya desteği.

Bu tur backend/frontend uygulama kodunu değiştirmedi; audit bulgularını ve Postman sözleşmesini güncelledi. Mevcut backend'de daha önce eklenmiş shipment yetki kontrolleri, V18 veri bütünlüğü constraint'leri ve şirket üyeliği/davet API'si incelendi.
