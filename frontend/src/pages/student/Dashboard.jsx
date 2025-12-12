// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow, isValid, parseISO } from "date-fns";
import Navbar from "../../components/avbar";
import BottomNav from "../../components/mobile/BottomNav";
import { api, ApiError } from "../../lib/api";
import { refreshSessionForProtected } from "../../lib/auth";
import { getUserFromStorage, setUserToStorage, clearAllAuthStorage } from "../../lib/storage";
import { useModal } from "../../contexts/ModalContext";
import { CategoryIcon, getCategoryEmoji } from "../../lib/categories";
import {
  ShoppingBag,
  Wallet,
  ClipboardList,
  LogOut,
  ArrowRight,
  Clock,
  CheckCircle2,
  X,
  Facebook,
  Globe,
  ExternalLink,
  Info,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });

// Canonical status mapping for consistency
const STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  PREPARING: 'PREPARING',
  READY: 'READY',
  CLAIMED: 'CLAIMED',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  REJECTED: 'REJECTED',
};

const canonicalizeStatus = (rawStatus) => {
  const normalized = String(rawStatus || '').toUpperCase().trim();
  
  // Map backend variants to canonical statuses
  if (['PENDING', 'QUEUED', 'WAITING'].includes(normalized)) return STATUS.PENDING;
  if (['APPROVED', 'CONFIRMED', 'ACCEPTED'].includes(normalized)) return STATUS.APPROVED;
  if (['PREPARING', 'COOKING', 'IN_PROGRESS'].includes(normalized)) return STATUS.PREPARING;
  if (['READY', 'READY_FOR_PICKUP', 'DONE'].includes(normalized)) return STATUS.READY;
  if (['CLAIMED', 'PICKED_UP', 'COMPLETED'].includes(normalized)) return STATUS.CLAIMED;
  if (['SUCCESS', 'SUCCESSFUL', 'PAID'].includes(normalized)) return STATUS.SUCCESS;
  if (['FAILED', 'FAILURE', 'ERROR'].includes(normalized)) return STATUS.FAILED;
  if (['REJECTED', 'DECLINED', 'CANCELLED'].includes(normalized)) return STATUS.REJECTED;
  
  return STATUS.PENDING; // default fallback
};

const getStatusConfig = (status) => {
  const configs = {
    [STATUS.PENDING]: {
      label: 'Pending',
      className: 'bg-amber-50 text-amber-700 border-amber-200',
      ariaLabel: 'Order status: Pending approval',
    },
    [STATUS.APPROVED]: {
      label: 'Approved',
      className: 'bg-jckl-cream text-jckl-navy border-jckl-gold',
      ariaLabel: 'Order status: Approved, being prepared',
    },
    [STATUS.PREPARING]: {
      label: 'Preparing',
      className: 'bg-violet-50 text-violet-700 border-violet-200',
      ariaLabel: 'Order status: Currently being prepared',
    },
    [STATUS.READY]: {
      label: 'Ready',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      ariaLabel: 'Order status: Ready for pickup',
    },
    [STATUS.CLAIMED]: {
      label: 'Claimed',
      className: 'bg-jckl-cream text-jckl-navy border-jckl-gold',
      ariaLabel: 'Order status: Claimed and completed',
    },
    [STATUS.SUCCESS]: {
      label: 'Success',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      ariaLabel: 'Transaction status: Successful',
    },
    [STATUS.FAILED]: {
      label: 'Failed',
      className: 'bg-rose-50 text-rose-700 border-rose-200',
      ariaLabel: 'Transaction status: Failed',
    },
    [STATUS.REJECTED]: {
      label: 'Rejected',
      className: 'bg-rose-50 text-rose-700 border-rose-200',
      ariaLabel: 'Order status: Rejected',
    },
  };
  
  return configs[status] || configs[STATUS.PENDING];
};

// Format relative time with fallback for invalid dates
const formatRelativeTime = (timestamp) => {
  try {
    const date = typeof timestamp === 'string' ? parseISO(timestamp) : new Date(timestamp);
    if (!isValid(date)) {
      return { relative: 'Recently', full: 'Invalid date' };
    }
    return {
      relative: formatDistanceToNow(date, { addSuffix: true }),
      full: date.toLocaleString('en-PH', { 
        dateStyle: 'full', 
        timeStyle: 'medium' 
      }),
    };
  } catch (e) {
    console.warn('Invalid timestamp:', timestamp, e);
    return { relative: 'Recently', full: String(timestamp) };
  }
};

