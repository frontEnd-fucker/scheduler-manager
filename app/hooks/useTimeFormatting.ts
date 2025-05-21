'use client'

/**
 * Formats a date string or Date object to HH:MM format
 */
export function formatTime(dateString: Date | string): string {
  const date = new Date(dateString)
  return date.toTimeString().substring(0, 5) // return HH:MM format
} 