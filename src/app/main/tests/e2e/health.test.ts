import { describe, expect, it } from "bun:test";

/**
 * E2E smoke test — hits the running server.
 * Requires the server to be running at TEST_BASE_URL (default: http://localhost:3000).
 *
 * Run with: bun test src/app/main/tests/e2e/
 */
const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:3000";

describe("E2E: Health check", () => {
  it("GET /health returns 200 with ok status", async () => {
    const res = await fetch(`${BASE_URL}/health`);
    expect(res.status).toBe(200);

    const body = await res.json() as { success: boolean; data: { status: string } };
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("ok");
  });

  it("GET / returns API info", async () => {
    const res = await fetch(`${BASE_URL}/`);
    expect(res.status).toBe(200);

    const body = await res.json() as { name: string };
    expect(body.name).toContain("Event Ticketing");
  });
});
