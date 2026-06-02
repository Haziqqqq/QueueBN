'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Ticket, Users, Clock, CheckCircle, XCircle,
  RefreshCw, LogOut, Megaphone, TrendingUp,
  PauseCircle, PlayCircle, Star, ArrowUpRight
} from 'lucide-react'

interface Department {
  id: string
  name: string
  code: string
  facility: string
  is_open: boolean
  avg_service_time_mins: number
  waiting_count: string
  called_count: string
  done_count: string
  no_show_count: string
  avg_wait_mins: string
  avg_rating: string
}

interface Analytics {
  total_served: string
  total_no_shows: string
  currently_waiting: string
  avg_wait_mins: string
  avg_rating: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [departments, setDepartments] = useState<Department[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [announcement, setAnnouncement] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  useEffect(() => {
    const stored = localStorage.getItem('staff')
    if (!stored) { router.push('/staff/login'); return }
    const s = JSON.parse(stored)
    if (s.role !== 'admin') { router.push('/staff'); return }
    fetchData()
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const [deptRes, analyticsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/overview`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/analytics`)
      ])
      setDepartments(await deptRes.json())
      setAnalytics(await analyticsRes.json())
      setLastUpdated(new Date())
      setLoading(false)
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  const toggleDept = async (dept: Department) => {
    const endpoint = dept.is_open ? 'pause' : 'resume'
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/departments/${dept.id}/${endpoint}`, { method: 'PATCH' })
    fetchData()
  }

  const sendAnnouncement = async () => {
    if (!announcement.trim()) return
    setSending(true)
    // For demo — just show sent confirmation
    await new Promise(r => setTimeout(r, 1000))
    setSent(true)
    setAnnouncement('')
    setSending(false)
    setTimeout(() => setSent(false), 3000)
  }

  const logout = () => {
    localStorage.removeItem('staff')
    router.push('/staff/login')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 text-sm">
      Loading admin dashboard...
    </div>
  )

  const totalWaiting = departments.reduce((s, d) => s + parseInt(d.waiting_count || '0'), 0)
  const totalServed = parseInt(analytics?.total_served || '0')
  const totalNoShows = parseInt(analytics?.total_no_shows || '0')
  const avgWait = parseInt(analytics?.avg_wait_mins || '0')

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <Ticket size={18} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">QueueBN Admin</div>
              <div className="text-xs text-slate-400">All Queues</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400">
              Updated {lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <button onClick={fetchData} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <RefreshCw size={15} />
            </button>
            <Link href="/" className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
              Public Site <ArrowUpRight size={12} />
            </Link>
            <button onClick={logout} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700">
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">

        {/* Global stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Currently Waiting', value: totalWaiting, icon: <Users size={18} />, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
            { label: 'Served Today', value: totalServed, icon: <CheckCircle size={18} />, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
            { label: 'No Shows', value: totalNoShows, icon: <XCircle size={18} />, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' },
            { label: 'Avg Wait Time', value: `${avgWait}m`, icon: <Clock size={18} />, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
          ].map(s => (
            <div key={s.label} className={`bg-white border ${s.border} rounded-xl p-5`}>
              <div className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center ${s.color} mb-3`}>
                {s.icon}
              </div>
              <div className="text-3xl font-bold font-mono text-slate-800">{s.value}</div>
              <div className="text-xs text-slate-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Departments grid */}
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Department Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map(dept => {
              const waiting = parseInt(dept.waiting_count || '0')
              const done = parseInt(dept.done_count || '0')
              const noShow = parseInt(dept.no_show_count || '0')
              const rating = parseFloat(dept.avg_rating || '0')

              return (
                <div key={dept.id} className="bg-white border border-slate-200 rounded-xl p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{dept.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{dept.facility}</div>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 ${dept.is_open ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${dept.is_open ? 'bg-green-500' : 'bg-slate-400'}`} />
                      {dept.is_open ? 'Open' : 'Paused'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center p-2 bg-blue-50 rounded-lg">
                      <div className="text-lg font-bold font-mono text-blue-700">{waiting}</div>
                      <div className="text-xs text-slate-400">waiting</div>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold font-mono text-green-700">{done}</div>
                      <div className="text-xs text-slate-400">served</div>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded-lg">
                      <div className="text-lg font-bold font-mono text-red-600">{noShow}</div>
                      <div className="text-xs text-slate-400">no show</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    {rating > 0 ? (
                      <div className="flex items-center gap-1 text-xs text-amber-600">
                        <Star size={12} fill="currentColor" />
                        <span className="font-semibold">{rating.toFixed(1)}</span>
                        <span className="text-slate-400">rating</span>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400">No ratings yet</div>
                    )}
                    <button
                      onClick={() => toggleDept(dept)}
                      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                        dept.is_open
                          ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                    >
                      {dept.is_open
                        ? <><PauseCircle size={12} /> Pause</>
                        : <><PlayCircle size={12} /> Resume</>
                      }
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Announcement */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Megaphone size={16} className="text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-700">Broadcast Announcement</h2>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Send a WhatsApp message to all patients currently waiting across all departments.
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="e.g. System maintenance in 30 minutes. Please proceed to counter..."
              value={announcement}
              onChange={e => setAnnouncement(e.target.value)}
              className="flex-1 px-4 py-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-colors"
            />
            <button
              onClick={sendAnnouncement}
              disabled={sending || !announcement.trim()}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              <Megaphone size={14} />
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
          {sent && (
            <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
              <CheckCircle size={14} />
              Announcement sent to all waiting patients
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-3 gap-4 pb-6">
          {[
            { label: 'Public Queue', desc: 'View citizen-facing site', href: '/', icon: <ArrowUpRight size={16} /> },
            { label: 'Staff Login', desc: 'Department staff portal', href: '/staff/login', icon: <Users size={16} /> },
            { label: 'Analytics', desc: 'Charts and performance data', href: '/admin/charts', icon: <TrendingUp size={16} /> },
          ].map(link => (
            <Link key={link.label} href={link.href} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 hover:border-blue-200 hover:bg-blue-50 transition-colors">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 flex-shrink-0">
                {link.icon}
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-800">{link.label}</div>
                <div className="text-xs text-slate-400">{link.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
