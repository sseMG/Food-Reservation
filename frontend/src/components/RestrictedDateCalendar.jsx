import React, { useMemo, useState } from "react";

function normalizeDateString(v) {
  if (!v) return "";
  const s = String(v).trim();
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function isDateRestricted(dateStr, rules) {
  const dStr = normalizeDateString(dateStr);
  if (!dStr) return false;
  const d = new Date(dStr);
  if (Number.isNaN(d.getTime())) return false;

  const yyyy = d.getFullYear();
  const mm = d.getMonth() + 1;
  const dow = d.getDay();
  const r = rules || { ranges: [], months: [], weekdays: [] };

  if (Array.isArray(r.weekdays) && r.weekdays.includes(dow)) return true;

  if (Array.isArray(r.months)) {
    for (const m of r.months) {
      if (Number(m?.year) === yyyy && Number(m?.month) === mm) return true;
    }
  }

  if (Array.isArray(r.ranges)) {
    for (const rg of r.ranges) {
      const from = normalizeDateString(rg?.from);
      const to = normalizeDateString(rg?.to);
      if (!from || !to) continue;
      if (from <= dStr && dStr <= to) return true;
    }
  }

  return false;
}

function monthLabel(d) {
  return new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(d);
}

function addMonths(d, delta) {
  const nd = new Date(d);
  nd.setDate(1);
  nd.setMonth(nd.getMonth() + delta);
  nd.setHours(0, 0, 0, 0);
  return nd;
}

export default function RestrictedDateCalendar({ value, onChange, min, rules }) {
  const minStr = normalizeDateString(min);
  const selectedStr = normalizeDateString(value);

  const initialMonth = useMemo(() => {
    const base = selectedStr ? new Date(selectedStr) : new Date();
    base.setDate(1);
    base.setHours(0, 0, 0, 0);
    return base;
  }, [selectedStr]);

  const [viewMonth, setViewMonth] = useState(initialMonth);

  const grid = useMemo(() => {
    const start = new Date(viewMonth);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
    const firstDow = start.getDay();

    const cells = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(start.getFullYear(), start.getMonth(), day);
      const dateStr = normalizeDateString(d);
      const restricted = isDateRestricted(dateStr, rules);
      const beforeMin = !!minStr && dateStr < minStr;
      cells.push({ day, dateStr, restricted, disabled: restricted || beforeMin });
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewMonth, rules, minStr]);

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="border border-gray-200 rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={() => setViewMonth((m) => addMonths(m, -1))}
          className="px-2 py-1 text-sm border rounded-lg hover:bg-gray-50"
        >
          Prev
        </button>
        <div className="text-sm font-semibold text-gray-900">{monthLabel(viewMonth)}</div>
        <button
          type="button"
          onClick={() => setViewMonth((m) => addMonths(m, 1))}
          className="px-2 py-1 text-sm border rounded-lg hover:bg-gray-50"
        >
          Next
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-[11px] text-gray-500 mb-1">
        {dayNames.map((n) => (
          <div key={n} className="text-center py-1">
            {n}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {grid.map((cell, idx) => {
          if (!cell) return <div key={`e-${idx}`} className="h-9" />;

          const isSelected = selectedStr && cell.dateStr === selectedStr;
          const base = "h-9 rounded-lg text-sm flex items-center justify-center";

          if (cell.disabled) {
            const disabledClass = cell.restricted
              ? "bg-rose-50 text-rose-700 border border-rose-200"
              : "bg-gray-50 text-gray-400";
            return (
              <div key={cell.dateStr} className={`${base} ${disabledClass}`} title={cell.restricted ? "Restricted" : "Unavailable"}>
                {cell.day}
              </div>
            );
          }

          return (
            <button
              key={cell.dateStr}
              type="button"
              onClick={() => onChange && onChange(cell.dateStr)}
              className={`${base} border ${isSelected ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"}`}
            >
              {cell.day}
            </button>
          );
        })}
      </div>

      <div className="mt-2 text-[11px] text-gray-500 flex items-center gap-2">
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-rose-50 border border-rose-200 inline-block" />
          Restricted
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-blue-600 inline-block" />
          Selected
        </span>
      </div>
    </div>
  );
}
