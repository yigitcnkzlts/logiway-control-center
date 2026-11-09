# Logiway backend API audit

Tarih: 9 Kasım 2026

İncelenen kaynak: `backend/` (14 Maven modülü)

Hariç tutulan: frontend ve `guc-backend-worktree/`

## Doğrulama özeti

- `mvn test`: **BUILD SUCCESS**.
- Final koşu: **200 test**, 196 başarılı, 4 atlandı. Üç yeni shipment rol/yetki regression testi dahildir.
- Atlanan 4 test `AuthFlowIntegrationTest` içindedir; `-Dguc.integration=true` ve çalışan Docker/PostgreSQL/Redis gerektirir. Bu makinede Docker daemon çalışmadığından gerçek kayıt → giriş → refresh → PostgreSQL/Redis E2E zinciri çalıştırılmadı.
- Canlı `GET https://logiway-api.onrender.com/actuator/health`: **UP** (liveness/readiness grupları).
- Render uygulama loglarına bu ortamdan erişim yoktur. Bu nedenle güncel production 500 hatasının Redis veya PostgreSQL kaynaklı olduğu iddia edilmemiştir.
- Postman koleksiyonu JSON olarak parse edilerek doğrulandı; token ve parola değerleri boş bırakıldı.

`Çalışıyor mu?` sütununda “Birim testli” controller URL'sinin canlıda çağrıldığı anlamına gelmez; ilgili service davranışının Maven testlerinden geçtiğini belirtir. “E2E bekliyor” gerçek PostgreSQL/Redis zincirinin bu turda çalıştırılamadığını gösterir.

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
| `/api/v1/auth/mfa/*` | POST | Identity | Evet | Birim testli | Tam Postman MFA senaryosu |
| `/api/v1/companies` | POST | Companies | Evet | Birim testli | Aynı kullanıcının mükerrer şirket politikasını netleştir |
| `/api/v1/companies/mine` | GET | Companies | Evet | Birim testli | — |
| `/api/v1/companies/{id}` | GET/PATCH | Companies | Evet | Üyelik/yönetici kontrolü testli | — |
| `/api/v1/companies/{id}/dashboard` | GET | Companies | Evet | Birim testli | Gerçek DB performans testi |
| Şirket üyesi liste/davet/rol/pasifleştirme | — | Companies | **Hayır** | — | Company Members API tasarla ve audit trail ekle |
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

## Authentication bulguları

- Argon2id encoder kullanılıyor ve `bcprov-jdk18on` runtime bağımlılığı mevcut; encode/matches testi başarılı.
- JWT access token, opaque refresh token hashleme, refresh rotasyonu, family reuse detection, session revoke, MFA ve hesap kilidi uygulanmış.
- Kayıt rolleri: `SHIPPER`, `LOGISTICS_COMPANY`, `INDEPENDENT_DRIVER`, `FLEET_OWNER`.
- Şirket hesaplarında `companyName` ve iki harfli `companyCountry` zorunlu. Kayıt event'i şirket ve OWNER üyeliğini oluşturuyor.
- Daha önceki event serialization ve Argon2 sınıf eksikliği için regression testleri geçiyor. Bu turda aynı 500 üretilemedi.
- `/api/v1/me` ile `/api/v1/users/me` iki ayrı “me” sözleşmesi sunuyor; frontend açısından sözleşme belirsizliği yaratabilir.

## Redis ve PostgreSQL

- Redis yalnızca varsayım değil: login/register/MFA rate limit her istekte `StringRedisTemplate.increment` çağırıyor. Redis erişilemezse yakalama/fallback yok; exception 500'e dönüşebilir ve auth akışını kesebilir. En küçük güvenli düzeltme; bağlantı hatasını ayrı gözlemlemek, açık bir fail-closed/fail-open politikası seçmek ve bunun testini eklemektir. Güvenlik limiti kaldırılmamalıdır.
- Production health yanıtı `UP`, ancak bileşen ayrıntıları yayınlanmadığı için PostgreSQL ve Redis ayrı ayrı doğrulanmış sayılmaz.
- Flyway V1–V17 ve `ddl-auto=validate` doğru yöndeydi. Audit sonrasında V18 ile çapraz modül ilişkilerine `NOT VALID` foreign key'ler eklendi: mevcut satırlar ve kullanıcı verileri korunurken yeni yazımlar hemen denetlenir. Polimorfik `offers.offerer_id` ve `vehicles.owner_id` tek tabloya güvenli biçimde bağlanamadığı için uygulama kontrolünde kalır. Production orphan sorguları temiz çıktıktan sonra ayrı migration ile `VALIDATE CONSTRAINT` çalıştırılmalıdır.
- `matches.load_id` ve `matches.offer_id` unique; shipment tarafında match/load/accepted offer unique ve aktif araç/şoför partial unique indeksleri çift atamayı engelliyor.

## Güvenlik ve veri izolasyonu

Olumlu:

- Varsayılan politika authenticated; yalnızca sağlık, OpenAPI ve auth başlangıç endpointleri açık.
- Company get/update, load taslak yönetimi, gelen teklifler, match/chat/shipment ve ödeme hold işlemlerinde üyelik/katılımcı kontrolü var.
- Refresh token veritabanında hashli; access ve MFA token tipleri ayrılmış.
- CORS production ortamında Vercel originlerine sınırlandırılmış.

Bloker/iyileştirme:

1. Shipment geçişleri audit sonrasında role göre ayrıldı: operasyon adımlarını atanmış şoför/taşıyıcı, iptali yalnızca yük veren veya taşıyıcı OWNER/ADMIN yapabilir. Production smoke testi hâlâ gereklidir.
2. Eksik foreign key'ler V18 additive migration ile `NOT VALID` olarak eklendi; production orphan audit sonrasında validation tamamlanmalıdır.
3. Payment hold gerçek ödeme değildir. Idempotency key, provider webhook doğrulaması, mutabakat ve iade/iptal modeli olmadan “ödendi” semantiği kullanılmamalı.
4. Operasyon belgeleri için authorization, malware scan, object storage ve süreli indirme URL'si henüz yok.
5. Company member yönetimi olmadığı için frontend ekip ekranı canlı API'ye bağlanamaz.

## Postman dosyaları

- `docs/postman/Logiway-Backend.postman_collection.json`
- `docs/postman/Logiway-Local.postman_environment.json`

Environment gizli değer içermez. `accessToken`, `refreshToken`, `email` ve `password` kullanıcı tarafından local/test ortamında girilmelidir. Production üzerinde Register veya veri değiştiren istekler gereksiz yere çalıştırılmamalıdır.

## Önerilen geliştirme sırası

1. Docker açık ortamda mevcut `AuthFlowIntegrationTest` ve Postman smoke akışını çalıştır; auth/Redis/PostgreSQL gerçek exception kanıtını al.
2. V18 constraint'leri için production orphan audit ve ardından additive `VALIDATE CONSTRAINT` migration; tenant negatif entegrasyon testleri.
3. Company Members liste/davet/rol/pasifleştirme API'si.
4. Shipment role-based transition matrisi ve concurrency testleri.
5. Operasyon belgeleri API'si.
6. Ödeme ledger'ını provider/idempotency/webhook modeliyle tamamla.
7. Mesajlarda sayfalama, okundu bilgisi ve güvenli ek dosya desteği.

Bu çalışma toplu backend yeniden yazımı içermez; audit bulgularından yalnızca shipment geçiş yetkisi ve additive veri bütünlüğü constraint'leri güvenli remediation olarak uygulanmıştır.
