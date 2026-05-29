# QueueBN

Virtual queue management system for RIPAS Hospital, Brunei.

## What it does

Citizens join a hospital queue from their phone — no waiting room needed. They receive a WhatsApp notification when their turn is approaching and only need to arrive at the counter when called.

## Features

- Join any RIPAS department queue remotely
- Real-time queue position and estimated wait time
- WhatsApp + SMS notifications when turn is near
- Staff dashboard to call next patient and manage queue
- Admin dashboard with live stats across all departments
- Auto-expires tickets after 10 minutes of no-show

## Tech Stack

- **Frontend** — Next.js 16 + React + Tailwind CSS + Lucide
- **Backend** — Node.js + Express
- **Database** — PostgreSQL via Supabase
- **Notifications** — Twilio WhatsApp + SMS
- **Deployment** — Vercel + Render

## Built for

BICTA 2026 — Brunei ICT Awards
