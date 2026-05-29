const express = require('express')
const cors = require('cors')
const { Pool } = require('pg')
require('dotenv').config()

const app = express()
app.use(cors({ origin: [process.env.FRONTEND_URL, 'http://localhost:3000'] }))
app.use(express.json())

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

// Health check
app.get('/health', async (req, res) => {
  const result = await db.query('SELECT NOW()')
  res.json({ status: 'ok', time: result.rows[0].now })
})

// GET /departments — get all open departments
app.get('/departments', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT d.*,
        COUNT(t.id) FILTER (WHERE t.status = 'waiting') as waiting_count,
        COUNT(t.id) FILTER (WHERE t.status = 'called') as called_count
      FROM departments d
      LEFT JOIN tickets t ON t.department_id = d.id 
        AND t.joined_at::date = CURRENT_DATE
      GROUP BY d.id
      ORDER BY d.name
    `)
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// GET /departments/:id — get single department with queue
app.get('/departments/:id', async (req, res) => {
  try {
    const dept = await db.query('SELECT * FROM departments WHERE id = $1', [req.params.id])
    if (dept.rows.length === 0) return res.status(404).json({ error: 'Not found' })

    const queue = await db.query(`
      SELECT * FROM tickets
      WHERE department_id = $1
        AND status IN ('waiting', 'called')
        AND joined_at::date = CURRENT_DATE
      ORDER BY position ASC
    `, [req.params.id])

    res.json({ ...dept.rows[0], queue: queue.rows })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /tickets — join a queue
app.post('/tickets', async (req, res) => {
  try {
    const { department_id, mobile_number, ic_number } = req.body
    if (!department_id || !mobile_number) {
      return res.status(400).json({ error: 'department_id and mobile_number are required' })
    }

    const dept = await db.query('SELECT * FROM departments WHERE id = $1', [department_id])
    if (dept.rows.length === 0) return res.status(404).json({ error: 'Department not found' })
    if (!dept.rows[0].is_open) return res.status(400).json({ error: 'Department is currently closed' })

    // Get next position
    const lastTicket = await db.query(`
      SELECT MAX(position) as max_pos FROM tickets
      WHERE department_id = $1 AND joined_at::date = CURRENT_DATE
    `, [department_id])
    const position = (lastTicket.rows[0].max_pos || 0) + 1

    // Generate ticket number e.g. OPD-042
    const ticketNumber = `${dept.rows[0].code}-${String(position).padStart(3, '0')}`

    // Count people ahead
    const ahead = await db.query(`
      SELECT COUNT(*) as count FROM tickets
      WHERE department_id = $1
        AND status IN ('waiting', 'called')
        AND joined_at::date = CURRENT_DATE
        AND position < $2
    `, [department_id, position])
    const peopleAhead = parseInt(ahead.rows[0].count)

    // Estimate wait time
    const estimatedWait = peopleAhead * dept.rows[0].avg_service_time_mins

    const result = await db.query(`
      INSERT INTO tickets (department_id, ticket_number, mobile_number, ic_number, position)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [department_id, ticketNumber, mobile_number, ic_number, position])

    res.json({
      ...result.rows[0],
      people_ahead: peopleAhead,
      estimated_wait_mins: estimatedWait,
      department: dept.rows[0]
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// GET /tickets/:id — get ticket status
app.get('/tickets/:id', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT t.*, d.name as department_name, d.code, d.avg_service_time_mins
      FROM tickets t
      JOIN departments d ON d.id = t.department_id
      WHERE t.id = $1
    `, [req.params.id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'Ticket not found' })

    const ticket = result.rows[0]

    // Count people ahead
    const ahead = await db.query(`
      SELECT COUNT(*) as count FROM tickets
      WHERE department_id = $1
        AND status IN ('waiting', 'called')
        AND joined_at::date = CURRENT_DATE
        AND position < $2
    `, [ticket.department_id, ticket.position])
    const peopleAhead = parseInt(ahead.rows[0].count)
    const estimatedWait = peopleAhead * ticket.avg_service_time_mins

    res.json({ ...ticket, people_ahead: peopleAhead, estimated_wait_mins: estimatedWait })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /tickets/:id — cancel ticket
app.delete('/tickets/:id', async (req, res) => {
  try {
    await db.query(`UPDATE tickets SET status = 'cancelled' WHERE id = $1`, [req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /tickets/:id/rating — submit rating
app.post('/tickets/:id/rating', async (req, res) => {
  try {
    const { rating } = req.body
    await db.query(`UPDATE tickets SET rating = $1 WHERE id = $2`, [rating, req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /staff/call-next — call next ticket
app.post('/staff/call-next', async (req, res) => {
  try {
    const { department_id } = req.body

    // Mark current called ticket as no-show if not served
    await db.query(`
      UPDATE tickets SET status = 'no_show'
      WHERE department_id = $1
        AND status = 'called'
        AND joined_at::date = CURRENT_DATE
    `, [department_id])

    // Get next waiting ticket
    const next = await db.query(`
      SELECT * FROM tickets
      WHERE department_id = $1
        AND status = 'waiting'
        AND joined_at::date = CURRENT_DATE
      ORDER BY position ASC
      LIMIT 1
    `, [department_id])

    if (next.rows.length === 0) return res.json({ message: 'No more tickets in queue' })

    const ticket = next.rows[0]
    await db.query(`
      UPDATE tickets SET status = 'called', called_at = NOW()
      WHERE id = $1
    `, [ticket.id])

    res.json({ ...ticket, status: 'called' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// PATCH /tickets/:id/done — mark as served
app.patch('/tickets/:id/done', async (req, res) => {
  try {
    const result = await db.query(`
      UPDATE tickets 
      SET status = 'done', done_at = NOW(),
          wait_mins = EXTRACT(EPOCH FROM (NOW() - joined_at))/60
      WHERE id = $1
      RETURNING *
    `, [req.params.id])

    // Update avg service time for department
    const ticket = result.rows[0]
    await db.query(`
      UPDATE departments 
      SET avg_service_time_mins = (
        SELECT COALESCE(AVG(wait_mins), 5)
        FROM (
          SELECT wait_mins FROM tickets
          WHERE department_id = $1 AND status = 'done' AND wait_mins IS NOT NULL
          ORDER BY done_at DESC LIMIT 20
        ) recent
      )
      WHERE id = $1
    `, [ticket.department_id])

    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /tickets/:id/no-show — mark as no-show
app.patch('/tickets/:id/no-show', async (req, res) => {
  try {
    await db.query(`UPDATE tickets SET status = 'no_show' WHERE id = $1`, [req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /departments/:id/pause — pause queue
app.patch('/departments/:id/pause', async (req, res) => {
  try {
    await db.query(`UPDATE departments SET is_open = false WHERE id = $1`, [req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /departments/:id/resume — resume queue
app.patch('/departments/:id/resume', async (req, res) => {
  try {
    await db.query(`UPDATE departments SET is_open = true WHERE id = $1`, [req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /admin/overview — all departments status
app.get('/admin/overview', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT d.*,
        COUNT(t.id) FILTER (WHERE t.status = 'waiting') as waiting_count,
        COUNT(t.id) FILTER (WHERE t.status = 'called') as called_count,
        COUNT(t.id) FILTER (WHERE t.status = 'done') as done_count,
        COUNT(t.id) FILTER (WHERE t.status = 'no_show') as no_show_count,
        ROUND(AVG(t.wait_mins) FILTER (WHERE t.status = 'done')) as avg_wait_mins,
        ROUND(AVG(t.rating) FILTER (WHERE t.rating IS NOT NULL), 1) as avg_rating
      FROM departments d
      LEFT JOIN tickets t ON t.department_id = d.id
        AND t.joined_at::date = CURRENT_DATE
      GROUP BY d.id
      ORDER BY d.name
    `)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /admin/analytics — full analytics
app.get('/admin/analytics', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'done') as total_served,
        COUNT(*) FILTER (WHERE status = 'no_show') as total_no_shows,
        COUNT(*) FILTER (WHERE status = 'waiting' OR status = 'called') as currently_waiting,
        ROUND(AVG(wait_mins) FILTER (WHERE status = 'done')) as avg_wait_mins,
        ROUND(AVG(rating) FILTER (WHERE rating IS NOT NULL), 1) as avg_rating
      FROM tickets
      WHERE joined_at::date = CURRENT_DATE
    `)
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`QueueBN backend running on port ${PORT}`))