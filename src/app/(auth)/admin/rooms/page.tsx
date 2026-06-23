'use client';

import { useState, useEffect } from 'react';
import { AuthLayout } from '@/components/AuthLayout';

interface Room {
  id: string;
  name: string;
  description: string;
  location: string;
  floor: string;
  building: string;
  capacity: number;
  equipment: string;
  color: string;
  active: boolean;
}

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
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
    } finally {
      setLoading(false);
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

  const openEdit = (room: Room) => {
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
        <h2 className="text-base sm:text-lg font-semibold">จัดการห้อง</h2>
        <button className="btn btn-primary text-xs sm:text-sm" onClick={openNew}>
          + เพิ่มห้อง
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {rooms.map((r) => (
          <div key={r.id} className="card p-4 relative" style={{ borderTop: `4px solid ${r.color}` }}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base sm:text-lg">{r.name}</h3>
              {r.active ? (
                <span className="badge badge-approved">เปิดใช้</span>
              ) : (
                <span className="badge badge-cancelled">ปิด</span>
              )}
            </div>
            {r.description && (
              <div className="text-sm text-navy-500 mt-1">{r.description}</div>
            )}
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
              <button
                className="btn btn-ghost text-red-500"
                onClick={() => handleDelete(r.id, r.name)}
              >
                🗑
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-navy-950/60 z-50 flex items-center justify-center p-4">
          <div className="card p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-3">
              {editingRoom ? 'แก้ไข' : 'เพิ่ม'}ห้อง
            </h3>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="text-sm">ชื่อห้อง</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm">คำอธิบาย</label>
                <textarea
                  className="input"
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="รายละเอียดห้องประชุม"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm">อาคาร</label>
                  <input
                    className="input"
                    value={form.building}
                    onChange={(e) => setForm({ ...form, building: e.target.value })}
                    placeholder="อาคาร A"
                  />
                </div>
                <div>
                  <label className="text-sm">ชั้น</label>
                  <input
                    className="input"
                    value={form.floor}
                    onChange={(e) => setForm({ ...form, floor: e.target.value })}
                    placeholder="ชั้น 3"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm">ที่ตั้ง</label>
                <input
                  className="input"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="ห้อง 301"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm">ความจุ (คน)</label>
                  <input
                    type="number"
                    className="input"
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-sm">สี</label>
                  <input
                    type="color"
                    className="input h-10"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm">อุปกรณ์</label>
                <input
                  className="input"
                  value={form.equipment}
                  onChange={(e) => setForm({ ...form, equipment: e.target.value })}
                  placeholder="TV, Projector, Whiteboard"
                />
              </div>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                />{' '}
                เปิดใช้งาน
              </label>
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
