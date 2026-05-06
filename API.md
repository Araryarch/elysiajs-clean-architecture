# Event Ticketing & Booking System - API Documentation

## Base URL
```
http://localhost:3000/api/v1
```

## Response Format
All responses follow this format:
```json
{
  "success": true,
  "data": { ... },
  "message": "Success message"
}
```

Error responses:
```json
{
  "success": false,
  "error": "Error message"
}
```

---

## Events API

### 1. Create Event (US1)
**Actor:** Event Organizer

Creates a new event in Draft status. Ticket categories should be added separately.

```http
POST /events
Content-Type: application/json

{
  "name": "Tech Conference 2024",
  "description": "Annual technology conference",
  "venue": "Jakarta Convention Center",
  "startAt": "2024-12-01T09:00:00Z",
  "endAt": "2024-12-01T18:00:00Z",
  "maxCapacity": 1000
}
```

**Validation:**
- `name`: required, min length 1
- `venue`: required, min length 1
- `maxCapacity`: required, minimum 1
- `endAt` must be after `startAt`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "evt_123"
  },
  "message": "Event created successfully"
}
```

---

### 2. List Events (US6)
**Actor:** Customer

View available published events with optional filtering.

```http
GET /events?status=Published&location=Jakarta&date=2024-12-01
```

**Query Parameters:**
- `status` (optional): Filter by event status (Published, Draft, Cancelled)
- `location` (optional): Filter by venue location
- `date` (optional): Filter by event date

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "evt_123",
      "name": "Tech Conference 2024",
      "venue": "Jakarta Convention Center",
      "startAt": "2024-12-01T09:00:00Z",
      "endAt": "2024-12-01T18:00:00Z",
      "status": "Published",
      "lowestPrice": 100000
    }
  ],
  "message": "Events retrieved successfully"
}
```

---

### 3. Get Event Details (US7)
**Actor:** Customer

View detailed information about an event including ticket categories.

```http
GET /events/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "evt_123",
    "name": "Tech Conference 2024",
    "description": "Annual technology conference",
    "venue": "Jakarta Convention Center",
    "startAt": "2024-12-01T09:00:00Z",
    "endAt": "2024-12-01T18:00:00Z",
    "maxCapacity": 1000,
    "status": "Published",
    "ticketCategories": [
      {
        "id": "cat_1",
        "name": "Regular",
        "price": 100000,
        "quota": 500,
        "remainingQuota": 450,
        "salesStart": "2024-11-01T00:00:00Z",
        "salesEnd": "2024-11-30T23:59:59Z",
        "status": "Active"
      },
      {
        "id": "cat_2",
        "name": "VIP",
        "price": 250000,
        "quota": 100,
        "remainingQuota": 0,
        "salesStart": "2024-11-01T00:00:00Z",
        "salesEnd": "2024-11-30T23:59:59Z",
        "status": "SoldOut"
      }
    ]
  },
  "message": "Event retrieved successfully"
}
```

---

### 4. Publish Event (US2)
**Actor:** Event Organizer

Publish an event to make it available for customers.

```http
POST /events/:id/publish
```

**Business Rules:**
- Event must have at least one active ticket category
- Total ticket quota must not exceed event max capacity
- Event must be in Draft status

**Response:**
```json
{
  "success": true,
  "data": null,
  "message": "Event published successfully"
}
```

---

### 5. Cancel Event (US3)
**Actor:** Event Organizer

Cancel a published event. All paid bookings will be marked for refund.

```http
POST /events/:id/cancel
```

**Business Rules:**
- Event must be in Published status
- Cannot cancel Completed events
- All paid bookings will require refund

**Response:**
```json
{
  "success": true,
  "data": null,
  "message": "Event cancelled successfully"
}
```

---

### 6. Add Ticket Category (US4)
**Actor:** Event Organizer

Add a new ticket category to an event.

```http
POST /events/:id/ticket-categories
Content-Type: application/json

{
  "name": "Early Bird",
  "price": 75000,
  "quota": 200,
  "salesStart": "2024-10-01T00:00:00Z",
  "salesEnd": "2024-10-31T23:59:59Z"
}
```

