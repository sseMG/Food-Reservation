// src/pages/admin/adminReservations.jsx
import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../../components/adminavbar";
import AdminBottomNav from '../../components/mobile/AdminBottomNav';
import { api } from "../../lib/api";
import { refreshSessionForProtected } from "../../lib/auth";
import {
  CalendarClock,
  Check,
  X,
  Search,
  RefreshCw,
  Loader2,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

// ---- helpers ---------------------------------------------------------------
const CANON = ["Pending", "Approved", "Rejected", "Claimed"];

function normalizeStatus(raw) {
  const s = String(raw || "").trim();
  if (!s) return "Pending";
  const lower = s.toLowerCase();
  if (["pending"].includes(lower)) return "Pending";
  if (["approved", "approve"].includes(lower)) return "Approved";
  if (["rejected", "declined", "cancelled"].includes(lower)) return "Rejected";
  if (["claimed", "pickedup", "picked_up", "picked-up"].includes(lower)) return "Claimed";
  return s;
}

function fmtDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d)) return String(v);
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(d);
}

function prettyPickupWindow(v) {
  const s = String(v || "").trim().toLowerCase();
  if (!s) return "";
  if (s.includes("recess")) return "Recess";
  if (s.includes("lunch")) return "Lunch";
  if (s.includes("after")) return "After Class";
  if (s.includes("breakfast")) return "Breakfast";
  if (s.includes("dismissal")) return "Dismissal";
  return String(v);
}

