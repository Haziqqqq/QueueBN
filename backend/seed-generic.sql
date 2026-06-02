-- Generic, domain-neutral demo queues for QueueBN (not hospital-specific).
-- WARNING: this clears existing tickets and departments, then reseeds.
DELETE FROM tickets;
DELETE FROM departments;

INSERT INTO departments (facility, name, code) VALUES
  ('', 'Customer Service', 'CS'),
  ('', 'Billing & Payments', 'PAY'),
  ('', 'Account Services', 'ACC'),
  ('', 'Collections & Pickup', 'PICK'),
  ('', 'General Enquiries', 'GEN');