**Validation:**
- `name`: required, min length 1
- `price`: required, minimum 0
- `quota`: required, minimum 1
- Sales period must end before or at event start date
- Total quota must not exceed event max capacity

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cat_3"
  },
  "message": "Ticket category added successfully"
}
```

---

### 7. Disable Ticket Category (US5)
**Actor:** Event Organizer

Disable a ticket category to prevent further purchases.

```http
POST /events/:id/ticket-categories/:categoryId/disable
```

**Business Rules:**
- Event must not be Completed
- Category is kept for historical purposes
- Existing bookings are not affected

**Response:**
```json
{
  "success": true,
  "data": null,
  "message": "Ticket category disabled successfully"
}
```

---

### 8. Get Sales Report (US19)
**Actor:** Event Organizer

View sales report for an event.

```http
GET /events/:id/sales-report
```

**Response:**
```json
{
  "success": true,
  "data": {
    "eventId": "evt_123",
    "eventName": "Tech Conference 2024",
    "ticketsSoldByCategory": [
      {
        "categoryName": "Regular",
        "sold": 50,
        "quota": 500
      },
      {
        "categoryName": "VIP",
        "sold": 100,
        "quota": 100
      }
    ],
    "bookingsByStatus": {
      "PendingPayment": 5,
      "Paid": 150,
      "Expired": 20,
      "Refunded": 2
    },
    "totalRevenue": 17500000
  },
  "message": "Sales report retrieved successfully"
}
```

---

### 9. Get Participants (US20)
**Actor:** Event Organizer

View list of participants for an event.

```http
GET /events/:id/participants
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "customerName": "John Doe",
      "customerEmail": "john@example.com",
      "ticketCategory": "Regular",
      "ticketCode": "TKT-ABC123",
      "checkInStatus": "CheckedIn"
    },
    {
      "customerName": "Jane Smith",
      "customerEmail": "jane@example.com",
      "ticketCategory": "VIP",
      "ticketCode": "TKT-XYZ789",
      "checkInStatus": "Active"
    }
  ],
  "message": "Participants retrieved successfully"
}
```

---

## Bookings API

### 10. Create Booking (US8)
**Actor:** Customer

Create a ticket booking for an event.

```http
POST /bookings
Content-Type: application/json

{
  "eventId": "evt_123",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "items": [
    {
      "ticketCategoryId": "cat_1",
      "quantity": 2
    }
  ]
}
```

**Validation:**
- `eventId`: required, min length 1
- `customerName`: required, min length 1
- `customerEmail`: required, valid email format
- `items`: required, min 1 item
- `quantity`: minimum 1

**Business Rules:**
- Event must be Published
- Ticket category must be Active
- Must be within sales period
- Quantity must not exceed remaining quota
- Customer cannot have multiple active bookings for same event

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "bkg_456"
  },
  "message": "Booking created successfully"
}
```

---

### 11. Get Booking (US9)
**Actor:** Customer

View booking details including total price.

```http
GET /bookings/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "bkg_456",
    "eventId": "evt_123",
    "eventName": "Tech Conference 2024",
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "status": "PendingPayment",
    "items": [
      {
        "ticketCategoryId": "cat_1",
        "ticketCategoryName": "Regular",
        "quantity": 2,
        "unitPrice": 100000,
        "subtotal": 200000
      }
    ],
    "totalPrice": 200000,
    "paymentDeadline": "2024-11-15T10:15:00Z",
    "createdAt": "2024-11-15T10:00:00Z"
  },
  "message": "Booking retrieved successfully"
}
```

---

### 12. Pay Booking (US10)
**Actor:** Customer

Pay for a booking to confirm tickets.

```http
POST /bookings/:id/pay
Content-Type: application/json

{
  "amount": 200000
}
```

**Validation:**
- `amount`: required, minimum 0

**Business Rules:**
- Booking must be in PendingPayment status
- Payment deadline must not have passed
- Amount must equal total booking price
- Tickets with unique codes are generated after payment

**Response:**
```json
{
  "success": true,
  "data": null,
  "message": "Payment successful"
}
```

---

### 13. Expire Booking (US11)
**Actor:** System (Background Job)

> **Note:** This endpoint is for manual/admin testing only. In production, this should be handled by a background scheduler.

```http
POST /bookings/:id/expire
```

**Business Rules:**
- Booking must be in PendingPayment status
- Payment deadline must have passed
- Reserved quota is released

**Response:**
```json
{
  "success": true,
  "data": null,
  "message": "Booking expired successfully"
}
```

---

### 14. Get Booking Tickets (US12)
**Actor:** Customer

View purchased tickets for a booking.

```http
GET /bookings/:id/tickets
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "tkt_1",
      "ticketCode": "TKT-ABC123",
      "ticketCategory": "Regular",
      "status": "Active",
      "bookingId": "bkg_456",
      "eventId": "evt_123",
      "eventName": "Tech Conference 2024"
    },
    {
      "id": "tkt_2",
      "ticketCode": "TKT-ABC124",
      "ticketCategory": "Regular",
      "status": "Active",
      "bookingId": "bkg_456",
      "eventId": "evt_123",
      "eventName": "Tech Conference 2024"
    }
  ],
  "message": "Tickets retrieved successfully"
}
```

---

## Tickets API

