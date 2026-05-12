# ElysiaJS Clean Architecture: Event Ticketing & Booking

Backend API untuk **Event Ticketing & Booking System** menggunakan **Bun + ElysiaJS + TypeScript + Drizzle ORM + Supabase** dengan pola **Clean Architecture** dan **Domain-Driven Design**.

## Struktur Project

```
src/
└── app/main/
    ├── api/               # Application + Presentation layer
    │   ├── event/         # Event module
    │   │   ├── controller/    # Commands, queries, handlers, controller
    │   │   ├── repository/    # Event repository
    │   │   ├── routes/        # Event routes
    │   │   └── service/       # Event services
    │   ├── booking/       # Booking module (same structure)
    │   ├── ticket/        # Ticket module (same structure)
    │   ├── refund/        # Refund module (same structure)
    │   ├── auth/          # Authentication module (same structure)
    │   ├── dashboard/     # Dashboard module (same structure)
    │   ├── customer/      # Customer portal module (same structure)
    │   └── promo-code/    # Promo code module (same structure)
    ├── domain/            # Domain entities & value objects
    ├── shared/            # Shared utilities, types, events, errors
    ├── middlewares/       # Elysia middlewares
    ├── infrastructure/    # Docs, mail, queue, cache, storage
    ├── config/            # App configuration
    ├── database/          # Drizzle schema, migrations, seeds
    ├── tests/             # Unit & integration tests
    ├── cmd/               # CLI entry points
    └── create-app.ts      # Main DI composition root
```

## Quick Start

