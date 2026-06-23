'use client';

import { useState, useEffect } from 'react';
import { formatDateTH, formatTime } from '@/lib/utils';
import Link from 'next/link';
import { LogIn, Monitor } from 'lucide-react';

interface KioskRoom {
  id: string;
  name: string;
  location: string;
  capacity: number;
  color: string;
  isOccupied: boolean;
  current: {
    id: string;
    title: string;
    status: string;
    startAt: string;
    endAt: string;
    userName: string;
  } | null;
  next: {
    id: string;
    title: string;
    status: string;
    startAt: string;
    endAt: string;
    userName: string;
  } | null;
  upcomingCount: number;
}

export default function KioskPage() {
  const [rooms, setRooms] = useState<KioskRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');
  const [clock, setClock] = useState('--:--');

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(
        String(now.getHours()).padStart(2, '0') +
          ':' +
          String(now.getMinutes()).padStart(2, '0')
      );
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      const res = await fetch('/api/kiosk');
      if (res.ok) {
        const data = await res.json();
        setRooms(data.rooms);
        setLastUpdate('อัปเดตล่าสุด ' + formatDateTH(data.ts));
      }
    } catch (error) {
      console.error('Error loading kiosk status:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/50 to-slate-50 text-slate-900">
      <header className="px-6 py-5 flex items-center gap-4 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0">
          <Monitor className="w-6 h-6 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold truncate text-slate-900">Meeting Room · Kiosk</h1>
          <p className="text-sm text-slate-500 truncate">{lastUpdate || 'กำลังโหลด...'}</p>
        </div>
        <div className="ml-auto flex items-center gap-4 shrink-0">
          <div className="text-4xl font-mono font-bold text-indigo-600">{clock}</div>
          <Link
            href="/login"
            className="btn btn-primary"
          >
            <LogIn className="w-4 h-4" /> เข้าระบบ
          </Link>
        </div>
      </header>

      <main className="p-6">
        {loading ? (
          <div className="text-slate-400 col-span-full text-center py-20 text-lg">
            กำลังโหลด...
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-slate-400 col-span-full text-center py-20 text-lg">ยังไม่มีห้อง</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {rooms.map((room) => (
              <div
                key={room.id}
                className={`p-6 rounded-2xl bg-white shadow-md hover:shadow-xl transition-shadow ${
                  room.isOccupied
                    ? 'ring-2 ring-red-200'
                    : 'ring-2 ring-emerald-200'
                }`}
                style={{ borderTop: `5px solid ${room.color}` }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-2xl font-bold leading-tight text-slate-900">{room.name}</div>
                    <div className="text-sm text-slate-500 mt-1">
                      {room.location || ''} · 👥 {room.capacity || 0}
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold shrink-0 ${
                      room.isOccupied
                        ? 'bg-red-100 text-red-600'
                        : 'bg-emerald-100 text-emerald-600'
                    }`}
                  >
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        room.isOccupied ? 'bg-red-400 pulse-red' : 'bg-emerald-400 pulse-blue'
                      }`}
                    ></span>{' '}
                    {room.isOccupied ? 'กำลังใช้งาน' : 'ว่าง'}
                  </span>
                </div>

                {room.current && (
                  <div className="mt-4 p-4 rounded-xl bg-slate-50">
                    <div className="text-xs text-slate-500 font-semibold uppercase tracking-wide">ตอนนี้</div>
                    <div className="font-semibold truncate text-slate-900 mt-1">{room.current.title}</div>
                    <div className="text-sm text-slate-600 mt-1">
                      {room.current.userName || ''} · {formatTime(room.current.startAt)} -{' '}
                      {formatTime(room.current.endAt)}
                    </div>
                  </div>
                )}

                {room.next ? (
                  <div className="mt-3 p-4 rounded-xl bg-slate-50/50">
                    <div className="text-xs text-slate-500 font-semibold uppercase tracking-wide">ถัดไป</div>
                    <div className="font-medium truncate text-slate-700 mt-1">{room.next.title}</div>
                    <div className="text-sm text-slate-500 mt-1">
                      {room.next.userName || ''} · {formatDateTH(room.next.startAt)}
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 p-4 rounded-xl bg-slate-50/30 text-sm text-slate-400">
                    ไม่มีนัดถัดไปวันนี้
                  </div>
                )}

                <div className="text-sm text-slate-500 mt-3 font-medium">
                  นัดวันนี้: {room.upcomingCount}
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-slate-400 text-sm text-center mt-8">
          หน้าจอนี้รีเฟรชอัตโนมัติทุก 30 วินาที
        </p>
      </main>
    </div>
  );
}
