# API Endpoint Improvements

## Ringkasan Perbaikan

Dokumen ini menjelaskan perbaikan yang telah dilakukan pada endpoint API agar sesuai dengan requirements di AGENT.md.

---

## 1. Validasi Input yang Lebih Ketat

### Sebelum:
```typescript
body: t.Object({
  name: t.String(),
  price: t.Number(),
  quota: t.Number(),
})
```

### Sesudah:
```typescript
body: t.Object({
  name: t.String({ minLength: 1 }),
  price: t.Number({ minimum: 0 }),
  quota: t.Number({ minimum: 1 }),
})
```

**Alasan:** Sesuai dengan acceptance criteria di AGENT.md yang menyebutkan:
- Ticket price cannot be less than zero
- Ticket quota must be greater than zero
- Mencegah input kosong atau invalid

**File yang diubah:**
- `src/presentation/http/controllers/event.controller.ts`
- `src/presentation/http/controllers/booking.controller.ts`
- `src/presentation/http/controllers/ticket.controller.ts`
- `src/presentation/http/controllers/refund.controller.ts`

---

## 2. Pemisahan Create Event dan Add Ticket Category

### Sebelum:
```typescript
POST /events
{
  "name": "Event",
  "maxCapacity": 1000,
  "ticketCategories": [...]  // ❌ Langsung include categories
}
```

### Sesudah:
```typescript
// Step 1: Create event (US1)
POST /events
{
  "name": "Event",
  "maxCapacity": 1000
  // ✅ Tidak ada ticketCategories
}

// Step 2: Add categories (US4)
POST /events/:id/ticket-categories
{
  "name": "Regular",
  "price": 100000,
  "quota": 500
}
```

**Alasan:** 
- US1 (Create Event) dan US4 (Create Ticket Category) adalah user stories yang terpisah
- Event harus dibuat dengan status Draft terlebih dahulu
- Ticket categories ditambahkan setelah event dibuat
- Sesuai dengan prinsip Single Responsibility

**File yang diubah:**
- `src/presentation/http/controllers/event.controller.ts`

---

## 3. Dokumentasi User Story pada Setiap Endpoint

### Sebelum:
```typescript
.post("/:id/publish", async ({ params }) => {
  await publishEventHandler.execute(new PublishEventCommand(params.id));
  return success(null, "Event published successfully");
})
```

### Sesudah:
```typescript
.post("/:id/publish", async ({ params }) => {
  // US2: Publish Event (Event Organizer only)
  await publishEventHandler.execute(new PublishEventCommand(params.id));
  return success(null, "Event published successfully");
})
```

**Alasan:**
- Memudahkan traceability antara code dan requirements
- Developer dapat langsung melihat user story mana yang diimplementasikan
- Memudahkan code review dan maintenance

**File yang diubah:**
- Semua controller files

---

## 4. Penambahan Query Parameter Validation

### Sebelum:
```typescript
.get("/", async ({ query }) => {
  const result = await listEventsHandler.execute(
    new ListEventsQuery(query.status, query.location, query.date)
  );
  return success(result, "Events retrieved successfully");
})
```

### Sesudah:
```typescript
.get(
  "/",
  async ({ query }) => {
    // US6: View Available Events - with proper filtering
    const result = await listEventsHandler.execute(
      new ListEventsQuery(query.status, query.location, query.date)
    );
    return success(result, "Events retrieved successfully");
  },
  {
    query: t.Object({
      status: t.Optional(t.String()),
      location: t.Optional(t.String()),
      date: t.Optional(t.String()),
    }),
  }
)
```

**Alasan:**
- US6 menyebutkan "Customers can filter events by date or location"
- Validasi query parameters mencegah injection attacks
- Type safety untuk query parameters

**File yang diubah:**
- `src/presentation/http/controllers/event.controller.ts`

---

## 5. Klarifikasi Endpoint Expire Booking

