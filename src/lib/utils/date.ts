/**
 * Timezone-aware date utilities for LifeSync
 */

export function getLocalDateStr(timeZone = 'Asia/Bangkok', date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export function getStartOfDayISO(dateStr: string, timeZone = 'Asia/Bangkok'): string {
  try {
    const tempDate = new Date(`${dateStr}T00:00:00Z`);
    const utcDateStr = tempDate.toLocaleString('en-US', { timeZone: 'UTC' });
    const tzDateStr = tempDate.toLocaleString('en-US', { timeZone });
    const diffMs = new Date(tzDateStr).getTime() - new Date(utcDateStr).getTime();
    return new Date(tempDate.getTime() - diffMs).toISOString();
  } catch {
    const fallback = new Date();
    fallback.setHours(0, 0, 0, 0);
    return fallback.toISOString();
  }
}

export function getEndOfDayISO(dateStr: string, timeZone = 'Asia/Bangkok'): string {
  try {
    const startISO = getStartOfDayISO(dateStr, timeZone);
    const startDate = new Date(startISO);
    return new Date(startDate.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString();
  } catch {
    const fallback = new Date();
    fallback.setHours(23, 59, 59, 999);
    return fallback.toISOString();
  }
}
