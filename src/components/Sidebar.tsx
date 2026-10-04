'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  GraduationCap, LayoutDashboard, BookOpen, ClipboardList,
  BarChart3, Users, Settings, LogOut, Menu, X, Bell, ChevronDown
} from 'lucide-react'
import { useState } from 'react'
import { cn, getInitials } from '@/lib/utils'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
}

const studentNav: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/courses', label: 'My Courses', icon: BookOpen },
  { href: '/dashboard/tests', label: 'Tests', icon: ClipboardList },
  { href: '/dashboard/results', label: 'Results', icon: BarChart3 },
]

const adminNav: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/courses', label: 'Courses', icon: BookOpen },
  { href: '/admin/questions', label: 'Question Bank', icon: ClipboardList },
  { href: '/admin/tests', label: 'Tests', icon: BarChart3 },
  { href: '/admin/students', label: 'Students', icon: Users },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

const teacherNav: NavItem[] = [
  { href: '/teacher', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/teacher/lectures', label: 'My Lectures', icon: BookOpen },
  { href: '/teacher/questions', label: 'Questions', icon: ClipboardList },
]

export default function Sidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const role = session?.user?.role
  const nav = role === 'ADMIN' ? adminNav : role === 'TEACHER' ? teacherNav : studentNav
  const name = session?.user?.name || 'User'
  const email = session?.user?.email || ''

  const roleColor = role === 'ADMIN'
    ? 'linear-gradient(135deg, #6644ff, #3366ff)'
    : role === 'TEACHER'
    ? 'linear-gradient(135deg, #059669, #0891b2)'
    : 'linear-gradient(135deg, #3366ff, #6644ff)'

  const roleBadge = role === 'ADMIN' ? 'Admin' : role === 'TEACHER' ? 'Teacher' : 'Student'

  const SidebarContent = () => (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: '#0f172a',
      borderRight: '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Logo */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: roleColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(51,102,255,0.3)',
          }}>
            <GraduationCap size={20} color="white" />
          </div>
          <div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '0.9375rem', color: 'white', lineHeight: 1.2 }}>
              ANALYZER ACADEMY
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#475569', fontWeight: 500 }}>
              {roleBadge} Portal
            </div>
          </div>
        </Link>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto' }}>
        {nav.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/dashboard' && item.href !== '/admin' && item.href !== '/teacher' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.625rem 0.875rem',
                borderRadius: 8,
                textDecoration: 'none',
                background: isActive ? 'rgba(51,102,255,0.15)' : 'transparent',
                border: isActive ? '1px solid rgba(51,102,255,0.25)' : '1px solid transparent',
                color: isActive ? '#7ca3ff' : '#64748b',
                fontWeight: isActive ? 600 : 400,
                fontSize: '0.875rem',
                transition: 'all 0.15s',
              }}
            >
              <Icon size={17} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User menu */}
      <div style={{ padding: '0.875rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.625rem 0.75rem', borderRadius: 10,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
            cursor: 'pointer', textAlign: 'left',
          }}
        >
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: roleColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.8125rem', fontWeight: 700, color: 'white', flexShrink: 0,
          }}>
            {getInitials(name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: 'white', fontSize: '0.8125rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {name}
            </div>
            <div style={{ color: '#475569', fontSize: '0.6875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {email}
            </div>
          </div>
          <ChevronDown size={14} color="#475569" style={{ transform: userMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>

        {userMenuOpen && (
          <div style={{
            marginTop: '0.5rem', borderRadius: 10,
            background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)',
            overflow: 'hidden',
          }}>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem',
                padding: '0.75rem 1rem',
                background: 'none', border: 'none',
                color: '#ef4444', fontSize: '0.875rem', fontWeight: 500,
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <LogOut size={15} />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            zIndex: 40, display: 'block',
          }}
        />
      )}

      {/* Desktop sidebar */}
      <aside style={{
        width: 240, flexShrink: 0, height: '100vh', position: 'sticky', top: 0,
        display: 'none',
      }} className="sidebar-desktop">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar drawer */}
      <aside style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: 260,
        zIndex: 50,
        transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s ease',
      }}>
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: '#0f172a',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0.875rem 1rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }} className="mobile-topbar">
        <button onClick={() => setMobileOpen(true)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}>
          <Menu size={22} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <GraduationCap size={18} color="#7ca3ff" />
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'white', fontSize: '0.9375rem' }}>ANALYZER ACADEMY</span>
        </div>
        <div style={{ width: 30 }} />
      </div>

      <style>{`
        @media (min-width: 768px) {
          .sidebar-desktop { display: block !important; }
          .mobile-topbar { display: none !important; }
        }
      `}</style>
    </>
  )
}