### Sebelum:
```typescript
// US11: Expire unpaid booking past deadline
.post("/:id/expire", async ({ params }) => {
  await expireBookingHandler.execute(new ExpireBookingCommand(params.id));
  return success(null, "Booking expired successfully");
})
```

### Sesudah:
```typescript
// NOTE: US11 (Expire Booking) should be handled by a background job/scheduler
// This endpoint is for manual/admin testing purposes only
.post("/:id/expire", async ({ params }) => {
  await expireBookingHandler.execute(new ExpireBookingCommand(params.id));
  return success(null, "Booking expired successfully");
})
```

**Alasan:**
- US11 menyebutkan "As the System" bukan "As a User"
- Seharusnya dijalankan oleh background job/scheduler otomatis
- Endpoint ini hanya untuk testing/admin purposes
- Menghindari kebingungan tentang siapa yang seharusnya memanggil endpoint ini

**File yang diubah:**
- `src/presentation/http/controllers/booking.controller.ts`

---

## 6. Penambahan Role Information pada Comments

### Contoh:
```typescript
// US16: Approve Refund (Event Organizer only)
.post("/:id/approve", async ({ params }) => {
  await approveRefundHandler.execute(new ApproveRefundCommand(params.id));
  return success(null, "Refund approved successfully");
})
```

**Alasan:**
- Memperjelas actor/role yang berhak mengakses endpoint
- Memudahkan implementasi authorization middleware di masa depan
- Sesuai dengan actor mapping di AGENT.md:
  - Event Organizer
  - Customer
  - Gate Officer
  - System Admin

**File yang diubah:**
- Semua controller files

---

## 7. Email Validation untuk Customer Email

### Sebelum:
```typescript
body: t.Object({
  customerEmail: t.String(),
})
```

### Sesudah:
```typescript
body: t.Object({
  customerEmail: t.String({ format: "email" }),
})
```

**Alasan:**
- Email adalah value object penting dalam domain
- Mencegah invalid email format
- Sesuai dengan domain model (Email value object)

**File yang diubah:**
- `src/presentation/http/controllers/booking.controller.ts`

---

## 8. Minimum Items Validation untuk Booking

### Sebelum:
```typescript
items: t.Array(
  t.Object({
    ticketCategoryId: t.String(),
    quantity: t.Number(),
  })
)
```

### Sesudah:
```typescript
items: t.Array(
  t.Object({
    ticketCategoryId: t.String({ minLength: 1 }),
    quantity: t.Number({ minimum: 1 }),
  }),
  { minItems: 1 }
)
```

**Alasan:**
- Booking harus memiliki minimal 1 item
- Quantity harus minimal 1 (sesuai US8)
- Mencegah empty booking

**File yang diubah:**
- `src/presentation/http/controllers/booking.controller.ts`

---

## Rekomendasi Implementasi Selanjutnya

### 1. Authentication & Authorization Middleware
```typescript
// Contoh implementasi
const requireRole = (role: 'organizer' | 'customer' | 'gate_officer' | 'admin') => {
  return async (context: any) => {
    const user = await authenticate(context);
    if (user.role !== role) {
      throw new UnauthorizedError();
    }
  };
};

// Penggunaan
.post("/:id/publish", 
  { beforeHandle: requireRole('organizer') },
  async ({ params }) => {
    // ...
  }
)
```

### 2. Background Job untuk Expire Bookings
```typescript
// Menggunakan cron job atau task scheduler
import { CronJob } from 'cron';

const expireBookingsJob = new CronJob('*/5 * * * *', async () => {
  // Setiap 5 menit, cek booking yang sudah melewati deadline
  const expiredBookings = await bookingRepository.findExpiredBookings();
  for (const booking of expiredBookings) {
    await expireBookingHandler.execute(new ExpireBookingCommand(booking.id));
  }
});
```

