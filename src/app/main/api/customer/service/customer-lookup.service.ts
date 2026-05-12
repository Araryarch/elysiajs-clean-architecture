export interface CustomerSummary {
  email: string;
  name: string;
  totalBookings: number;
  totalSpent: number;
  activeTickets: number;
  pendingRefunds: number;
}

export interface ICustomerLookupService {
  buildSummary(params: {
    email: string;
    name: string;
    bookings: Array<{ status: string; totalAmount: number }>;
    tickets: Array<{ status: string }>;
    refunds: Array<{ status: string }>;
  }): CustomerSummary;
}

export class CustomerLookupService implements ICustomerLookupService {
  buildSummary({ email, name, bookings, tickets, refunds }: {
    email: string;
    name: string;
    bookings: Array<{ status: string; totalAmount: number }>;
    tickets: Array<{ status: string }>;
    refunds: Array<{ status: string }>;
  }): CustomerSummary {
    const totalSpent = bookings
      .filter((b) => b.status === "Paid" || b.status === "Refunded")
      .reduce((sum, b) => sum + b.totalAmount, 0);

    return {
      email,
      name,
      totalBookings: bookings.length,
      totalSpent,
      activeTickets: tickets.filter((t) => t.status === "Active").length,
      pendingRefunds: refunds.filter((r) => r.status === "Requested" || r.status === "Approved").length,
    };
  }
}
