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
  userName?: string;
  username?: string;
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
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [allBookingsFilter, setAllBookingsFilter] = useState({ roomId: '', date: '' });

  useEffect(() => {
    loadData();
    loadAllBookings();
  }, []);

  const loadData = async () => {
    try {
      const [roomsRes, bookingsRes] = await Promise.all([
        fetch('/api/rooms'),
        fetch('/api/bookings'),
      ]);

      if (roomsRes.ok) setRooms(await roomsRes.json());
      if (bookingsRes.ok) setBookings(await bookingsRes.json());
      loadAllBookings();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllBookings = async () => {
    try {
      const res = await fetch('/api/bookings/all');
      if (res.ok) setAllBookings(await res.json());
    } catch (error) {
      console.error('Error loading all bookings:', error);
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

  const filteredAllBookings = allBookings.filter((b) => {
    if (allBookingsFilter.roomId && b.roomId !== allBookingsFilter.roomId) return false;
    if (allBookingsFilter.date) {
      const bookingDate = new Date(b.startAt).toISOString().split('T')[0];
      if (bookingDate !== allBookingsFilter.date) return false;
    }
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
      <section className="card p-4 sm:p-5 flex flex-wrap gap-3 sm:gap-4 items-end">
        <div className="flex-1 min-w-[160px]">
          <label className="text-sm font-semibold text-slate-600 block mb-2">ห้อง</label>
          <select
            className="input py-2 sm:py-2.5 text-sm sm:text-base"
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
        <div className="w-full sm:flex-1 min-w-[140px]">
          <label className="text-sm font-semibold text-slate-600 block mb-2">สถานะ</label>
          <select
            className="input py-2 sm:py-2.5 text-sm sm:text-base w-full"
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
        <div className="w-full sm:flex-1 min-w-[140px]">
          <label className="text-sm font-semibold text-slate-600 block mb-2">ตั้งแต่</label>
          <input
            type="date"
            className="input py-2 sm:py-2.5 text-sm sm:text-base w-full"
            value={filters.from}
            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
          />
        </div>
        <div className="w-full sm:flex-1 min-w-[140px]">
          <label className="text-sm font-semibold text-slate-600 block mb-2">ถึง</label>
          <input
            type="date"
            className="input py-2 sm:py-2.5 text-sm sm:text-base w-full"
            value={filters.to}
            onChange={(e) => setFilters({ ...filters, to: e.target.value })}
          />
        </div>
        <button
          className="btn btn-ghost text-xs sm:text-sm px-4 py-2.5 sm:px-5 sm:py-3 mt-2 sm:mt-0 w-full sm:w-auto"
          onClick={() => setFilters({ roomId: '', status: '', from: '', to: '' })}
        >
          <RotateCcw className="w-4 h-4 mr-1" /> รีเซ็ต
        </button>
      </section>

      {/* Bookings list - Mobile Card View */}
      <section className="card overflow-hidden">
        <div className="px-4 py-4 sm:px-5 sm:py-4 border-b border-gray-100 flex items-center gap-2">
          <h2 className="font-bold text-gray-900 text-lg sm:text-xl">การจองของฉัน</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="text-slate-600 px-4 py-3 text-left">ห้อง</th>
                <th className="text-slate-600 px-4 py-3 text-left">หัวข้อ</th>
                <th className="text-slate-600 px-4 py-3 text-left hidden sm:table-cell">เริ่ม</th>
                <th className="text-slate-600 px-4 py-3 text-left hidden sm:table-cell">สิ้นสุด</th>
                <th className="text-slate-600 px-4 py-3 text-left">สถานะ</th>
                <th className="text-slate-600 px-4 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 px-4">
                    ยังไม่มีการจอง
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b.id} className="border-b border-gray-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="inline-block w-3 h-3 rounded-full"
                          style={{ background: b.roomColor }}
                        ></span>
                        <span className="text-sm sm:text-base font-medium">{b.roomName}</span>
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-sm sm:text-base">{b.title}</div>
                      <div className="text-xs text-slate-400 sm:hidden mt-1">{formatDateTH(b.startAt)}</div>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell text-sm">{formatDateTH(b.startAt)}</td>
                    <td className="px-4 py-4 hidden sm:table-cell text-sm">{formatDateTH(b.endAt)}</td>
                    <td className="px-4 py-4">
                      <span className={`badge badge-${b.status} text-xs sm:text-sm`}>{statusLabel(b.status)}</span>
                    </td>
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      {b.status === 'approved' && (
                        <button
                          className="btn btn-ghost p-2 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center"
                          title="QR Check-in"
                          onClick={() => setShowQR(b)}
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                      )}
                      {['pending', 'approved'].includes(b.status) && (
                        <button
                          className="btn btn-ghost p-2 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-red-500"
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
        
        {/* Mobile Card View (shown only on mobile) */}
        <div className="block sm:hidden space-y-3 p-4">
          {filteredBookings.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              ยังไม่มีการจอง
            </div>
          ) : (
            filteredBookings.map((b) => (
              <div
                key={`mobile-${b.id}`}
                className="card p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block w-3 h-3 rounded-full"
                      style={{ background: b.roomColor }}
                    ></span>
                    <span className="font-semibold text-sm">{b.roomName}</span>
                  </div>
                  <span className={`badge badge-${b.status} text-xs`}>{statusLabel(b.status)}</span>
                </div>
                <div className="space-y-2">
                  <div className="font-medium">{b.title}</div>
                  <div className="text-xs text-slate-500">
                    {formatDateTH(b.startAt)} - {formatDateTH(b.endAt)}
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                    {b.status === 'approved' && (
                      <button
                        className="btn btn-primary btn-sm flex-1"
                        onClick={() => setShowQR(b)}
                      >
                        <QrCode className="w-3 h-3 mr-1" /> Check-in
                      </button>
                    )}
                    {['pending', 'approved'].includes(b.status) && (
                      <button
                        className="btn btn-outline btn-sm text-red-500 flex-1"
                        onClick={() => handleCancel(b.id)}
                      >
                        ยกเลิก
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* All Bookings - ดูการจองทั้งหมด */}
      <section className="card overflow-hidden">
        <div className="px-4 py-4 sm:px-5 sm:py-4 border-b border-gray-100 flex items-center gap-2">
          <h2 className="font-bold text-gray-900 text-lg sm:text-xl">การจองทั้งหมด (ทุกคน)</h2>
        </div>
        <div className="px-4 py-3 sm:px-5 sm:py-3 border-b border-gray-100 flex flex-col sm:flex-row gap-3 sm:gap-4 items-end">
          <div className="w-full sm:flex-1 min-w-[160px]">
            <label className="text-sm font-semibold text-slate-600 block mb-1">ห้อง</label>
            <select
              className="input text-sm sm:text-base w-full"
              value={allBookingsFilter.roomId}
              onChange={(e) => setAllBookingsFilter({ ...allBookingsFilter, roomId: e.target.value })}
            >
              <option value="">ทั้งหมด</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div className="w-full sm:flex-1 min-w-[140px]">
            <label className="text-sm font-semibold text-slate-600 block mb-1">วันที่</label>
            <input
              type="date"
              className="input text-sm sm:text-base w-full"
              value={allBookingsFilter.date}
              onChange={(e) => setAllBookingsFilter({ ...allBookingsFilter, date: e.target.value })}
            />
          </div>
          <button
            className="btn btn-ghost text-xs sm:text-sm px-4 py-2.5 sm:px-5 w-full sm:w-auto"
            onClick={() => setAllBookingsFilter({ roomId: '', date: '' })}
          >
            ล้างตัวกรอง
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="text-slate-600 px-4 py-3 text-left text-xs sm:text-sm">วัน/เวลา</th>
                <th className="text-slate-600 px-4 py-3 text-left text-xs sm:text-sm">ห้อง</th>
                <th className="text-slate-600 px-4 py-3 text-left text-xs sm:text-sm">หัวข้อ</th>
                <th className="text-slate-600 px-4 py-3 text-left text-xs sm:text-sm hidden sm:table-cell">ผู้จอง</th>
                <th className="text-slate-600 px-4 py-3 text-left text-xs sm:text-sm hidden md:table-cell">รายละเอียด</th>
                <th className="text-slate-600 px-4 py-3 text-left text-xs sm:text-sm">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {filteredAllBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 px-4">
                    ยังไม่มีการจอง
                  </td>
                </tr>
              ) : (
                filteredAllBookings.map((b) => (
                  <tr key={b.id} className="border-b border-gray-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm">{formatDateTH(b.startAt)}</div>
                      <div className="text-xs text-slate-400">ถึง {formatDateTH(b.endAt)}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-2">
                        <span className="inline-block w-3 h-3 rounded-full" style={{ background: b.roomColor }}></span>
                        <span className="text-sm">{b.roomName}</span>
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-sm">{b.title}</div>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell text-sm">{b.userName || '-'}</td>
                    <td className="px-4 py-4 hidden md:table-cell text-sm text-slate-500">{b.description || '-'}</td>
                    <td className="px-4 py-4">
                      <span className={`badge badge-${b.status} text-xs sm:text-sm`}>{statusLabel(b.status)}</span>
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
