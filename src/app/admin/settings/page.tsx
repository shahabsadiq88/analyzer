'use client'

import { useState } from 'react'
import { Save, Shield, Bell, Database, Lock, CheckCircle2, AlertCircle } from 'lucide-react'

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  
  // Settings state
  const [settings, setSettings] = useState({
    platformName: 'ANALYZER ACADEMY',
    supportEmail: 'support@mdcatlms.com',
    allowRegistrations: false,
    maxTestAttempts: '3',
    enableNegativeMarkingDefault: true,
    defaultNegativeMarkValue: '0.25',
    sessionTimeoutMinutes: '60',
    maintenanceMode: false,
    emailNotifications: true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSavedSuccess(false)
    
    // Simulate save logic
    setTimeout(() => {
      setSaving(false)
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 3000)
    }, 600)
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: 'white', marginBottom: '0.375rem' }}>
          Platform Settings
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9375rem' }}>
          Manage global portal configurations, testdefaults, and security policies.
        </p>
      </div>

      {savedSuccess && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)',
          color: '#10b981', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem',
          fontSize: '0.875rem'
        }}>
          <CheckCircle2 size={18} />
          <span>Settings saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* General Settings */}
        <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <Database size={20} color="#3366ff" />
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'white', fontSize: '1.125rem', margin: 0 }}>
              General Platform Settings
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8125rem', marginBottom: '0.5rem', fontWeight: 500 }}>
                Platform Name
              </label>
              <input
                type="text"
                value={settings.platformName}
                onChange={e => setSettings({ ...settings, platformName: e.target.value })}
                style={{
                  width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px', padding: '0.625rem 0.875rem', color: 'white', fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8125rem', marginBottom: '0.5rem', fontWeight: 500 }}>
                Support Email
              </label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={e => setSettings({ ...settings, supportEmail: e.target.value })}
                style={{
                  width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px', padding: '0.625rem 0.875rem', color: 'white', fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>
        </div>

        {/* Exam & Testing Defaults */}
        <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <Shield size={20} color="#f59e0b" />
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'white', fontSize: '1.125rem', margin: 0 }}>
              Testing & Exam Rules
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8125rem', marginBottom: '0.5rem', fontWeight: 500 }}>
                Max Practice Attempts Per Test
              </label>
              <input
                type="number"
                value={settings.maxTestAttempts}
                onChange={e => setSettings({ ...settings, maxTestAttempts: e.target.value })}
                style={{
                  width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px', padding: '0.625rem 0.875rem', color: 'white', fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8125rem', marginBottom: '0.5rem', fontWeight: 500 }}>
                Default Negative Marking Value
              </label>
              <input
                type="text"
                value={settings.defaultNegativeMarkValue}
                onChange={e => setSettings({ ...settings, defaultNegativeMarkValue: e.target.value })}
                style={{
                  width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px', padding: '0.625rem 0.875rem', color: 'white', fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
              <input
                type="checkbox"
                id="negMarking"
                checked={settings.enableNegativeMarkingDefault}
                onChange={e => setSettings({ ...settings, enableNegativeMarkingDefault: e.target.checked })}
                style={{ width: 18, height: 18, accentColor: '#3366ff', cursor: 'pointer' }}
              />
              <label htmlFor="negMarking" style={{ color: 'white', fontSize: '0.875rem', cursor: 'pointer' }}>
                Enable Negative Marking by Default for New Tests
              </label>
            </div>
          </div>
        </div>

        {/* Security & Access */}
        <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <Lock size={20} color="#10b981" />
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'white', fontSize: '1.125rem', margin: 0 }}>
              Security & Maintenance
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div>
                <div style={{ color: 'white', fontSize: '0.875rem', fontWeight: 600 }}>Student Self-Registration</div>
                <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Allow students to register accounts without admin approval</div>
              </div>
              <input
                type="checkbox"
                checked={settings.allowRegistrations}
                onChange={e => setSettings({ ...settings, allowRegistrations: e.target.checked })}
                style={{ width: 18, height: 18, accentColor: '#3366ff', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div>
                <div style={{ color: 'white', fontSize: '0.875rem', fontWeight: 600 }}>System Maintenance Mode</div>
                <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Restrict non-admin access to the portal during updates</div>
              </div>
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={e => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                style={{ width: 18, height: 18, accentColor: '#ef4444', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: '#3366ff', color: 'white', border: 'none',
              padding: '0.75rem 1.75rem', borderRadius: '10px',
              fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '0.875rem',
              cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
              boxShadow: '0 4px 12px rgba(51, 102, 255, 0.25)'
            }}
          >
            <Save size={16} />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
