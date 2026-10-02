# Frontend / Backend Integration Audit

Audit date: 2026-10-02

## Implemented backend contracts

| Capability | Backend status | Contract |
| --- | --- | --- |
| Loads and marketplace | Implemented | `/api/v1/loads` |
| Offers | Implemented | `/api/v1/loads/{loadId}/offers`, `/api/v1/offers/mine` |
| Counter offer and history | Implemented | `POST /api/v1/offers/{id}/counter`, `GET /api/v1/offers/{id}/rounds` |
| Offer accept/reject/withdraw | Implemented | `/api/v1/offers/{id}/accept|reject|withdraw` |
| Shipment status | Implemented | `POST /api/v1/shipments/{id}/status` |
| Tracking | Implemented | `/api/v1/tracking/matches/{matchId}/positions|latest` |
| Notifications | Partial | Paginated list and single mark-read exist. Unread count and mark-all-read are missing. |
| Match chat | Development-only | In-memory GET/POST exists. It has no persistence, participant authorization, unread state, pagination, or attachments. |
| Verification documents | Implemented for verification scope | Not a shipment-document API. |
| Payments | Partial | Ledger, hold and confirmation exist. Invoice domain is missing. |

## Production gaps and required contracts

### Messaging

The current `MatchChatController` must not be treated as a production messaging source. A persistent module needs conversations, participants, messages and attachments. Every lookup must authorize the current user through company membership plus load/offer/shipment relationship. Required operations: paginated conversation list, paginated messages, send, mark-read and unread count. Attachments must validate PDF/JPEG/PNG MIME and size server-side, generate storage keys independently of user filenames, and authorize both upload and download.

### Notifications

Add unread-count and mark-all-read operations to the existing notification service. Navigation metadata should remain in `payloadJson` as validated `entityType` and `entityId`. Responses should use a DTO instead of exposing the JPA entity.

### Search

No tenant-aware global search endpoint exists. Add one normalized paginated result contract for loads, shipments, companies, vehicles and drivers. Enforce a minimum query length, a result cap and entity-level authorization.

### Shipment operations

Shipment transitions exist and validate ordered state changes. Dedicated carrier assignment endpoints are not exposed; current assignment is captured on the offer. If reassignment is required, add transactional driver/vehicle assignment with carrier ownership, availability, document validity and overlapping-shipment checks.

### Documents and contact disclosure

Shipment documents and authorized contact disclosure endpoints are missing. Both require shipment-party checks. Drivers must not receive finance-only documents. Marketplace responses must not include full phone/email before an accepted relationship.

### Location and geocoding

Tracking exists at match level. Geocoding does not. Addresses remain the source of truth and coordinates stay nullable. A future provider-neutral geocoding adapter should persist status (`NOT_GEOCODED`, `GEOCODED`, `FAILED`, `NEEDS_REVIEW`) without blocking load creation.

### Team and finance

Company membership exists, but the web team-management contract is incomplete. Payments are partial and invoices are missing. Do not show synthesized revenue, invoice or payment records in production.

## Security and data rules

- Never fall back to demo/localStorage after a configured API fails.
- Use backend timestamps and decimal amount plus ISO currency; format only in presentation code.
- Critical commands (accept, reject, withdraw, counter, assignment and status) wait for server success; no optimistic persistence.
- Preserve offer rounds; never overwrite negotiation history.
- Rely on the existing optimistic version in `CounterOfferRequest` for stale-write conflicts.
- Keep accept/match/shipment creation transactional and idempotent; database uniqueness remains the final duplicate guard.
- Audit offer decisions, assignment, status, document, contact and membership changes through the existing audit/outbox architecture.
