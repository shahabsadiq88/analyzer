import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merges Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format a date to Asia/Karachi timezone */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en-PK', {
    timeZone: 'Asia/Karachi',
    ...options,
  }).format(new Date(date))
}

/** Format duration in seconds to "Xh Ym" or "Ym Zs" */
export function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0s'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

/** Format minutes to a readable string */
export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

/** Calculate remaining seconds until a deadline */
export function getRemainingSeconds(serverDeadline: Date | string): number {
  const deadline = new Date(serverDeadline).getTime()
  const now = Date.now()
  return Math.max(0, Math.floor((deadline - now) / 1000))
}

/** Calculate percentage */
export function calculatePercentage(obtained: number, total: number): number {
  if (total === 0) return 0
  return Math.round((obtained / total) * 100 * 100) / 100
}

/** Shuffle an array (Fisher-Yates) */
export function shuffleArray<T>(array: T[], seed?: string): T[] {
  const arr = [...array]
  // For reproducible shuffling, use a simple seeded random
  // In production, use a proper seeded PRNG
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** Truncate text to a max length */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

/** Get initials from a full name */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/** Check if a test window is currently active */
export function isTestWindowActive(windowStart: Date | null, windowEnd: Date | null): boolean {
  if (!windowStart || !windowEnd) return true // Practice test
  const now = new Date()
  return now >= new Date(windowStart) && now <= new Date(windowEnd)
}

/** Get grade label from percentage */
export function getGrade(percentage: number): { label: string; color: string } {
  if (percentage >= 85) return { label: 'Excellent', color: 'text-emerald-500' }
  if (percentage >= 70) return { label: 'Good', color: 'text-blue-500' }
  if (percentage >= 50) return { label: 'Pass', color: 'text-amber-500' }
  return { label: 'Fail', color: 'text-red-500' }
}
