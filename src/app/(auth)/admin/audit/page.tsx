'use client';

import { useState, useEffect } from 'react';
import { AuthLayout } from '@/components/AuthLayout';
import { formatDateTH } from '@/lib/utils';

interface AuditLog {
  id: string;
  ts: string;
  userId: string;
  userName: string;
  action: string;
  target: string;
  details: string;
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const res = await fetch('/api/admin/audit?limit=200');
      if (res.ok) setLogs(await res.json());
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AuthLayout>
        <div className="skeleton h-64"></div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="card overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th className="text-xs sm:text-sm">เวลา</th>
              <th className="text-xs sm:text-sm">ผู้ใช้</th>
              <th className="text-xs sm:text-sm">Action</th>
              <th className="text-xs sm:text-sm hidden sm:table-cell">Target</th>
              <th className="text-xs sm:text-sm hidden md:table-cell">รายละเอียด</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-6 text-navy-400">
                  ยังไม่มี
                </td>
              </tr>
            ) : (
              logs.map((a) => (
                <tr key={a.id}>
                  <td className="whitespace-nowrap text-xs">{formatDateTH(a.ts)}</td>
                  <td className="text-xs sm:text-sm">{a.userName || a.userId}</td>
                  <td>
                    <span className="badge badge-cancelled">{a.action}</span>
                  </td>
                  <td className="hidden sm:table-cell font-mono text-xs">{a.target || ''}</td>
                  <td className="hidden md:table-cell text-xs text-navy-400">{a.details || ''}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AuthLayout>
  );
}
