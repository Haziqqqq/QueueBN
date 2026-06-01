'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Ticket, Lock, Mail, ArrowRight } from 'lucide-react'

export default function StaffLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const login = async () => {
    if (!email || !password) { setError('Please enter email and password'); return }
    setLoading(true)
    setError('')

    // Simple hardcoded auth for demo — replace with Supabase Auth later
    const staffAccounts: Record<string, { name: string; department_id: string; department: string; role: string }> = {
    'service@queuebn.app': { name: 'Customer Service Staff', department_id: '', department: 'Customer Service', role: 'staff' },
    'billing@queuebn.app': { name: 'Billing Staff', department_id: '', department: 'Billing & Payments', role: 'staff' },
    'accounts@queuebn.app': { name: 'Account Services Staff', department_id: '', department: 'Account Services', role: 'staff' },
    'collections@queuebn.app': { name: 'Collections Staff', department_id: '', department: 'Collections & Pickup', role: 'staff' },
    'enquiries@queuebn.app': { name: 'Enquiries Staff', department_id: '', department: 'General Enquiries', role: 'staff' },
    'admin@queuebn.app': { name: 'Admin', department_id: '', department: 'all', role: 'admin' },
    }

    if (password !== 'queuebn2026') {
      setError('Invalid email or password')
      setLoading(false)
      return
    }

    const account = staffAccounts[email.toLowerCase()]
    if (!account) {
      setError('Invalid email or password')
      setLoading(false)
      return
    }

    // Fetch departments to get the ID
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/departments`)
    const departments = await res.json()
    const dept = departments.find((d: any) => d.name === account.department)

    localStorage.setItem('staff', JSON.stringify({
      ...account,
      email,
      department_id: dept?.id || '',
    }))

    if (account.role === 'admin') {
        router.push('/admin')
    } else {
        router.push('/staff')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Ticket size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">QueueBN Staff Portal</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to manage your queue</p>
        </div>

        {/* Form */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1.5 mb-2">
              <Mail size={12} /> Email Address
            </label>
            <input
              type="email"
              placeholder="service@queuebn.app"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && login()}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1.5 mb-2">
              <Lock size={12} /> Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && login()}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            onClick={login}
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? 'Signing in...' : <> Sign In <ArrowRight size={16} /> </>}
          </button>
        </div>

        {/* Demo accounts */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <p className="text-xs font-semibold text-blue-700 mb-2">Demo Accounts (password: queuebn2026)</p>
          <div className="space-y-1">
            {['service@queuebn.app', 'billing@queuebn.app', 'accounts@queuebn.app', 'collections@queuebn.app', 'enquiries@queuebn.app', 'admin@queuebn.app'].map(acc => (
              <button
                key={acc}
                onClick={() => setEmail(acc)}
                className="block w-full text-left text-xs text-blue-600 hover:text-blue-800 font-mono transition-colors"
              >
                {acc}
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          <a href="/" className="hover:text-slate-600 transition-colors">← Back to public queue</a>
        </p>
      </div>
    </div>
  )
}
