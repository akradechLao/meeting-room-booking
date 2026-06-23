'use client';

import { AuthLayout } from '@/components/AuthLayout';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Plus, Repeat, QrCode, Filter, RotateCcw } from 'lucide-react';
import { formatDateTH, statusLabel, statusColor, generateQRUrl } from '@/lib/utils';
import { DateTimePicker } from '@/components/DateTimePicker';

interface Room {
  id: string;
  name: string;
  location: string;
  capacity: number;
  equipment: string;
  color: string;
}

interface Booking {
  id: string;
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  status: string;
  roomId: string;
  roomName: string;
  roomColor: string;
  qrToken: string;
}

export default function HomePage() {
  const { data: session } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    roomId: '',
    status: '',
    from: '',
    to: '',
  });

  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    roomId: '',
    title: '',
    description: '',
    startAt: '',
    endAt: '',
  });

  const [showCheckinForm, setShowCheckinForm] = useState(false);
  const [qrToken, setQrToken] = useState('');

  const [showQR, setShowQR] = useState<Booking | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [roomsRes, bookingsRes] = await Promise.all([
        fetch('/api/rooms'),
        fetch('/api/bookings'),
      ]);

      if (roomsRes.ok) setRooms(await roomsRes.json());
      if (bookingsRes.ok) setBookings(await bookingsRes.json());
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...bookingForm,
          startAt: new Date(bookingForm.startAt).toISOString(),
          endAt: new Date(bookingForm.endAt).toISOString(),
        }),
      });

      if (res.ok) {
        setShowBookingForm(false);
        setBookingForm({ roomId: '', title: '', description: '', startAt: '', endAt: '' });
        loadData();
      } else {
        const error = await res.json();
        alert(error.error);
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาด');
    }
  };

  const handleCheckIn = async () => {
    try {
      const res = await fetch('/api/bookings/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrToken }),
      });

      if (res.ok) {
        alert('เช็คอินสำเร็จ');
        setShowCheckinForm(false);
        setQrToken('');
        loadData();
      } else {
        const error = await res.json();
        alert(error.error);
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาด');
    }
  };

  const handleCheckOut = async () => {
    try {
      const res = await fetch('/api/bookings/check-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrToken }),
      });

      if (res.ok) {
        alert('เช็คเอาท์สำเร็จ');
        setShowCheckinForm(false);
        setQrToken('');
        loadData();
      } else {
        const error = await res.json();
        alert(error.error);
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาด');
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('ยกเลิกการจองนี้?')) return;
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });

      if (res.ok) {
        loadData();
      } else {
        const error = await res.json();
        alert(error.error);
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาด');
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (filters.roomId && b.roomId !== filters.roomId) return false;
    if (filters.status && b.status !== filters.status) return false;
    if (filters.from && new Date(b.endAt) < new Date(filters.from)) return false;
    if (filters.to && new Date(b.startAt) > new Date(filters.to + 'T23:59')) return false;
    return true;
  });

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === 'pending').length,
    today: bookings.filter((b) => {
      const d = new Date(b.startAt);
      const today = new Date();
      return d.toDateString() === today.toDateString();
    }).length,
    upcoming: bookings.filter(
      (b) =>
        new Date(b.startAt) > new Date() &&
        !['cancelled', 'rejected'].includes(b.status)
    ).length,
  };

  if (loading) {
    return (
      <AuthLayout>
        <div className="space-y-4">
          <div className="skeleton h-12 w-64"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-24"></div>
            ))}
          </div>
          <div className="skeleton h-64"></div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      {/* Greeting + actions */}
      <section className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">
            สวัสดี {(session?.user as any)?.name || 'ผู้ใช้'} 👋
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">จัดการการจองห้องประชุมของคุณได้ที่นี่</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-primary" onClick={() => setShowBookingForm(true)}>
            <Plus className="w-4 h-4" /> จองใหม่
          </button>
          <button className="btn btn-outline" onClick={() => setShowCheckinForm(true)}>
            <QrCode className="w-4 h-4" /> Check-in/out
          </button>
        </div>
      </section>

      {/* Stat cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 card-hover">
          <div className="text-sm text-slate-500 font-medium">การจองทั้งหมด</div>
          <div className="text-3xl font-bold mt-2 text-slate-900 dark:text-white">{stats.total}</div>
        </div>
        <div className="card p-5 card-hover bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="text-sm text-slate-500 font-medium">รออนุมัติ</div>
          <div className="text-3xl font-bold mt-2 text-amber-500">{stats.pending}</div>
        </div>
        <div className="card p-5 card-hover bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="text-sm text-slate-500 font-medium">วันนี้</div>
          <div className="text-3xl font-bold mt-2 text-emerald-500">{stats.today}</div>
        </div>
        <div className="card p-5 card-hover bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20" style={{ borderLeft: '4px solid #6366f1' }}>
          <div className="text-sm text-slate-500 font-medium">กำลังจะมา</div>
          <div className="text-3xl font-bold mt-2 text-indigo-500">{stats.upcoming}</div>
        </div>
      </section>

      {/* Filter */}
      <section className="card p-5 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[160px]">
          <label className="text-sm font-semibold text-slate-600 block mb-2">ห้อง</label>
          <select
            className="input"
            value={filters.roomId}
            onChange={(e) => setFilters({ ...filters, roomId: e.target.value })}
          >
            <option value="">ทั้งหมด</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[140px]">
          <label className="text-sm font-semibold text-slate-600 block mb-2">สถานะ</label>
          <select
            className="input"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">ทั้งหมด</option>
            <option value="pending">รออนุมัติ</option>
            <option value="approved">อนุมัติ</option>
            <option value="checked_in">เช็คอินแล้ว</option>
            <option value="completed">เสร็จสิ้น</option>
            <option value="cancelled">ยกเลิก</option>
            <option value="rejected">ปฏิเสธ</option>
          </select>
        </div>
        <div className="min-w-[140px]">
          <label className="text-sm font-semibold text-slate-600 block mb-2">ตั้งแต่</label>
          <input
            type="date"
            className="input"
            value={filters.from}
            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
          />
        </div>
        <div className="min-w-[140px]">
          <label className="text-sm font-semibold text-slate-600 block mb-2">ถึง</label>
          <input
            type="date"
            className="input"
            value={filters.to}
            onChange={(e) => setFilters({ ...filters, to: e.target.value })}
          />
        </div>
        <button
          className="btn btn-ghost text-xs sm:text-sm"
          onClick={() => setFilters({ roomId: '', status: '', from: '', to: '' })}
        >
          <RotateCcw className="w-4 h-4" /> รีเซ็ต
        </button>
      </section>

      {/* Bookings list */}
      <section className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <h2 className="font-bold text-gray-900">การจองของฉัน</h2>
        </div>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th className="text-slate-600">ห้อง</th>
                <th className="text-slate-600">หัวข้อ</th>
                <th className="text-slate-600 hidden sm:table-cell">เริ่ม</th>
                <th className="text-slate-600 hidden sm:table-cell">สิ้นสุด</th>
                <th className="text-slate-600">สถานะ</th>
                <th className="text-slate-600"></th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    ยังไม่มีการจอง
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="inline-block w-3 h-3 rounded-full"
                          style={{ background: b.roomColor }}
                        ></span>
                        <span>{b.roomName}</span>
                      </span>
                    </td>
                    <td>
                      <div className="font-medium">{b.title}</div>
                      <div className="text-xs text-slate-400 sm:hidden">{formatDateTH(b.startAt)}</div>
                    </td>
                    <td className="hidden sm:table-cell">{formatDateTH(b.startAt)}</td>
                    <td className="hidden sm:table-cell">{formatDateTH(b.endAt)}</td>
                    <td>
                      <span className={`badge badge-${b.status}`}>{statusLabel(b.status)}</span>
                    </td>
                    <td className="text-right whitespace-nowrap">
                      {b.status === 'approved' && (
                        <button
                          className="btn btn-ghost p-2"
                          title="QR Check-in"
                          onClick={() => setShowQR(b)}
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                      )}
                      {['pending', 'approved'].includes(b.status) && (
                        <button
                          className="btn btn-ghost p-2 text-red-500"
                          title="ยกเลิก"
                          onClick={() => handleCancel(b.id)}
                        >
                          ✕
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Booking Form Modal */}
      {showBookingForm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-6 sm:p-8 max-w-md w-full max-h-[92vh] overflow-y-auto shadow-2xl">
            <h3 className="text-xl font-bold mb-5 text-slate-900">จองห้องใหม่</h3>
            <form onSubmit={handleBookingSubmit} className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-slate-600 block mb-2">ห้อง</label>
                <select
                  className="input mt-1"
                  value={bookingForm.roomId}
                  onChange={(e) => setBookingForm({ ...bookingForm, roomId: e.target.value })}
                  required
                >
                  <option value="">เลือกห้อง</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.capacity} คน)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600 block mb-2">หัวข้อ</label>
                <input
                  className="input mt-1"
                  placeholder="เช่น ประชุมทีม Marketing"
                  value={bookingForm.title}
                  onChange={(e) => setBookingForm({ ...bookingForm, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600 block mb-2">รายละเอียด</label>
                <textarea
                  rows={2}
                  className="input mt-1"
                  placeholder="(ไม่บังคับ)"
                  value={bookingForm.description}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, description: e.target.value })
                  }
                />
              </div>
              <DateTimePicker
                label="เริ่ม"
                value={bookingForm.startAt}
                onChange={(v) => setBookingForm({ ...bookingForm, startAt: v })}
                required
              />
              <DateTimePicker
                label="สิ้นสุด"
                value={bookingForm.endAt}
                onChange={(v) => setBookingForm({ ...bookingForm, endAt: v })}
                required
              />
              <div className="flex gap-2 mt-2">
                <button className="btn btn-primary flex-1" type="submit">
                  ยืนยันจอง
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowBookingForm(false)}
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Check-in/out Modal */}
      {showCheckinForm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-3 text-slate-900">Check-in / Check-out</h3>
            <p className="text-sm text-slate-500 mb-4">
              วาง QR หรือพิมพ์รหัสที่ปรากฏใต้ QR ของการจอง
            </p>
            <input
              className="input"
              placeholder="QR token เช่น abc123..."
              value={qrToken}
              onChange={(e) => setQrToken(e.target.value)}
            />
            <div className="flex gap-2 mt-4">
              <button className="btn btn-success flex-1" onClick={handleCheckIn}>
                เช็คอิน
              </button>
              <button className="btn btn-warning flex-1" onClick={handleCheckOut}>
                เช็คเอาท์
              </button>
              <button className="btn btn-outline" onClick={() => setShowCheckinForm(false)}>
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-6 sm:p-8 max-w-md w-full text-center shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900">{showQR.title}</h3>
            <p className="text-sm text-slate-500 mb-4">
              {showQR.roomName} · {formatDateTH(showQR.startAt)}
            </p>
            <img
              src={generateQRUrl(showQR.qrToken, 240)}
              alt="QR"
              className="mx-auto rounded-2xl border border-slate-100"
            />
            <div className="font-mono text-sm mt-4 text-slate-600 bg-slate-50 p-3 rounded-xl break-all">{showQR.qrToken}</div>
            <p className="text-xs text-slate-400 mt-3">
              สแกน QR เพื่อ Check-in / Check-out ที่หน้าห้อง
            </p>
            <div className="flex justify-center gap-2 mt-5">
              <button className="btn btn-outline" onClick={() => setShowQR(null)}>
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
