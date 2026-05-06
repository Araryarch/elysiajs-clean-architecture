export type EventDTO = {
  id: string;
  name: string;
  description?: string;
  venue: string;
  startAt: string;
  endAt: string;
  maxCapacity: number;
  status: string;
  ticketCategories: TicketCategoryDTO[];
};

export type TicketCategoryDTO = {
  id: string;
  name: string;
  price: number;
  currency: string;
  quota: number;
  availableQuantity: number;
  salesStart: string;
  salesEnd: string;
  isActive: boolean;
};

export type BookingDTO = {
  id: string;
  eventId: string;
  customerName: string;
  customerEmail: string;
  items: BookingItemDTO[];
  totalAmount: number;
  currency: string;
  status: string;
  paymentDeadline: string;
  createdAt: string;
  paidAt?: string;
};

export type BookingItemDTO = {
  ticketCategoryId: string;
  ticketCategoryName: string;
  quantity: number;
  unitPrice: number;
};

export type TicketDTO = {
  id: string;
  ticketCode: string;
  eventName: string;
  categoryName: string;
  customerName: string;
  status: string;
  issuedAt: string;
  checkedInAt?: string;
};

export type SalesReportDTO = {
  eventId: string;
  eventName: string;
  categorySales: Array<{
    categoryName: string;
    soldQuantity: number;
    revenue: number;
  }>;
  bookingStats: {
    pendingPayment: number;
    paid: number;
    expired: number;
    refunded: number;
  };
  totalRevenue: number;
};

export type ParticipantDTO = {
  customerName: string;
  customerEmail: string;
  ticketCategory: string;
  ticketCode: string;
  checkedIn: boolean;
};
