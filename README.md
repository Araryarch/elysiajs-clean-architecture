# ElysiaJS Clean Architecture: Event Ticketing & Booking

Backend API untuk event management system dengan fitur ticketing dan booking. Project ini memakai Bun, ElysiaJS, TypeScript, dan clean architecture.

## Struktur

- `src/domain`: entity, contract repository, dan error bisnis.
- `src/application`: use case aplikasi.
- `src/infrastructure`: implementasi detail teknis, saat ini repository in-memory.
- `src/presentation/http`: HTTP app, route, dan error mapper.
- `src/shared`: helper umum.

## Menjalankan

```bash
bun install
bun run dev
```

Server default berjalan di `http://localhost:3000`.

Swagger UI tersedia di `http://localhost:3000/swagger`.

## Endpoint Utama

- `GET /health`
- `GET /events`
- `GET /events/:id`
- `POST /events`
- `POST /bookings`
- `GET /bookings/:id`
- `POST /bookings/:id/confirm`
- `POST /bookings/:id/cancel`

## Contoh Create Booking

```bash
curl -X POST http://localhost:3000/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "seed-event-1",
    "customerName": "Ari",
    "customerEmail": "ari@example.com",
    "items": [
      { "ticketCategoryId": "seed-vip", "quantity": 2 }
    ]
  }'
```
