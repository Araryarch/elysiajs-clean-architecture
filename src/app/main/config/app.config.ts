/**
 * Central application configuration.
 * All env vars are read here — nowhere else in the codebase should access process.env directly.
 */
export const appConfig = {
  env: (process.env.NODE_ENV ?? "development") as "development" | "production" | "test",
  port: Number(process.env.PORT ?? 3000),

  database: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@localhost:5432/event_ticketing",
    maxConnections: Number(process.env.DB_MAX_CONNECTIONS ?? 1),
    idleTimeout: Number(process.env.DB_IDLE_TIMEOUT ?? 20),
    connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT ?? 10),
  },

  jwt: {
    secret: process.env.JWT_SECRET ?? "default-secret-change-in-production",
    expiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  },

  payment: {
    /** Timeout in ms for payment gateway calls */
    timeoutMs: Number(process.env.PAYMENT_TIMEOUT_MS ?? 10_000),
  },

  booking: {
    /** Minutes a booking stays in PendingPayment before expiring */
    paymentDeadlineMinutes: Number(process.env.BOOKING_PAYMENT_DEADLINE_MINUTES ?? 15),
  },

  mail: {
    host: process.env.MAIL_HOST ?? "smtp.mailtrap.io",
    port: Number(process.env.MAIL_PORT ?? 587),
    user: process.env.MAIL_USER ?? "",
    pass: process.env.MAIL_PASS ?? "",
    from: process.env.MAIL_FROM ?? "noreply@eventapp.id",
  },
} as const;

export type AppConfig = typeof appConfig;
