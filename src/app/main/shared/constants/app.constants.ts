/** Default currency used across the system */
export const DEFAULT_CURRENCY = "IDR" as const;

/** Payment deadline in minutes after booking creation */
export const PAYMENT_DEADLINE_MINUTES = 15;

/** Maximum tickets per booking item */
export const MAX_TICKETS_PER_ITEM = 10;

/** Maximum booking items per booking */
export const MAX_ITEMS_PER_BOOKING = 5;

/** Pagination defaults */
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

/** JWT token expiry */
export const JWT_EXPIRES_IN = "7d";

/** Minimum password length */
export const MIN_PASSWORD_LENGTH = 8;

/** Ticket code length (nanoid) */
export const TICKET_CODE_LENGTH = 12;
