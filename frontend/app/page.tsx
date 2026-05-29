'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Hospital, Users, Clock, ArrowRight, Smartphone, Bell, MapPin, RefreshCw } from 'lucide-react'

interface Department {
  id: string
  facility: string
  name: string
  code: string
  is_open: boolean
  avg_service_time_mins: number
  waiting_count: string
  called_count: string
}

const deptIcons: Record<string, React.ReactNode> = {
  OPD: <Hospital size={22} />,
  SPC: <Hospital size={22} />,
  PHR: <Hospital size={22} />,
  LAB: <Hospital size={22} />,
  RAD: <Hospital size={22} />,
  EMG: <Hospital size={22} />,
}

const deptColors: Record<string, { bg: string; color: string; border: string }> = {
  OPD: { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  SPC: { bg: '#F5F3FF', color: '#6D28D9', border: '#DDD6FE' },
  PHR: { bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0' },
  LAB: { bg: '#FFF7ED', color: '#9A3412', border: '#FED7AA' },
  RAD: { bg: '#FDF4FF', color: '#86198F', border: '#F0ABFC' },
  EMG: { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA' },
}

export default function Home() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchDepartments = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/departments`)
      .then(r => r.json())
      .then(data => {
        setDepartments(data)
        setLoading(false)
        setLastUpdated(new Date())
      })
  }

  useEffect(() => {
    fetchDepartments()
    const interval = setInterval(fetchDepartments, 15000)
    return () => clearInterval(interval)
  }, [])

  const totalWaiting = departments.reduce((sum, d) => sum + parseInt(d.waiting_count || '0'), 0)
  const openDepts = departments.filter(d => d.is_open).length

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <header className="bg-blue-600 text-white">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
                <Hospital size={18} className="text-white" />
              </div>
              <div>
                <div className="text-base font-bold tracking-tight">QueueBN</div>
                <div className="text-xs text-blue-200">RIPAS Hospital Virtual Queue</div>
              </div>
            </div>
            <Link href="/staff/login" className="text-sm text-blue-200 hover:text-white transition-colors flex items-center gap-1">
              Staff Portal <ArrowRight size={14} />
            </Link>
          </div>

          <h1 className="text-3xl font-bold tracking-tight leading-tight mb-3">
            Skip the waiting room.<br />Join from anywhere.
          </h1>
          <p className="text-blue-100 text-sm font-light max-w-md leading-relaxed">
            Select your department, join the virtual queue, and receive a WhatsApp notification when your turn is approaching.
          </p>

          <div className="flex gap-4 mt-6">
            <div className="bg-white/15 rounded-xl px-5 py-3">
              <div className="text-2xl font-semibold font-mono">{totalWaiting}</div>
              <div className="text-xs text-blue-200 mt-0.5">currently waiting</div>
            </div>
            <div className="bg-white/15 rounded-xl px-5 py-3">
              <div className="text-2xl font-semibold font-mono">{openDepts}</div>
              <div className="text-xs text-blue-200 mt-0.5">departments open</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-6 py-8">

        {/* Section header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-slate-800">Select a Department</h2>
          <button
            onClick={fetchDepartments}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
          >
            <RefreshCw size={12} />
            Updated {lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-400 text-sm">Loading departments...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {departments.map(dept => {
              const style = deptColors[dept.code] || { bg: '#F8FAFC', color: '#334155', border: '#E2E8F0' }
              const waiting = parseInt(dept.waiting_count || '0')
              const estimatedWait = waiting * dept.avg_service_time_mins

              return (
                <Link
                  key={dept.id}
                  href={dept.is_open ? `/queue/${dept.id}` : '#'}
                  className={`block rounded-xl border bg-white overflow-hidden transition-all ${dept.is_open ? 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer' : 'opacity-50 cursor-not-allowed pointer-events-none'}`}
                  style={{ borderColor: style.border }}
                >
                  {/* Top accent bar */}
                  <div className="h-1" style={{ background: style.color }} />

                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="w-11 h-11 rounded-lg flex items-center justify-center"
                        style={{ background: style.bg, color: style.color }}
                      >
                        {deptIcons[dept.code] || <Hospital size={22} />}
                      </div>
                      <span
                        className="text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1"
                        style={{
                          background: dept.is_open ? '#DCFCE7' : '#FEE2E2',
                          color: dept.is_open ? '#15803D' : '#DC2626'
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: dept.is_open ? '#16A34A' : '#DC2626' }} />
                        {dept.is_open ? 'Open' : 'Closed'}
                      </span>
                    </div>

                    <div className="text-base font-semibold text-slate-800 mb-0.5">{dept.name}</div>
                    <div className="text-xs text-slate-400 mb-4">{dept.facility}</div>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="rounded-lg p-3" style={{ background: style.bg }}>
                        <div className="text-xl font-semibold font-mono" style={{ color: style.color }}>{waiting}</div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <Users size={10} /> waiting
                        </div>
                      </div>
                      <div className="rounded-lg p-3 bg-slate-50">
                        <div className="text-xl font-semibold font-mono text-slate-700">
                          {waiting === 0 ? '—' : `${estimatedWait}m`}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <Clock size={10} /> est. wait
                        </div>
                      </div>
                    </div>

                    {dept.is_open && (
                      <div
                        className="w-full py-2.5 rounded-lg text-sm font-medium text-center flex items-center justify-center gap-2 transition-opacity"
                        style={{ background: style.bg, color: style.color }}
                      >
                        Join Queue <ArrowRight size={14} />
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* How it works */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-5">How QueueBN works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Smartphone size={18} className="text-blue-600" />,
                title: 'Join from anywhere',
                desc: 'Select your department and join the virtual queue from home or on arrival. No need to be physically present.'
              },
              {
                icon: <Bell size={18} className="text-blue-600" />,
                title: 'Get notified',
                desc: 'Receive a WhatsApp message when 3 people are ahead of you and again when you are next in line.'
              },
              {
                icon: <MapPin size={18} className="text-blue-600" />,
                title: 'Arrive on time',
                desc: 'Show up at the counter only when your turn is approaching. No more wasted hours in the waiting room.'
              },
            ].map(item => (
              <div key={item.title} className="flex gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  {item.icon}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800 mb-1">{item.title}</div>
                  <div className="text-xs text-slate-500 leading-relaxed">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
