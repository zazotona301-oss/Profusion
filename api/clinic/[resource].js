import { neon } from "@neondatabase/serverless";

const resourceTables = {
  patients: { table: "patients", orderBy: "created_at desc" },
  doctors: { table: "doctors", orderBy: "created_at desc" },
  appointments: { table: "appointments", orderBy: "starts_at asc" },
  prescriptions: { table: "prescriptions", orderBy: "issued_at desc" },
  invoices: { table: "invoices", orderBy: "issued_at desc" },
};

const patientColumns = ["file_number", "full_name", "phone", "email", "national_id", "date_of_birth", "gender", "blood_type", "address", "emergency_contact_name", "emergency_contact_phone", "allergies", "chronic_conditions", "notes", "status"];
const doctorColumns = ["full_name", "specialty", "license_number", "phone", "email", "avatar_url", "is_active"];
const appointmentColumns = ["patient_id", "doctor_id", "starts_at", "ends_at", "type", "status", "reason", "notes"];
const prescriptionColumns = ["patient_id", "doctor_id", "appointment_id", "diagnosis", "instructions", "issued_at"];
const invoiceColumns = ["invoice_number", "patient_id", "appointment_id", "subtotal", "discount", "tax", "total", "amount_paid", "currency", "status", "due_date", "notes", "issued_at"];

function sendHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
}

function readJson(req) {
  if (!req.body) return {};
  return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
}

function allowedPayload(payload, columns) {
  return Object.fromEntries(columns.filter((column) => payload[column] !== undefined).map((column) => [column, payload[column]]));
}

async function listResource(sql, resource, query) {
  const config = resourceTables[resource];
  if (resource === "patients" && query.q) {
    const pattern = `%${query.q}%`;
    return sql.query(`select * from patients where full_name ilike $1 or file_number ilike $1 or phone ilike $1 order by ${config.orderBy}`, [pattern]);
  }
  if (resource === "appointments" && query.from && query.to) {
    return sql.query(`select a.*, p.full_name as patient_name, p.phone as patient_phone, d.full_name as doctor_name from appointments a join patients p on p.id = a.patient_id join doctors d on d.id = a.doctor_id where a.starts_at >= $1 and a.starts_at < $2 order by ${config.orderBy}`, [query.from, query.to]);
  }
  if (resource === "prescriptions") {
    return sql.query("select r.*, p.full_name as patient_name, d.full_name as doctor_name, coalesce(json_agg(ri order by ri.created_at) filter (where ri.id is not null), '[]') as medicines from prescriptions r join patients p on p.id = r.patient_id join doctors d on d.id = r.doctor_id left join prescription_items ri on ri.prescription_id = r.id group by r.id, p.full_name, d.full_name order by r.issued_at desc");
  }
  if (resource === "invoices") {
    return sql.query("select i.*, p.full_name as patient_name, coalesce(json_agg(ii order by ii.created_at) filter (where ii.id is not null), '[]') as items from invoices i join patients p on p.id = i.patient_id left join invoice_items ii on ii.invoice_id = i.id group by i.id, p.full_name order by i.issued_at desc");
  }
  return sql.query(`select * from ${config.table} order by ${config.orderBy}`);
}

export default async function handler(req, res) {
  sendHeaders(res);
  if (req.method === "OPTIONS") return res.status(204).end();

  const resource = String(req.query?.resource || "").toLowerCase();
  const config = resourceTables[resource];
  if (!config) return res.status(404).json({ error: "Unknown resource", allowed: Object.keys(resourceTables) });
  if (!process.env.DATABASE_URL) return res.status(503).json({ error: "DATABASE_URL is not configured" });

  const sql = neon(process.env.DATABASE_URL);
  const id = req.query?.id;

  try {
    if (req.method === "GET") {
      if (id) {
        const rows = await sql.query(`select * from ${config.table} where id = $1 limit 1`, [id]);
        return rows[0] ? res.status(200).json(rows[0]) : res.status(404).json({ error: "Record not found" });
      }
      return res.status(200).json(await listResource(sql, resource, req.query || {}));
    }

    if (req.method === "POST") {
      const body = readJson(req);
      const columns = resource === "patients" ? patientColumns : resource === "doctors" ? doctorColumns : resource === "appointments" ? appointmentColumns : resource === "prescriptions" ? prescriptionColumns : invoiceColumns;
      const payload = allowedPayload(body, columns);
      const keys = Object.keys(payload);
      if (!keys.length) return res.status(400).json({ error: "Request body is empty" });
      const values = keys.map((key) => payload[key]);
      const placeholders = keys.map((_, index) => `$${index + 1}`);
      const rows = await sql.query(`insert into ${config.table} (${keys.join(", ")}) values (${placeholders.join(", ")}) returning *`, values);
      return res.status(201).json(rows[0]);
    }

    if (req.method === "PATCH") {
      if (!id) return res.status(400).json({ error: "id query parameter is required" });
      const body = readJson(req);
      const columns = resource === "patients" ? patientColumns : resource === "doctors" ? doctorColumns : resource === "appointments" ? appointmentColumns : resource === "prescriptions" ? prescriptionColumns : invoiceColumns;
      const payload = allowedPayload(body, columns);
      const keys = Object.keys(payload);
      if (!keys.length) return res.status(400).json({ error: "No editable fields supplied" });
      const values = keys.map((key) => payload[key]);
      const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(", ");
      values.push(id);
      const rows = await sql.query(`update ${config.table} set ${setClause} where id = $${values.length} returning *`, values);
      return rows[0] ? res.status(200).json(rows[0]) : res.status(404).json({ error: "Record not found" });
    }

    if (req.method === "DELETE") {
      if (!id) return res.status(400).json({ error: "id query parameter is required" });
      const rows = await sql.query(`delete from ${config.table} where id = $1 returning id`, [id]);
      return rows[0] ? res.status(200).json({ success: true, id: rows[0].id }) : res.status(404).json({ error: "Record not found" });
    }

    res.setHeader("Allow", "GET, POST, PATCH, DELETE, OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("[Clinic API]", error);
    return res.status(500).json({ error: "Database operation failed", detail: process.env.NODE_ENV === "development" ? error.message : undefined });
  }
}
