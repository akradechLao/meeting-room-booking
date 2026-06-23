'use client';

import { useState, useEffect } from 'react';
import { AuthLayout } from '@/components/AuthLayout';
import { formatDateTH } from '@/lib/utils';
import { DateTimePicker } from '@/components/DateTimePicker';

interface Blackout {
  id: string;
  roomId: string;
  roomName: string;
  startAt: string;
  endAt: string;
  reason: string;
}

interface Room {
  id: string;
  name: string;
}

export default function AdminBlackoutsPage() {
  const [blackouts, setBlackouts] = useState<Blackout[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    roomId: '*',
    startAt: '',
    endAt: '',
    reason: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [blackoutsRes, roomsRes] = await Promise.all([
        fetch('/api/admin/blackouts'),
        fetch('/api/admin/rooms'),
      ]);
      if (blackoutsRes.ok) setBlackouts(await blackoutsRes.json());
      if (roomsRes.ok) setRooms(await roomsRes.json());
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/blackouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: form.roomId,
          startAt: new Date(form.startAt).toISOString(),
          endAt: new Date(form.endAt).toISOString(),
          reason: form.reason,
        }),
      });

      if (res.ok) {
        setShowForm(false);
        loadData();
      } else {
        const error = await res.json();
        alert(error.error);
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาด');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ลบ Blackout นี้?')) return;
    try {
      await fetch(`/api/admin/blackouts?id=${id}`, { method: 'DELETE' });
      loadData();
    } catch (error) {
      alert('เกิดข้อผิดพลาด');
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
      <div className="flex flex-wrap justify-between items-center gap-3 mb-3">
        <h2 className="text-base sm:text-lg font-semibold">Blackout (วันหยุด/งดให้บริการ)</h2>
        <button className="btn btn-primary text-xs sm:text-sm" onClick={() => setShowForm(true)}>
          + เพิ่ม
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th className="text-xs sm:text-sm">ห้อง</th>
              <th className="text-xs sm:text-sm">เริ่ม</th>
              <th className="text-xs sm:text-sm hidden sm:table-cell">สิ้นสุด</th>
              <th className="text-xs sm:text-sm hidden md:table-cell">เหตุผล</th>
              <th className="text-xs sm:text-sm"></th>
            </tr>
          </thead>
          <tbody>
            {blackouts.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-6 text-navy-400">
                  ยังไม่มี
                </td>
              </tr>
            ) : (
              blackouts.map((b) => (
                <tr key={b.id}>
                  <td className="text-xs sm:text-sm">{b.roomName}</td>
                  <td className="text-xs sm:text-sm">{formatDateTH(b.startAt)}</td>
                  <td className="hidden sm:table-cell text-xs sm:text-sm">{formatDateTH(b.endAt)}</td>
                  <td className="hidden md:table-cell text-xs sm:text-sm">{b.reason || ''}</td>
                  <td className="text-right">
                    <button
                      className="btn btn-ghost p-2 text-red-500"
                      onClick={() => handleDelete(b.id)}
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-navy-950/60 z-50 flex items-center justify-center p-4">
          <div className="card p-5 sm:p-6 max-w-md w-full">
            <h3 className="text-base sm:text-lg font-bold mb-3">เพิ่ม Blackout</h3>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="text-xs sm:text-sm font-semibold text-navy-700">ห้อง</label>
                <select
                  className="input"
                  value={form.roomId}
                  onChange={(e) => setForm({ ...form, roomId: e.target.value })}
                >
                  <option value="*">(ทุกห้อง)</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <DateTimePicker
                label="เริ่ม"
                value={form.startAt}
                onChange={(v) => setForm({ ...form, startAt: v })}
                required
              />
              <DateTimePicker
                label="สิ้นสุด"
                value={form.endAt}
                onChange={(v) => setForm({ ...form, endAt: v })}
                required
              />
              <div>
                <label className="text-xs sm:text-sm font-semibold text-navy-700">เหตุผล</label>
                <input
                  className="input"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <button className="btn btn-primary flex-1" type="submit">
                  บันทึก
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowForm(false)}
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
