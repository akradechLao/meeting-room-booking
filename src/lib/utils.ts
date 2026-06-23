import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTH(date: Date | string): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const month = months[d.getMonth()];
  const year = d.getFullYear() + 543;
  const hour = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year} ${hour}:${min}`;
}

export function formatTime(date: Date | string): string {
  const d = new Date(date);
  const hour = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${hour}:${min}`;
}

export function formatDateShort(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('th-TH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function toISOStringLocal(date: Date): string {
  const pad = (n: number) => ('0' + n).slice(-2);
  return (
    date.getFullYear() +
    '-' +
    pad(date.getMonth() + 1) +
    '-' +
    pad(date.getDate()) +
    'T' +
    pad(date.getHours()) +
    ':' +
    pad(date.getMinutes())
  );
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'รออนุมัติ',
    approved: 'อนุมัติ',
    rejected: 'ปฏิเสธ',
    cancelled: 'ยกเลิก',
    checked_in: 'เช็คอินแล้ว',
    completed: 'เสร็จสิ้น',
  };
  return labels[status] || status;
}

export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    checked_in: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    completed: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function generateQRUrl(text: string, size: number = 220): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
}

export function generateCsvContent(headers: string[], rows: any[][]): string {
  const escapeCell = (cell: any) => {
    const str = String(cell ?? '');
    if (/[",\n]/.test(str)) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };

  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(row.map(escapeCell).join(','));
  }
  return lines.join('\n');
}
