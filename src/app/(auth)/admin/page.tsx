'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { AuthLayout } from '@/components/AuthLayout';
import Link from 'next/link';
import {
  LayoutDashboard,
  Calendar,
  DoorOpen,
  Users,
  Ban,
  Settings,
  FileClock,
} from 'lucide-react';

export default function AdminPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<any>(null);

  const isAdmin = (session?.user as any)?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) {
      router.push('/home');
    }
  }, [isAdmin, router]);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadStats();
    }
  }, [activeTab]);

  const loadStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) setStats(await res.json());
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'bookings', label: 'การจอง', icon: Calendar },
    { id: 'rooms', label: 'ห้อง', icon: DoorOpen },
    { id: 'users', label: 'ผู้ใช้', icon: Users },
    { id: 'blackouts', label: 'Blackouts', icon: Ban },
    { id: 'settings', label: 'ตั้งค่า', icon: Settings },
    { id: 'audit', label: 'Audit', icon: FileClock },
  ];

  return (
    <AuthLayout>
      <div className="flex gap-1 overflow-x-auto no-scrollbar mb-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`tab-btn text-xs sm:text-sm ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-5 card-hover">
              <div className="text-sm text-slate-500">การจองทั้งหมด</div>
              <div className="text-3xl font-bold mt-2 text-slate-900 dark:text-white">{stats?.totalBookings || '-'}</div>
            </div>
            <div className="card p-5 card-hover bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20" style={{ borderLeft: '4px solid #f59e0b' }}>
              <div className="text-sm text-slate-500">รออนุมัติ</div>
              <div className="text-3xl font-bold mt-2 text-amber-500">
                {stats?.pending || '-'}
              </div>
            </div>
            <div className="card p-5 card-hover">
              <div className="text-sm text-slate-500">ผู้ใช้</div>
              <div className="text-3xl font-bold mt-2 text-slate-900 dark:text-white">{stats?.totalUsers || '-'}</div>
            </div>
            <div className="card p-5 card-hover">
              <div className="text-sm text-slate-500">ห้อง</div>
              <div className="text-3xl font-bold mt-2 text-slate-900 dark:text-white">{stats?.totalRooms || '-'}</div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold mb-3 text-slate-900 dark:text-white">Top Users</h3>
            {stats?.topUsers?.length ? (
              stats.topUsers.map((u: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
                  <span className="text-slate-700 dark:text-slate-300">{u.name}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{u.count}</span>
                </div>
              ))
            ) : (
              <div className="text-slate-400 text-sm">-</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'bookings' && <AdminBookings />}
      {activeTab === 'rooms' && <AdminRooms />}
      {activeTab === 'users' && <AdminUsers />}
      {activeTab === 'blackouts' && <AdminBlackouts />}
      {activeTab === 'settings' && <AdminSettings />}
      {activeTab === 'audit' && <AdminAudit />}

      <style jsx>{`
        .tab-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
          white-space: nowrap;
          transition: all 0.2s ease;
        }
        .tab-btn:hover {
          background: #f3f4f6;
          color: #374151;
        }
        .tab-btn.active {
          background: #1a3a8f;
          color: #fff;
          box-shadow: 0 2px 8px rgba(26, 58, 143, 0.2);
        }
      `}</style>
    </AuthLayout>
  );
}

function AdminBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    loadBookings();
  }, [filter]);

  const loadBookings = async () => {
    try {
      const res = await fetch(`/api/bookings?all=true&status=${filter}`);
      if (res.ok) setBookings(await res.json());
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleApprove = async (id: string) => {
    await fetch(`/api/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve' }),
    });
    loadBookings();
  };

  const handleReject = async (id: string) => {
    const reason = prompt('เหตุผลที่ปฏิเสธ (ไม่บังคับ)') || '';
    await fetch(`/api/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject', reason }),
    });
    loadBookings();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h2 className="text-base sm:text-lg font-semibold">จัดการการจอง</h2>
        <select className="input w-auto text-xs sm:text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="pending">รออนุมัติ</option>
          <option value="approved">อนุมัติ</option>
          <option value="">ทั้งหมด</option>
        </select>
      </div>
      <div className="card overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th className="text-xs sm:text-sm">หัวข้อ</th>
              <th className="text-xs sm:text-sm hidden sm:table-cell">ห้อง</th>
              <th className="text-xs sm:text-sm hidden md:table-cell">ผู้จอง</th>
              <th className="text-xs sm:text-sm hidden lg:table-cell">เริ่ม</th>
              <th className="text-xs sm:text-sm hidden lg:table-cell">สิ้นสุด</th>
              <th className="text-xs sm:text-sm">สถานะ</th>
              <th className="text-xs sm:text-sm"></th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id}>
                <td className="font-medium text-xs sm:text-sm">{b.title}</td>
                <td className="hidden sm:table-cell text-xs sm:text-sm">{b.roomName}</td>
                <td className="hidden md:table-cell text-xs sm:text-sm">{b.userName}</td>
                <td className="hidden lg:table-cell text-xs sm:text-sm">{formatDateTH(b.startAt)}</td>
                <td className="hidden lg:table-cell text-xs sm:text-sm">{formatDateTH(b.endAt)}</td>
                <td>
                  <span className={`badge badge-${b.status}`}>{statusLabel(b.status)}</span>
                </td>
                <td>
                  {b.status === 'pending' && (
                    <>
                      <button className="btn btn-success p-2" onClick={() => handleApprove(b.id)}>
                        ✓
                      </button>
                      <button className="btn btn-danger p-2" onClick={() => handleReject(b.id)}>
                        ✕
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminRooms() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    location: '',
    floor: '',
    building: '',
    capacity: 0,
    equipment: '',
    color: '#6366f1',
    active: true,
  });

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const res = await fetch('/api/admin/rooms');
      if (res.ok) setRooms(await res.json());
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const body: any = { ...form };
      if (editingRoom) body.id = editingRoom.id;

      const res = await fetch('/api/admin/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowForm(false);
        setEditingRoom(null);
        loadRooms();
      } else {
        const error = await res.json();
        alert(error.error);
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาด');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`ลบห้อง "${name}" ?`)) return;
    try {
      await fetch(`/api/admin/rooms?id=${id}`, { method: 'DELETE' });
      loadRooms();
    } catch (error) {
      alert('เกิดข้อผิดพลาด');
    }
  };

  const openEdit = (room: any) => {
    setEditingRoom(room);
    setForm({
      name: room.name,
      description: room.description || '',
      location: room.location || '',
      floor: room.floor || '',
      building: room.building || '',
      capacity: room.capacity,
      equipment: room.equipment || '',
      color: room.color,
      active: room.active,
    });
    setShowForm(true);
  };

  const openNew = () => {
    setEditingRoom(null);
    setForm({
      name: '',
      description: '',
      location: '',
      floor: '',
      building: '',
      capacity: 0,
      equipment: '',
      color: '#6366f1',
      active: true,
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h2 className="text-base sm:text-lg font-semibold">จัดการห้อง</h2>
        <button className="btn btn-primary text-xs sm:text-sm" onClick={openNew}>
          + เพิ่มห้อง
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {rooms.map((r) => (
          <div key={r.id} className="card p-4" style={{ borderTop: `4px solid ${r.color}` }}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base sm:text-lg">{r.name}</h3>
              {r.active ? (
                <span className="badge badge-approved">เปิดใช้</span>
              ) : (
                <span className="badge badge-cancelled">ปิด</span>
              )}
            </div>
            {r.description && <div className="text-sm text-navy-500 mt-1">{r.description}</div>}
            <div className="text-sm text-navy-500 mt-1">
              {r.building && <span>{r.building}</span>}
              {r.floor && <span> ชั้น {r.floor}</span>}
              {r.location && <span> ห้อง {r.location}</span>}
            </div>
            <div className="text-sm mt-2">👥 {r.capacity} คน</div>
            <div className="text-sm text-navy-500 mt-1">🛠️ {r.equipment || '-'}</div>
            <div className="flex gap-2 mt-3">
              <button className="btn btn-outline text-xs sm:text-sm" onClick={() => openEdit(r)}>
                แก้ไข
              </button>
              <button className="btn btn-ghost text-red-500" onClick={() => handleDelete(r.id, r.name)}>
                🗑
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-navy-950/60 z-50 flex items-center justify-center p-4">
          <div className="card p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-3">{editingRoom ? 'แก้ไข' : 'เพิ่ม'}ห้อง</h3>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="text-sm">ชื่อห้อง</label>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm">คำอธิบาย</label>
                <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="รายละเอียดห้องประชุม" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm">อาคาร</label>
                  <input className="input" value={form.building} onChange={(e) => setForm({ ...form, building: e.target.value })} placeholder="อาคาร A" />
                </div>
                <div>
                  <label className="text-sm">ชั้น</label>
                  <input className="input" value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} placeholder="ชั้น 3" />
                </div>
              </div>
              <div>
                <label className="text-sm">ที่ตั้ง</label>
                <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="ห้อง 301" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm">ความจุ (คน)</label>
                  <input type="number" className="input" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="text-sm">สี</label>
                  <input type="color" className="input h-10" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-sm">อุปกรณ์</label>
                <input className="input" value={form.equipment} onChange={(e) => setForm({ ...form, equipment: e.target.value })} placeholder="TV, Projector, Whiteboard" />
              </div>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> เปิดใช้งาน
              </label>
              <div className="flex gap-2">
                <button className="btn btn-primary flex-1" type="submit">บันทึก</button>
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [form, setForm] = useState({
    username: '',
    name: '',
    email: '',
    role: 'user',
    password: '',
    telegramChatId: '',
    active: true,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) setUsers(await res.json());
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const body: any = { ...form };
      if (editingUser) body.id = editingUser.id;
      if (!form.password && editingUser) delete body.password;

      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowForm(false);
        setEditingUser(null);
        loadUsers();
      } else {
        const error = await res.json();
        alert(error.error);
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาด');
    }
  };

  const handleDelete = async (id: string, username: string) => {
    if (!confirm(`ลบผู้ใช้ "${username}" ?`)) return;
    try {
      await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
      loadUsers();
    } catch (error) {
      alert('เกิดข้อผิดพลาด');
    }
  };

  const openEdit = (user: any) => {
    setEditingUser(user);
    setForm({
      username: user.username,
      name: user.name,
      email: user.email || '',
      role: user.role,
      password: '',
      telegramChatId: user.telegramChatId || '',
      active: user.active,
    });
    setShowForm(true);
  };

  const openNew = () => {
    setEditingUser(null);
    setForm({
      username: '',
      name: '',
      email: '',
      role: 'user',
      password: '',
      telegramChatId: '',
      active: true,
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h2 className="text-base sm:text-lg font-semibold">จัดการผู้ใช้</h2>
        <button className="btn btn-primary text-xs sm:text-sm" onClick={openNew}>
          + เพิ่มผู้ใช้
        </button>
      </div>
      <div className="card overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th className="text-xs sm:text-sm">ชื่อ</th>
              <th className="text-xs sm:text-sm">Username</th>
              <th className="text-xs sm:text-sm hidden sm:table-cell">Email</th>
              <th className="text-xs sm:text-sm">Role</th>
              <th className="text-xs sm:text-sm">สถานะ</th>
              <th className="text-xs sm:text-sm"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="text-xs sm:text-sm">{u.name}</td>
                <td className="text-xs sm:text-sm">{u.username}</td>
                <td className="hidden sm:table-cell text-xs sm:text-sm">{u.email || ''}</td>
                <td>
                  <span className={`badge ${u.role === 'admin' ? 'badge-approved' : 'badge-cancelled'}`}>
                    {u.role}
                  </span>
                </td>
                <td>
                  <span className={`badge ${u.active ? 'badge-approved' : 'badge-rejected'}`}>
                    {u.active ? 'active' : 'disabled'}
                  </span>
                </td>
                <td className="whitespace-nowrap text-right">
                  <button className="btn btn-ghost p-2" onClick={() => openEdit(u)}>✎</button>
                  <button className="btn btn-ghost p-2 text-red-500" onClick={() => handleDelete(u.id, u.username)}>🗑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-navy-950/60 z-50 flex items-center justify-center p-4">
          <div className="card p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-3">{editingUser ? 'แก้ไข' : 'เพิ่ม'}ผู้ใช้</h3>
            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm">ชื่อ</label>
                  <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div>
                  <label className="text-sm">Username</label>
                  <input className="input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
                </div>
              </div>
              <div>
                <label className="text-sm">Email</label>
                <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm">Role</label>
                  <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm">Telegram Chat ID</label>
                  <input className="input" value={form.telegramChatId} onChange={(e) => setForm({ ...form, telegramChatId: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-sm">รหัสผ่าน {editingUser ? '(เว้นว่างถ้าไม่เปลี่ยน)' : ''}</label>
                <input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} {...(!editingUser ? { required: true, minLength: 4 } : {})} />
              </div>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active
              </label>
              <div className="flex gap-2">
                <button className="btn btn-primary flex-1" type="submit">บันทึก</button>
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminBlackouts() {
  const [blackouts, setBlackouts] = useState<any[]>([]);

  useEffect(() => {
    loadBlackouts();
  }, []);

  const loadBlackouts = async () => {
    try {
      const res = await fetch('/api/admin/blackouts');
      if (res.ok) setBlackouts(await res.json());
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-base sm:text-lg font-semibold">Blackout (วันหยุด/งดให้บริการ)</h2>
      </div>
      <div className="card overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th className="text-xs sm:text-sm">ห้อง</th>
              <th className="text-xs sm:text-sm">เริ่ม</th>
              <th className="text-xs sm:text-sm hidden sm:table-cell">สิ้นสุด</th>
              <th className="text-xs sm:text-sm hidden md:table-cell">เหตุผล</th>
            </tr>
          </thead>
          <tbody>
            {blackouts.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-6 text-navy-400">
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminSettings() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const settingDefs = [
    { key: 'system_name', label: 'ชื่อระบบ' },
    { key: 'org_name', label: 'องค์กร' },
    { key: 'theme_default', label: 'Theme เริ่มต้น (light/dark)' },
    { key: 'auto_approve', label: 'อนุมัติอัตโนมัติ (true/false)' },
    { key: 'min_duration_min', label: 'ระยะเวลาขั้นต่ำ (นาที)' },
    { key: 'max_duration_min', label: 'ระยะเวลาสูงสุด (นาที)' },
    { key: 'allow_booking_days_ahead', label: 'จองล่วงหน้าได้กี่วัน' },
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) setSettings(await res.json());
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const items = settingDefs.map((s) => ({
      key: s.key,
      value: settings.find((st) => st.key === s.key)?.value || '',
    }));

    try {
      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      alert('บันทึกแล้ว');
    } catch (error) {
      alert('เกิดข้อผิดพลาด');
    }
  };

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => {
      const existing = prev.find((s) => s.key === key);
      if (existing) {
        return prev.map((s) => (s.key === key ? { ...s, value } : s));
      }
      return [...prev, { key, value }];
    });
  };

  if (loading) return <div className="skeleton h-64"></div>;

  return (
    <div className="card p-4 max-w-2xl">
      <h3 className="font-semibold mb-4">ตั้งค่าระบบ</h3>
      <div className="space-y-3">
        {settingDefs.map((s) => (
          <div key={s.key}>
            <label className="text-xs sm:text-sm font-medium">{s.label}</label>
            <input
              className="input mt-1"
              value={settings.find((st) => st.key === s.key)?.value || ''}
              onChange={(e) => updateSetting(s.key, e.target.value)}
            />
          </div>
        ))}
      </div>
      <button className="btn btn-primary mt-4" onClick={handleSave}>
        บันทึก
      </button>
    </div>
  );
}

function AdminAudit() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const res = await fetch('/api/admin/audit?limit=100');
      if (res.ok) setLogs(await res.json());
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
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
  );
}

function formatDateTH(date: Date | string): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const month = months[d.getMonth()];
  const year = d.getFullYear() + 543;
  const hour = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year} ${hour}:${min}`;
}

function statusLabel(status: string): string {
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
