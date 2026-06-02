'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Ticket as BrandIcon, Users, Clock, CheckCircle, XCircle,
  SkipForward, LogOut, RefreshCw, PauseCircle, PlayCircle,
  AlertCircle, Hash
} from 'lucide-react'

interface Ticket {
  id: string
  ticket_number: string
  status: string
  position: number
  mobile_number: string
  joined_at: string
  called_at: string | null
  people_ahead?: number
}

interface Department {
  id: string
  name: string
  code: string
  is_open: boolean
  avg_service_time_mins: number
  waiting_count: string
}

interface Staff {
  email: string
  name: string
  department: string
  department_id: string
  role: string
}

export default function StaffDashboard() {
  const router = useRouter()
  const [staff, setStaff] = useState<Staff | null>(null)
  const [dept, setDept] = useState<Department | null>(null)
  const [queue, setQueue] = useState<Ticket[]>([])
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [calling, setCalling] = useState(false)
  const [stats, setStats] = useState({ served: 0, no_shows: 0, avg_wait: 0 })

  useEffect(() => {
    const stored = localStorage.getItem('staff')
    if (!stored) { router.push('/staff/login'); return }
    const s = JSON.parse(stored)
    setStaff(s)
    fetchData(s.department_id)
    const interval = setInterval(() => fetchData(s.department_id), 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async (deptId: string) => {
    if (!deptId) return
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/departments/${deptId}`)
      const data = await res.json()
      setDept(data)

      const waiting = data.queue?.filter((t: Ticket) => t.status === 'waiting') || []
      const called = data.queue?.filter((t: Ticket) => t.status === 'called') || []
      setQueue(waiting)
      setCurrentTicket(called[0] || null)

      // Fetch analytics
      const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/analytics`)
      const statsData = await statsRes.json()
      setStats({
        served: parseInt(statsData.total_served) || 0,
        no_shows: parseInt(statsData.total_no_shows) || 0,
        avg_wait: parseInt(statsData.avg_wait_mins) || 0,
      })

      setLoading(false)
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  const callNext = async () => {
    if (!staff?.department_id) return
    setCalling(true)
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/staff/call-next`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ department_id: staff.department_id })
    })
    await fetchData(staff.department_id)
    setCalling(false)
  }

  const markDone = async (ticketId: string) => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickets/${ticketId}/done`, { method: 'PATCH' })
    await fetchData(staff!.department_id)
  }

  const markNoShow = async (ticketId: string) => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickets/${ticketId}/no-show`, { method: 'PATCH' })
    await fetchData(staff!.department_id)
  }

  const toggleQueue = async () => {
    if (!dept) return
    const endpoint = dept.is_open ? 'pause' : 'resume'
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/departments/${dept.id}/${endpoint}`, { method: 'PATCH' })
    await fetchData(staff!.department_id)
  }

  const logout = () => {
    localStorage.removeItem('staff')
    router.push('/staff/login')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 text-sm">
      Loading dashboard...
    </div>
  )

  const minutesSinceCalled = currentTicket?.called_at
    ? Math.floor((new Date().getTime() - new Date(currentTicket.called_at).getTime()) / 60000)
    : 0

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <BrandIcon size={18} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">QueueBN Staff</div>
              <div className="text-xs text-slate-400">{staff?.name} — {dept?.name}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchData(staff!.department_id)}
              className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Waiting', value: queue.length, icon: <Users size={16} />, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Served Today', value: stats.served, icon: <CheckCircle size={16} />, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'No Shows', value: stats.no_shows, icon: <XCircle size={16} />, color: 'text-red-500', bg: 'bg-red-50' },
            { label: 'Avg Wait', value: `${stats.avg_wait}m`, icon: <Clock size={16} />, color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map(s => (
            <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className={`w-8 h-8 ${s.bg} rounded-lg flex items-center justify-center ${s.color} mb-3`}>
                {s.icon}
              </div>
              <div className="text-2xl font-bold font-mono text-slate-800">{s.value}</div>
              <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Current ticket */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-700">Current Patient</h2>

            {currentTicket ? (
              <div className="bg-white border-2 border-amber-300 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle size={16} className="text-amber-500" />
                  <span className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Called — awaiting arrival</span>
                  {minutesSinceCalled > 0 && (
                    <span className={`ml-auto text-xs font-mono px-2 py-0.5 rounded-full ${minutesSinceCalled >= 8 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                      {minutesSinceCalled}m ago
                    </span>
                  )}
                </div>
                <div className="text-4xl font-bold font-mono text-slate-800 mb-1">{currentTicket.ticket_number}</div>
                <div className="text-sm text-slate-400 mb-6">{currentTicket.mobile_number}</div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => markDone(currentTicket.id)}
                    className="py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <CheckCircle size={16} /> Done
                  </button>
                  <button
                    onClick={() => markNoShow(currentTicket.id)}
                    className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <XCircle size={16} /> No Show
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Hash size={20} className="text-slate-400" />
                </div>
                <div className="text-sm text-slate-500 mb-1">No patient called yet</div>
                <div className="text-xs text-slate-400">Press Call Next to bring in the next patient</div>
              </div>
            )}

            {/* Call next button */}
            <button
              onClick={callNext}
              disabled={calling || queue.length === 0 || !dept?.is_open}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-base rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <SkipForward size={20} />
              {calling ? 'Calling...' : `Call Next (${queue.length} waiting)`}
            </button>

            {/* Pause/Resume */}
            <button
              onClick={toggleQueue}
              className={`w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors border ${
                dept?.is_open
                  ? 'border-amber-200 text-amber-600 hover:bg-amber-50'
                  : 'border-green-200 text-green-600 hover:bg-green-50'
              }`}
            >
              {dept?.is_open
                ? <><PauseCircle size={16} /> Pause Queue</>
                : <><PlayCircle size={16} /> Resume Queue</>
              }
            </button>
          </div>

          {/* Queue list */}
          <div>
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Waiting Queue ({queue.length})</h2>
            {queue.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
                <CheckCircle size={24} className="text-green-500 mx-auto mb-2" />
                <div className="text-sm text-slate-500">Queue is empty</div>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {queue.map((ticket, index) => (
                  <div key={ticket.id} className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-sm font-bold font-mono text-slate-800">{ticket.ticket_number}</div>
                        <div className="text-xs text-slate-400">{ticket.mobile_number}</div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      {new Date(ticket.joined_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