### 15. Check In Ticket (US13, US14)
**Actor:** Gate Officer

Check in a ticket at the event venue.

```http
POST /tickets/check-in
Content-Type: application/json

{
  "ticketCode": "TKT-ABC123",
  "eventId": "evt_123"
}
```

**Validation:**
- `ticketCode`: required, min length 1
- `eventId`: required, min length 1

**Business Rules:**
- Ticket must exist and be valid
- Ticket must be Active (not already checked in)
- Ticket must belong to the specified event
- Check-in must be within allowed time window
- Event must not be Cancelled

**Success Response:**
```json
{
  "success": true,
  "data": null,
  "message": "Ticket checked in successfully"
}
```

**Error Responses:**
```json
// Invalid ticket
{
  "success": false,
  "error": "Ticket not found or invalid"
}

// Already checked in
{
  "success": false,
  "error": "Ticket has already been used"
}

// Wrong event
{
  "success": false,
  "error": "Ticket does not match this event"
}

// Event cancelled
{
  "success": false,
  "error": "Event has been cancelled"
}
```

---

## Refunds API

### 16. Request Refund (US15)
**Actor:** Customer

Request a refund for a paid booking.

```http
POST /refunds
Content-Type: application/json

{
  "bookingId": "bkg_456"
}
```

**Validation:**
- `bookingId`: required, min length 1

**Business Rules:**
- Booking must be Paid
- No tickets can be checked in
- Must be before refund deadline (unless event is cancelled)
- Automatic approval if event is cancelled

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "ref_789"
  },
  "message": "Refund requested successfully"
}
```

---

### 17. Approve Refund (US16)
**Actor:** Event Organizer

Approve a refund request.

```http
POST /refunds/:id/approve
```

**Business Rules:**
- Refund must be in Requested status
- Related tickets are marked as Cancelled
- Related booking is marked as Refunded

**Response:**
```json
{
  "success": true,
  "data": null,
  "message": "Refund approved successfully"
}
```

---

### 18. Reject Refund (US17)
**Actor:** Event Organizer

Reject a refund request with a reason.

```http
POST /refunds/:id/reject
Content-Type: application/json

{
  "reason": "Refund deadline has passed"
}
```

**Validation:**
- `reason`: required, min length 1

**Business Rules:**
- Refund must be in Requested status
- Rejection reason is mandatory
- Booking remains Paid
- Tickets remain Active

**Response:**
```json
{
  "success": true,
  "data": null,
  "message": "Refund rejected successfully"
}
```

---

### 19. Payout Refund (US18)
**Actor:** System Admin

Mark an approved refund as paid out.

```http
POST /refunds/:id/payout
```

**Business Rules:**
- Refund must be in Approved status
- Payment reference is recorded
- Cannot be modified after payout

**Response:**
```json
{
  "success": true,
  "data": null,
  "message": "Refund paid out successfully"
}
```

---

## Actor-Endpoint Mapping

### Event Organizer Endpoints
- `POST /events` - Create event
- `POST /events/:id/publish` - Publish event
- `POST /events/:id/cancel` - Cancel event
- `POST /events/:id/ticket-categories` - Add ticket category
- `POST /events/:id/ticket-categories/:categoryId/disable` - Disable category
- `GET /events/:id/sales-report` - View sales report
- `GET /events/:id/participants` - View participants
- `POST /refunds/:id/approve` - Approve refund
- `POST /refunds/:id/reject` - Reject refund

### Customer Endpoints
- `GET /events` - List available events
- `GET /events/:id` - View event details
- `POST /bookings` - Create booking
- `GET /bookings/:id` - View booking
- `POST /bookings/:id/pay` - Pay booking
- `GET /bookings/:id/tickets` - View tickets
- `POST /refunds` - Request refund

### Gate Officer Endpoints
- `POST /tickets/check-in` - Check in ticket

### System Admin Endpoints
- `POST /refunds/:id/payout` - Payout refund
- `POST /bookings/:id/expire` - Expire booking (should be automated)

---

## Notes

1. **Authentication:** This API documentation does not include authentication headers. In production, implement proper authentication (JWT, OAuth, etc.) to identify actors.

2. **Authorization:** Each endpoint should verify that the authenticated user has the correct role (Event Organizer, Customer, Gate Officer, System Admin).

3. **Background Jobs:** The following operations should be automated:
   - Expire bookings past payment deadline (US11)
   - Auto-approve refunds for cancelled events

4. **Domain Events:** All operations raise appropriate domain events as specified in AGENT.md.

5. **Validation:** All endpoints include input validation. Additional business rule validation is performed in the domain layer.

6. **Error Handling:** All errors return appropriate HTTP status codes and descriptive error messages.