### Prasyarat
- [Bun](https://bun.sh/) v1.3+
- [Supabase Account](https://supabase.com/) (gratis)

### Setup Supabase

1. **Buat project baru di Supabase**
   - Buka [Supabase Dashboard](https://supabase.com/dashboard)
   - Klik "New Project"
   - Isi nama project dan password database
   - Pilih region terdekat (Singapore untuk Indonesia)

2. **Dapatkan Connection String**
   - Buka project > Settings > Database
   - Scroll ke "Connection String" > pilih tab "URI"
   - Copy connection string (mode: Session atau Transaction)
   - Format: `postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`

### Setup Projects

```bash
# 1. Clone & masuk ke folder
git clone <repo-url>
cd elysiajs-clean-architecture

# 2. Install dependencies
bun install

# 3. Setup environment
cp .env.example .env
# Edit .env dan paste connection string dari Supabase

# 4. Push schema ke Supabase
bun run db:push

# 5. Seed database dengan data sample
bun run db:seed

# 6. Jalankan server
bun run dev
```

Server berjalan di `http://localhost:3000`.
Swagger UI di `http://localhost:3000/swagger`.

### Reset Database

Jika ingin reset database dari awal:

```bash
# 1. Drop semua table di Supabase (via SQL Editor atau Drizzle Studio)
bun run db:studio

# 2. Push schema ulang
bun run db:push

# 3. Seed ulang
bun run db:seed
```

## Scripts

| Script | Deskripsi |
|---|---|
| `bun run dev` | Jalankan server (watch mode) |
| `bun run start` | Jalankan server (production) |
| `bun run test` | Jalankan semua tests (domain + integration) |
| `bun run db:generate` | Generate migration files |
| `bun run db:migrate` | Jalankan migration |
| `bun run db:push` | Push schema langsung ke DB |
| `bun run db:seed` | Seed database dengan data lengkap |
| `bun run db:studio` | Buka Drizzle Studio |

## Testing

Project ini memiliki 2 jenis test:

### 1. Domain Tests (`tests/domain.test.ts`)
Test untuk business logic dan domain rules:
- Event entity validation
- Booking entity validation  
- Ticket entity validation
- Refund entity validation
- Value objects validation

### 2. Integration Tests (`tests/api-endpoints.test.ts`)
Test untuk semua API endpoints:
- Events endpoints (7 tests)
- Bookings endpoints (6 tests)
- Tickets endpoints (2 tests)
- Refunds endpoints (6 tests)
- Error handling (2 tests)

**Total: 23 integration tests + domain tests**

Jalankan test:
```bash
# Semua tests
bun run test

# Specific test file
bun test tests/api-endpoints.test.ts
bun test tests/domain.test.ts
```

## API Endpoints

### Events (Event Organizer)

| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/v1/events` | Create event baru |
| `GET` | `/api/v1/events` | List events (filter: `?status=`, `?location=`) |
| `GET` | `/api/v1/events/:id` | Detail event + ticket categories |
| `POST` | `/api/v1/events/:id/publish` | Publish event (Draft -> Published) |
| `POST` | `/api/v1/events/:id/cancel` | Cancel event (Published -> Cancelled) |
| `GET` | `/api/v1/events/:id/sales-report` | Laporan penjualan |
| `GET` | `/api/v1/events/:id/participants` | Daftar peserta |

### Bookings (Customer)

| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/v1/bookings` | Buat booking |
| `GET` | `/api/v1/bookings/:id` | Detail booking |
| `POST` | `/api/v1/bookings/:id/pay` | Bayar booking |

### Tickets (Gate Officer)

| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/v1/tickets/check-in` | Check-in tiket |

### Refunds

| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/v1/refunds` | Request refund |
| `POST` | `/api/v1/refunds/:id/approve` | Approve refund (Organizer) |
| `POST` | `/api/v1/refunds/:id/reject` | Reject refund (Organizer) |
| `POST` | `/api/v1/refunds/:id/payout` | Payout refund (Admin) |

## Seed Data & Testing Guide

Setelah `db:seed`, database akan terisi data lengkap untuk testing semua flow:

### Event IDs
| ID | Status | Bisa ditest |
|---|---|---|
| `event_draft-001` | Draft | Publish |
| `event_published-001` | Published | Booking, Cancel, Sales Report, Participants |
| `event_published-002` | Published | Booking |
| `event_cancelled-001` | Cancelled | View (tidak muncul di list) |
| `event_completed-001` | Completed | View |

### Booking IDs
| ID | Status | Bisa ditest |
|---|---|---|
| `booking_pending-001` | PendingPayment | Pay (amount: 500000) |
| `booking_paid-001` | Paid | Request Refund, View |
| `booking_paid-checkedin-001` | Paid | View (ada ticket checked-in) |
| `booking_expired-001` | Expired | View |
| `booking_refunded-001` | Refunded | View |
| `booking_paid-002` | Paid | Request Refund |

### Ticket Codes
| Code | Status | Bisa ditest |
|---|---|---|
| `TCKT-ACTV-0001` | Active | Check-in |
| `TCKT-ACTV-0002` | Active | Check-in |
| `TCKT-CHKD-0001` | CheckedIn | Reject (sudah dipakai) |

### Refund IDs
| ID | Status | Bisa ditest |
|---|---|---|
| `refund_requested-001` | Requested | Approve / Reject |
| `refund_approved-001` | Approved | Payout |
| `refund_rejected-001` | Rejected | View |
| `refund_paidout-001` | PaidOut | View |

## Contoh Request

### Create Event
```bash
curl -X POST http://localhost:3000/api/v1/events \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Workshop Flutter",
    "description": "Workshop mobile development",
    "venue": "ITS Surabaya",
    "startAt": "2026-09-01T09:00:00Z",
    "endAt": "2026-09-01T17:00:00Z",
    "maxCapacity": 100,
    "ticketCategories": [
      { "name": "Regular", "price": 150000, "quota": 80, "salesStart": "2026-07-01T00:00:00Z", "salesEnd": "2026-08-31T23:59:59Z" },
      { "name": "VIP", "price": 350000, "quota": 20, "salesStart": "2026-07-01T00:00:00Z", "salesEnd": "2026-08-31T23:59:59Z" }
    ]
  }'
```

### Create Booking
```bash
curl -X POST http://localhost:3000/api/v1/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "event_published-001",
    "customerName": "Ari Pratama",
    "customerEmail": "ari@example.com",
    "items": [
      { "ticketCategoryId": "cat_regular-001", "quantity": 2 }
    ]
  }'
```

### Pay Booking
```bash
curl -X POST http://localhost:3000/api/v1/bookings/booking_pending-001/pay \
  -H "Content-Type: application/json" \
  -d '{ "amount": 500000 }'
```

### Check-in Ticket
```bash
curl -X POST http://localhost:3000/api/v1/tickets/check-in \
  -H "Content-Type: application/json" \
  -d '{ "ticketCode": "TCKT-ACTV-0001", "eventId": "event_published-001" }'
```

### Request Refund
```bash
curl -X POST http://localhost:3000/api/v1/refunds \
  -H "Content-Type: application/json" \
  -d '{ "bookingId": "booking_paid-001" }'
```

## Unit Tests

```bash
bun run test
```

Test cases mencakup domain logic validasi pada Event, Booking, Ticket, dan Refund.

## Tech Stack

- **Runtime**: [Bun](https://bun.sh/)
- **Framework**: [ElysiaJS](https://elysiajs.com/)
- **Language**: TypeScript
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Architecture**: Clean Architecture + DDD Tactical Patterns

## Deployment

### Deploy ke Vercel

Project ini sudah dikonfigurasi untuk deploy ke Vercel dengan Bun runtime.

1. **Setup Supabase Production Database**
   - Buat project baru untuk production di [Supabase Dashboard](https://supabase.com/dashboard)
   - Dapatkan connection string production

2. **Deploy ke Vercel**
   ```bash
   # Install Vercel CLI (jika belum)
   npm i -g vercel
   
   # Login ke Vercel
   vercel login
   
   # Deploy
   vercel
   ```

3. **Set Environment Variables di Vercel**
   - Buka project di Vercel Dashboard
   - Settings > Environment Variables
   - Tambahkan `DATABASE_URL` dengan connection string Supabase production

4. **Push Schema & Seed Data** (opsional)
   ```bash
   # Setelah deploy, jalankan di local dengan DATABASE_URL production
   DATABASE_URL=<supabase-production-url> bun run db:push
   DATABASE_URL=<supabase-production-url> bun run db:seed
   ```

### Deploy ke Platform Lain (Railway, Fly.io, dll)

1. **Setup Supabase Production Database**
   - Buat project baru untuk production
   - Dapatkan connection string production

2. **Deploy Application**
   ```bash
   # Set environment variables
   DATABASE_URL=<supabase-production-url>
   PORT=3000
   
   # Build & start
   bun install
   bun run db:push
   bun run start
   ```

3. **Seed data production** (opsional)
   ```bash
   bun run db:seed
   ```

### Troubleshooting Deployment

**404 Not Found pada semua endpoint:**
- Pastikan file `src/index.ts` ada dan export default Elysia instance
- Pastikan `vercel.json` ada dengan `bunVersion: "1.x"`
- Pastikan environment variable `DATABASE_URL` sudah di-set di Vercel

**Database connection error:**
- Pastikan connection string Supabase benar
- Pastikan schema sudah di-push ke database production
- Cek apakah IP Vercel sudah di-whitelist di Supabase (biasanya otomatis)
