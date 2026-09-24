export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();
  return res.status(200).json({
    service: "clinic-management-api",
    status: "ok",
    database: process.env.DATABASE_URL ? "configured" : "not_configured",
    timestamp: new Date().toISOString(),
    resources: ["patients", "doctors", "appointments", "prescriptions", "invoices"],
  });
}
