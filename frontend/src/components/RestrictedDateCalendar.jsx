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

export default function RestrictedDateCalendar({ value, onChange, min, rules, cutoff }) {
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
      
      // Check cutoff status
      let cutoffStatus = null;
      if (cutoff && cutoff.cutoffTime) {
        const nowManila = new Date(
          new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' })
        );
        const [h, m] = cutoff.cutoffTime.split(':').map(Number);
        const advance = cutoff.advanceDaysRequired ?? 1;
        const deadline = new Date(d);
        deadline.setDate(deadline.getDate() - advance);
        deadline.setHours(h, m, 0, 0);
        
        if (nowManila >= deadline) {
          cutoffStatus = 'closed';
        } else {
          const diff = deadline - nowManila;
          const hours = Math.floor(diff / 3600000);
          if (hours < 2) {
            cutoffStatus = 'urgent';
          } else if (hours < 24) {
            cutoffStatus = 'warning';
          } else {
            cutoffStatus = 'safe';
          }
        }
      }
      
      cells.push({ day, dateStr, restricted, disabled: restricted || beforeMin || cutoffStatus === 'closed', cutoffStatus });
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewMonth, rules, minStr, cutoff]);

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
          const base = "h-9 rounded-lg text-sm flex items-center justify-center relative";

          if (cell.disabled) {
            let disabledClass = "";
            let titleText = "";
            
            if (cell.cutoffStatus === 'closed') {
              disabledClass = "bg-red-50 text-red-700 border border-red-200";
              titleText = "Ordering closed for this date";
            } else if (cell.restricted) {
              disabledClass = "bg-rose-50 text-rose-700 border border-rose-200";
              titleText = "Restricted";
            } else {
              disabledClass = "bg-gray-50 text-gray-400";
              titleText = "Unavailable";
            }
            
            return (
              <div key={cell.dateStr} className={`${base} ${disabledClass}`} title={titleText}>
                {cell.day}
                {cell.cutoffStatus === 'closed' && (
                  <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" aria-label="Ordering closed"></span>
                )}
              </div>
            );
          }

          // Determine cutoff styling
          let cutoffIndicator = null;
          let cutoffClass = "";
          let cutoffTitle = "";
          
          if (cell.cutoffStatus) {
            switch (cell.cutoffStatus) {
              case 'closed':
                cutoffIndicator = <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" aria-label="Ordering closed"></span>;
                cutoffClass = "border-red-300";
                cutoffTitle = "Ordering closed for this date";
                break;
              case 'urgent':
                cutoffIndicator = <span className="absolute top-0 right-0 w-2 h-2 bg-orange-500 rounded-full animate-pulse" aria-label="Ordering closes soon"></span>;
                cutoffClass = "border-orange-300";
                cutoffTitle = "Ordering closes soon (under 2 hours)";
                break;
              case 'warning':
                cutoffIndicator = <span className="absolute top-0 right-0 w-2 h-2 bg-yellow-500 rounded-full" aria-label="Ordering closes today"></span>;
                cutoffClass = "border-yellow-300";
                cutoffTitle = "Ordering closes today";
                break;
              default:
                cutoffIndicator = <span className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full" aria-label="Plenty of time to order"></span>;
                cutoffClass = "border-green-300";
                cutoffTitle = "Plenty of time to order";
            }
          }

          return (
            <button
              key={cell.dateStr}
              type="button"
              onClick={() => onChange && onChange(cell.dateStr)}
              className={`${base} border ${isSelected ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"} ${cutoffClass}`}
              title={cutoffTitle || "Select this date"}
            >
              {cell.day}
              {cutoffIndicator}
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
