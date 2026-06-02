'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { ArrowLeft, TrendingUp, Clock, Users, XCircle, Hospital } from 'lucide-react'

interface ChartData {
  avgWait: { name: string; avg_wait: number }[]
  perHour: { hour: number; count: number }[]
  noShowRate: { name: string; no_shows: number; total: number }[]
  last7Days: { date: string; count: number }[]
}

const COLORS = ['#2563EB', '#7C3AED', '#065F46', '#9A3412', '#86198F', '#991B1B']

export default function AdminCharts() {
  const router = useRouter()
  const [data, setData] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('staff')
    if (!stored) { router.push('/staff/login'); return }
    const s = JSON.parse(stored)
    if (s.role !== 'admin') { router.push('/staff'); return }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/charts`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 text-sm">
      Loading analytics...
    </div>
  )

  const noShowData = data?.noShowRate.map(d => ({
    name: d.name.replace(' General', '').replace(' Clinic', '').replace(' Department', ''),
    rate: d.total > 0 ? Math.round((d.no_shows / d.total) * 100) : 0
  })) || []

  const perHourData = Array.from({ length: 24 }, (_, i) => {
    const found = data?.perHour.find(d => parseInt(String(d.hour)) === i)
    return { hour: `${String(i).padStart(2, '0')}:00`, count: found ? parseInt(String(found.count)) : 0 }
  }).filter(d => d.hour >= '07:00' && d.hour <= '18:00')

  const last7Data = data?.last7Days.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    count: parseInt(String(d.count))
  })) || []

  const avgWaitData = data?.avgWait.map(d => ({
    name: d.name.replace(' General', '').replace(' Clinic', '').replace(' Department', ''),
    minutes: parseInt(String(d.avg_wait)) || 0
  })) || []

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-slate-400 hover:text-slate-600 transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <Hospital size={18} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">Analytics Dashboard</div>
              <div className="text-xs text-slate-400">RIPAS Hospital — Queue Performance</div>
            </div>
          </div>
          <Link href="/admin" className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
            <ArrowLeft size={12} /> Back to Overview
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Served (All Time)',
              value: data?.avgWait.length ? data.avgWait.reduce((s, d) => s + (d.avg_wait || 0), 0) : 0,
              icon: <Users size={16} />,
              color: 'text-blue-600',
              bg: 'bg-blue-50',
              suffix: ' depts tracked'
            },
            {
              label: 'Best Avg Wait',
              value: data?.avgWait.length ? Math.min(...data.avgWait.map(d => d.avg_wait || 0)) : 0,
              icon: <Clock size={16} />,
              color: 'text-green-600',
              bg: 'bg-green-50',
              suffix: 'min'
            },
            {
              label: 'Worst Avg Wait',
              value: data?.avgWait.length ? Math.max(...data.avgWait.map(d => d.avg_wait || 0)) : 0,
              icon: <Clock size={16} />,
              color: 'text-red-500',
              bg: 'bg-red-50',
              suffix: 'min'
            },
            {
              label: 'Departments Tracked',
              value: data?.avgWait.length || 0,
              icon: <TrendingUp size={16} />,
              color: 'text-amber-600',
              bg: 'bg-amber-50',
              suffix: ''
            },
          ].map(s => (
            <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-5">
              <div className={`w-8 h-8 ${s.bg} rounded-lg flex items-center justify-center ${s.color} mb-3`}>
                {s.icon}
              </div>
              <div className="text-2xl font-bold font-mono text-slate-800">
                {s.value}{s.suffix}
              </div>
              <div className="text-xs text-slate-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Charts grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Average wait time per department */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Clock size={16} className="text-blue-600" />
              <h3 className="text-sm font-semibold text-slate-800">Average Wait Time by Department</h3>
            </div>
            {avgWaitData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
                No data yet — serve some patients first
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={avgWaitData} margin={{ top: 0, right: 0, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} angle={-20} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} unit="m" />
                  <Tooltip
                    formatter={(value) => [`${value} minutes`, 'Avg Wait']}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}
                  />
                  <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
                    {avgWaitData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Tickets per hour today */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp size={16} className="text-blue-600" />
              <h3 className="text-sm font-semibold text-slate-800">Tickets Served Per Hour Today</h3>
            </div>
            {perHourData.every(d => d.count === 0) ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
                No data yet for today
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={perHourData} margin={{ top: 0, right: 0, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#94A3B8' }} angle={-20} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <Tooltip
                    formatter={(value) => [value, 'Tickets']}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#2563EB" strokeWidth={2} dot={{ fill: '#2563EB', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Last 7 days */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Users size={16} className="text-blue-600" />
              <h3 className="text-sm font-semibold text-slate-800">Tickets Served — Last 7 Days</h3>
            </div>
            {last7Data.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
                No historical data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={last7Data} margin={{ top: 0, right: 0, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <Tooltip
                    formatter={(value) => [value, 'Tickets Served']}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}
                  />
                  <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* No-show rate */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <XCircle size={16} className="text-red-500" />
              <h3 className="text-sm font-semibold text-slate-800">No-Show Rate by Department Today</h3>
            </div>
            {noShowData.length === 0 || noShowData.every(d => d.rate === 0) ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
                No no-show data yet for today
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={noShowData} margin={{ top: 0, right: 0, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} angle={-20} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} unit="%" />
                  <Tooltip
                    formatter={(value) => [`${value}%`, 'No-Show Rate']}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}
                  />
                  <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                    {noShowData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-400 text-center pb-6">
          Data updates in real time as patients are served. Charts show historical data across all sessions.
        </p>
      </div>
    </div>
  )
}
