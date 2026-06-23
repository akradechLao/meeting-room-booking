'use client';

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  required?: boolean;
}

const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    const hh = String(h).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    TIME_OPTIONS.push(`${hh}:${mm}`);
  }
}

export function DateTimePicker({ value, onChange, label, required }: DateTimePickerProps) {
  const [datePart, timePart] = value ? value.split('T') : ['', ''];
  const timeValue = timePart || '09:00';

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    if (date) {
      onChange(`${date}T${timeValue}`);
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const time = e.target.value;
    if (datePart) {
      onChange(`${datePart}T${time}`);
    }
  };

  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1 min-w-0">
        <label className="text-xs sm:text-sm font-semibold text-navy-700">{label}</label>
        <input
          type="date"
          className="input mt-1"
          value={datePart}
          onChange={handleDateChange}
          required={required}
        />
      </div>
      <div className="w-24 sm:w-32">
        <label className="text-xs sm:text-sm font-semibold text-navy-700">เวลา</label>
        <select
          className="input mt-1"
          value={timeValue}
          onChange={handleTimeChange}
        >
          {TIME_OPTIONS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
