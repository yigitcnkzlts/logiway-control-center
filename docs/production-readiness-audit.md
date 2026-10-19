# Logiway production readiness audit

## Scope

Frontend routes, navigation, clickable controls, role portals, API fallbacks, authentication, messaging, notifications, visual claims and backend integration boundaries were reviewed on 2026-10-19.

## Fixed in this pass

- Logout now clears access, refresh and session data before returning to login.
- Live login forms no longer expose demo e-mail addresses or a shared demo password.
- Unsupported “free trial/free start” marketing claims were removed.
- Fixed unread counters were removed; only data-backed counts should be shown.
- The profile button now opens the closest role-specific account/team area.
- Live mode no longer presents sample shipment, route, payment or document data as real data.
- Demo document uploads remain isolated to demo mode; live mode waits for secure storage and verification APIs.
- Live driver screens no longer display a fictional driver, phone number, vehicle or assigned route.
- Match chat is persistent, participant-authorized and backed by the API.
- Match e-mail alerts are available when SMTP configuration is enabled.

## Click-path inventory

| Area | Current state | Next production addition |
| --- | --- | --- |
| Landing navigation and CTA | Working anchors/routes | Add legal/privacy/contact pages and analytics consent |
| Registration and login | API-backed, MFA supported | Password reset, e-mail verification and terms acceptance |
| Logout | Working and session-clearing | Server-side refresh-token revocation endpoint call |
| Load creation | API-backed | Address geocoding, draft autosave and duplicate-submit idempotency |
| Offer submission/acceptance | API-backed | Confirmation dialog, optimistic-lock conflict UI and offer withdrawal UI |
| Match chat | Persistent and authorized | Read receipts, pagination, attachments and realtime WebSocket/SSE delivery |
| Notifications | API-backed list/read | Realtime delivery, preference management and reliable e-mail outbox/retry |
| Shipment detail | Demo only; honest empty state in live mode | Bind match detail and shipment status transition APIs |
| Driver assignment | Backend support exists | Add company assignment UI and driver acceptance flow |
| Phone contact | Backend exposes matched-party phones | Bind real match detail to contact cards; never expose before matching |
| Live tracking | Position APIs exist | Consent, background update policy, map provider and stale-position handling |
| Documents | Demo only; disabled in live mode | Object storage upload, malware scan, KYC review and expiry reminders |
| Payments/invoices | Demo only; disabled in live mode | Licensed payment provider, ledger reconciliation, invoices and disputes |
| Team management | Placeholder | Invitations, roles, membership removal and audit log |
| Vehicles/drivers | Partial dashboards | CRUD, availability, document status and assignment conflicts |
| Search/command palette | Local UI | Server-side search with role/tenant filtering |
| Saved loads/filters | Local preferences | Account-synced preferences endpoint |
| Language picker | Partial labels | Full i18n catalogue; hide selector until complete |
| Help and support | Missing | Support/contact entry, incident status and feedback reporting |

## Visual and interaction recommendations

1. Use real empty states instead of sample numbers in every authenticated live view.
2. Add skeleton loading and retry actions to every API-backed list.
3. Show a persistent “Demo” banner only when `VITE_USE_MOCK_DATA=true`.
4. Add mobile bottom navigation for the driver workflow; keep primary actions thumb-reachable.
5. Use maps only when position freshness and user consent are visible.
6. Add confirmation for irreversible actions such as load cancellation and offer acceptance.
7. Replace partial language switching with full translations before advertising multilingual support.

## Go-live blockers

- Shipment detail/status UI is not yet bound to the real match/shipment API.
- Driver assignment and live task UI are incomplete.
- Password reset and account e-mail verification are missing.
- Document upload/KYC and payment screens need real providers before activation.
- SMTP credentials and `EMAIL_NOTIFICATIONS_ENABLED=true` are required for match e-mails.
- Production monitoring, error tracking, backups, migration rehearsal and end-to-end staging tests need evidence.

## Recommended delivery order

1. Real shipment detail plus status state machine UI.
2. Company-to-driver assignment and driver task acceptance.
3. Password reset/e-mail verification.
4. Realtime notifications/chat and reliable delivery retries.
5. Secure documents/KYC.
6. Tracking/map integration.
7. Payments and invoicing after provider/legal readiness.
