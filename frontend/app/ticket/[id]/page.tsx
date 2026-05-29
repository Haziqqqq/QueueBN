'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Hospital, Users, Clock, CheckCircle, XCircle, AlertCircle, Hash, Phone, RefreshCw } from 'lucide-react'

interface Ticket {
  id: string
  ticket_number: string
  status: string
  position: number
  mobile_number: string
  department_name: string
  code: string
  avg_service_time_mins: number
  people_ahead: number
  estimated_wait_mins: number
  joined_at: string
  called_at: string | null
  done_at: string | null
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode; message: string }> = {
  waiting: {
    label: 'Waiting',
    color: '#1D4ED8',
    bg: '#EFF6FF',
    icon: <Clock size={20} />,
    message: 'Your ticket is in the queue. We will notify you on WhatsApp when your turn is approaching.'
  },
  called: {
    label: 'You are next',
    color: '#D97706',
    bg: '#FFFBEB',
    icon: <AlertCircle size={20} />,
    message: 'Please proceed to the counter now. You have 10 minutes before your ticket expires.'
  },
  serving: {
    label: 'Being served',
    color: '#065F46',
    bg: '#ECFDF5',
    icon: <CheckCircle size={20} />,
    message: 'You are currently being served at the counter.'
  },
  done: {
    label: 'Completed',
    color: '#15803D',
    bg: '#F0FDF4',
    icon: <CheckCircle size={20} />,
    message: 'Your visit is complete. Thank you for using QueueBN.'
  },
  no_show: {
    label: 'Ticket Expired',
    color: '#DC2626',
    bg: '#FEF2F2',
    icon: <XCircle size={20} />,
    message: 'Your ticket expired because you did not arrive within 10 minutes of being called.'
  },
  cancelled: {
    label: 'Cancelled',
    color: '#6B7280',
    bg: '#F9FAFB',
    icon: <XCircle size={20} />,
    message: 'You have left the queue.'
  },
}

