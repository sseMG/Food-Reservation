// src/pages/TxHistory.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import Navbar from "../../components/avbar";
import BottomNav from "../../components/mobile/BottomNav";
import FullScreenLoader from "../../components/FullScreenLoader";
import { api } from "../../lib/api";
import { refreshSessionForProtected } from "../../lib/auth";
import { Search, RefreshCw, ChevronLeft, ChevronRight, X, Filter, CheckCircle, Clock, XCircle, DollarSign, Calendar, ShoppingBag } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useModal } from "../../contexts/ModalContext";

const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });

/* ---------- small UI helpers ---------- */
function Pill({ children, tone = "gray" }) {
  const tones = {
    gray: "bg-gray-100 text-gray-700 border-gray-200",
    green: "bg-green-100 text-green-700 border-green-200",
    red: "bg-red-100 text-red-700 border-red-200",
    yellow: "bg-yellow-100 text-yellow-700 border-yellow-200",
    blue: "bg-blue-100 text-blue-700 border-blue-200",
  };
  const icons = {
    green: <CheckCircle className="w-3 h-3" />,
    yellow: <Clock className="w-3 h-3" />,
    red: <XCircle className="w-3 h-3" />,
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${tones[tone] || tones.gray}`}>
      {icons[tone]}
      {children}
    </span>
  );
}

function fmtDateTime(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v || "");
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(d);
}

 function fmtDate(v) {
   if (!v) return "—";
   const d = new Date(v);
   if (Number.isNaN(d.getTime())) return String(v || "");
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

/* ---------- data normalization helpers (kept intact + robust) ---------- */
function computeReservationTotal(r) {
  if (!r) return 0;
  if (typeof r.total === "number") return r.total;
  if (Array.isArray(r.items)) {
    return r.items.reduce((s, it) => {
      const q = Number(it.qty ?? it.quantity ?? 1) || 0;
      const p = Number(it.price ?? it.unitPrice ?? it.amount ?? 0) || 0;
      return s + q * p;
    }, 0);
  }
  return Number(r.amount ?? 0) || 0;
}

function extractItemsArray(r) {
  const arr = Array.isArray(r?.items)
    ? r.items
    : Array.isArray(r?.order)
    ? r.order
    : Array.isArray(r?.lines)
    ? r.lines
    : [];
  return arr.map((it) => ({
    name: it.name ?? it.product ?? it.title ?? "Item",
    qty: Number(it.qty ?? it.quantity ?? 1) || 1,
    price: Number(it.price ?? it.unitPrice ?? it.amount ?? 0) || 0,
  }));
}

function looksLikeFood(raw) {
  if (!raw || typeof raw !== "object") return false;
  if (Array.isArray(raw.items) && raw.items.length) return true;
  const txt = String(raw.type || raw.kind || raw.title || raw.description || raw.note || "").toLowerCase();
  if (txt.includes("reservation") || txt.includes("order") || txt.includes("purchase")) return true;
  const refish = String(raw.id || raw.ref || raw.reference || raw.orderId || raw.reservationId || "").toLowerCase();
  if (refish.startsWith("res") || refish.includes("res-")) return true;
  return false;
}

function mapFoodToRow(raw) {
  const id = raw.id || raw.orderId || raw.reservationId || raw.ref || raw.reference || raw._id || Math.random().toString(36).slice(2);
  const createdAt = [raw.createdAt, raw.created, raw.time, raw.date, raw.submittedAt, raw.updatedAt]
    .find((v) => {
      if (!v) return false;
      const d = new Date(v);
      return !Number.isNaN(d.getTime());
    }) || null;
  const pickupWindow = raw.when || raw.slot || raw.slotLabel || raw.pickup || raw.pickupTime || "";
  const pickupWindowLabel = pickupWindow ? prettyPickupWindow(pickupWindow) : "";
  const pickupDate = raw.pickupDate || raw.pickup_date || raw.claimDate || raw.claim_date || "";
  const items = extractItemsArray(raw);
  const amount = computeReservationTotal(raw);
  const products = items.map(({ name, qty }) => `${name} ×${qty}`).join(" • ");
  const status = String(raw.status || raw.result || raw.state || "Success");
  const statusLC = status.toLowerCase();

  const pickupDisplay = [pickupDate ? fmtDate(pickupDate) : "", pickupWindowLabel ? String(pickupWindowLabel) : ""]
    .filter(Boolean)
    .join(" • ");

  return {
    id,
    createdAt,
    title: raw.title || raw.name || "Reservation",
    products,
    productsTitle: products,
    amount: Math.abs(amount || 0),
    status,
    statusLC,
    pickupWindow,
    pickupWindowLabel,
    pickupDate,
    pickupDisplay,
    sign: -1,
    raw,
  };
}

/* ---------- utility hooks ---------- */
function useDebounce(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => {
      setV(value);
    }, 350);
    return () => clearTimeout(timer);
  }, [value]);
  return v;
}

/* ---------- fetcher with server-side attempt and robust fallbacks ---------- */
const fetchReservationsWithParams = async ({ signal, params }) => {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.status && params.status !== "all") qs.set("status", params.status);
  if (params.pickup && params.pickup !== "all") qs.set("pickup", params.pickup);
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);
  if (params.sort) qs.set("sort", params.sort);
  if (params.page) qs.set("page", String(params.page));
  if (params.perPage) qs.set("perPage", String(params.perPage));

  // Primary: try server-side paginated endpoint
  try {
    const url = `/reservations?${qs.toString()}`;
    const res = await api.get(url, { signal });
    if (Array.isArray(res)) return { items: res.map(mapFoodToRow), total: res.length };
    if (res && Array.isArray(res.data)) return { items: res.data.map(mapFoodToRow), total: res.total ?? res.data.length };
    if (res && Array.isArray(res.payload)) return { items: res.payload.map(mapFoodToRow), total: res.total ?? res.payload.length };
  } catch (e) {
    if (e?.name === "AbortError") throw e;
  }

  // Fallbacks: alternate endpoints
  let pool = [];
  try {
    const mine = await api.get("/reservations/mine", { signal }).catch(() => null);
    if (Array.isArray(mine)) pool.push(...mine);
    else if (mine && Array.isArray(mine.data)) pool.push(...mine.data);
  } catch (e) { if (e?.name === "AbortError") throw e; }

  try {
    const alt = await api.get("/reservations", { signal }).catch(() => null);
    if (Array.isArray(alt)) pool.push(...alt);
    else if (alt && Array.isArray(alt.data)) pool.push(...alt.data);
  } catch (e) { if (e?.name === "AbortError") throw e; }

  if (pool.length === 0) {
    try {
      const tx = await api.get("/transactions/mine", { signal }).catch(() => null);
      if (Array.isArray(tx)) pool.push(...tx);
      else if (tx && Array.isArray(tx.data)) pool.push(...tx.data);
    } catch (e) { if (e?.name === "AbortError") throw e; }
  }

  if (pool.length === 0) {
    const dash = await api.get("/dashboard").catch(() => null);
    const recent = dash?.recent || dash?.recentActivity || dash?.recentOrders || [];
    if (Array.isArray(recent)) pool.push(...recent);
  }

  const normalized = pool.filter(Boolean);
  const mapped = normalized.map(mapFoodToRow);

  // Client-side filters (for fallback)
  const qLower = (params.q || "").trim().toLowerCase();
  let filtered = mapped;
  if (qLower) {
    const toks = qLower.split(/\s+/).filter(Boolean);
    filtered = filtered.filter((r) => {
      const hay = [String(r.id), r.title, r.status, r.products, r.pickupDisplay, r.pickupDate, r.pickupWindow].join(" ").toLowerCase();
      return toks.every((t) => hay.includes(t));
    });
  }
  if (params.status && params.status !== "all") {
    filtered = filtered.filter((r) => r.statusLC === (params.status || "").toLowerCase());
  }
  if (params.pickup && params.pickup !== "all") {
    const p = String(params.pickup || "").toLowerCase();
    filtered = filtered.filter((r) => String(r.pickupWindow || "").toLowerCase().includes(p));
  }
  if (params.from || params.to) {
    const fromD = params.from ? new Date(params.from) : null;
    const toD = params.to ? new Date(params.to) : null;
    if (fromD) fromD.setHours(0, 0, 0, 0);
    if (toD) toD.setHours(23, 59, 59, 999);
    filtered = filtered.filter((r) => {
      const d = new Date(r.createdAt);
      if (Number.isNaN(d.getTime())) return false;
      if (fromD && d < fromD) return false;
      if (toD && d > toD) return false;
      return true;
    });
  }

  switch (params.sort) {
    case "date-asc":
      filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      break;
    case "amount-desc":
      filtered.sort((a, b) => b.amount - a.amount);
      break;
    case "amount-asc":
      filtered.sort((a, b) => a.amount - b.amount);
      break;
    default:
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  const total = filtered.length;
  const page = Number(params.page || 1);
  const perPage = Number(params.perPage || 10);
  const start = (page - 1) * perPage;
  const items = filtered.slice(start, start + perPage);

  return { items, total };
};

/* ---------- main component ---------- */
export default function TxHistory() {
  const navigate = useNavigate();
  const { showAlert, showConfirm } = useModal();
  useEffect(() => {
    (async () => {
      await refreshSessionForProtected({ navigate, requiredRole: "student" });
    })();
  }, [navigate]);

  // UI state
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [pickup, setPickup] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rangeOpen, setRangeOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");
  const [sort, setSort] = useState("date-desc");
  const [showFilters, setShowFilters] = useState(false);
  const rangeRef = useRef(null);

  useEffect(() => {
    if (!rangeOpen) return;
    const onDown = (e) => {
      if (!rangeRef.current) return;
      if (!rangeRef.current.contains(e.target)) setRangeOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setRangeOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [rangeOpen]);

  const debouncedQ = useDebounce(q, 300);

  // modal for details
  const [selected, setSelected] = useState(null);
  const modalCloseRef = useRef(null);

  const scrollLockPrevRef = useRef({
    bodyOverflow: "",
    htmlOverflow: "",
    locked: false,
  });

  // cancel modal
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const cancelCloseRef = useRef(null);

  // mobile detection
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth <= 820 : false);
  useEffect(() => {
    function onResize() {
      setIsMobile(window.innerWidth <= 820);
    }
    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // query key and fetching
  const queryKey = ["txHistory", { q: debouncedQ, status, pickup, from, to, sort, page, perPage }];

  const {
    data,
    error: queryError,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      const res = await fetchReservationsWithParams({ signal, params: { q: debouncedQ, status, pickup, from, to, sort, page, perPage } });
      return res;
    },
    keepPreviousData: true,
    retry: 1,
    staleTime: 1000 * 10,
  });

  // derived data
  const rows = data?.items ?? [];
  const total = data?.total ?? rows.length;
  const totalPages = Math.max(1, Math.ceil((total || 0) / perPage));
  const pageSafe = Math.min(page, totalPages);
  const pageRows = rows; // already paginated by fetcher

  // summary statistics
  const summary = useMemo(() => {
    let totalSpent = 0;
    let success = 0, preparing = 0, pending = 0, rejected = 0;
    for (const r of rows) {
      totalSpent += r.amount;
      const s = r.statusLC;
      if (s === "success" || s === "approved" || s === "claimed" || s === "ready") success++;
      else if (s === "preparing") preparing++;
      else if (s === "pending") pending++;
      else if (s === "failed" || s === "rejected") rejected++;
    }
    return { totalSpent, success, preparing, pending, rejected };
  }, [rows]);

  // error mapping
  let friendlyError = null;
  if (queryError) {
    const msg = String(queryError?.message || queryError || "");
    const lower = msg.toLowerCase();
    if (lower.includes("401") || lower.includes("unauthorized")) {
      friendlyError = "You are not logged in. Please login, then refresh.";
    } else if (lower.includes("network") || lower.includes("fetch") || lower.includes("failed")) {
      friendlyError = "Network error. Make sure the API is reachable, then refresh.";
    } else {
      friendlyError = "Could not load your order history. Please try again.";
    }
  }

  const handleRefresh = useCallback(async () => {
    setPage(1);
    await refetch();
  }, [refetch]);

  // export CSV for current filtered results (not all server data)
  const exportCSV = useCallback(async () => {
    // ✅ Suggestion #1: Check for no data
    if (!rows || rows.length === 0) {
      await showAlert("No records to export. Please add some orders first.", "warning", "No Data Available");
      return;
    }

    // ✅ Suggestion #1: Prompt user before export
    const confirmed = await showConfirm(
      `Export ${rows.length} order record${rows.length !== 1 ? 's' : ''} to CSV?\n\nThis will export all currently filtered orders.`,
      "Export Order History"
    );
    
    if (!confirmed) return;

    const csvEscape = (value) => {
      const v = value == null ? "" : String(value);
      return `"${v.replace(/"/g, '""')}"`;
    };

    // Human-readable headers matching website
    const header = [
      "Order ID",
      "Order Type",
      "Date & Time",
      "Pickup",
      "Amount (PHP)",
      "Status",
      "Items Ordered",
    ];

    const items = rows.map((r) => ({
      "Order ID": r.id,
      "Order Type": r.title,
      "Date & Time": fmtDateTime(r.createdAt),
      "Pickup": r.pickupDisplay || "—",
      "Amount (PHP)": peso.format(r.amount),
      "Status": r.status,
      "Items Ordered": r.products || "—",
    }));

    const lines = [header.map(csvEscape).join(",")].concat(
      items.map((it) => header.map((h) => csvEscape(it[h])).join(","))
    );

    // Use CRLF for better Excel compatibility + prepend UTF-8 BOM to avoid garbled chars (₱, ×)
    const csv = `\uFEFF${lines.join("\r\n")}`;
    
    // ✅ Suggestion #3: Professional filename with date
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = today.toTimeString().slice(0,5).replace(':', ''); // HHMM
    
    let filename = `Order_History_${dateStr}_${timeStr}`;
    if (status !== "all") filename += `_${status}`;
    if (q) filename += `_filtered`;
    filename += `.csv`;
    
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [rows, pageSafe, status, q, showAlert, showConfirm]);

  // modal keyboard handling (escape to close)
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape" && selected) setSelected(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  // focus trap / bring focus to modal close button
  useEffect(() => {
    if (selected && modalCloseRef.current) modalCloseRef.current.focus();
  }, [selected]);

  // Prevent background scroll when any modal is open
  useEffect(() => {
    const shouldLock = !!selected || !!cancelOpen;
    const prev = scrollLockPrevRef.current;

    if (!shouldLock) {
      if (prev.locked) {
        document.body.style.overflow = prev.bodyOverflow;
        document.documentElement.style.overflow = prev.htmlOverflow;
        prev.locked = false;
      }
      return;
    }

    if (!prev.locked) {
      prev.bodyOverflow = document.body.style.overflow;
      prev.htmlOverflow = document.documentElement.style.overflow;
      prev.locked = true;
    }

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      const stillLocked = !!selected || !!cancelOpen;
      if (!stillLocked && prev.locked) {
        document.body.style.overflow = prev.bodyOverflow;
        document.documentElement.style.overflow = prev.htmlOverflow;
        prev.locked = false;
      }
    };
  }, [selected, cancelOpen]);

  useEffect(() => {
    if (cancelOpen && cancelCloseRef.current) cancelCloseRef.current.focus();
  }, [cancelOpen]);

  const openCancel = useCallback((row) => {
    setCancelTarget(row);
    setCancelReason("");
    setCancelOpen(true);
  }, []);

  const submitCancel = useCallback(async () => {
    if (!cancelTarget?.id) return;
    const reason = String(cancelReason || "").trim();
    if (!reason) {
      await showAlert("Please enter a reason for cancellation.", "warning", "Reason Required");
      return;
    }

    try {
      await api.patch(`/reservations/${cancelTarget.id}/cancel`, { reason });
      setCancelOpen(false);
      setCancelTarget(null);
      setCancelReason("");
      await showAlert("Your order has been cancelled.", "success", "Cancelled");
      await refetch();
    } catch (e) {
      const msg = String(e?.message || e || "");
      await showAlert(msg || "Failed to cancel this order. Please try again.", "error", "Cancel Failed");
    }
  }, [cancelTarget, cancelReason, refetch, showAlert]);

  if (isLoading) {
    return <FullScreenLoader message="Loading transaction history..." />;
  }

  return (
    <div className="min-h-screen bg-white pb-28">
      <Navbar />

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
        {/* Header */}
        <header className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Order History</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Food reservations and purchases only
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={isFetching}
                className="inline-flex items-center gap-2 border border-jckl-gold px-3 py-2 rounded-lg text-sm hover:bg-jckl-cream disabled:opacity-60 text-jckl-navy"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={exportCSV}
                className="hidden sm:inline-flex items-center gap-2 border border-gray-300 px-3 py-2 rounded-lg text-sm hover:bg-gray-50"
                title="Export CSV"
              >
                Export CSV
              </button>
            </div>
          </div>
        </header>

        {/* Summary cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Total Spent</div>
            </div>
            <div className="text-lg sm:text-2xl font-bold text-gray-900">{peso.format(summary.totalSpent)}</div>
          </div>

          <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-lg sm:text-2xl font-bold text-green-600">{summary.success}</div>
          </div>

          <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-yellow-600" />
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Preparing</div>
            </div>
            <div className="text-lg sm:text-2xl font-bold text-yellow-600">{summary.preparing + summary.pending}</div>
          </div>

          <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-4 h-4 text-red-600" />
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Failed</div>
            </div>
            <div className="text-lg sm:text-2xl font-bold text-red-600">{summary.rejected}</div>
          </div>
        </section>

        {/* Filters */}
        <section className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border-t-4 border-jckl-gold space-y-3">
          {/* Search bar - always visible */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by ID, product, status..."
                className="w-full border border-jckl-gold rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jckl-gold text-jckl-navy"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            {/* Mobile: Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden inline-flex items-center gap-2 border border-jckl-gold px-3 py-2 rounded-lg text-sm hover:bg-jckl-cream text-jckl-navy"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? <X className="w-4 h-4" /> : null}
            </button>

            {/* Desktop: Export CSV */}
            <button
              onClick={exportCSV}
              className="hidden md:inline-flex items-center gap-2 border border-gray-300 px-3 py-2 rounded-lg text-sm hover:bg-gray-50"
            >
              Export CSV
            </button>
          </div>

          {/* Filter controls */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 ${showFilters ? 'block' : 'hidden'} md:grid`}>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All statuses</option>
              <option value="success">Success</option>
              <option value="approved">Approved</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="claimed">Claimed</option>
              <option value="pending">Pending</option>
              <option value="pending cancellation">Pending Cancellation</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={pickup}
              onChange={(e) => {
                setPickup(e.target.value);
                setPage(1);
              }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All pickup windows</option>
              <option value="recess">Recess</option>
              <option value="lunch">Lunch</option>
              <option value="after">After Class</option>
            </select>

            <div className="relative" ref={rangeRef}>
              <button
                type="button"
                onClick={() => {
                  setDraftFrom(from);
                  setDraftTo(to);
                  setRangeOpen((v) => !v);
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <span className="inline-flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-jckl-navy">
                    {from || to ? `${from || "…"} → ${to || "…"}` : "Date of Request Range"}
                  </span>
                </span>
              </button>

              {rangeOpen && (
                <div className="absolute z-50 mt-2 w-full min-w-[260px] rounded-lg border border-gray-200 bg-white shadow-lg p-3">
                  <div className="grid grid-cols-1 gap-2">
                    <input
                      type="date"
                      value={draftFrom}
                      onChange={(e) => setDraftFrom(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="date"
                      value={draftTo}
                      onChange={(e) => setDraftTo(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDraftFrom("");
                        setDraftTo("");
                        setFrom("");
                        setTo("");
                        setPage(1);
                        setRangeOpen(false);
                      }}
                      className="px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-50"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFrom(draftFrom);
                        setTo(draftTo);
                        setPage(1);
                        setRangeOpen(false);
                      }}
                      className="px-3 py-1.5 text-xs rounded-lg bg-jckl-navy text-white hover:bg-jckl-light-navy"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>

            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date-desc">Newest first</option>
              <option value="date-asc">Oldest first</option>
              <option value="amount-desc">Amount (high → low)</option>
              <option value="amount-asc">Amount (low → high)</option>
            </select>

            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value) || 10);
                setPage(1);
              }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={7}>7 per page</option>
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>

          {/* Active filters indicator */}
          {(q || status !== "all" || pickup !== "all" || from || to) && (
            <div className="flex items-center justify-between text-xs text-gray-600 pt-2 border-t">
              <span>Showing {total} record{total !== 1 ? 's' : ''}</span>
              <button
                onClick={() => {
                  setQ("");
                  setStatus("all");
                  setPickup("all");
                  setFrom("");
                  setTo("");
                  setDraftFrom("");
                  setDraftTo("");
                  setRangeOpen(false);
                  setSort("date-desc");
                  setPage(1);
                }}
                className="text-jckl-navy hover:text-jckl-light-navy"
              >
                Clear filters
              </button>
            </div>
          )}
        </section>

        {/* Error */}
        {!isLoading && friendlyError && (
          <div className="bg-white rounded-xl border border-red-100 p-8 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-sm text-red-600 mb-3">{friendlyError}</p>
            <button onClick={() => refetch()} className="text-sm text-red-600 hover:text-red-700 underline">
              Try again
            </button>
          </div>
        )}

        {/* Main content (mobile cards or desktop table) */}
        <div className="bg-white rounded-xl shadow-sm border-t-4 border-jckl-gold overflow-hidden">
          {isFetching && !isLoading && (
            <div className="px-4 py-2 text-xs text-gray-500 border-b">Updating…</div>
          )}

          {!friendlyError && isMobile ? (
            <div className="p-3 space-y-3">
              {!isLoading && isFetching && (
                <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500">Loading...</p>
                </div>
              )}

              {!isLoading && rows.length === 0 && (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 bg-jckl-cream rounded-full flex items-center justify-center mx-auto mb-3">
                    <ShoppingBag className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">
                    {q || status !== "all" || pickup !== "all" || from || to 
                      ? "No orders match your filters."
                      : "No order history yet."}
                  </p>
                </div>
              )}

              {!isLoading && rows.length > 0 && pageRows.map((t) => (
                <article key={t.id} className="bg-white border-t-4 border-jckl-gold rounded-lg shadow-sm p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate">
                          <div className="text-xs text-gray-500">{fmtDateTime(t.createdAt)}</div>
                          <div className="font-semibold truncate">{t.title}</div>
                          <div className="text-xs text-gray-400 truncate">{t.id}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold">{peso.format(t.amount)}</div>
                          <div className="mt-2">
                            {(() => {
                              const s = t.statusLC;
                              if (s === "success" || s === "approved" || s === "claimed" || s === "ready") return <Pill tone="green">{t.status}</Pill>;
                              if (s === "preparing" || s === "pending" || s === "pending cancellation") return <Pill tone="yellow">{t.status}</Pill>;
                              if (s === "failed" || s === "rejected" || s === "cancelled") return <Pill tone="red">{t.status}</Pill>;
                              if (s === "refunded") return <Pill tone="blue">{t.status}</Pill>;
                              return <Pill>{t.status}</Pill>;
                            })()}
                          </div>

                          {t.statusLC === "pending" && (
                            <button
                              onClick={() => openCancel(t)}
                              className="mt-2 w-full text-xs px-3 py-1.5 border border-red-300 text-red-700 rounded-md hover:bg-red-50"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 text-sm text-gray-700">
                        <div className="line-clamp-2" title={t.productsTitle}>{t.products || "—"}</div>
                      </div>

                      <div className="mt-2 text-xs text-gray-600">
                        <span className="font-medium">Pickup:</span>{" "}
                        {t.pickupDisplay || "—"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <button onClick={() => navigator.clipboard?.writeText(String(t.id || ""))} className="text-xs px-3 py-1 border rounded-md">Copy Ref</button>
                    <button onClick={() => navigator.clipboard?.writeText(String(t.products || ""))} className="text-xs px-3 py-1 border rounded-md">Copy Items</button>
                    <button onClick={() => setSelected(t)} className="ml-auto text-xs px-3 py-1 border rounded-md">View</button>
                  </div>
                </article>
              ))}
            </div>
          ) : !friendlyError ? (
            <div className="overflow-auto">
              <table className="min-w-full">
                <thead className="bg-jckl-cream">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-jckl-navy uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-jckl-navy uppercase tracking-wider">Ref</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-jckl-navy uppercase tracking-wider">Products</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-jckl-navy uppercase tracking-wider">Pickup</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-jckl-navy uppercase tracking-wider">Date of request</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-jckl-navy uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-jckl-navy uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {isLoading &&
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={`sk-${i}`} className="animate-pulse">
                        <td className="px-6 py-4"><div className="h-4 w-40 bg-gray-200 rounded" /></td>
                        <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-200 rounded" /></td>
                        <td className="px-6 py-4"><div className="h-4 w-64 bg-gray-200 rounded" /></td>
                        <td className="px-6 py-4"><div className="h-4 w-28 bg-gray-200 rounded" /></td>
                        <td className="px-6 py-4 text-center"><div className="h-4 w-28 bg-gray-200 rounded inline-block" /></td>
                        <td className="px-6 py-4 text-right"><div className="h-4 w-20 bg-gray-200 rounded inline-block" /></td>
                        <td className="px-6 py-4 text-center"><div className="h-5 w-20 bg-gray-200 rounded inline-block" /></td>
                      </tr>
                    ))}

                  {!isLoading && rows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-6 text-center text-sm text-jckl-slate">
                        No food orders found.
                        <div className="text-xs text-gray-400 mt-1">Tip: make a reservation in the Shop, then check back here.</div>
                      </td>
                    </tr>
                  )}

                  {!isLoading && rows.length > 0 && pageRows.map((t) => (
                    <tr key={t.id} className="hover:bg-jckl-cream">
                      <td className="px-6 py-4 text-sm text-jckl-navy font-medium">{t.title}</td>
                      <td className="px-6 py-4 text-sm text-jckl-slate">{t.id}</td>
                      <td className="px-6 py-4 text-sm text-jckl-slate"><span className="line-clamp-2 block" title={t.productsTitle}>{t.products || "—"}</span></td>
                      <td className="px-6 py-4 text-sm text-jckl-slate">
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500">{t.pickupDate ? fmtDate(t.pickupDate) : "—"}</span>
                          <span className="text-sm text-jckl-navy">{t.pickupWindowLabel || t.pickupWindow || "—"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-jckl-slate text-center">{fmtDateTime(t.createdAt)}</td>
                      <td className={`px-6 py-4 text-sm text-right font-semibold ${t.statusLC === "rejected" || t.statusLC === "cancelled" ? "text-gray-900" : "text-rose-700"}`}>
                        {(t.statusLC === "rejected" || t.statusLC === "cancelled") ? peso.format(t.amount) : `−${peso.format(t.amount)}`}
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        {(() => {
                          const s = t.statusLC;
                          if (s === "success" || s === "approved" || s === "claimed" || s === "ready") return <Pill tone="green">{t.status}</Pill>;
                          if (s === "preparing" || s === "pending" || s === "pending cancellation") return <Pill tone="yellow">{t.status}</Pill>;
                          if (s === "failed" || s === "rejected" || s === "cancelled") return <Pill tone="red">{t.status}</Pill>;
                          if (s === "refunded") return <Pill tone="blue">{t.status}</Pill>;
                          return <Pill>{t.status}</Pill>;
                        })()}
                        {t.statusLC === "pending" && (
                          <div className="mt-2">
                            <button
                              onClick={() => openCancel(t)}
                              className="text-xs px-3 py-1.5 border border-red-300 text-red-700 rounded-md hover:bg-red-50"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>

        {/* Pagination */}
        {!isLoading && !friendlyError && total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs sm:text-sm text-gray-600 order-2 sm:order-1">
              Page {pageSafe} of {totalPages} • {total} record{total !== 1 ? 's' : ''}
            </div>
            <div className="flex items-center gap-2 order-1 sm:order-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pageSafe <= 1}
                className="inline-flex items-center gap-1 px-3 py-2 border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" /> 
                <span className="hidden sm:inline">Prev</span>
              </button>
              <div className="px-3 py-2 text-sm font-medium text-gray-700">
                {pageSafe}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={pageSafe >= totalPages}
                className="inline-flex items-center gap-1 px-3 py-2 border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      <BottomNav />

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="Order details">
          <div className="max-w-3xl w-full bg-white rounded-lg overflow-hidden shadow-lg">
            <div className="p-4 border-b flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-sm text-gray-500">Top-up by</div>
                <div className="text-lg font-semibold truncate">{selected.title || selected.name || "—"}</div>
                <div className="text-xs text-gray-400 truncate">{selected.id}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">Amount</div>
                <div className="text-lg font-bold">{peso.format(Number(selected.amount) || 0)}</div>
                <div className="mt-2"><Pill tone={selected.statusLC === "success" ? "green" : selected.statusLC === "pending" ? "yellow" : "gray"}>{selected.status}</Pill></div>
              </div>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-jckl-slate mb-2">Reference</div>
                <div className="p-3 border rounded break-words">{selected.id || "—"}</div>

                <div className="text-sm text-jckl-slate mt-3 mb-2">Products</div>
                <div className="p-3 border rounded break-words text-sm">{selected.products || "—"}</div>

                <div className="text-sm text-jckl-slate mt-3 mb-2">Notes</div>
                <div className="p-3 border rounded text-sm">{selected.raw?.note || selected.raw?.notes || "—"}</div>
              </div>

              <div className="hidden md:block">
                <div className="text-sm text-jckl-slate mb-2">Proof</div>
                {selected.raw?.proofUrl || selected.raw?.image || selected.raw?.proof ? (
                  // try multiple possible proof fields
                  <img
                    src={selected.raw?.proofUrl || selected.raw?.image || selected.raw?.proof}
                    alt="proof"
                    className="w-full h-56 object-contain rounded border"
                    loading="lazy"
                  />
                ) : (
                  <div className="p-6 border rounded text-sm text-gray-500">No proof image available.</div>
                )}
              </div>
            </div>

            <div className="p-4 border-t flex justify-between gap-2">
              <div className="flex gap-2">
                <button
                  onClick={() => navigator.clipboard?.writeText(String(selected.id || ""))}
                  className="px-3 py-2 border rounded"
                >
                  Copy Ref
                </button>
                <button
                  onClick={() => {
                    // open in new tab if there's a proof url
                    const u = selected.raw?.proofUrl || selected.raw?.image || selected.raw?.proof;
                    if (u) window.open(u, "_blank");
                  }}
                  className="hidden md:inline-flex px-3 py-2 border rounded"
                >
                  Open Proof
                </button>
              </div>
              <div>
                <button
                  ref={modalCloseRef}
                  onClick={() => setSelected(null)}
                  className="inline-flex items-center gap-2 px-3 py-2 border rounded"
                >
                  <X className="w-4 h-4" />
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel modal */}
      {cancelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="Cancel order">
          <div className="max-w-lg w-full bg-white rounded-lg overflow-hidden shadow-lg">
            <div className="p-4 border-b flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-lg font-semibold text-gray-900">Cancel Order</div>
                <div className="text-xs text-gray-500 truncate">{cancelTarget?.id}</div>
              </div>
              <button
                ref={cancelCloseRef}
                onClick={() => {
                  setCancelOpen(false);
                  setCancelTarget(null);
                  setCancelReason("");
                }}
                className="inline-flex items-center gap-2 px-3 py-2 border rounded"
              >
                <X className="w-4 h-4" />
                Close
              </button>
            </div>

            <div className="p-4">
              <div className="text-sm text-gray-700 mb-2">Please tell us why you want to cancel.</div>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Reason for cancellation"
              />
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setCancelOpen(false);
                    setCancelTarget(null);
                    setCancelReason("");
                  }}
                  className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={submitCancel}
                  className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700"
                >
                  Confirm Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