const Pill = ({ status }) => {
  const map = {
    Pending: "bg-amber-100 text-amber-700",
    Approved: "bg-emerald-100 text-emerald-700",
    Rejected: "bg-rose-100 text-rose-700",
    Claimed: "bg-gray-100 text-gray-700",
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
};

// ---- component -------------------------------------------------------------
export default function AdminReservations() {
  const navigate = useNavigate();
  useEffect(() => {
    (async () => {
      await refreshSessionForProtected({ navigate, requiredRole: 'admin' });
    })();
  }, [navigate]);

  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [pickup, setPickup] = useState("all");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [tab, setTab] = useState("Pending");
  const [selected, setSelected] = useState({});
  const [expandedCards, setExpandedCards] = useState({}); // for mobile expand/collapse

  const [restrictionsOpen, setRestrictionsOpen] = useState(false);
  const [restrictionsLoading, setRestrictionsLoading] = useState(false);
  const [restrictionsSaving, setRestrictionsSaving] = useState(false);
  const [restrictions, setRestrictions] = useState({ ranges: [], months: [], weekdays: [] });
  const [draftRange, setDraftRange] = useState({ from: "", to: "" });
  const [draftMonth, setDraftMonth] = useState({ year: String(new Date().getFullYear()), month: String(new Date().getMonth() + 1) });

  // fetch
  const fetchReservations = async () => {
    setLoading(true);
    try {
      const data = await api.get("/reservations/admin");
      const arr = Array.isArray(data) ? data : [];
      setRows(arr);
    } catch (e) {
      console.error("Load reservations failed:", e);
      setRows([]);
      alert(e?.message || "Failed to load reservations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  useEffect(() => {
    if (!restrictionsOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [restrictionsOpen]);

  useEffect(() => {
    if (!restrictionsOpen) return;
    (async () => {
      setRestrictionsLoading(true);
      try {
        const data = await api.get("/admin/reservation-date-restrictions");
        setRestrictions({
          ranges: Array.isArray(data?.ranges) ? data.ranges : [],
          months: Array.isArray(data?.months) ? data.months : [],
          weekdays: Array.isArray(data?.weekdays) ? data.weekdays : [],
        });
      } catch (e) {
        console.error("Load reservation date restrictions failed:", e);
        alert(e?.message || "Failed to load reservation date restrictions.");
      } finally {
        setRestrictionsLoading(false);
      }
    })();
  }, [restrictionsOpen]);

  const saveRestrictions = async () => {
    setRestrictionsSaving(true);
    try {
      const payload = {
        ranges: restrictions.ranges || [],
        months: restrictions.months || [],
        weekdays: restrictions.weekdays || [],
      };
      const saved = await api.put("/admin/reservation-date-restrictions", payload);
      setRestrictions({
        ranges: Array.isArray(saved?.ranges) ? saved.ranges : [],
        months: Array.isArray(saved?.months) ? saved.months : [],
        weekdays: Array.isArray(saved?.weekdays) ? saved.weekdays : [],
      });
      alert("Reservation date restrictions saved.");
      setRestrictionsOpen(false);
    } catch (e) {
      console.error("Save reservation date restrictions failed:", e);
      alert(e?.message || "Failed to save reservation date restrictions.");
    } finally {
      setRestrictionsSaving(false);
    }
  };

  const addRange = () => {
    const from = String(draftRange.from || "").trim();
    const to = String(draftRange.to || "").trim();
    if (!from || !to) return;
    const next = from <= to ? { from, to } : { from: to, to: from };
    setRestrictions((r) => ({ ...r, ranges: [...(r.ranges || []), next] }));
    setDraftRange({ from: "", to: "" });
  };

  const addMonth = () => {
    const y = Number(draftMonth.year);
    const m = Number(draftMonth.month);
    if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) return;
    const entry = { year: y, month: m };
    setRestrictions((r) => {
      const exists = (r.months || []).some((x) => Number(x?.year) === y && Number(x?.month) === m);
      return exists ? r : { ...r, months: [...(r.months || []), entry] };
    });
  };

  const toggleWeekday = (d) => {
    setRestrictions((r) => {
      const set = new Set((r.weekdays || []).map((n) => Number(n)));
      if (set.has(d)) set.delete(d);
      else set.add(d);
      return { ...r, weekdays: Array.from(set).filter((n) => Number.isFinite(n)).sort((a, b) => a - b) };
    });
  };

  // normalize & sort
  const normalized = useMemo(() => {
    return (rows || [])
      .map((r) => {
        const items = Array.isArray(r.items)
          ? r.items
          : Array.isArray(r.order)
          ? r.order
          : [];

        const student =
          r.student ||
          r.studentName ||
          r.name ||
          (r.user && (r.user.name || r.user.fullName)) ||
          r.payerName ||
          "Student";
        const grade = r.grade || r.gradeLevel || r.grade_level || "";
        const section = r.section || r.classSection || r.section_name || "";
        const when = r.when || r.slotLabel || r.slot || r.pickup || r.pickupTime || "";
        const pickupDate = r.pickupDate || r.pickup_date || r.claimDate || r.claim_date || "";
        const status = normalizeStatus(r.status);
        const created =
          r.createdAt ||
          r.submittedAt ||
          r.date ||
          r.created ||
          r.updatedAt ||
          null;
        const createdNum = created ? new Date(created).getTime() : 0;
        return { ...r, items, student, grade, section, when, pickupDate, status, createdNum };
      })
      .sort((a, b) => b.createdNum - a.createdNum);
  }, [rows]);

  // counts for tabs
  const counts = useMemo(() => {
    const acc = CANON.reduce((m, k) => { m[k] = 0; return m; }, {});
    for (const r of normalized) acc[r.status] = (acc[r.status] || 0) + 1;
    acc["All"] = normalized.length;
    return acc;
  }, [normalized]);

  // filter by tab + search
  const filtered = useMemo(() => {
    const s = String(q || "").trim().toLowerCase();
    let list = normalized;
    if (tab !== "All") list = list.filter((r) => r.status === tab);
    if (pickup !== "all") {
      const p = String(pickup).toLowerCase();
      list = list.filter((r) => String(r.when || "").toLowerCase().includes(p));
    }
    if (!s) return list;
    return list.filter((r) =>
      (
        String(r.id || "") +
        " " +
        String(r.student || "") +
        " " +
        String(r.grade || "") +
        " " +
        String(r.section || "") +
        " " +
        String(r.when || "") +
        " " +
        String(r.pickupDate || "")
      )
        .toLowerCase()
        .includes(s)
    );
  }, [normalized, q, tab, pickup]);

  const lineTotal = (it) => {
    const price = Number(it.price ?? it.unitPrice ?? it.amount ?? 0);
    const qty = Number(it.qty ?? it.quantity ?? 1);
    return price * qty;
  };

  const total = (r) => (r.items || []).reduce((s, it) => s + lineTotal(it), 0);

  const updateStatus = async (id, status) => {
    setBusyId(id);
    try {
      const data = await api.patch(`/reservations/admin/${id}`, { status });
      const patch = data && (data.reservation || data);
      if (patch && (patch.id || patch.status)) {
        setRows((rs) => rs.map((r) => (String(r.id) === String(id) ? { ...r, ...patch } : r)));
      } else {
        await fetchReservations();
      }

      try { window.dispatchEvent(new Event("reservations:updated")); } catch {}
      if (String(status).toLowerCase() === "approved") {
        try { window.dispatchEvent(new Event("menu:updated")); } catch {}
      }
    } catch (e) {
      console.error(`Set status ${status} failed:`, e);
      alert(e?.message || `Failed to mark as ${status}.`);
    } finally {
      setBusyId(null);
    }
  };

  // bulk actions
  const selectedIds = useMemo(() => Object.keys(selected).filter((k) => selected[k]), [selected]);
  const anySelected = selectedIds.length > 0;

  const bulkUpdate = async (nextStatus) => {
    if (!anySelected) return;
    const ids = selectedIds.slice();
    setSelected({});
    for (const id of ids) {
      setBusyId(id);
      try {
        await api.patch(`/reservations/admin/${id}`, { status: nextStatus });
        setRows((rs) => rs.map((r) => (String(r.id) === String(id) ? { ...r, status: nextStatus } : r)));
      } catch (e) {
        console.error(`Bulk ${nextStatus} failed for ${id}`, e);
      } finally {
        setBusyId(null);
      }
    }

    try { window.dispatchEvent(new Event("reservations:updated")); } catch {}
    if (String(nextStatus).toLowerCase() === "approved") {
      try { window.dispatchEvent(new Event("menu:updated")); } catch {}
    }
  };

  const toggleExpand = (id) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // derive badge counts for bottom nav
  const badgeCounts = {
    orders: 0,
    topups: 0,
    reservations: counts["Pending"] || 0,
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Navbar />

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Reservations
            </h1>
          </div>

          {/* Search bar - full width on mobile */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="relative flex-1">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search student name, grade..."
                className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            <select
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              className="w-full sm:w-48 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Filter by pickup window"
            >
              <option value="all">All pickup windows</option>
              <option value="recess">Recess</option>
              <option value="lunch">Lunch</option>
              <option value="after">After Class</option>
            </select>

            <button
              onClick={fetchReservations}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border hover:bg-gray-50 text-sm disabled:opacity-60 whitespace-nowrap"
              aria-label="Refresh reservations"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={() => setRestrictionsOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-sm whitespace-nowrap"
            >
              Restricted Date for Reservations
            </button>
          </div>
        </div>

        {/* Tabs - scrollable on mobile */}
        <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
          <div className="flex items-center gap-2 min-w-max">
            {["All", ...CANON].map((t) => {
              const active = tab === t;
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium border transition whitespace-nowrap ${
                    active
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {t}
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] ${
                        active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {counts[t] ?? 0}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bulk action bar - responsive */}
        {tab === "Pending" && (
          <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>
                  {anySelected ? `${selectedIds.length} selected` : "Select items to bulk approve/reject"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={!anySelected}
                  onClick={() => bulkUpdate("Approved")}
                  className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs sm:text-sm bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Approve Selected
                </button>
                <button
                  disabled={!anySelected}
                  onClick={() => bulkUpdate("Rejected")}
                  className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs sm:text-sm bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reject Selected
                </button>
              </div>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 sm:p-10 text-center text-sm text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            Loading reservations…
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 sm:p-10 text-center text-sm text-gray-500">
            {q ? "No reservations match your search." : "No reservations for this filter."}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => {
              const isPending = r.status === "Pending";
              const isChecked = !!selected[r.id];
              const isExpanded = !!expandedCards[r.id];

              return (
                <div key={r.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Card Header - Always visible */}
                  <div className="p-3 sm:p-4">
                    <div className="flex items-start gap-3">
                      {/* Checkbox - only in Pending tab */}
                      {tab === "Pending" && (
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 rounded border-gray-300 flex-shrink-0"
                          checked={isChecked}
                          onChange={(e) =>
                            setSelected((m) => ({ ...m, [r.id]: e.target.checked }))
                          }
                        />
                      )}

                      {/* Main info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs sm:text-sm text-gray-500 font-mono">RES-{r.id}</span>
                          <Pill status={r.status} />
                        </div>
                        <div className="mt-1 text-sm sm:text-base text-gray-900 font-medium">
                          {r.student}
                          {r.studentId && (
                            <span className="ml-2 text-xs sm:text-sm font-mono text-gray-500">
                              {r.studentId}
                            </span>
                          )}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 mt-0.5">
                          {r.grade}{r.section ? `-${r.section}` : ""}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 mt-1">
                          Pickup: {r.pickupDate ? fmtDate(r.pickupDate) : "—"} • {prettyPickupWindow(r.when) || "—"}
                        </div>
                        {r.status === "Claimed" && (r.claimedAt || r.pickedAt || r.picked_at || r.claimed_at) && (
                          <div className="text-xs text-gray-500 mt-1">
                            Claimed: {new Date(r.claimedAt || r.pickedAt || r.picked_at || r.claimed_at).toLocaleString()}
                          </div>
                        )}
                      </div>

                      {/* Total - Right side */}
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs text-gray-500">Total</div>
                        <div className="text-base sm:text-lg font-semibold text-gray-900">
                          {peso.format(total(r))}
                        </div>
                      </div>
                    </div>

                    {/* Expand/Collapse button - Mobile only */}
                    <button
                      onClick={() => toggleExpand(r.id)}
                      className="md:hidden mt-3 w-full flex items-center justify-center gap-2 py-2 text-xs text-gray-600 hover:text-gray-900 border-t"
                    >
                      {isExpanded ? (
                        <>
                          <span>Hide Items</span>
                          <ChevronUp className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          <span>View {r.items?.length || 0} Item{(r.items?.length || 0) !== 1 ? 's' : ''}</span>
                          <ChevronDown className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Items list - Hidden on mobile unless expanded, always visible on desktop */}
                  <div className={`border-t ${isExpanded ? 'block' : 'hidden'} md:block`}>
                    <div className="p-3 sm:p-4 space-y-2">
                      {(r.items || []).map((it, idx) => {
                        const qty = Number(it.qty ?? it.quantity ?? 1);
                        const itemPrice = Number(it.price ?? it.unitPrice ?? it.amount ?? 0);
                        return (
                          <div key={idx} className="flex items-center justify-between text-xs sm:text-sm">
                            <div className="text-gray-700 flex-1 min-w-0 truncate">
                              {it.name || it.product || "Item"}
                            </div>
                            <div className="text-gray-600 ml-3 flex-shrink-0">
                              x{qty} = {peso.format(itemPrice * qty)}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Actions - only for Pending */}
                    {isPending && (
                      <div className="p-3 sm:p-4 bg-gray-50 border-t flex items-center justify-end gap-2">
                        <button
                          onClick={() => updateStatus(r.id, "Approved")}
                          disabled={busyId === r.id}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                          {busyId === r.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => updateStatus(r.id, "Rejected")}
                          disabled={busyId === r.id}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
                        >
                          {busyId === r.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {restrictionsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 pb-24 sm:pb-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden max-h-[calc(100vh-7rem)] sm:max-h-[85vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-gray-900">Reservation Claim Date Restrictions</div>
                <div className="text-xs text-gray-500">Block date ranges, whole months, or all dates on selected weekdays.</div>
              </div>

              <button
                onClick={() => setRestrictionsOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-5 overflow-y-auto flex-1">
              {restrictionsLoading ? (
                <div className="text-sm text-gray-600">Loading…</div>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-gray-900">Restricted date range</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="date"
                        value={draftRange.from}
                        onChange={(e) => setDraftRange((r) => ({ ...r, from: e.target.value }))}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      />
                      <input
                        type="date"
                        value={draftRange.to}
                        onChange={(e) => setDraftRange((r) => ({ ...r, to: e.target.value }))}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      />
                      <button
                        type="button"
                        onClick={addRange}
                        className="px-3 py-2 rounded-lg text-sm bg-gray-900 text-white hover:bg-gray-800"
                      >
                        Add range
                      </button>
                    </div>

                    {(restrictions.ranges || []).length > 0 && (
                      <div className="space-y-1">
                        {(restrictions.ranges || []).map((rg, idx) => (
                          <div key={`rg-${idx}`} className="flex items-center justify-between gap-2 text-sm border rounded-lg px-3 py-2">
                            <div className="text-gray-700">{rg.from} → {rg.to}</div>
                            <button
                              type="button"
                              onClick={() => setRestrictions((r) => ({ ...r, ranges: (r.ranges || []).filter((_, i) => i !== idx) }))}
                              className="text-rose-600 hover:text-rose-700"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-gray-900">Restrict whole month</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="number"
                        value={draftMonth.year}
                        onChange={(e) => setDraftMonth((m) => ({ ...m, year: e.target.value }))}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        placeholder="Year"
                      />
                      <select
                        value={draftMonth.month}
                        onChange={(e) => setDraftMonth((m) => ({ ...m, month: e.target.value }))}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      >
                        {Array.from({ length: 12 }).map((_, i) => (
                          <option key={i + 1} value={String(i + 1)}>{i + 1}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={addMonth}
                        className="px-3 py-2 rounded-lg text-sm bg-gray-900 text-white hover:bg-gray-800"
                      >
                        Add month
                      </button>
                    </div>

                    {(restrictions.months || []).length > 0 && (
                      <div className="space-y-1">
                        {(restrictions.months || []).map((m, idx) => (
                          <div key={`mo-${idx}`} className="flex items-center justify-between gap-2 text-sm border rounded-lg px-3 py-2">
                            <div className="text-gray-700">{m.year}-{String(m.month).padStart(2, "0")}</div>
                            <button
                              type="button"
                              onClick={() => setRestrictions((r) => ({ ...r, months: (r.months || []).filter((_, i) => i !== idx) }))}
                              className="text-rose-600 hover:text-rose-700"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-gray-900">Restrict by weekday (all dates)</div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 0, label: "Sun" },
                        { id: 1, label: "Mon" },
                        { id: 2, label: "Tue" },
                        { id: 3, label: "Wed" },
                        { id: 4, label: "Thu" },
                        { id: 5, label: "Fri" },
                        { id: 6, label: "Sat" },
                      ].map((d) => {
                        const checked = (restrictions.weekdays || []).includes(d.id);
                        return (
                          <label key={d.id} className="inline-flex items-center gap-2 border rounded-lg px-3 py-2 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleWeekday(d.id)}
                            />
                            <span className="text-gray-700">{d.label}</span>
                          </label>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setRestrictions((r) => ({ ...r, weekdays: [0, 1, 2, 3, 4, 5, 6] }))}
                        className="px-3 py-2 text-xs border rounded-lg hover:bg-gray-50"
                      >
                        Restrict all weekdays
                      </button>
                      <button
                        type="button"
                        onClick={() => setRestrictions((r) => ({ ...r, weekdays: [] }))}
                        className="px-3 py-2 text-xs border rounded-lg hover:bg-gray-50"
                      >
                        Clear weekdays
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-4 border-t flex items-center justify-end gap-2">
              <button
                onClick={() => setRestrictionsOpen(false)}
                className="px-3 py-2 rounded-lg text-sm border hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveRestrictions}
                disabled={restrictionsLoading || restrictionsSaving}
                className="px-3 py-2 rounded-lg text-sm bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-60"
              >
                {restrictionsSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation - Mobile only */}
      <AdminBottomNav badgeCounts={badgeCounts} />
    </div>
  );
}