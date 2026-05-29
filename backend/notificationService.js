const twilio = require('twilio')
require('dotenv').config()

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

async function sendWhatsApp(to, message) {
  try {
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: `whatsapp:${to}`,
      body: message
    })
    console.log(`WhatsApp sent to ${to}`)
  } catch (err) {
    console.error('WhatsApp failed:', err.message)
  }
}

async function notifyApproaching(ticket, departmentName, peopleAhead) {
  const message = `QueueBN — RIPAS ${departmentName}\n\nYour turn is approaching!\nTicket: ${ticket.ticket_number}\nPeople ahead: ${peopleAhead}\n\nPlease make your way to the counter now.`
  await sendWhatsApp(ticket.mobile_number, message)
}

async function notifyNext(ticket, departmentName) {
  const message = `QueueBN — RIPAS ${departmentName}\n\nYou are NEXT!\nTicket: ${ticket.ticket_number}\n\nPlease proceed to the counter immediately.\nYou have 10 minutes before your ticket expires.`
  await sendWhatsApp(ticket.mobile_number, message)
}

async function notifyExpired(ticket, departmentName) {
  const message = `QueueBN — RIPAS ${departmentName}\n\nYour ticket ${ticket.ticket_number} has expired.\nYou did not arrive within 10 minutes.\n\nVisit queuebn.vercel.app to rejoin the queue.`
  await sendWhatsApp(ticket.mobile_number, message)
}

module.exports = { notifyApproaching, notifyNext, notifyExpired }