### 3. Rate Limiting
```typescript
// Mencegah abuse pada endpoint create booking
import rateLimit from '@elysiajs/rate-limit';

app.use(rateLimit({
  duration: 60000, // 1 menit
  max: 10, // maksimal 10 request
  skip: (req) => req.path !== '/api/v1/bookings'
}));
```

### 4. Request Logging
```typescript
// Log semua request untuk audit trail
app.use((context) => {
  console.log({
    method: context.request.method,
    path: context.path,
    user: context.user?.id,
    timestamp: new Date().toISOString()
  });
});
```

### 5. Error Response Standardization
```typescript
// Consistent error response format
class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
  }
}

// Error handler
app.onError((error) => {
  if (error instanceof ApiError) {
    return {
      success: false,
      error: error.message,
      code: error.code,
      statusCode: error.statusCode
    };
  }
  // Handle domain errors, validation errors, etc.
});
```

---

## Checklist Compliance dengan AGENT.md

### ✅ Sudah Sesuai:
- [x] Semua 20 User Stories memiliki endpoint
- [x] Input validation sesuai acceptance criteria
- [x] Response format konsisten
- [x] Dokumentasi user story pada code
- [x] Pemisahan concerns (create event vs add category)
- [x] Query parameter validation
- [x] Role documentation pada comments

### ⚠️ Perlu Implementasi Tambahan:
- [ ] Authentication middleware
- [ ] Authorization berdasarkan role
- [ ] Background job untuk expire bookings
- [ ] Rate limiting
- [ ] Request logging untuk audit
- [ ] Comprehensive error handling
- [ ] API versioning strategy
- [ ] CORS configuration
- [ ] Request/Response logging

### 📝 Perlu Dokumentasi:
- [x] API documentation (API.md)
- [ ] Postman/Thunder Client collection
- [ ] Integration test examples
- [ ] Deployment guide
- [ ] Environment configuration guide

---

## Testing Recommendations

### 1. Integration Tests
```typescript
describe('POST /events', () => {
  it('should create event without ticket categories', async () => {
    const response = await app.handle(
      new Request('http://localhost/api/v1/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Event',
          venue: 'Test Venue',
          startAt: '2024-12-01T09:00:00Z',
          endAt: '2024-12-01T18:00:00Z',
          maxCapacity: 100
        })
      })
    );
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.id).toBeDefined();
  });
});
```

### 2. Validation Tests
```typescript
describe('POST /bookings validation', () => {
  it('should reject empty items array', async () => {
    const response = await app.handle(
      new Request('http://localhost/api/v1/bookings', {
        method: 'POST',
        body: JSON.stringify({
          eventId: 'evt_123',
          customerName: 'John',
          customerEmail: 'john@example.com',
          items: [] // Empty array
        })
      })
    );
    
    expect(response.status).toBe(400);
  });
  
  it('should reject invalid email', async () => {
    const response = await app.handle(
      new Request('http://localhost/api/v1/bookings', {
        method: 'POST',
        body: JSON.stringify({
          eventId: 'evt_123',
          customerName: 'John',
          customerEmail: 'invalid-email', // Invalid format
          items: [{ ticketCategoryId: 'cat_1', quantity: 1 }]
        })
      })
    );
    
    expect(response.status).toBe(400);
  });
});
```

---

## Kesimpulan

Perbaikan yang telah dilakukan fokus pada:

1. **Compliance dengan AGENT.md** - Semua endpoint sesuai dengan user stories
2. **Input Validation** - Validasi yang lebih ketat sesuai acceptance criteria
3. **Code Documentation** - Traceability antara code dan requirements
4. **Separation of Concerns** - Pemisahan create event dan add ticket category
5. **Security** - Validasi input untuk mencegah injection attacks
6. **Maintainability** - Comments yang jelas tentang role dan user story

Langkah selanjutnya adalah implementasi authentication, authorization, dan background jobs untuk membuat sistem production-ready.
