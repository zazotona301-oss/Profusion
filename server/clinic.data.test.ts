import { describe, expect, it } from "vitest";
import { formatArabicDate, initialClinicData } from "../src/lib/clinicStore.jsx";

describe("clinic local data", () => {
  it("ships with the core medical workspace collections", () => {
    expect(initialClinicData.patients.length).toBeGreaterThan(0);
    expect(initialClinicData.appointments.length).toBeGreaterThan(0);
    expect(initialClinicData.bills.length).toBeGreaterThan(0);
    expect(initialClinicData.prescriptions.length).toBeGreaterThan(0);
  });

  it("formats ISO dates using the Arabic locale", () => {
    const formatted = formatArabicDate("2026-09-24T00:00:00.000Z");
    expect(formatted).toContain("٢٠٢٦");
    expect(formatted).toContain("سبتمبر");
  });
});
