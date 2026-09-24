-- عيادتي | Neon PostgreSQL schema
-- Run this file once against your Neon database before enabling the HTTP API.

create extension if not exists pgcrypto;

create type gender_type as enum ('male', 'female', 'other');
create type appointment_status as enum ('scheduled', 'confirmed', 'waiting', 'in_progress', 'completed', 'cancelled', 'no_show');
create type invoice_status as enum ('draft', 'pending', 'paid', 'partially_paid', 'cancelled', 'refunded');
create type encounter_type as enum ('consultation', 'follow_up', 'screening', 'lab_review', 'emergency');

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists clinic_settings (
  id uuid primary key default gen_random_uuid(),
  clinic_name varchar(160) not null,
  specialty varchar(160),
  phone varchar(40),
  whatsapp_phone varchar(40),
  address text,
  logo_url text,
  timezone varchar(80) not null default 'Asia/Riyadh',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists doctors (
  id uuid primary key default gen_random_uuid(),
  full_name varchar(160) not null,
  specialty varchar(160) not null,
  license_number varchar(80),
  phone varchar(40),
  email varchar(320),
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists patients (
  id uuid primary key default gen_random_uuid(),
  file_number varchar(32) not null unique,
  full_name varchar(160) not null,
  phone varchar(40) not null,
  email varchar(320),
  national_id varchar(40),
  date_of_birth date,
  gender gender_type,
  blood_type varchar(5),
  address text,
  emergency_contact_name varchar(160),
  emergency_contact_phone varchar(40),
  allergies text,
  chronic_conditions text,
  notes text,
  status varchar(40) not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  doctor_id uuid not null references doctors(id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  type encounter_type not null default 'consultation',
  status appointment_status not null default 'scheduled',
  reason text,
  notes text,
  reminder_sent_at timestamptz,
  checked_in_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointments_time_order check (ends_at > starts_at)
);

create table if not exists medical_records (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  doctor_id uuid references doctors(id) on delete set null,
  appointment_id uuid references appointments(id) on delete set null,
  record_date timestamptz not null default now(),
  chief_complaint text,
  diagnosis text,
  vital_signs jsonb not null default '{}'::jsonb,
  assessment text,
  plan text,
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists prescriptions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  doctor_id uuid not null references doctors(id) on delete restrict,
  appointment_id uuid references appointments(id) on delete set null,
  diagnosis text,
  instructions text,
  issued_at timestamptz not null default now(),
  shared_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists prescription_items (
  id uuid primary key default gen_random_uuid(),
  prescription_id uuid not null references prescriptions(id) on delete cascade,
  medicine_name varchar(180) not null,
  dosage varchar(120),
  frequency varchar(120),
  duration varchar(120),
  instructions text,
  created_at timestamptz not null default now()
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number varchar(40) not null unique,
  patient_id uuid not null references patients(id) on delete restrict,
  appointment_id uuid references appointments(id) on delete set null,
  subtotal numeric(12, 2) not null default 0,
  discount numeric(12, 2) not null default 0,
  tax numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  amount_paid numeric(12, 2) not null default 0,
  currency varchar(3) not null default 'SAR',
  status invoice_status not null default 'pending',
  due_date date,
  notes text,
  issued_at timestamptz not null default now(),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invoice_amounts_non_negative check (subtotal >= 0 and discount >= 0 and tax >= 0 and total >= 0 and amount_paid >= 0)
);

create table if not exists invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  description varchar(240) not null,
  quantity integer not null default 1,
  unit_price numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  constraint invoice_item_quantity_positive check (quantity > 0)
);

create table if not exists patient_attachments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  medical_record_id uuid references medical_records(id) on delete cascade,
  file_name varchar(240) not null,
  file_url text not null,
  mime_type varchar(120),
  file_size integer,
  created_at timestamptz not null default now()
);

create index if not exists idx_patients_name on patients using gin (to_tsvector('simple', full_name));
create index if not exists idx_patients_phone on patients(phone);
create index if not exists idx_appointments_starts_at on appointments(starts_at);
create index if not exists idx_appointments_patient on appointments(patient_id);
create index if not exists idx_appointments_doctor on appointments(doctor_id);
create index if not exists idx_medical_records_patient_date on medical_records(patient_id, record_date desc);
create index if not exists idx_prescriptions_patient_date on prescriptions(patient_id, issued_at desc);
create index if not exists idx_invoices_patient_date on invoices(patient_id, issued_at desc);
create index if not exists idx_invoices_status on invoices(status);

create trigger clinic_settings_updated_at before update on clinic_settings for each row execute function set_updated_at();
create trigger doctors_updated_at before update on doctors for each row execute function set_updated_at();
create trigger patients_updated_at before update on patients for each row execute function set_updated_at();
create trigger appointments_updated_at before update on appointments for each row execute function set_updated_at();
create trigger medical_records_updated_at before update on medical_records for each row execute function set_updated_at();
create trigger prescriptions_updated_at before update on prescriptions for each row execute function set_updated_at();
create trigger invoices_updated_at before update on invoices for each row execute function set_updated_at();

insert into clinic_settings (clinic_name, specialty, phone, whatsapp_phone, address)
select 'مركز نبض الطبي', 'الطب الباطني وأمراض القلب', '+966 11 456 7821', '966114567821', 'الرياض، حي المروج، شارع الأمير تركي'
where not exists (select 1 from clinic_settings);

insert into doctors (full_name, specialty, license_number)
select 'د. ليان السالم', 'الطب الباطني وأمراض القلب', 'SCFHS-DEMO-001'
where not exists (select 1 from doctors where full_name = 'د. ليان السالم');
