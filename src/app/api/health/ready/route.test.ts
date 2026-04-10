import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/infrastructure/sqlite/sqlite-client", () => ({
  checkDbHealth: vi.fn(),
}));

import { checkDbHealth } from "@/infrastructure/sqlite/sqlite-client";
import { GET } from "./route";

beforeEach(() => vi.clearAllMocks());

describe("GET /api/health/ready", () => {
  it("returns 200 when DB is accessible", async () => {
    vi.mocked(checkDbHealth).mockReturnValue(undefined);
    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ status: "ok" });
  });

  it("returns 503 when DB throws", async () => {
    vi.mocked(checkDbHealth).mockImplementation(() => {
      throw new Error("DB not accessible");
    });
    const response = await GET();
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.status).toBe("error");
  });
});
