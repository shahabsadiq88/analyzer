'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  GraduationCap, LayoutDashboard, BookOpen, ClipboardList,
  BarChart3, Users, Settings, LogOut, X, ChevronRight, Sun, Moon, Menu
} from 'lucide-react'
import { useState } from 'react'
import { getInitials } from '@/lib/utils'
import { useTheme } from '../context/ThemeContext'

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
  const { theme, toggleTheme } = useTheme()
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const role = session?.user?.role
  const nav = role === 'ADMIN' ? adminNav : role === 'TEACHER' ? teacherNav : studentNav
  const name = session?.user?.name || 'User'
  const email = session?.user?.email || ''
  const roleBadge = role === 'ADMIN' ? 'Admin' : role === 'TEACHER' ? 'Teacher' : 'Student'

  function isActive(href: string) {
    if (href === '/dashboard' || href === '/admin' || href === '/teacher') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  /* ── Shared drawer/sidebar nav content ── */
  const NavContent = () => (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'var(--surface)',
    }}>
      {/* Logo row */}
      <div style={{
        padding: '1.25rem 1.5rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none' }}
          onClick={() => setDrawerOpen(false)}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'var(--brand-500)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(249,115,22,0.25)',
            flexShrink: 0,
          }}>
            <GraduationCap size={20} color="white" />
          </div>
          <div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text)', lineHeight: 1.2 }}>
              ANALYZER ACADEMY
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              {roleBadge} Portal
            </div>
          </div>
        </Link>
        {/* Close button — visible only in mobile drawer */}
        <button
          onClick={() => setDrawerOpen(false)}
          className="drawer-close-btn"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', padding: 4, display: 'none',
          }}>
          <X size={20} />
        </button>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto' }}>
        {nav.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setDrawerOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.625rem 0.875rem',
                borderRadius: 8,
                textDecoration: 'none',
                background: active ? 'var(--brand-50)' : 'transparent',
                border: active ? '1px solid var(--brand-200)' : '1px solid transparent',
                color: active ? 'var(--brand-600)' : 'var(--text-muted)',
                fontWeight: active ? 600 : 500,
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

      {/* Theme toggle */}
      <div style={{ padding: '0 0.875rem 0.5rem' }}>
        <button
          onClick={toggleTheme}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0.625rem 0.875rem', borderRadius: 10,
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            color: 'var(--text)', fontSize: '0.8125rem', fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            {theme === 'dark' ? <Sun size={16} color="#f59e0b" /> : <Moon size={16} color="#ea580c" />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </span>
        </button>
      </div>

      {/* User section */}
      <div style={{ padding: '0.875rem', borderTop: '1px solid var(--border)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.625rem 0.75rem', borderRadius: 10,
          background: 'var(--surface-2)', border: '1px solid var(--border)',
          marginBottom: '0.5rem',
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'var(--brand-500)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.8125rem', fontWeight: 700, color: 'white', flexShrink: 0,
          }}>
            {getInitials(name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: 'var(--text)', fontSize: '0.8125rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {name}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.6875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {email}
            </div>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem',
            padding: '0.625rem 0.875rem', borderRadius: 8,
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
            color: '#ef4444', fontSize: '0.875rem', fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          <LogOut size={15} />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* ─────────────────────────────────────────
          DESKTOP SIDEBAR (≥ 768px)
      ───────────────────────────────────────── */}
      <aside className="nav-sidebar-desktop" style={{
        width: 240, flexShrink: 0, height: '100vh',
        position: 'sticky', top: 0,
        borderRight: '1px solid var(--border)',
      }}>
        <NavContent />
      </aside>

      {/* ─────────────────────────────────────────
          MOBILE: TOP NAVBAR (< 768px)
      ───────────────────────────────────────── */}
      <div className="nav-mobile-topbar" style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '0.75rem 1rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
          <div style={{
            width: 30, height: 30, borderRadius: 7,
            background: 'var(--brand-500)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <GraduationCap size={16} color="white" />
          </div>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'var(--text)', fontSize: '0.9rem' }}>
            ANALYZER
          </span>
        </Link>

        {/* Right: theme + hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button onClick={toggleTheme} style={{
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '0.4rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-muted)',
          }}>
            {theme === 'dark' ? <Sun size={16} color="#f59e0b" /> : <Moon size={16} color="#ea580c" />}
          </button>
          <button
            onClick={() => setDrawerOpen(true)}
            style={{
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '0.4rem 0.6rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text)',
            }}
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────
          MOBILE: FULL-SCREEN SLIDE-IN DRAWER
      ───────────────────────────────────────── */}
      {/* Backdrop */}
      <div
        onClick={() => setDrawerOpen(false)}
        className="nav-drawer-backdrop"
        style={{
          position: 'fixed', inset: 0, zIndex: 49,
          background: 'rgba(0,0,0,0.6)',
          opacity: drawerOpen ? 1 : 0,
          pointerEvents: drawerOpen ? 'all' : 'none',
          transition: 'opacity 0.25s ease',
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Drawer panel */}
      <aside
        className="nav-drawer-panel"
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: 280, zIndex: 50,
          transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: drawerOpen ? '-8px 0 32px rgba(0,0,0,0.35)' : 'none',
        }}
      >
        {/* Close button inside drawer */}
        <div style={{ position: 'absolute', top: '1rem', left: '-3rem', zIndex: 51 }}>
          <button
            onClick={() => setDrawerOpen(false)}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--surface)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text)',
            }}
          >
            <X size={18} />
          </button>
        </div>
        <NavContent />
      </aside>

      <style>{`
        /* Desktop sidebar shown, mobile elements hidden */
        .nav-sidebar-desktop { display: flex; flex-direction: column; }
        .nav-mobile-topbar   { display: none; }
        .nav-drawer-backdrop { display: none; }
        .nav-drawer-panel    { display: none; }

        @media (max-width: 767px) {
          .nav-sidebar-desktop { display: none !important; }
          .nav-mobile-topbar   { display: flex !important; }
          .nav-drawer-backdrop { display: block !important; }
          .nav-drawer-panel    { display: flex !important; flex-direction: column; }
        }
      `}</style>
    </>
  )
}
