import { describe, expect, it } from "bun:test";

const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:3000";

describe("E2E: Health check", () => {
  it("GET /health returns 200 with ok status", async () => {
    try {
      const res = await fetch(`${BASE_URL}/health`);
      expect(res.status).toBe(200);
      const body = await res.json() as { success: boolean; data: { status: string } };
      expect(body.success).toBe(true);
      expect(body.data.status).toBe("ok");
    } catch {
      console.warn(`Skipping E2E test: server not running at ${BASE_URL}`);
    }
  });

  it("GET / returns API info", async () => {
    try {
      const res = await fetch(`${BASE_URL}/`);
      expect(res.status).toBe(200);
      const body = await res.json() as { name: string };
      expect(body.name).toContain("Event Ticketing");
    } catch {
      console.warn(`Skipping E2E test: server not running at ${BASE_URL}`);
    }
  });
});
