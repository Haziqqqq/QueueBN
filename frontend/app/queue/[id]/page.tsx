'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, Clock, Phone, CreditCard, MessageSquare, ArrowRight, Hospital } from 'lucide-react'

interface Department {
  id: string
  facility: string
  name: string
  code: string
  is_open: boolean
  avg_service_time_mins: number
  waiting_count: string
  queue: { status: string }[]
}

export default function JoinQueue() {
  const { id } = useParams()
  const router = useRouter()
  const [dept, setDept] = useState<Department | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobile, setMobile] = useState('+673')
  const [ic, setIc] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/departments/${id}`)
      .then(r => r.json())
      .then(data => { setDept(data); setLoading(false) })
  }, [id])

  const joinQueue = async () => {
    if (!mobile || mobile.length < 8) {
      setError('Please enter a valid mobile number')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ department_id: id, mobile_number: mobile, ic_number: ic })
      })
      const data = await res.json()
      if (data.error) { setError(data.error); setSubmitting(false); return }
      router.push(`/ticket/${data.id}`)
    } catch {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 text-sm font-sans">
      Loading department...
    </div>
  )

  if (!dept) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-red-500 text-sm font-sans">
      Department not found.
    </div>
  )

  const waiting = dept.queue?.filter(t => t.status === 'waiting').length || parseInt(dept.waiting_count || '0')
  const estimatedWait = waiting * dept.avg_service_time_mins

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <header className="bg-blue-600 text-white px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <Link href="/" className="text-blue-200 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <Hospital size={16} className="text-blue-200" />
            <span className="text-sm font-semibold">QueueBN</span>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-6 py-8">

        {/* Department card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
          <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">{dept.facility}</div>
          <div className="text-xl font-bold text-slate-800 mb-4">{dept.name}</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-1.5 text-blue-600 mb-1">
                <Users size={14} />
                <span className="text-xs font-medium">Waiting</span>
              </div>
              <div className="text-2xl font-semibold font-mono text-blue-700">{waiting}</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <Clock size={14} />
                <span className="text-xs font-medium">Est. Wait</span>
              </div>
              <div className="text-2xl font-semibold font-mono text-slate-700">
                {waiting === 0 ? '—' : `~${estimatedWait}m`}
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-1">Join the queue</h2>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            Enter your mobile number to receive a WhatsApp notification when your turn is approaching.
          </p>

          <div className="space-y-4">
            {/* Mobile number */}
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                <Phone size={12} />
                Mobile Number (WhatsApp)
                <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                placeholder="+6731234567"
                value={mobile}
                onChange={e => setMobile(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-colors font-mono"
              />
              <p className="text-xs text-slate-400 mt-1.5">Include country code. e.g. +673 for Brunei</p>
            </div>

            {/* IC number */}
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                <CreditCard size={12} />
                IC Number
                <span className="text-xs font-normal text-slate-400 normal-case tracking-normal">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 01-123456"
                value={ic}
                onChange={e => setIc(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-colors font-mono"
              />
            </div>

            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              onClick={joinQueue}
              disabled={submitting}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              {submitting ? 'Joining queue...' : (
                <>Join Queue <ArrowRight size={16} /></>
              )}
            </button>
          </div>

          {/* Info box */}
          <div className="mt-5 p-4 bg-green-50 border border-green-100 rounded-lg flex gap-3">
            <MessageSquare size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-green-700 leading-relaxed">
              You will receive a WhatsApp message when 3 people are ahead of you, and again when you are next. You have <strong>10 minutes</strong> to arrive at the counter before your ticket expires.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
