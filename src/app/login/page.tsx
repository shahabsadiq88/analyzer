'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GraduationCap, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email: email.trim(),
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('Invalid email or password. Please try again.')
      setLoading(false)
      return
    }

    // Redirect based on role — the session will have the role
    // We'll do a quick fetch to get the session and redirect accordingly
    const session = await fetch('/api/auth/session').then(r => r.json())
    const role = session?.user?.role

    if (role === 'ADMIN') router.push('/admin')
    else if (role === 'TEACHER') router.push('/teacher')
    else router.push('/dashboard')
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      padding: '1.5rem',
    }}>
      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 420,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20,
        padding: '2.5rem',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
        animation: 'fadeIn 0.4s ease-out',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: 'linear-gradient(135deg, #3366ff, #6644ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 8px 24px rgba(51,102,255,0.4)',
          }}>
            <GraduationCap size={28} color="white" />
          </div>
          <h1 style={{
            fontFamily: 'Outfit, sans-serif', fontWeight: 800,
            fontSize: '1.75rem', color: 'white', marginBottom: '0.375rem',
          }}>
            Welcome Back
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Sign in to continue to ANALYZER ACADEMY
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 10, padding: '0.875rem 1rem',
            color: '#fca5a5', fontSize: '0.875rem', marginBottom: '1.25rem',
          }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.5rem' }}>
              Email or Username
            </label>
            <input
              id="email"
              type="text"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="ali@student.com"
              required
              autoComplete="email"
              style={{
                width: '100%', padding: '0.75rem 1rem', borderRadius: 10,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'white', fontSize: '0.9375rem',
                outline: 'none', transition: 'border 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#3366ff'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.5rem' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                style={{
                  width: '100%', padding: '0.75rem 3rem 0.75rem 1rem', borderRadius: 10,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white', fontSize: '0.9375rem',
                  outline: 'none', transition: 'border 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#3366ff'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4,
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '0.875rem',
              borderRadius: 10, border: 'none',
              background: loading ? '#334155' : 'linear-gradient(135deg, #3366ff, #6644ff)',
              color: 'white', fontSize: '1rem', fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              boxShadow: loading ? 'none' : '0 4px 15px rgba(51,102,255,0.4)',
              transition: 'all 0.2s', marginTop: '0.5rem',
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                Signing in...
              </>
            ) : 'Sign In'}
          </button>
        </form>

        {/* Demo credentials hint */}
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem', borderRadius: 10,
          background: 'rgba(51,102,255,0.08)',
          border: '1px solid rgba(51,102,255,0.15)',
        }}>
          <p style={{ color: '#7ca3ff', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Demo Credentials
          </p>
          <div style={{ color: '#64748b', fontSize: '0.75rem', lineHeight: 2 }}>
            <div>Admin: <span style={{ color: '#94a3b8' }}>admin@mdcatacademy.com / admin123</span></div>
            <div>Student: <span style={{ color: '#94a3b8' }}>ali@student.com / student123</span></div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        input::placeholder { color: #475569; }
      `}</style>
    </div>
  )
}