// ActivityItem Component - Clickable and keyboard accessible
const ActivityItem = ({ activity, onClick }) => {
  const canonical = canonicalizeStatus(activity.status);
  const statusConfig = getStatusConfig(canonical);
  const timeData = formatRelativeTime(activity.time);
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(activity);
    }
  };
  
  return (
    <li>
      <button
        onClick={() => onClick(activity)}
        onKeyDown={handleKeyDown}
        className="w-full py-3 flex items-center justify-between text-left hover:bg-jckl-cream rounded-lg px-2 -mx-2 transition focus-ring"
        aria-label={`View details for ${activity.title}, ${statusConfig.ariaLabel}, ${timeData.relative}`}
      >
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-jckl-navy truncate">
            {activity.title}
          </div>
          <div className="mt-1 text-xs text-gray-500 flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1" title={timeData.full}>
              <Clock className="w-3 h-3" />
              {timeData.relative}
            </span>
            <span 
              className={`inline-flex items-center px-2 py-0.5 rounded-full border ${statusConfig.className}`}
              aria-label={statusConfig.ariaLabel}
            >
              {statusConfig.label}
            </span>
            {activity.reference && (
              <span className="inline-flex items-center text-xs text-gray-400 font-mono" title="Transaction Reference">
                #{activity.reference}
              </span>
            )}
          </div>
        </div>
        <div className="text-sm font-semibold text-jckl-navy ml-4">
          {peso.format(activity.amount || 0)}
        </div>
      </button>
    </li>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { showConfirm } = useModal();
  
  // --- Ready orders notification ---
  const [dismissedReadyOrders, setDismissedReadyOrders] = useState(() => {
    // Session-based dismissal (cleared on page refresh)
    return sessionStorage.getItem('dismissedReadyOrders') === 'true';
  });

  useEffect(() => {
    (async () => {
      await refreshSessionForProtected({ navigate, requiredRole: 'student', setUser });
    })();
  }, [navigate]);

  // --- loading & error states ---
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true); // Track first load
  const [error, setError] = useState(null);

  // --- user & balance ---
  const [user, setUser] = useState(() => {
    return getUserFromStorage() || {};
  });

  const balance = useMemo(() => {
    const val = user?.balance;
    if (typeof val === "number") return val;
    if (val && !isNaN(parseFloat(val))) return parseFloat(val);
    return 0;
  }, [user]);

  // --- recent activity (orders / transactions) ---
  const [activity, setActivity] = useState([]);
  const [retryCount, setRetryCount] = useState(0);
  const abortControllerRef = React.useRef(null);

  // Categories derived from menu items that currently have stock
  const [adminCategories, setAdminCategories] = useState([]);

  useEffect(() => {
    let mounted = true;
    const loadCategories = async () => {
      try {
        // Fetch full category objects with icon data
        const data = await api.get("/categories");
        if (!mounted) return;
        
        if (Array.isArray(data) && data.length > 0) {
          // Store full category objects
          setAdminCategories(data);
        } else {
          // Fallback to defaults if no categories returned
          const defaults = [
            { name: "Meals", iconID: 0 },
            { name: "Snacks", iconID: 1 },
            { name: "Beverages", iconID: 2 }
          ];
          setAdminCategories(defaults);
        }
      } catch (e) {
        console.error("Failed to load categories", e);
        // Fallback to defaults
        const defaults = [
          { name: "Meals", iconID: 0 },
          { name: "Snacks", iconID: 1 },
          { name: "Beverages", iconID: 2 }
        ];
        if (mounted) {
          setAdminCategories(defaults);
        }
      }
    };

    loadCategories();
    const reload = () => loadCategories();

    window.addEventListener("categories:updated", reload);
    window.addEventListener("menu:updated", reload);

    return () => {
      mounted = false;
      window.removeEventListener("categories:updated", reload);
      window.removeEventListener("menu:updated", reload);
    };
  }, []);

  const fetchArr = async (path, signal) => {
    try {
      const data = await api.get(path, { signal });
      if (Array.isArray(data)) return data;
      return [];
    } catch(e) {
      // Don't process errors if request was aborted
      if (e.name === 'AbortError') {
        console.log(`Request to ${path} was aborted`);
        return [];
      }

      if (e instanceof ApiError) {
        switch (e.status) {
          case ApiError.Maintenance:  navigate("/status/maintenance");  break;
          case ApiError.NotFound:     navigate("/status/not_found");    break;
          case ApiError.ServerError:  navigate("/status/server_error"); break;
          case ApiError.Unauthorized: navigate("/status/unauthorized"); break;
          case ApiError.Forbidden:    navigate("/status/unauthorized"); break;
          default:
        }
      }

      throw e; // Re-throw for retry logic
    }
  };

  const loadActivity = async (signal) => {
    try {
      const [reservations, txs] = await Promise.all([
        fetchArr('/reservations/mine', signal), 
        fetchArr('/transactions/mine', signal)
      ]);

      const rows = [];

      if (Array.isArray(reservations) && reservations.length > 0) {
        for (const r of reservations) {
          rows.push({
            id: r.id || `R-${rows.length + 1}`,
            title: r.title || 'Reservation',
            amount: Math.abs(Number(r.total || r.amount || 0) || 0),
            time: r.createdAt || r.date || r.time || new Date().toISOString(),
            status: r.status || 'Pending',
            direction: 'debit',
            type: 'reservation',
            items: r.items || [],
            reference: r.id // Add reference for auditability
          });
        }
      }

      if (Array.isArray(txs) && txs.length > 0) {
        for (const t of txs) {
          const id = t.id || t.txId || `TX-${rows.length + 1}`;
          const direction = t.direction || 'debit';
          const ref = String(t.ref || t.reference || t.reservationId || '').toLowerCase();
          const isReservationRef = ref.includes('res') || ref.startsWith('r-');
          
          // Only include transactions that are related to orders
          if (isReservationRef || t.type === 'Reservation') {
            rows.push({
              id,
              title: t.title || t.type || 'Transaction',
              amount: Math.abs(Number(t.amount ?? t.total ?? t.value ?? 0) || 0),
              time: t.createdAt || t.time || t.date || new Date().toISOString(),
              status: t.status || t.state || 'Success',
              direction,
              type: 'transaction',
              reference: ref || id // Add reference for auditability
            });
          }
        }
      }

      // Sort by time desc
      rows.sort((a, b) => new Date(b.time) - new Date(a.time));
      
      // Only update state if not aborted
      if (!signal?.aborted) {
        setActivity(rows);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error("Failed to load activity:", err);
        if (!signal?.aborted) {
          setActivity([]);
        }
        throw err; // Re-throw for retry logic
      }
    }
  };

  // Keep wallet in sync with server (SERVER-TRUTH)
  const syncWallet = async (signal) => {
    try {
      // Prefer full user object from server. Some endpoints return { balance } only.
      // SERVER IS SOURCE OF TRUTH - always trust the API response
      const me = await api.get("/wallets/me", { signal });
      
      if (!signal?.aborted && me && (me.id || me.balance != null)) {
        const curLocal = getUserFromStorage() || {};
        const merged = { ...curLocal, ...(me || {}) };
        
        // Ensure balance is numeric - SERVER VALUE TAKES PRECEDENCE
        if (merged.balance && typeof merged.balance !== "number") {
          merged.balance = Number(merged.balance) || 0;
        }
        
        // Update localStorage as cache only
        setUserToStorage(merged);
        setUser(merged);
  
        // reload recent activity after wallet sync (user identity may have changed)
        await loadActivity(signal);
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.error("Failed to sync wallet:", e);
        throw e; // Re-throw for retry logic
      }
      // Ignore abort errors, keep local cached state
    }
  };

  // Exponential backoff retry logic
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  const loadDataWithRetry = async (signal, attempt = 0) => {
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second
    
    try {
      await Promise.all([
        loadActivity(signal),
        syncWallet(signal)
      ]);
      
      // Success - reset retry count
      if (!signal?.aborted) {
        setRetryCount(0);
      }
    } catch (err) {
      if (err.name === 'AbortError' || signal?.aborted) {
        return; // Don't retry if aborted
      }

      // Check if it's a 5xx server error that should be retried
      const isServerError = err instanceof ApiError && 
                           err.status >= 500 && 
                           err.status < 600;
      
      if (isServerError && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
        
        if (!signal?.aborted) {
          setRetryCount(attempt + 1);
        }
        
        await sleep(delay);
        
        if (!signal?.aborted) {
          return loadDataWithRetry(signal, attempt + 1);
        }
      } else {
        // Final failure or non-retryable error
        throw err;
      }
    }
  };

  useEffect(() => {
    // Create new AbortController for this effect
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        await loadDataWithRetry(signal, 0);
      } catch (err) {
        if (err.name !== 'AbortError' && !signal.aborted) {
          console.error("Failed to load dashboard data:", err);
          
          // User-friendly error messages
          let errorMessage = "Failed to load dashboard data. Please try again.";
          if (err instanceof ApiError) {
            if (err.status >= 500) {
              errorMessage = "Server is experiencing issues. We'll keep trying automatically.";
            } else if (err.status === 401 || err.status === 403) {
              errorMessage = "Session expired. Please log in again.";
            }
          } else if (err.message) {
            errorMessage = err.message;
          }
          
          setError(errorMessage);
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false);
          setInitialLoad(false); // Mark initial load complete
        }
      }
    };
    
    loadData();
    
    const onStorage = (e) => {
      if (["transactions", "orders", "user"].includes(e.key)) {
        if (e.key === "user") {
          try { 
            const newUser = JSON.parse(e.newValue || "{}");
            // Only update if not currently loading (avoid conflicts)
            if (!loading) {
              setUser(newUser);
            }
          } catch {}
        } else {
          // Re-fetch from server to get truth
          if (!loading && abortControllerRef.current) {
            loadActivity(abortControllerRef.current.signal);
          }
        }
      }
    };
    
    window.addEventListener("storage", onStorage);
    
    // Cleanup: abort all pending requests on unmount
    return () => {
      window.removeEventListener("storage", onStorage);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []); // Empty deps - only run on mount/unmount

  // --- derived stats (simple, school-friendly) ---
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Filter for current month's activity
    const thisMonth = activity.filter((a) => {
      const d = new Date(a.time);
      return !isNaN(d) && 
             d.getMonth() === currentMonth && 
             d.getFullYear() === currentYear;
    });

    // Only count orders that were Approved, Preparing, Ready, or Claimed
    const validStatuses = new Set(["Approved", "Preparing", "Ready", "Claimed"]);
    const validOrders = thisMonth.filter(a => validStatuses.has(a.status));
    const ordersCount = validOrders.length;

    // Only sum amounts for valid orders
    const totalSpent = validOrders.reduce((s, a) => s + (a.amount || 0), 0);

    // Count orders ready for pickup
    const readyCount = activity.filter((a) => canonicalizeStatus(a.status) === STATUS.READY).length;

    return { ordersCount, totalSpent, readyCount };
  }, [activity]);
  
  // Ready orders for callout
  const readyOrders = useMemo(() => {
    return activity.filter((a) => canonicalizeStatus(a.status) === STATUS.READY);
  }, [activity]);
  
  const showReadyOrdersBanner = readyOrders.length > 0 && !dismissedReadyOrders;
  
  const handleDismissReadyOrders = () => {
    setDismissedReadyOrders(true);
    sessionStorage.setItem('dismissedReadyOrders', 'true');
  };
  
  // Handle activity item click
  const handleActivityClick = (activity) => {
    // Navigate to transactions page and scroll to the specific transaction
    navigate(`/transactions?id=${activity.id}`);
  };

  // --- greeting ---
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // --- actions ---
  const handleLogout = async () => {
    const confirmed = await showConfirm(
      "Are you sure you want to logout?",
      "Confirm Logout"
    );
    
    if (!confirmed) return;
    
    clearAllAuthStorage();
    navigate("/login");
  };

  // how many recent activity items to show on dashboard
  const RECENT_LIMIT = 5;
  
  // slice for dashboard preview (show only latest RECENT_LIMIT)
  const recentPreview = activity.slice(0, RECENT_LIMIT);

  // --- Skeleton Components (for refreshes) ---
  const SkeletonWalletButton = () => (
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl animate-pulse">
      <div className="w-4 h-4 bg-gray-300 rounded"></div>
      <div className="w-24 h-4 bg-gray-300 rounded"></div>
    </div>
  );

  const SkeletonStatsCard = () => (
    <div className="rounded-2xl p-5 shadow-sm border border-gray-100 bg-white">
      <div className="w-32 h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
      <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
    </div>
  );

  const SkeletonActivityRow = () => (
    <li className="py-3 flex items-center justify-between">
      <div className="min-w-0 flex-1">
        <div className="w-48 h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
        <div className="w-32 h-3 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
    </li>
  );

  // --- Retry function ---
  const handleRetry = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new controller for retry
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    setLoading(true);
    setError(null);
    setRetryCount(0);
    
    try {
      await loadDataWithRetry(signal, 0);
    } catch (err) {
      if (err.name !== 'AbortError' && !signal.aborted) {
        console.error("Retry failed:", err);
        
        let errorMessage = "Failed to load dashboard data. Please try again.";
        if (err instanceof ApiError && err.status >= 500) {
          errorMessage = "Server is still experiencing issues. Please try again later.";
        }
        
        setError(errorMessage);
      }
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  };

  // Full-screen loading overlay (ONLY on initial load)
  if (loading && initialLoad) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-24 w-24 border-4 border-gray-200 border-t-blue-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <img 
              src="/jckl-192.png" 
              alt="JCKL Academy Logo" 
              className="w-16 h-16 rounded-xl"
            />
          </div>
        </div>
        <p className="mt-6 text-jckl-slate font-medium animate-pulse">
          Loading your dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-16 md:pb-0">
      <Navbar />

      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-3 sm:py-8 space-y-3 sm:space-y-8">
        {/* Error Banner */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start justify-between" role="alert">
            <div className="flex-1">
              <h3 className="font-semibold text-rose-900 mb-1">Error Loading Dashboard</h3>
              <p className="text-sm text-rose-700">{error}</p>
              {retryCount > 0 && (
                <p className="text-xs text-rose-600 mt-1">
                  Auto-retry attempt {retryCount}/3 failed
                </p>
              )}
            </div>
            <button
              onClick={handleRetry}
              className="ml-4 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition font-medium text-sm focus-ring-white"
            >
              Retry Now
            </button>
          </div>
        )}

        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-jckl-navy">
              {greeting}, {user?.name || "Student"}
            </h1>
            <p className="text-xs sm:text-base text-white">Reserve ahead and skip the line.</p>
          </div>

          {loading && !initialLoad ? (
            <SkeletonWalletButton />
          ) : (
            <button
              onClick={() => navigate("/profile")}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-white border border-jckl-gold rounded-lg sm:rounded-xl shadow-sm hover:shadow-md transition font-medium text-sm sm:text-base text-jckl-navy focus-ring"
            >
              <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
              <span className="text-xs sm:text-sm">Wallet:</span> <span className="font-semibold text-xs sm:text-base">{peso.format(balance)}</span>
            </button>
          )}
        </header>

        {/* Quick Actions */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          <button
            onClick={() => navigate("/shop")}
            className="bg-white rounded-lg sm:rounded-2xl p-3 sm:p-6 shadow-sm hover:shadow-md transition border border-gray-100 text-left focus-ring">
            <div className="flex items-center gap-1.5 sm:gap-3">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-jckl-cream flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 sm:w-6 sm:h-6 text-jckl-navy" />
              </div>
              <div>
                <h3 className="text-xs sm:text-base font-semibold text-jckl-navy">Order Food</h3>
                <p className="text-[10px] sm:text-sm text-jckl-slate">Browse menu</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate("/topup")}
            className="bg-white rounded-lg sm:rounded-2xl p-3 sm:p-6 shadow-sm hover:shadow-md transition border border-gray-100 text-left focus-ring"
          >
            <div className="flex items-center gap-1.5 sm:gap-3">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-emerald-50 flex items-center justify-center">
                <Wallet className="w-4 h-4 sm:w-6 sm:h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xs sm:text-base font-semibold text-jckl-navy">Top-Up</h3>
                <p className="text-[10px] sm:text-sm text-gray-500 hidden sm:block">Add balance via QR</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate("/transactions")}
            className="bg-white rounded-lg sm:rounded-2xl p-3 sm:p-6 shadow-sm hover:shadow-md transition border border-gray-100 text-left focus-ring"
          >
            <div className="flex items-center gap-1.5 sm:gap-3">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-violet-50 flex items-center justify-center">
                <ClipboardList className="w-4 h-4 sm:w-6 sm:h-6 text-violet-600" />
              </div>
              <div>
                <h3 className="text-xs sm:text-base font-semibold text-jckl-navy">History</h3>
                <p className="text-[10px] sm:text-sm text-gray-500 hidden sm:block">View orders & top-ups</p>
              </div>
            </div>
          </button>

          <button
            onClick={handleLogout}
            className="bg-white rounded-lg sm:rounded-2xl p-3 sm:p-6 shadow-sm hover:shadow-md transition border border-gray-100 text-left focus-ring"
          >
            <div className="flex items-center gap-1.5 sm:gap-3">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-jckl-cream flex items-center justify-center">
                <LogOut className="w-4 h-4 sm:w-6 sm:h-6 text-jckl-navy" />
              </div>
              <div>
                <h3 className="text-xs sm:text-base font-semibold text-jckl-navy">Logout</h3>
                <p className="text-[10px] sm:text-sm text-gray-500 hidden sm:block">Sign out of your account</p>
              </div>
            </div>
          </button>
        </section>

        {/* Stats (neutral, no "member status") */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
          {loading && !initialLoad ? (
            <>
              <SkeletonStatsCard />
              <SkeletonStatsCard />
              <SkeletonStatsCard />
            </>
          ) : (
            <>
              <div className="rounded-lg sm:rounded-2xl p-3 sm:p-5 shadow-sm border border-gray-100 bg-white">
                <p className="text-[10px] sm:text-sm text-jckl-slate">Orders this month</p>
                <p className="mt-1 text-xl sm:text-3xl font-bold text-jckl-navy">{stats.ordersCount}</p>
              </div>
              <div className="rounded-lg sm:rounded-2xl p-3 sm:p-5 shadow-sm border border-gray-100 bg-white">
                <p className="text-[10px] sm:text-sm text-jckl-slate">Total spent this month</p>
                <p className="mt-1 text-xl sm:text-3xl font-bold text-jckl-navy">
                  {peso.format(stats.totalSpent)}
                </p>
              </div>
              <div className="rounded-lg sm:rounded-2xl p-3 sm:p-5 shadow-sm border border-gray-100 bg-white">
                <p className="text-[10px] sm:text-sm text-jckl-slate">Ready for pickup</p>
                <p className="mt-1 text-xl sm:text-3xl font-bold text-jckl-navy">{stats.readyCount}</p>
              </div>
            </>
          )}
        </section>

        {/* Ready Orders Callout Banner */}
        {showReadyOrdersBanner && (
          <section 
            className="bg-emerald-50 border border-emerald-200 rounded-lg sm:rounded-2xl p-3 sm:p-4 shadow-sm"
            role="status"
            aria-live="polite"
            aria-label={`You have ${readyOrders.length} order${readyOrders.length > 1 ? 's' : ''} ready for pickup`}
          >
            <div className="flex items-start justify-between gap-2 sm:gap-4">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-emerald-900 mb-1">
                    🎉 {readyOrders.length} Order{readyOrders.length > 1 ? 's' : ''} Ready for Pickup!
                  </h3>
                  <p className="text-xs sm:text-sm text-emerald-700">
                    Your food is ready. Please proceed to the canteen counter to claim your order.
                  </p>
                  {readyOrders.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {readyOrders.slice(0, 3).map((order) => (
                        <li key={order.id} className="text-[10px] sm:text-xs text-emerald-600">
                          • {order.title} - {peso.format(order.amount)}
                        </li>
                      ))}
                      {readyOrders.length > 3 && (
                        <li className="text-xs text-emerald-600">
                          • And {readyOrders.length - 3} more...
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              </div>
              <button
                onClick={handleDismissReadyOrders}
                className="text-emerald-700 hover:text-emerald-900 p-1 rounded focus-ring"
                aria-label="Dismiss ready orders notification"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </section>
        )}

        {/* Recent Activity */}
        <section className="bg-white rounded-lg sm:rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div>
              <h2 className="text-base sm:text-xl font-bold text-jckl-navy">Recent Activity</h2>
              {!loading && (
                <div className="text-xs sm:text-sm text-gray-500">Showing {recentPreview.length} of {activity.length} recent items</div>
              )}
            </div>
            <button
              onClick={() => navigate("/transactions")}
              className="text-xs sm:text-sm text-jckl-navy hover:text-jckl-light-navy inline-flex items-center gap-1 focus-ring"
            >
              See all <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>

          {loading && !initialLoad ? (
            <ul className="divide-y divide-gray-100">
              <SkeletonActivityRow />
              <SkeletonActivityRow />
              <SkeletonActivityRow />
              <SkeletonActivityRow />
              <SkeletonActivityRow />
            </ul>
          ) : activity.length === 0 ? (
            <div className="bg-jckl-cream rounded-lg sm:rounded-xl p-4 sm:p-8 text-center border-t-4 border-jckl-gold">
              <div className="w-12 h-12 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 bg-jckl-gold rounded-full flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 sm:w-10 sm:h-10 text-jckl-navy" />
              </div>
              <h3 className="text-sm sm:text-lg font-bold text-jckl-navy mb-1 sm:mb-2">Welcome to JCKL Canteen!</h3>
              <p className="text-xs sm:text-base text-jckl-slate mb-4 sm:mb-6">
                Pre-order your meals and skip the lunch rush. Your first order gets priority handling!
              </p>
              <button
                onClick={() => navigate('/shop')}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-jckl-navy text-white rounded-lg sm:rounded-xl text-xs sm:text-base font-medium hover:bg-jckl-light-navy transition focus-ring"
              >
                Browse Menu <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
           ) : (
             <ul className="divide-y divide-gray-100">
              {recentPreview.map((a) => (
                <ActivityItem 
                  key={a.id} 
                  activity={a} 
                  onClick={handleActivityClick}
                />
              ))}
             </ul>
           )}
        </section>

        {/* Categories quick access - now functional with URL params */}
        <section>
          <h2 className="text-base sm:text-xl font-bold text-jckl-navy mb-2 sm:mb-4">Categories</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-1.5 sm:gap-4">
            {adminCategories.map((c) => {
              const catName = typeof c === 'string' ? c : (c && c.name) || '';
              const iconID = (c && typeof c === 'object' && typeof c.iconID === 'number') ? c.iconID : 0;
              return (
                <button
                  key={catName}
                  onClick={() => navigate(`/shop?category=${encodeURIComponent(catName)}`)}
                  className="bg-white rounded-lg sm:rounded-2xl p-2 sm:p-6 shadow-sm hover:shadow-md transition border border-gray-100 text-center focus-ring"
                >
                  <div className="mx-auto mb-1 sm:mb-3 w-6 h-6 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gray-100 flex items-center justify-center text-xl sm:text-3xl">
                    {getCategoryEmoji(catName, iconID)}
                  </div>
                  <div className="text-[10px] sm:text-sm font-medium text-jckl-navy">{catName}</div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Break Time Policy Section */}
        <section className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg sm:rounded-2xl shadow-sm border border-blue-200 p-4 sm:p-6">
          <div className="mb-4">
            <h2 className="text-base sm:text-xl font-bold text-jckl-navy mb-1">Optimized for JCKL Break Schedules</h2>
            <p className="text-xs sm:text-sm text-gray-600">Our system works seamlessly with your existing break time intervals</p>
          </div>

          {/* Break Schedule Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-4">
            {/* Elementary */}
            <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border-l-4 border-blue-500 shadow-sm">
              <div className="text-xs sm:text-sm font-bold text-blue-600 mb-1">2-6</div>
              <div className="text-[10px] sm:text-xs font-semibold text-gray-900 mb-2">Elementary</div>
              <div className="space-y-1">
                <div className="text-[9px] sm:text-xs text-gray-600">9:15 - 9:30 AM</div>
                <div className="text-[9px] sm:text-xs text-gray-600">11:00 AM - 12:00 NN</div>
              </div>
            </div>

            {/* Junior High */}
            <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border-l-4 border-green-500 shadow-sm">
              <div className="text-xs sm:text-sm font-bold text-green-600 mb-1">JHS</div>
              <div className="text-[10px] sm:text-xs font-semibold text-gray-900 mb-2">Junior High</div>
              <div className="space-y-1">
                <div className="text-[9px] sm:text-xs text-gray-600">9:30 - 9:45 AM</div>
                <div className="text-[9px] sm:text-xs text-gray-600">1:00 - 1:20 PM</div>
              </div>
            </div>

            {/* Senior High */}
            <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border-l-4 border-amber-500 shadow-sm">
              <div className="text-xs sm:text-sm font-bold text-amber-600 mb-1">SHS</div>
              <div className="text-[10px] sm:text-xs font-semibold text-gray-900 mb-2">Senior High</div>
              <div className="space-y-1">
                <div className="text-[9px] sm:text-xs text-gray-600">9:45 - 10:00 AM</div>
                <div className="text-[9px] sm:text-xs text-gray-600">1:20 - 1:40 PM</div>
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <div className="flex items-start gap-2 p-3 bg-blue-100 border border-blue-300 rounded-lg">
            <Info className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-blue-900">Orders are only claimable during your designated time slot</p>
          </div>
        </section>

        {/* Important Pickup Rules Section */}
        <section className="bg-jckl-cream rounded-lg sm:rounded-2xl shadow-sm border-l-4 border-jckl-gold p-4 sm:p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-jckl-gold flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-jckl-navy" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-jckl-navy">Important Pickup Rules</h2>
          </div>
          
          <ul className="space-y-2 sm:space-y-3">
            <li className="flex items-start gap-2 sm:gap-3 text-sm sm:text-base">
              <span className="text-jckl-gold font-bold mt-0.5">•</span>
              <span className="text-jckl-navy">Orders can <span className="font-semibold">only be claimed during your designated time slot</span>.</span>
            </li>
            <li className="flex items-start gap-2 sm:gap-3 text-sm sm:text-base">
              <span className="text-jckl-gold font-bold mt-0.5">•</span>
              <span className="text-jckl-navy">You must present your <span className="font-semibold">QR code</span> at the canteen counter for verification.</span>
            </li>
            <li className="flex items-start gap-2 sm:gap-3 text-sm sm:text-base">
              <span className="text-jckl-gold font-bold mt-0.5">•</span>
              <span className="text-jckl-navy">Orders not picked up during the assigned slot may be <span className="font-semibold">forfeited</span> to prevent food waste.</span>
            </li>
            <li className="flex items-start gap-2 sm:gap-3 text-sm sm:text-base">
              <span className="text-jckl-gold font-bold mt-0.5">•</span>
              <span className="text-jckl-navy">Pre order at least <span className="font-semibold">30 minutes before</span> your break time for preparation.</span>
            </li>
          </ul>
        </section>

        {/* Benefits of the System Section */}
        <section className="bg-white rounded-lg sm:rounded-2xl shadow-sm border-t-4 border-jckl-navy p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold text-jckl-navy mb-4">Benefits of the System</h2>
          
          <ul className="space-y-2 sm:space-y-3">
            <li className="flex items-start gap-2 sm:gap-3 text-sm sm:text-base">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-jckl-gold flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-jckl-navy">No waiting in line</span>
                <span className="text-gray-600"> – skip the queue and maximize your break time</span>
              </div>
            </li>
            <li className="flex items-start gap-2 sm:gap-3 text-sm sm:text-base">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-jckl-gold flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-jckl-navy">Guaranteed meal availability</span>
                <span className="text-gray-600"> – your food is reserved when you order</span>
              </div>
            </li>
            <li className="flex items-start gap-2 sm:gap-3 text-sm sm:text-base">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-jckl-gold flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-jckl-navy">Cashless convenience</span>
                <span className="text-gray-600"> – no need to bring physical money to school</span>
              </div>
            </li>
            <li className="flex items-start gap-2 sm:gap-3 text-sm sm:text-base">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-jckl-gold flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-jckl-navy">Parental monitoring</span>
                <span className="text-gray-600"> – parents can track spending and set limits</span>
              </div>
            </li>
            <li className="flex items-start gap-2 sm:gap-3 text-sm sm:text-base">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-jckl-gold flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-jckl-navy">Reduced food waste</span>
                <span className="text-gray-600"> – accurate forecasting prevents over-preparation</span>
              </div>
            </li>
          </ul>
        </section>

        {/* Social Links Section - Polished like major apps */}
        <section className="bg-gradient-to-br from-jckl-cream to-jckl-cream rounded-lg sm:rounded-2xl shadow-sm border border-jckl-gold p-4 sm:p-6">
          <div className="text-center mb-4">
            <h2 className="text-base sm:text-lg font-bold text-jckl-navy mb-1">Connect with JCKL Academy</h2>
            <p className="text-xs sm:text-sm text-jckl-slate">Stay updated with school news and announcements</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="https://www.facebook.com/JCKLAcademy"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto group flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-white hover:bg-jckl-cream border border-jckl-gold hover:border-jckl-gold rounded-xl shadow-sm hover:shadow-md transition-all duration-200 focus-ring"
              aria-label="Visit JCKL Academy Facebook page"
            >
              <div className="w-8 h-8 bg-jckl-navy rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Facebook className="w-5 h-5 text-white" fill="white" />
              </div>
              <div className="text-left flex-1">
                <div className="text-sm font-semibold text-jckl-navy">Facebook</div>
                <div className="text-xs text-jckl-slate">@JCKLAcademy</div>
              </div>
              <ExternalLink className="w-4 h-4 text-jckl-slate group-hover:text-jckl-navy transition-colors" />
            </a>

            <a
              href="https://www.jcklacademy.edu.ph/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto group flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-white hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 focus-ring"
              aria-label="Visit JCKL Academy official website"
            >
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div className="text-left flex-1">
                <div className="text-sm font-semibold text-jckl-navy">Official Website</div>
                <div className="text-xs text-jckl-slate">jcklacademy.edu.ph</div>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors" />
            </a>
          </div>
        </section>
      </main>
      
      <BottomNav />
    </div>
  );
}