export default function TicketPage() {
  const { id } = useParams()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(0)
  const [rated, setRated] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const fetchTicket = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickets/${id}`)
      .then(r => r.json())
      .then(data => { setTicket(data); setLoading(false) })
  }

  useEffect(() => {
    fetchTicket()
    const interval = setInterval(fetchTicket, 10000)
    return () => clearInterval(interval)
  }, [id])

  const cancelTicket = async () => {
    if (!confirm('Are you sure you want to leave the queue?')) return
    setCancelling(true)
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickets/${id}`, { method: 'DELETE' })
    fetchTicket()
    setCancelling(false)
  }

  const submitRating = async (stars: number) => {
    setRating(stars)
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickets/${id}/rating`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: stars })
    })
    setRated(true)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 text-sm">
      Loading your ticket...
    </div>
  )

  if (!ticket) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-red-500 text-sm">
      Ticket not found.
    </div>
  )

  const status = statusConfig[ticket.status] || statusConfig.waiting
  const isActive = ['waiting', 'called', 'serving'].includes(ticket.status)
  const isDone = ['done', 'no_show', 'cancelled'].includes(ticket.status)

  const progressSteps = [
    { label: 'Joined', done: true },
    { label: 'In Queue', done: ticket.status !== 'waiting' || true },
    { label: 'Called', done: ['called', 'serving', 'done'].includes(ticket.status) },
    { label: 'Done', done: ticket.status === 'done' },
  ]

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <header className="bg-blue-600 text-white px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-blue-200 hover:text-white transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div className="flex items-center gap-2">
              <Hospital size={16} className="text-blue-200" />
              <span className="text-sm font-semibold">QueueBN</span>
            </div>
          </div>
          <button onClick={fetchTicket} className="text-blue-200 hover:text-white transition-colors">
            <RefreshCw size={16} />
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-6 py-8 space-y-4">

        {/* Ticket number */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
          <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">{ticket.department_name}</div>
          <div className="text-xs text-slate-400 mb-4">Your Ticket Number</div>
          <div className="text-5xl font-bold font-mono text-slate-800 tracking-tight mb-2">
            {ticket.ticket_number}
          </div>
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mt-2"
            style={{ background: status.bg, color: status.color }}
          >
            {status.icon}
            {status.label}
          </div>
        </div>

        {/* Status message */}
        <div
          className="rounded-xl p-4 flex gap-3"
          style={{ background: status.bg, border: `1px solid ${status.color}20` }}
        >
          <div style={{ color: status.color, flexShrink: 0, marginTop: 2 }}>
            {status.icon}
          </div>
          <p className="text-sm leading-relaxed" style={{ color: status.color }}>
            {status.message}
          </p>
        </div>

        {/* Queue position — only show when waiting */}
        {ticket.status === 'waiting' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs mb-2">
                  <Users size={12} />
                  People Ahead
                </div>
                <div className="text-4xl font-bold font-mono text-slate-800">{ticket.people_ahead}</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs mb-2">
                  <Clock size={12} />
                  Est. Wait
                </div>
                <div className="text-4xl font-bold font-mono text-slate-800">
                  {ticket.estimated_wait_mins === 0 ? '—' : `${ticket.estimated_wait_mins}m`}
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-400">Queue Progress</span>
                <span className="text-xs font-mono text-slate-400">Position #{ticket.position}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: ticket.people_ahead === 0 ? '100%' : `${Math.max(5, 100 - (ticket.people_ahead * 10))}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Called state */}
        {ticket.status === 'called' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
            <AlertCircle size={32} className="text-amber-500 mx-auto mb-3" />
            <div className="text-lg font-bold text-amber-800 mb-1">It is your turn!</div>
            <div className="text-sm text-amber-600">Please proceed to the {ticket.department_name} counter now.</div>
          </div>
        )}

        {/* Ticket details */}
        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
          <div className="px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Hash size={12} />
              Ticket Number
            </div>
            <div className="text-sm font-mono font-semibold text-slate-800">{ticket.ticket_number}</div>
          </div>
          <div className="px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Hospital size={12} />
              Department
            </div>
            <div className="text-sm font-medium text-slate-800">{ticket.department_name}</div>
          </div>
          <div className="px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Phone size={12} />
              Notify To
            </div>
            <div className="text-sm font-mono text-slate-800">{ticket.mobile_number}</div>
          </div>
          <div className="px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock size={12} />
              Joined At
            </div>
            <div className="text-sm font-mono text-slate-800">
              {new Date(ticket.joined_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        {/* Rating — show after done */}
        {ticket.status === 'done' && !rated && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
            <div className="text-sm font-semibold text-slate-800 mb-1">How was your experience?</div>
            <div className="text-xs text-slate-400 mb-4">Rate your visit to help us improve</div>
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => submitRating(star)}
                  className="w-10 h-10 rounded-lg border-2 text-sm font-bold transition-all hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600"
                  style={{
                    borderColor: rating >= star ? '#2563EB' : '#E2E8F0',
                    background: rating >= star ? '#EFF6FF' : 'white',
                    color: rating >= star ? '#1D4ED8' : '#94A3B8'
                  }}
                >
                  {star}
                </button>
              ))}
            </div>
          </div>
        )}

        {rated && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <CheckCircle size={20} className="text-green-600 mx-auto mb-1" />
            <p className="text-sm text-green-700 font-medium">Thank you for your feedback!</p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 pb-8">
          {isActive && (
            <button
              onClick={cancelTicket}
              disabled={cancelling}
              className="w-full py-3 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {cancelling ? 'Leaving queue...' : 'Leave Queue'}
            </button>
          )}
          {isDone && (
            <Link
              href="/"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              Back to Home
            </Link>
          )}
          <p className="text-xs text-slate-400 text-center">
            Auto-refreshes every 10 seconds
          </p>
        </div>
      </div>
    </div>
  )
}
