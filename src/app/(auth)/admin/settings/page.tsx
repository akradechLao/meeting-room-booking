'use client';

import { useState, useEffect } from 'react';
import { AuthLayout } from '@/components/AuthLayout';

interface Setting {
  key: string;
  value: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);

  const settingDefs = [
    { key: 'system_name', label: 'ชื่อระบบ' },
    { key: 'org_name', label: 'องค์กร' },
    { key: 'theme_default', label: 'Theme เริ่มต้น (light/dark)' },
    { key: 'auto_approve', label: 'อนุมัติอัตโนมัติ (true/false)' },
    { key: 'min_duration_min', label: 'ระยะเวลาขั้นต่ำ (นาที)' },
    { key: 'max_duration_min', label: 'ระยะเวลาสูงสุด (นาที)' },
    { key: 'allow_booking_days_ahead', label: 'จองล่วงหน้าได้กี่วัน' },
    { key: 'enable_telegram', label: 'เปิดใช้ Telegram (true/false)' },
    { key: 'telegram_token', label: 'Telegram Bot Token' },
    { key: 'telegram_chat_id', label: 'Telegram Chat ID' },
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
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      if (res.ok) {
        alert('บันทึกแล้ว');
      } else {
        const error = await res.json();
        alert(error.error);
      }
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

  if (loading) {
    return (
      <AuthLayout>
        <div className="skeleton h-64"></div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="card p-4 sm:p-5 max-w-2xl">
        <h3 className="font-semibold mb-4">ตั้งค่าระบบ</h3>
        <div className="space-y-3">
          {settingDefs.map((s) => (
            <div key={s.key}>
              <label className="text-xs sm:text-sm font-medium text-navy-700">{s.label}</label>
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
    </AuthLayout>
  );
}
