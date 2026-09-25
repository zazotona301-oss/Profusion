import { describe, expect, it } from "vitest";
import healthHandler from "../api/clinic/index.js";
import resourceHandler from "../api/clinic/[resource].js";

function createResponse() {
  const response = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: undefined as unknown,
    setHeader(name: string, value: string) {
      this.headers[name] = value;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
    end() {
      return this;
    },
  };
  return response;
}

describe("clinic HTTP API", () => {
  it("reports Neon configuration state from the health endpoint", async () => {
    const response = createResponse();
    const previous = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    await healthHandler({ method: "GET" } as never, response as never);

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({ service: "clinic-management-api", database: "not_configured" });
    if (previous === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previous;
  });

  it("rejects an unknown CRUD resource before touching Neon", async () => {
    const response = createResponse();
    await resourceHandler({ method: "GET", query: { resource: "not-a-resource" } } as never, response as never);

    expect(response.statusCode).toBe(404);
    expect(response.body).toMatchObject({ error: "Unknown resource" });
  });

  it("returns a clear response when DATABASE_URL is missing", async () => {
    const response = createResponse();
    const previous = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    await resourceHandler({ method: "GET", query: { resource: "patients" } } as never, response as never);

    expect(response.statusCode).toBe(503);
    expect(response.body).toMatchObject({ error: "DATABASE_URL is not configured" });
    if (previous === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previous;
  });
});
