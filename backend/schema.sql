CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility TEXT NOT NULL DEFAULT 'RIPAS Hospital',
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL,
  is_open BOOLEAN NOT NULL DEFAULT true,
  avg_service_time_mins INTEGER NOT NULL DEFAULT 5
);

CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES departments(id),
  ticket_number TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  ic_number TEXT,
  position INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  called_at TIMESTAMPTZ,
  done_at TIMESTAMPTZ,
  wait_mins NUMERIC,
  rating INTEGER,
  notif_3_sent BOOLEAN NOT NULL DEFAULT false,
  notif_1_sent BOOLEAN NOT NULL DEFAULT false
);

INSERT INTO departments (facility, name, code) VALUES
  ('RIPAS Hospital', 'OPD General', 'OPD'),
  ('RIPAS Hospital', 'Pharmacy', 'PHR'),
  ('RIPAS Hospital', 'Laboratory', 'LAB'),
  ('RIPAS Hospital', 'Radiology', 'RAD'),
  ('RIPAS Hospital', 'Emergency Triage', 'EMG')
ON CONFLICT (name) DO NOTHING;
