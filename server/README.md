# Wedding venue module

The venue module uses the existing JWT HTTP-only cookie and the `User`, `Vendor`, and `Admin` role models. Public listings contain only approved, active venues. Vendor venue changes are owner-scoped; venue edits return the listing to pending review.

## Environment

Set the following in `server/.env`:

- `MONGO_URI` — MongoDB connection string. If omitted, the existing development configuration starts an in-memory MongoDB.
- `JWT_SECRET` — the signing secret already used by the authentication system.
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_UPLOAD_PRESET` — a **signed** Cloudinary upload preset configured for images, with an 8 MB maximum file size and JPG/PNG/WebP allowed formats.

The upload-signature route is vendor-authenticated. The API secret stays on the server; the browser uploads selected images directly to Cloudinary. Venue records store only the resulting secure URLs.

## Run

From `server/`:

```sh
npm run dev
```

From `client/` in a separate terminal:

```sh
npm run dev
```

The client Vite proxy defaults to `http://localhost:5001`. For a different local API port, set `API_PROXY_TARGET` before starting Vite.

## Venue and booking endpoints

| Method | Endpoint | Access |
| --- | --- | --- |
| `GET` | `/api/venues` | Public search and filters |
| `GET` | `/api/venues/:id` | Public approved venue details |
| `GET` | `/api/venues/:id/availability?date=YYYY-MM-DD&guests=300` | Public, database-backed availability check |
| `POST` | `/api/venues` | Vendor |
| `GET` | `/api/venues/vendor/my` | Vendor |
| `GET` | `/api/venues/vendor/my/:id` | Owning vendor |
| `PUT` / `DELETE` | `/api/venues/:id` | Owning vendor |
| `PATCH` | `/api/venues/:id/status` | Owning vendor |
| `PATCH` | `/api/venues/:id/availability` | Owning vendor; replaces blocked dates |
| `GET` | `/api/venues/admin` | Admin; optional `approvalStatus` filter and totals |
| `PATCH` | `/api/venues/admin/:id/status` | Admin; approve, reject, or disable |
| `POST` | `/api/bookings` | User; creates a pending request |
| `GET` | `/api/bookings/user/my` | User |
| `GET` | `/api/bookings/user/my/:id` | Booking owner |
| `PATCH` | `/api/bookings/user/my/:id/cancel` | Booking owner; reason required; active booking only |
| `PATCH` | `/api/bookings/user/my/:id/quotation` | Booking owner; accepts or rejects a sent quotation |
| `GET` | `/api/bookings/vendor/my` | Vendor |
| `PATCH` | `/api/bookings/vendor/:id/respond` | Owning vendor; legacy acceptance or rejection of pending requests |
| `POST` | `/api/bookings/vendor/:id/quotation` | Owning vendor; sends a server-calculated quotation for a pending request |
| `PATCH` | `/api/bookings/vendor/:id/cancel` | Owning vendor; reason required; active booking only |
| `GET` | `/api/bookings/admin` | Admin; optional status filter |
| `PATCH` | `/api/bookings/admin/:id/cancel` | Admin; exceptional cancellation; reason required |
| `PATCH` | `/api/bookings/admin/:id/complete` | Admin; completes a confirmed booking on/after the event date |
| `GET` / `PATCH` | `/api/vendors/me` | Vendor; read/update own public business profile |
| `GET` | `/api/vendors/:id` | Public; approved active venues and explicitly public profile fields |
| `GET` | `/api/notifications` | Authenticated user, vendor, or admin; latest 50 for current account |
| `PATCH` | `/api/notifications/:id/read` | Owning notification recipient |
| `PATCH` | `/api/notifications/read-all` | Authenticated current account |
| `POST` | `/api/uploads/venue-signature` | Vendor |

### Booking lifecycle and quotations

New booking requests begin as `pending`. The quotation flow is `pending` → `quotation_sent` → `confirmed`, with user rejection moving the booking to `rejected`. Existing `accepted` bookings remain supported as legacy confirmed reservations. Pending requests can be rejected or cancelled; quotation-sent bookings can be accepted, rejected, or cancelled; confirmed bookings can be cancelled or completed. Completed, rejected, and cancelled bookings are terminal.

The quotation is embedded in its `VenueBooking` and records the numeric base price, extras, explanation, vendor message, advance percentage, server-computed total/advance/remaining amounts, quotation status, and timestamps. Amounts are calculated to two decimal places on the server; client previews are informational only.

User, owning vendor, and admin cancellations require a reason and persist the actor and timestamp. The venue's cancellation policy is displayed during confirmation; no refund is calculated because there is no payment/refund system. Admins can mark a confirmed booking completed only on or after its event date. Lifecycle events and account-scoped database notifications are stored with the booking and notification collections respectively.

Venue comparison selections are stored in browser local storage as venue IDs only, capped at three; no authentication data is stored there. Comparisons use public venue API records. Ratings/reviews and vendor statistics are omitted because those models/data are not present.

Accepted legacy bookings and new confirmed bookings have a MongoDB partial unique index on venue and event date. Startup awaits index initialization, and a conflicting confirmation maps to HTTP `409`.

## Verification

From `client/`, run `npm run lint` and `npm run build`. The booking race/authorization workflow can be exercised with an isolated MongoDB memory server: create a venue as a vendor, approve it as an admin, create two pending requests for the same date, and attempt both vendor acceptances concurrently. Exactly one acceptance should succeed.
