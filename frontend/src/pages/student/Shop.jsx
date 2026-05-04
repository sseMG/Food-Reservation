// src/pages/Shop.jsx - FIXED VERSION
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { refreshSessionForProtected } from "../../lib/auth";
import Navbar from "../../components/avbar";
import BottomNav from "../../components/mobile/BottomNav";
import FullScreenLoader from "../../components/FullScreenLoader";
import RestrictedDateCalendar from "../../components/RestrictedDateCalendar";
import { api } from "../../lib/api";
import { getCategoryEmoji } from '../../lib/categories';
import { useCart } from "../../contexts/CartContext";
import { useModal } from "../../contexts/ModalContext";
import { useReservation } from "../../contexts/ReservationContext";
import { getUserFromStorage, setUserToStorage } from "../../lib/storage";

import {
  Plus,
  Minus,
  ShoppingCart,
  Search,
  Clock,
  X,
  CheckCircle2,
  RefreshCw,
  Filter,
  Wallet,
  AlertTriangle,
  Eye,
  ChevronDown,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Menu,
  Home,
  Info,
  LogIn,
  UserPlus,
} from "lucide-react";

const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });

const SLOTS = [
  { id: "recess", label: "Recess" },
  { id: "lunch", label: "Lunch" },
  { id: "after", label: "After Class" },
];

// Grade-specific pickup times
const getPickupTimes = (grade) => {
  if (!grade) return {};
  
  const gradeNum = parseInt(grade.replace('G', ''));
  
  if (gradeNum >= 2 && gradeNum <= 6) {
    return {
      recess: "9:15 AM - 9:30 AM",
      lunch: "11:00 AM - 12:00 PM",
      after: "After Class"
    };
  } else if (gradeNum >= 7 && gradeNum <= 10) {
    return {
      recess: "9:30 AM - 9:45 AM",
      lunch: "1:00 PM - 1:20 PM",
      after: "After Class"
    };
  } else if (gradeNum >= 11 && gradeNum <= 12) {
    return {
      recess: "9:45 AM - 10:00 AM",
      lunch: "1:20 PM - 1:40 PM",
      after: "After Class"
    };
  }
  
  return {};
};

// For icon mapping we use the shared FOOD_ICONS and CategoryIcon

function GuestHeader({ mobileMenuOpen, setMobileMenuOpen }) {
  return (
    <>
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
          <div className="h-14 sm:h-16 flex items-center justify-between gap-2">
            <a href="/" className="inline-flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink">
              <img src="/jckl-192.png" alt="JCKL" className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex-shrink-0" />
              <div className="min-w-0">
                <span className="hidden xl:inline text-[15px] font-semibold text-jckl-navy">Jesus Christ King of Kings and Lord of Lords Academy Inc.</span>
                <span className="hidden md:inline xl:hidden text-[15px] font-semibold text-jckl-navy truncate max-w-[520px]">Jesus Christ King of Kings and Lord of Lords Academy Inc.</span>
                <span className="md:hidden text-xs sm:text-sm font-semibold text-jckl-navy">JCKL Academy</span>
              </div>
            </a>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <a href="/register" className="hidden sm:inline text-xs sm:text-sm text-jckl-slate hover:text-jckl-navy">Create Account</a>
              <a href="/login" className="text-xs sm:text-sm text-jckl-navy hover:text-jckl-light-navy font-medium hidden sm:inline">Log In</a>
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden p-2 rounded-lg hover:bg-jckl-cream text-jckl-navy transition-colors"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-30 sm:hidden" onClick={() => setMobileMenuOpen(false)} />
          <nav className="fixed top-14 left-0 right-0 bg-white border-b border-jckl-gold z-40 sm:hidden shadow-lg">
            <div className="px-4 py-3 space-y-2">
              <a
                href="/"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Home className="w-5 h-5" />
                <span className="text-sm font-medium">Home</span>
              </a>
              <a
                href="/about"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Info className="w-5 h-5" />
                <span className="text-sm font-medium">About Us</span>
              </a>
              <a
                href="/login"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <LogIn className="w-5 h-5" />
                <span className="text-sm font-medium">Log In</span>
              </a>
              <a
                href="/register"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-jckl-navy hover:bg-jckl-cream transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                <UserPlus className="w-5 h-5" />
                <span className="text-sm font-medium">Create Account</span>
              </a>
            </div>
          </nav>
        </>
      )}
    </>
  );
}

function Toast({ message, visible, onClose }) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 2000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed top-20 right-4 z-50 animate-slide-in-right">
      <div className="bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5" />
        <span className="font-medium">{message}</span>
      </div>
    </div>
  );
}

function EmptyCartSuggestions({ items, onAdd, categoriesMap = {}, show = true, selectedSlot = null }) {
  const popularItems = useMemo(() => {
    const currentDay = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    return items
      .filter(i => i.stock > 0)
      .filter(i => {
        // Check if item is available on current day
        const availableDays = i.availableDays || [];
        const dayMatch = availableDays.length === 0 || availableDays.includes(currentDay);
        
        // Check if item is available in selected slot
        const availableSlots = i.availableSlots || [];
        const slotMatch = availableSlots.length === 0 || availableSlots.includes(selectedSlot);
        
        return dayMatch && slotMatch;
      })
      .sort((a, b) => a.price - b.price)
      .slice(0, 3);
  }, [items, selectedSlot]);

  if (popularItems.length === 0 || !show) return null;

  return (
    <div className="py-4 space-y-3">
      <div className="text-xs font-medium text-jckl-slate uppercase tracking-wide">
        Popular items
      </div>
      {popularItems.map(item => (
        <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-jckl-cream transition">
          <div className="w-12 h-12 rounded bg-jckl-cream flex items-center justify-center flex-shrink-0 text-jckl-navy">
            {item.img ? (
              <img src={item.img} alt={item.name} className="w-full h-full object-cover rounded" />
            ) : (
              <span className="text-xl">{getCategoryEmoji(item.category, item.iconID ?? categoriesMap[item.category])}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-jckl-navy truncate">{item.name}</div>
            <div className="text-xs text-jckl-slate">{peso.format(item.price)}</div>
          </div>
          <button
            onClick={() => onAdd(item.id)}
            className="p-2 bg-jckl-navy text-white rounded-lg hover:bg-jckl-light-navy transition"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

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

function isOrderAllowed(pickupDateStr, cutoff) {
  if (!cutoff || !cutoff.cutoffTime) return true;
  const [h, m] = cutoff.cutoffTime.split(':').map(Number);
  const advance = cutoff.advanceDaysRequired ?? 1;
  const pickup = new Date(pickupDateStr + 'T00:00:00+08:00');
  const deadline = new Date(pickup);
  deadline.setDate(deadline.getDate() - advance);
  deadline.setHours(h, m, 0, 0);
  const nowManila = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' })
  );
  return nowManila < deadline;
}

function getCutoffDeadlineLabel(pickupDateStr, cutoff) {
  if (!cutoff || !cutoff.cutoffTime) return null;
  const [h, m] = cutoff.cutoffTime.split(':').map(Number);
  const advance = cutoff.advanceDaysRequired ?? 1;
  const pickup = new Date(pickupDateStr + 'T00:00:00+08:00');
  const deadline = new Date(pickup);
  deadline.setDate(deadline.getDate() - advance);
  deadline.setHours(h, m, 0, 0);
  const time = deadline.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
    timeZone: 'Asia/Manila'
  });
  const date = deadline.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    timeZone: 'Asia/Manila'
  });
  return `Order by ${time}, ${date}`;
}

function getCutoffCountdown(pickupDateStr, cutoff) {
  if (!cutoff || !cutoff.cutoffTime) return null;
  const [h, m] = cutoff.cutoffTime.split(':').map(Number);
  const advance = cutoff.advanceDaysRequired ?? 1;
  const pickup = new Date(pickupDateStr + 'T00:00:00+08:00');
  const deadline = new Date(pickup);
  deadline.setDate(deadline.getDate() - advance);
  deadline.setHours(h, m, 0, 0);
  const nowManila = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' })
  );
  const diff = deadline - nowManila;
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function Shop({ publicView = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { showAlert, showConfirm } = useModal();
  const { reservation, setReservationDetails } = useReservation();
  const [searchParams] = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [showShopNote, setShowShopNote] = useState(false);
  
  useEffect(() => {
    if (publicView) return;
    (async () => {
      await refreshSessionForProtected({ navigate, requiredRole: "student" });
    })();
  }, [navigate, publicView]);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  // categories list and lookup (from public categories endpoint)
  const [categoriesList, setCategoriesList] = useState([]);
  const categoriesMap = useMemo(() => {
    const map = {};
    if (Array.isArray(categoriesList)) {
      categoriesList.forEach(c => {
        if (typeof c.name === 'string') map[c.name] = c.iconID;
      });
    }
    return map;
  }, [categoriesList]);

  const [wallet, setWallet] = useState({ balance: 0 });
  const [loadingWallet, setLoadingWallet] = useState(true);

  const urlCategory = searchParams.get('category');
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [category, setCategory] = useState(urlCategory || "all");
  const [sort, setSort] = useState("featured");

  const [scrolled, setScrolled] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "" });
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  const { cart, add, setQty, remove, clear } = useCart();

  const [open, setOpen] = useState(false);
  const [reserve, setReserve] = useState({ grade: "", section: "", pickupDate: "", slot: "", note: "" });
  const [submitting, setSubmitting] = useState(false);

  const [dateRestrictions, setDateRestrictions] = useState({ ranges: [], months: [], weekdays: [] });
  const [globalCutoff, setGlobalCutoff] = useState(null);
  const [cutoffCountdown, setCutoffCountdown] = useState(null);

  const [preview, setPreview] = useState(null);
  const [showPickupDatePopup, setShowPickupDatePopup] = useState(false);

  const filterBarRef = useRef(null);
  const menuGridRef = useRef(null);

  // Prevent body scroll when preview modal is open
  useEffect(() => {
    if (!preview) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [preview]);

  useEffect(() => {
    if (publicView) return;
    if (location?.pathname !== "/shop") return;
    setShowShopNote(true);
  }, [publicView, location?.pathname]);

  useEffect(() => {
    if (!showShopNote) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [showShopNote]);

  const closeShopNote = () => {
    setShowShopNote(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (publicView) return;
    let mounted = true;
    (async () => {
      try {
        const r = await api.get("/reservations/date-restrictions");
        if (!mounted) return;
        setDateRestrictions({
          ranges: Array.isArray(r?.ranges) ? r.ranges : [],
          months: Array.isArray(r?.months) ? r.months : [],
          weekdays: Array.isArray(r?.weekdays) ? r.weekdays : [],
        });
        setGlobalCutoff(r?.orderCutoff ?? null);
      } catch (e) {
        // silent fail: backend will still enforce
      }
    })();
    return () => {
      mounted = false;
    };
  }, [publicView]);

  useEffect(() => {
    const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    setRecentlyViewed(viewed);
    
    const handleLogout = () => {
      localStorage.removeItem('recentlyViewed');
      setRecentlyViewed([]);
    };
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  const addToRecentlyViewed = (itemId) => {
    const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    const filtered = viewed.filter(id => id !== itemId);
    const updated = [itemId, ...filtered].slice(0, 5);
    localStorage.setItem('recentlyViewed', JSON.stringify(updated));
    setRecentlyViewed(updated);
  };

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const data = await api.getMenu(false);
      const rows = Array.isArray(data) ? data : [];
      const visibleRows = rows.filter((r) => r.visible !== false);
      setItems(visibleRows);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const fetchWallet = async () => {
    setLoadingWallet(true);
    try {
      if (publicView) {
        setWallet({ balance: 0 });
        return;
      }
      const w = await api.get("/wallets/me");
      const val = w || {};
      const bal = Number(val.balance) || 0;
      setWallet({ balance: bal });
      const u = getUserFromStorage();
      if (u && u.id) {
        u.balance = bal;
        setUserToStorage(u);
      }
    } catch (e) {
      setWallet({ balance: 0 });
    } finally {
      setLoadingWallet(false);
    }
  };

  useEffect(() => {
    fetchMenu();
    fetchWallet();
    let t = null;
    const onMenuUpdated = () => {
      if (t) clearTimeout(t);
      t = setTimeout(() => fetchMenu(), 150);
    };
    window.addEventListener("menu:updated", onMenuUpdated);
    return () => {
      window.removeEventListener("menu:updated", onMenuUpdated);
      if (t) clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadCategories = async () => {
      try {
        const data = await api.get('/categories');
        if (!mounted) return;
        const rows = Array.isArray(data) ? data : [];
        setCategoriesList(rows);
      } catch (err) {
        console.error('Failed to fetch categories', err);
        if (mounted) setCategoriesList([]);
      }
    };

    loadCategories();
    window.addEventListener('categories:updated', loadCategories);
    return () => {
      mounted = false;
      window.removeEventListener('categories:updated', loadCategories);
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim().toLowerCase()), 200);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (!open) return;
    const u = getUserFromStorage() || {};
    setReserve((r) => ({
      ...r,
      grade: r.grade || u.grade || "",
      section: r.section || u.section || "",
    }));
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!globalCutoff || !reserve.pickupDate) {
      setCutoffCountdown(null);
      return;
    }
    const update = () => {
      setCutoffCountdown(
        getCutoffCountdown(reserve.pickupDate, globalCutoff)
      );
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [globalCutoff, reserve.pickupDate]);

  // Deadline notifications
  useEffect(() => {
    if (!globalCutoff || !globalCutoff.cutoffTime) return;

    const checkNotifications = () => {
      const nowManila = new Date(
        new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' })
      );
      
      // Check for urgent deadlines (under 2 hours)
      for (let i = 1; i <= 7; i++) {
        const checkDate = new Date(nowManila);
        checkDate.setDate(checkDate.getDate() + i);
        checkDate.setHours(0, 0, 0, 0);
        
        const dateStr = [
          checkDate.getFullYear(),
          String(checkDate.getMonth() + 1).padStart(2, "0"),
          String(checkDate.getDate()).padStart(2, "0")
        ].join('-');
        
        if (isOrderAllowed(dateStr, globalCutoff)) {
          const [h, m] = globalCutoff.cutoffTime.split(':').map(Number);
          const advance = globalCutoff.advanceDaysRequired ?? 1;
          const deadline = new Date(checkDate);
          deadline.setDate(deadline.getDate() - advance);
          deadline.setHours(h, m, 0, 0);
          
          const diff = deadline - nowManila;
          const hours = Math.floor(diff / 3600000);
          
          // Show notification for deadlines under 2 hours
          if (hours > 0 && hours < 2) {
            const notificationKey = `urgent-${dateStr}`;
            const lastShown = localStorage.getItem(notificationKey);
            const now = Date.now();
            
            if (!lastShown || (now - parseInt(lastShown)) > 30 * 60 * 1000) { // Don't show more than once per 30 minutes
              localStorage.setItem(notificationKey, now.toString());
              
              // Show toast notification
              showToast({
                visible: true,
                message: `⚠️ Order deadline approaching! ${dateStr} orders close in ${Math.ceil(hours * 60)} minutes`,
                type: 'warning'
              });
              
              // Request browser notification permission
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Order Deadline Approaching', {
                  body: `${dateStr} orders close in ${Math.ceil(hours * 60)} minutes`,
                  icon: '/jckl-192.png'
                });
              }
            }
          }
        }
      }
    };

    // Check notifications every 5 minutes
    const notificationInterval = setInterval(checkNotifications, 5 * 60 * 1000);
    
    return () => {
      clearInterval(notificationInterval);
    };
  }, [globalCutoff]);

  useEffect(() => {
    if (!mobileCartOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileCartOpen]);

  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [items]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    
    // Count search filter
    if (debouncedQ) count++;
    
    // Count category filter
    if (category !== "all") count++;
    
    // Count sort filter
    if (sort !== "featured") count++;
    
    // Count pickup details filters
    if (reservation.pickupDate && reservation.slot) {
      const pickupDate = new Date(reservation.pickupDate);
      const pickupDay = pickupDate.getDay();
      
      // Check if any products are actually filtered by day availability
      const hasDayFilter = items.some(item => {
        const availableDays = item.availableDays || [];
        return availableDays.length > 0 && !availableDays.includes(pickupDay);
      });
      
      // Check if any products are actually filtered by slot availability
      const hasSlotFilter = items.some(item => {
        const availableSlots = item.availableSlots || [];
        return availableSlots.length > 0 && !availableSlots.includes(reservation.slot);
      });
      
      if (hasDayFilter) count++;
      if (hasSlotFilter) count++;
    }
    
    return count;
  }, [debouncedQ, category, sort, reservation.pickupDate, reservation.slot, items]);

  const catCounts = useMemo(() => {
    // First apply the same filtering logic as the filtered items
    let availableItems = items.slice(0);
    
    if (debouncedQ) {
      availableItems = availableItems.filter(
        (i) =>
          String(i.name || "").toLowerCase().includes(debouncedQ) ||
          String(i.category || "").toLowerCase().includes(debouncedQ)
      );
    }
    if (category !== "all") availableItems = availableItems.filter((i) => i.category === category);
    
    // Filter by pickup details if they are selected
    if (reservation.pickupDate && reservation.slot) {
      const pickupDate = new Date(reservation.pickupDate);
      const pickupDay = pickupDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      availableItems = availableItems.filter((item) => {
        // Check weekday availability
        const availableDays = item.availableDays || [];
        const dayMatch = availableDays.length === 0 || availableDays.includes(pickupDay);
        
        // Check slot availability
        const availableSlots = item.availableSlots || [];
        const slotMatch = availableSlots.length === 0 || availableSlots.includes(reservation.slot);
        
        return dayMatch && slotMatch;
      });
    }
    
    // Count categories from available items only
    const map = new Map();
    for (const it of availableItems) {
      map.set(it.category || "Others", (map.get(it.category || "Others") || 0) + 1);
    }
    return map;
  }, [items, debouncedQ, category, reservation.pickupDate, reservation.slot]);

  const filtered = useMemo(() => {
    let rows = items.slice(0);

    if (debouncedQ) {
      rows = rows.filter(
        (i) =>
          String(i.name || "").toLowerCase().includes(debouncedQ) ||
          String(i.category || "").toLowerCase().includes(debouncedQ)
      );
    }
    if (category !== "all") rows = rows.filter((i) => i.category === category);

    // Filter by pickup details if they are selected
    if (reservation.pickupDate && reservation.slot) {
      const pickupDate = new Date(reservation.pickupDate);
      const pickupDay = pickupDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      rows = rows.filter((item) => {
        // Check weekday availability
        const availableDays = item.availableDays || [];
        const dayMatch = availableDays.length === 0 || availableDays.includes(pickupDay);
        
        // Check pickup window availability
        const availableSlots = item.availableSlots || [];
        const slotMatch = availableSlots.length === 0 || availableSlots.includes(reservation.slot);
        
        return dayMatch && slotMatch;
      });
    }

    switch (sort) {
      case "name-asc":
        rows.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        rows.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "price-asc":
        rows.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        rows.sort((a, b) => b.price - a.price);
        break;
      case "stock-desc":
        rows.sort((a, b) => b.stock - a.stock);
        break;
      default:
        rows.sort((a, b) => {
          const av = Number(b.stock > 0) - Number(a.stock > 0);
          return av !== 0 ? av : a.name.localeCompare(b.name);
        });
    }
    return rows;
  }, [items, debouncedQ, category, sort, reservation.pickupDate, reservation.slot]);

  const list = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => {
          const p = items.find((x) => String(x.id) === String(id));
          return p ? { ...p, qty } : null;
        })
        .filter(Boolean),
    [cart, items]
  );

  const total = useMemo(
    () => list.reduce((a, b) => a + b.qty * (Number(b.price) || 0), 0),
    [list]
  );

  const insufficient = total > (Number(wallet.balance) || 0);

  const recentlyViewedItems = useMemo(() => {
    return recentlyViewed
      .map(id => items.find(i => String(i.id) === String(id)))
      .filter(Boolean);
  }, [recentlyViewed, items]);

  const showToast = (message) => {
    setToast({ visible: true, message });
  };

  const inc = (id) => {
    const item = items.find((x) => String(x.id) === String(id));
    if (!item) return;
    const currentQty = cart[String(id)] || 0;
    if (item.stock >= 0 && currentQty >= item.stock) {
      showAlert(`Sorry, only ${item.stock} items available in stock.`, "warning");
      return;
    }

    add(item.id, 1);
    showToast(`Added ${item.name} to cart`);
    
    const cartIcon = document.getElementById('cart-icon');
    if (cartIcon) {
      cartIcon.classList.add('animate-bounce');
      setTimeout(() => cartIcon.classList.remove('animate-bounce'), 500);
    }
  };

  const dec = (id) =>
    setQty(id, Math.max((cart[String(id)] || 0) - 1, 0));
  
  const removeFromCart = (id) => {
    remove(id);
    showToast("Item removed from cart");
  };
  
  const clearCart = async () => {
    const confirmed = await showConfirm(
      "Are you sure you want to clear all items from cart?",
      "Clear Cart"
    );
    if (confirmed) {
      clear();
      showToast("Cart cleared");
      setMobileCartOpen(false);
    }
  };

  const goCart = () => navigate("/cart");
  const openReserve = () => {
    setReserve((r) => ({
      ...r,
      grade: reservation.grade || r.grade,
      section: reservation.section || r.section,
      pickupDate: reservation.pickupDate || r.pickupDate,
      slot: reservation.slot || r.slot,
    }));
    setOpen(true);
  };
  const closeReserve = () => setOpen(false);

  const openPreviewModal = (item) => {
    setPreview(item);
    addToRecentlyViewed(item.id);
  };

  const getMinDate = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // Check if items would be removed with new pickup details
  const checkUnavailableItems = (newPickupDate, newSlot) => {
    if (!newPickupDate || !newSlot) return [];
    
    const pickupDate = new Date(newPickupDate);
    const pickupDay = pickupDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    return list.filter((item) => {
      // Check weekday availability
      const availableDays = item.availableDays || [];
      const dayMatch = availableDays.length === 0 || availableDays.includes(pickupDay);
      
      // Check slot availability
      const availableSlots = item.availableSlots || [];
      const slotMatch = availableSlots.length === 0 || availableSlots.includes(newSlot);
      
      return !dayMatch || !slotMatch;
    });
  };

  // Handle pickup details change with warning
  const handlePickupChange = async (field, value) => {
    const newReservation = { ...reservation, [field]: value };
    
    // Only check if both pickup date and slot are set (or being set)
    const hasPickupDetails = newReservation.pickupDate && newReservation.slot;
    
    if (hasPickupDetails && Object.keys(cart).length > 0) {
      const unavailableItems = checkUnavailableItems(newReservation.pickupDate, newReservation.slot);
      
      if (unavailableItems.length > 0) {
        // Close popup temporarily to show warning, then reopen if user cancels
        const wasPopupOpen = open;
        if (wasPopupOpen) {
          setOpen(false);
        }
        
        const confirmed = await showConfirm(
          `If pickup details are updated, ${unavailableItems.length} item(s) that are not available in the pickup window and date will be removed from the cart. Continue?`,
          "Update Pickup Details"
        );
        
        if (!confirmed) {
          // User cancelled - reopen popup if it was open, but DON'T apply the changes
          if (wasPopupOpen) {
            setOpen(true);
          }
          return;
        }
        
        // Remove unavailable items from cart
        unavailableItems.forEach(item => {
          remove(item.id);
        });
        
        showToast(`${unavailableItems.length} item(s) removed from cart due to availability`);
        
        // Reopen popup after successful change
        if (wasPopupOpen) {
          setOpen(true);
        }
      }
    }
    
    // Apply the change ONLY after confirmation or if no warning needed
    setReservationDetails(newReservation);
  };

  const submitReservation = async () => {
    if (!list.length) return showAlert("Your cart is empty.", "warning");
    if (!reserve.grade) return showAlert("Select grade level.", "warning");
    if (!reserve.section.trim()) return showAlert("Enter section.", "warning");
    if (!reserve.pickupDate) return showAlert("Select a pickup date.", "warning");
    if (!reserve.slot) return showAlert("Choose a pickup window.", "warning");

    if (isDateRestricted(reserve.pickupDate, dateRestrictions)) {
      await showAlert("That pickup date is restricted. Please choose another date.", "warning");
      setReserve((r) => ({ ...r, pickupDate: "" }));
      return;
    }

    if (globalCutoff && reserve.pickupDate) {
      if (!isOrderAllowed(reserve.pickupDate, globalCutoff)) {
        const label = getCutoffDeadlineLabel(
          reserve.pickupDate, globalCutoff
        );
        await showAlert(
          `Order deadline has passed for this date. ${label}. Please pick a later date.`,
          "warning"
        );
        return;
      }
    }

    const token = localStorage.getItem("token");
    if (!token) {
      await showAlert("Please log in first.", "warning");
      return navigate("/login");
    }

    if (insufficient) {
      return showAlert("Insufficient wallet balance. Please top-up first.", "warning");
    }

    setSubmitting(true);
    try {
      const payload = {
        items: list.map(({ id, qty }) => ({ id, qty })),
        grade: reserve.grade,
        section: reserve.section.trim(),
        pickupDate: reserve.pickupDate,
        slot: reserve.slot,
        note: reserve.note || "",
      };

      let r;
      try {
        r = await api.post("/reservations/checkout", payload);
      } catch {
        const created = await api.post("/reservations", payload);
        const createdId = created?.id || created?.data?.id;
        const amount = created?.total ?? created?.data?.total ?? total;

        if (!createdId) throw new Error("Reservation created without an id.");
        await api.post("/wallets/charge", {
          amount: Number(amount),
          refType: "reservation",
          refId: createdId,
        });

        r = created;
      }

      await showAlert("Reservation submitted and wallet charged.", "success");
      clear();
      setReserve({ grade: "", section: "", pickupDate: "", slot: "", note: "" });
      closeReserve();

      await Promise.all([fetchMenu(), fetchWallet()]);
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.error || e?.message || "Failed to reserve. Try again.";
      await showAlert(msg, "warning");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && initialLoad) {
    return <FullScreenLoader message="Loading menu..." />;
  }

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">
      {publicView ? <GuestHeader mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} /> : <Navbar />}

      {!publicView && showShopNote && (
        <div className="fixed inset-0 z-[70]">
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border-t-4 border-jckl-gold">
              <div className="flex items-start justify-between gap-3 p-5 border-b">
                <div className="min-w-0">
                  <div className="text-2xl font-extrabold text-jckl-navy">NOTE</div>
                </div>
              </div>

              <div className="p-5 space-y-3">
                <div className="text-base sm:text-lg font-semibold text-jckl-navy">
                  The menu for this demonstration is not the actual menu for the canteen.
                </div>
                <div className="text-sm text-jckl-slate">
                  The actual menu for the canteen will be updated here once the system is in use.
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeShopNote}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-jckl-navy text-white text-sm font-medium hover:bg-jckl-light-navy transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toast 
        message={toast.message} 
        visible={toast.visible} 
        onClose={() => setToast({ visible: false, message: "" })}
      />

      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-3 sm:py-6 space-y-3 sm:space-y-6">
        {/* Global Cutoff Banner */}
        {globalCutoff && globalCutoff.cutoffTime && (
          <div data-cutoff-banner className="sticky top-0 z-30 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg shadow-lg p-4 mb-4 sm:p-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-sm sm:text-base">Order Deadline Active</div>
                  <div className="text-xs opacity-90">
                    Orders by {globalCutoff.cutoffTime}, {globalCutoff.advanceDaysRequired} day(s) before pickup
                  </div>
                </div>
              </div>
              {cutoffCountdown && (
                <div className="text-right sm:text-left">
                  <div className="text-xs opacity-90">Next deadline in</div>
                  <div className="font-bold text-lg sm:text-xl">{cutoffCountdown}</div>
                </div>
              )}
              {/* Mobile dismiss button */}
              <button
                onClick={() => {
                  // Temporarily hide banner for mobile
                  const banner = document.querySelector('[data-cutoff-banner]');
                  if (banner) {
                    banner.style.transform = 'translateY(-100%)';
                    setTimeout(() => {
                      banner.style.transform = 'translateY(0%)';
                    }, 300);
                  }
                }}
                className="sm:hidden p-2 -m-2 rounded-lg hover:bg-white/20 transition-colors"
                aria-label="Dismiss deadline banner"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {!publicView && items.length > 0 && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl overflow-hidden shadow-lg">
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col text-white space-y-3 sm:space-y-4 max-w-2xl">
                <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Today's Special</span>
                </div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold">Pre-order now and skip the lunch rush!</h2>
                <p className="text-sm sm:text-base text-white">Order your favorite meals ahead of time and enjoy more break time.</p>
                <button
                  onClick={() => {
                    menuGridRef.current?.scrollIntoView({ 
                      behavior: 'smooth', 
                      block: 'start' 
                    });
                  }}
                  className="inline-flex items-center gap-2 bg-jckl-cream text-jckl-navy px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-jckl-gold transition w-fit text-sm sm:text-base shadow-md"
                >
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                  Start Ordering
                </button>
              </div>
            </div>
          </div>
        )}

        {!publicView && (
          <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 bg-gradient-to-r from-jckl-cream to-white border-y border-jckl-gold">
            <div className="text-sm font-semibold text-jckl-navy mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pickup Details
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-jckl-navy mb-1">Grade Level</label>
                <select
                  value={reservation.grade}
                  onChange={(e) => setReservationDetails({ ...reservation, grade: e.target.value })}
                  className="w-full border border-jckl-gold rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jckl-gold bg-white"
                >
                  <option value="">Select grade</option>
                  {[...Array(11)].map((_, i) => (
                    <option key={i} value={`G${i + 2}`}>G{i + 2}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-jckl-navy mb-1">Section</label>
                <input
                  value={reservation.section}
                  onChange={(e) => setReservationDetails({ ...reservation, section: e.target.value })}
                  placeholder="e.g., A"
                  className="w-full border border-jckl-gold rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jckl-gold bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-jckl-navy mb-1">Pickup Date</label>
                <button
                  type="button"
                  onClick={() => setShowPickupDatePopup(true)}
                  className="w-full border border-jckl-gold rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jckl-gold bg-white text-left hover:bg-jckl-cream transition"
                >
                  {reservation.pickupDate || "Select date"}
                </button>
              </div>
              <div>
                <label className="block text-xs font-medium text-jckl-navy mb-1">Pickup Window</label>
                {!reservation.grade ? (
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                    Select grade first
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-1">
                    {SLOTS.map((s) => {
                      const times = getPickupTimes(reservation.grade);
                      const timeStr = times[s.id] || s.label;
                      return (
                        <label
                          key={s.id}
                          className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs cursor-pointer transition ${
                            reservation.slot === s.id
                              ? "bg-jckl-navy text-white border-jckl-navy"
                              : "bg-white text-jckl-navy border-jckl-gold hover:bg-jckl-cream"
                          }`}
                        >
                          <input
                            type="radio"
                            name="pickup-slot"
                            checked={reservation.slot === s.id}
                            onChange={() => handlePickupChange('slot', s.id)}
                            className="sr-only"
                          />
                          <span className="font-medium">{s.label}</span>
                          <span className="text-[10px] opacity-80">{timeStr}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div 
          ref={filterBarRef}
          className={`sticky top-14 sm:top-16 z-30 transition-all duration-300 ${
            scrolled ? 'bg-white shadow-md -mx-2 sm:-mx-4 px-2 sm:px-4 py-3' : 'bg-white border border-jckl-gold rounded-lg sm:rounded-xl px-2 sm:px-4 py-3'
          }`}
        >
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <div className="inline-flex items-center gap-1 sm:gap-2 mr-1 text-jckl-navy">
                <div className="relative">
                  <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] sm:text-[9px] font-bold rounded-full min-w-[14px] sm:min-w-[16px] h-[14px] sm:h-[16px] flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wide">Categories</span>
              </div>
              <div className="flex flex-wrap gap-1 sm:gap-1.5">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-medium transition ${
                      category === c
                        ? "bg-jckl-navy text-white border-jckl-navy shadow-sm"
                        : "bg-white text-jckl-navy border-jckl-gold hover:bg-jckl-cream hover:border-jckl-gold"
                    }`}
                  >
                    {c !== "all" && (
                      <span className="mr-1">{getCategoryEmoji(c, categoriesMap[c])}</span>
                    )}
                    {c === "all" ? "All Items" : c}
                    {c !== "all" && (
                      <span className="ml-1.5 text-[10px] opacity-70">
                        ({catCounts.get(c) || 0})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[10px] sm:text-xs text-jckl-slate font-medium uppercase tracking-wide">Sort by</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="border border-jckl-gold rounded-lg px-2 sm:px-3 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-jckl-gold bg-white text-jckl-navy"
              >
                <option value="name-asc">Name (A–Z)</option>
                <option value="name-desc">Name (Z–A)</option>
                <option value="price-asc">Price (Low to High)</option>
                <option value="price-desc">Price (High to Low)</option>
                <option value="stock-desc">Stock (High to Low)</option>
              </select>
              {(debouncedQ || category !== "all" || sort !== "featured") && (
                <button
                  onClick={() => {
                    setQ("");
                    setCategory("all");
                    setSort("featured");
                  }}
                  className="ml-auto inline-flex items-center gap-1 text-xs sm:text-sm text-jckl-navy hover:text-jckl-light-navy font-medium"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear filters</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-start sm:items-center justify-between gap-3 sm:gap-4 flex-col sm:flex-row">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-jckl-navy">Canteen Menu</h1>
            <p className="text-xs sm:text-sm text-jckl-slate mt-1">
              {filtered.length} {filtered.length === 1 ? 'item' : 'items'} available
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search menu…"
                className="w-full sm:w-72 border border-jckl-gold rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-jckl-gold focus:border-transparent text-jckl-navy"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <button
              onClick={() => {
                fetchMenu();
                fetchWallet();
              }}
              className="inline-flex items-center gap-2 border border-jckl-gold px-3 py-2.5 rounded-lg text-sm hover:bg-jckl-cream transition text-jckl-navy"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2 space-y-6">
            {!publicView && (!reservation.pickupDate || !reservation.slot) ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <div className="col-span-full bg-white rounded-lg border-t-4 border-jckl-gold p-10 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                    <Clock className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-semibold text-jckl-navy mb-2">Fill-up Pickup Details above first to view Available Items</h3>
                  <p className="text-sm text-jckl-slate">Please select your pickup date and pickup window from the section above to browse the menu.</p>
                </div>
              </div>
            ) : (
              <div ref={menuGridRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={`skeleton-${i}`}
                    className="bg-white rounded-lg shadow-sm border-t-4 border-jckl-gold p-4"
                  >
                    <div className="h-36 rounded bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer mb-4" />
                    <div className="h-4 w-1/2 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded mb-2" />
                    <div className="h-3 w-1/3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded mb-4" />
                    <div className="flex items-center justify-between">
                      <div className="h-8 w-24 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded" />
                      <div className="h-8 w-20 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded" />
                    </div>
                  </div>
                ))
              ) : filtered.length === 0 ? (
                <div className="col-span-full bg-white rounded-lg border-t-4 border-jckl-gold p-10 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-jckl-cream flex items-center justify-center text-jckl-navy">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-sm text-jckl-slate">No items found.</p>
                </div>
              ) : (
                filtered.map((it) => {
                  const soldOut = Number(it.stock) <= 0;
                  const lowStock = Number(it.stock) > 0 && Number(it.stock) <= 5;

                  return (
                    <div 
                      key={it.id} 
                      className="bg-white rounded-lg shadow-sm border-t-4 border-jckl-gold p-4 hover:shadow-md transition-all duration-200 group"
                    >
                      <div className="relative h-36 mb-4 rounded-lg overflow-hidden bg-jckl-cream">
                        {it.img ? (
                          <img
                            src={it.img}
                            alt={it.name}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-gray-400">
                            <span className="text-5xl">{getCategoryEmoji(it.category, it.iconID ?? categoriesMap[it.category])}</span>
                          </div>
                        )}
                        <button
                          onClick={() => openPreviewModal(it)}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
                        >
                          <div className="bg-white text-jckl-navy px-4 py-2 rounded-lg font-medium inline-flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            Quick View
                          </div>
                        </button>
                      </div>
                      
                      <div className="font-medium text-jckl-navy truncate">{it.name}</div>
                      <div className="text-sm text-jckl-slate">{peso.format(it.price)}</div>
                      
                      <div className="mt-2">
                        {soldOut ? (
                          <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 font-medium">
                            Out of stock
                          </span>
                        ) : lowStock ? (
                          <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700 animate-pulse">
                            ⚠️ Only {it.stock} left!
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                            ✓ {it.stock} in stock
                          </span>
                        )}
                      </div>
                      
                      <div className="mt-3 flex items-center gap-3">
                        {publicView ? (
                          <button
                            onClick={() => openPreviewModal(it)}
                            className="inline-flex items-center gap-2 text-sm text-jckl-navy hover:underline"
                          >
                            Preview <ChevronRight className="w-3 h-3" />
                          </button>
                        ) : (
                          <button
                            onClick={() => inc(it.id)}
                            disabled={soldOut}
                            className="inline-flex items-center gap-2 bg-jckl-navy text-white px-3 py-2 rounded-lg hover:bg-jckl-light-navy disabled:opacity-60 font-medium text-sm"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            )}

            {!publicView && recentlyViewedItems.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border-t-4 border-jckl-gold p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Eye className="w-5 h-5 text-jckl-navy" />
                  <h3 className="font-semibold">Recently Viewed</h3>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {recentlyViewedItems.map(it => (
                    <div 
                      key={it.id} 
                      className="flex-shrink-0 w-32 cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => openPreviewModal(it)}
                    >
                      <div className="w-32 h-32 rounded-lg overflow-hidden bg-jckl-cream mb-2">
                        {it.img ? (
                          <img src={it.img} alt={it.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl">
                            {getCategoryEmoji(it.category, it.iconID ?? categoriesMap[it.category])}
                          </div>
                        )}
                      </div>
                      <div className="text-xs font-medium text-jckl-navy truncate">{it.name}</div>
                      <div className="text-xs text-jckl-slate">{peso.format(it.price)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {!publicView && (
            <aside className="hidden lg:flex bg-white rounded-lg shadow-sm border-t-4 border-jckl-gold p-4 h-[72vh] sticky top-24 flex-col">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-jckl-navy">Your Cart</h2>
                <span id="cart-icon" className="text-xs text-jckl-slate inline-flex items-center gap-1">
                  <ShoppingCart className="w-3.5 h-3.5" />
                  {list.reduce((a, b) => a + b.qty, 0)} items
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between text-sm">
                <div className="inline-flex items-center gap-2 text-jckl-navy">
                  <Wallet className="w-4 h-4" />
                  <span>Wallet:</span>
                </div>
                <div className="font-semibold">
                  {loadingWallet ? "…" : peso.format(Number(wallet.balance) || 0)}
                </div>
              </div>

              {insufficient && list.length > 0 && (
                <div className="mt-2 text-xs inline-flex items-center gap-2 text-red-700 bg-red-50 border border-red-100 px-2 py-1 rounded">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Insufficient balance. Please top-up.
                </div>
              )}

              <div className="mt-3 divide-y overflow-auto flex-1 min-h-0">
                {list.length === 0 ? (
                  <div className="py-6 text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-jckl-cream flex items-center justify-center text-jckl-navy">
                      <ShoppingCart className="w-8 h-8 text-gray-400" />
                    </div>
                    <div className="text-sm text-jckl-slate">Your cart is empty.</div>
                    <EmptyCartSuggestions items={items} onAdd={(id) => inc(id)} categoriesMap={categoriesMap} show={!!reservation.pickupDate && !!reservation.slot} selectedSlot={reservation.slot} />
                  </div>
                ) : (
                  list.map((it) => (
                    <div key={it.id} className="py-3 flex items-start gap-3">
                      <div className="w-12 h-12 rounded bg-jckl-cream flex-shrink-0">
                        {it.img ? (
                          <img src={it.img} alt={it.name} className="w-full h-full object-cover rounded" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl">
                            {getCategoryEmoji(it.category, it.iconID ?? categoriesMap[it.category])}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-jckl-navy truncate">{it.name}</div>
                        <div className="text-xs text-jckl-slate">{peso.format(it.price)}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="inline-flex items-center border rounded">
                            <button 
                              onClick={() => dec(it.id)} 
                              className="px-1.5 py-1 hover:bg-jckl-cream text-jckl-navy"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 text-xs">{it.qty}</span>
                            <button
                              onClick={() => inc(it.id)}
                              className="px-1.5 py-1 hover:bg-jckl-cream disabled:opacity-50 text-jckl-navy"
                              disabled={it.qty >= it.stock}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="text-sm font-medium">
                            {peso.format((Number(it.price) || 0) * it.qty)}
                          </div>
                          <button
                            onClick={() => removeFromCart(it.id)}
                            className="ml-auto text-xs text-jckl-slate hover:text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t pt-3">
                <span className="text-sm text-jckl-slate">Total</span>
                <span className="text-lg font-semibold">{peso.format(total)}</span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2">
                <button
                  onClick={goCart}
                  disabled={!list.length}
                  className="w-full inline-flex items-center justify-center gap-2 border border-jckl-gold px-4 py-3 rounded-lg text-sm hover:bg-jckl-cream disabled:opacity-60 transition text-jckl-navy"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Go to Cart
                </button>
                {globalCutoff && globalCutoff.cutoffTime && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-amber-800">Order Deadline Active</div>
                        <div className="text-xs text-amber-600">
                          Orders close {globalCutoff.advanceDaysRequired} day(s) before pickup at {globalCutoff.cutoffTime}
                        </div>
                      </div>
                    </div>
                    {cutoffCountdown && (
                      <div className="mt-2 text-center">
                        <div className="text-xs text-amber-600">Next deadline in</div>
                        <div className="font-bold text-lg text-amber-800">{cutoffCountdown}</div>
                      </div>
                    )}
                  </div>
                )}
                <button
                  onClick={openReserve}
                  disabled={!list.length || (globalCutoff && reserve.pickupDate && !isOrderAllowed(reserve.pickupDate, globalCutoff))}
                  className="w-full inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-4 py-3 rounded-lg hover:bg-black text-sm disabled:opacity-60 transition"
                >
                  <Clock className="w-4 h-4" />
                  Reserve for Pickup
                </button>
                {list.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="w-full text-sm text-jckl-navy hover:underline"
                  >
                    Clear cart
                  </button>
                )}
              </div>
            </aside>
          )}
        </div>
      </main>

      {!publicView && (
        <>
          {list.length > 0 && (
            <button
              onClick={() => setMobileCartOpen(!mobileCartOpen)}
              className="lg:hidden fixed bottom-20 right-4 z-40 bg-jckl-navy text-white p-4 rounded-full shadow-lg hover:bg-jckl-light-navy transition"
            >
              <div className="relative">
                <ShoppingCart className="w-6 h-6" />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {list.reduce((a, b) => a + b.qty, 0)}
                </span>
              </div>
            </button>
          )}

          {mobileCartOpen && (
            <div className="lg:hidden fixed inset-0 z-[60]">
              <div 
                className="absolute inset-0 bg-black/40" 
                onClick={() => setMobileCartOpen(false)}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl max-h-[80vh] flex flex-col pb-20">
                <div className="flex items-center justify-center py-3 border-b">
                  <div className="w-12 h-1 bg-gray-300 rounded-full" />
                </div>

                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="font-semibold text-jckl-navy">Your Cart</h3>
                  <button 
                    onClick={() => setMobileCartOpen(false)}
                    className="p-2 hover:bg-jckl-cream rounded-lg text-jckl-navy"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {list.map((it) => (
                    <div key={it.id} className="flex items-start gap-3 bg-jckl-cream p-3 rounded-lg">
                      <div className="w-16 h-16 rounded bg-gray-200 flex-shrink-0">
                        {it.img ? (
                          <img src={it.img} alt={it.name} className="w-full h-full object-cover rounded" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">
                            {getCategoryEmoji(it.category, it.iconID ?? categoriesMap[it.category])}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-jckl-navy">{it.name}</div>
                        <div className="text-sm text-jckl-slate">{peso.format(it.price)}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="inline-flex items-center border rounded">
                            <button onClick={() => dec(it.id)} className="px-2 py-1">
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="px-3 text-sm">{it.qty}</span>
                            <button 
                              onClick={() => inc(it.id)} 
                              className="px-2 py-1"
                              disabled={it.qty >= it.stock}
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="font-medium">{peso.format(it.price * it.qty)}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(it.id)}
                        className="p-2 hover:bg-jckl-cream rounded text-jckl-navy"
                      >
                        <X className="w-5 h-5 text-jckl-navy" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="p-4 border-t space-y-3">
                  <div className="flex items-center justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>{peso.format(total)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setMobileCartOpen(false);
                        goCart();
                      }}
                      className="inline-flex items-center justify-center gap-2 border px-4 py-3 rounded-lg font-medium"
                    >
                      View Cart
                    </button>
                    <button
                      onClick={() => {
                        setMobileCartOpen(false);
                        openReserve();
                      }}
                      disabled={insufficient}
                      className="inline-flex items-center justify-center gap-2 bg-jckl-navy text-white px-4 py-3 rounded-lg font-medium disabled:opacity-60 hover:bg-jckl-light-navy"
                    >
                      <Clock className="w-4 h-4" />
                      Reserve
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {!publicView && open && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="min-h-screen px-4 text-center flex items-center justify-center">
            <div className="fixed inset-0 bg-black/30" onClick={closeReserve} />
            
            <div className="relative inline-block w-full max-w-2xl bg-white rounded-xl shadow-xl border-t-4 border-jckl-gold text-left">
              <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-white rounded-t-xl">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-jckl-navy" />
                  <h3 className="font-semibold">Confirm Reservation</h3>
                </div>
                <button onClick={closeReserve} className="p-2 rounded-lg hover:bg-jckl-cream text-jckl-navy">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-[65vh] flex flex-col">
                <div className="flex-1 overflow-y-auto">
                  <div className="p-3 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-jckl-navy mb-1">Grade Level</label>
                          <select
                            value={reserve.grade}
                            onChange={(e) => {
                            setReserve((r) => ({ ...r, grade: e.target.value }));
                            setReservationDetails({ ...reservation, grade: e.target.value });
                          }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="" disabled={!!reserve.grade}>Select grade level</option>
                            {[...Array(11)].map((_, i) => (
                              <option key={i}>G{i + 2}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-jckl-navy mb-1">Section</label>
                          <input
                            value={reserve.section}
                            onChange={(e) => {
                            setReserve((r) => ({ ...r, section: e.target.value }));
                            setReservationDetails({ ...reservation, section: e.target.value });
                          }}
                            placeholder="e.g., A"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-jckl-navy mb-1">Pickup Date</label>
                        <RestrictedDateCalendar
                          value={reserve.pickupDate}
                          cutoff={globalCutoff}
                          onChange={async (next) => {
                            // Don't update local state immediately, only check if warning needed
                            const newReservation = { ...reservation, pickupDate: next };
                            const hasPickupDetails = newReservation.pickupDate && reservation.slot;
                            
                            if (hasPickupDetails && Object.keys(cart).length > 0) {
                              const pickupDate = new Date(newReservation.pickupDate);
                              const pickupDay = pickupDate.getDay();
                              
                              const unavailableItems = list.filter((item) => {
                                const availableDays = item.availableDays || [];
                                const dayMatch = availableDays.length === 0 || availableDays.includes(pickupDay);
                                const availableSlots = item.availableSlots || [];
                                const slotMatch = availableSlots.length === 0 || availableSlots.includes(reservation.slot);
                                return !dayMatch || !slotMatch;
                              });
                              
                              if (unavailableItems.length > 0) {
                                // Close popup temporarily to show warning
                                setOpen(false);
                                
                                const confirmed = await showConfirm(
                                  `If pickup details are updated, ${unavailableItems.length} item(s) that are not available in the pickup window and date will be removed from the cart. Continue?`,
                                  "Update Pickup Details"
                                );
                                
                                if (confirmed) {
                                  // User confirmed - update both local and global state
                                  setReserve((r) => ({ ...r, pickupDate: next }));
                                  setReservationDetails(newReservation);
                                  
                                  // Remove unavailable items from cart
                                  unavailableItems.forEach(item => {
                                    remove(item.id);
                                  });
                                  
                                  showToast(`${unavailableItems.length} item(s) removed from cart due to availability`);
                                  // Don't reopen popup - user can continue with reservation process
                                  return;
                                } else {
                                  // User cancelled - reopen popup with original values
                                  setOpen(true);
                                  return;
                                }
                              }
                            }
                            
                            // No warning needed or no cart items - update both states
                            setReserve((r) => ({ ...r, pickupDate: next }));
                            setReservationDetails(newReservation);
                          }}
                          min={getMinDate()}
                          rules={dateRestrictions}
                        />
                        {reserve.pickupDate && (
                          <div className="mt-2 text-xs text-jckl-slate">Selected: {reserve.pickupDate}</div>
                        )}
                      </div>

                      {globalCutoff && reserve.pickupDate &&
                       isOrderAllowed(reserve.pickupDate, globalCutoff) &&
                       cutoffCountdown && (
                        <div 
                          className="p-3 bg-blue-50 border border-blue-200 
                          rounded-lg text-xs text-blue-800"
                          role="status"
                          aria-live="polite"
                          aria-label={`Order countdown: ${cutoffCountdown} remaining`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <svg 
                                className="w-10 h-10 transform -rotate-90"
                                aria-hidden="true"
                                focusable="false"
                              >
                                <circle
                                  cx="20"
                                  cy="20"
                                  r="18"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  fill="none"
                                  className="text-blue-200"
                                />
                                <circle
                                  cx="20"
                                  cy="20"
                                  r="18"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  fill="none"
                                  strokeDasharray="113"
                                  strokeDashoffset={113 - (Math.min(100, Math.max(0, 100 - (parseFloat(cutoffCountdown) / 72 * 100))) * 1.13)}
                                  className="text-blue-600 transition-all duration-1000"
                                  transform="rotate(-90 20 20)"
                                  transformOrigin="20 20"
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Clock className="w-4 h-4 text-blue-600" aria-hidden="true" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-sm">Order window closes</div>
                              <div className="text-lg font-bold" aria-live="polite">{cutoffCountdown}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {globalCutoff && reserve.pickupDate &&
                       !isOrderAllowed(reserve.pickupDate, globalCutoff) && (
                        <div className="p-3 bg-red-50 border border-red-200 
                          rounded-lg text-xs text-red-800 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 flex-shrink-0 
                            text-red-600" />
                          <span>Ordering closed for this date. {' '}
                            {getCutoffDeadlineLabel(reserve.pickupDate, globalCutoff)}
                          </span>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-jckl-navy mb-1">Pickup Window</label>
                        {!reserve.grade ? (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                            Please select a grade level first to see available pickup times.
                          </div>
                        ) : (
                          <div className="grid gap-2">
                            {SLOTS.map((s) => {
                              const times = getPickupTimes(reserve.grade);
                              const timeStr = times[s.id] || s.label;
                              return (
                                <label
                                  key={s.id}
                                  className="flex items-center gap-3 p-3 rounded-lg border border-jckl-gold hover:bg-jckl-cream cursor-pointer"
                                >
                                  <input
                                    type="radio"
                                    name="slot"
                                    checked={reserve.slot === s.id}
                                    onChange={async () => {
                                      // Don't update local state immediately, only check if warning needed
                                      const newReservation = { ...reservation, slot: s.id };
                                      const hasPickupDetails = reservation.pickupDate && newReservation.slot;
                                      
                                      if (hasPickupDetails && Object.keys(cart).length > 0) {
                                        const pickupDate = new Date(reservation.pickupDate);
                                        const pickupDay = pickupDate.getDay();
                                        
                                        const unavailableItems = list.filter((item) => {
                                          const availableDays = item.availableDays || [];
                                          const dayMatch = availableDays.length === 0 || availableDays.includes(pickupDay);
                                          const availableSlots = item.availableSlots || [];
                                          const slotMatch = availableSlots.length === 0 || availableSlots.includes(s.id);
                                          return !dayMatch || !slotMatch;
                                        });
                                        
                                        if (unavailableItems.length > 0) {
                                          // Close popup temporarily to show warning
                                          setOpen(false);
                                          
                                          const confirmed = await showConfirm(
                                            `If pickup details are updated, ${unavailableItems.length} item(s) that are not available in the pickup window and date will be removed from the cart. Continue?`,
                                            "Update Pickup Details"
                                          );
                                          
                                          if (confirmed) {
                                            // User confirmed - update both local and global state
                                            setReserve((r) => ({ ...r, slot: s.id }));
                                            setReservationDetails(newReservation);
                                            
                                            // Remove unavailable items from cart
                                            unavailableItems.forEach(item => {
                                              remove(item.id);
                                            });
                                            
                                            showToast(`${unavailableItems.length} item(s) removed from cart due to availability`);
                                            setOpen(false); // Close popup after confirmation
                                            return;
                                          } else {
                                            // User cancelled - reopen popup with original values
                                            setOpen(true);
                                            return;
                                          }
                                        }
                                      }
                                      
                                      // No warning needed or no cart items - update both states
                                      setReserve((r) => ({ ...r, slot: s.id }));
                                      setReservationDetails(newReservation);
                                    }}
                                  />
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium">{s.label}</span>
                                    <span className="text-xs text-jckl-slate">{timeStr}</span>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-800">
                              If selected Pickup Window and Date of reservation is modified, unavailable items will be removed from cart.
                            </p>
                          </div>
                        </div>

                      <div>
                        <label className="block text-sm font-medium text-jckl-navy mb-1">Note (optional)</label>
                        <textarea
                          rows={2}
                          value={reserve.note}
                          onChange={(e) => setReserve((r) => ({ ...r, note: e.target.value }))}
                          placeholder="Special requests..."
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Order Summary</h4>
                      <div className="border rounded-lg divide-y max-h-40 overflow-y-auto">
                        {list.map((it) => (
                          <div key={it.id} className="p-3 flex justify-between text-sm">
                            <div>
                              <div className="font-medium">{it.name}</div>
                              <div className="text-xs text-jckl-slate">{it.qty} × {peso.format(it.price)}</div>
                            </div>
                            <div className="font-medium">{peso.format(it.qty * it.price)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="sticky bottom-0 bg-white border-t p-3 rounded-b-xl">
                  <div className="space-y-1 mb-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-jckl-slate">Total</span>
                      <span className="text-lg font-semibold">{peso.format(total)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-jckl-slate">Wallet Balance</span>
                      <span className="font-semibold">{peso.format(wallet.balance)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-jckl-slate">Remaining</span>
                      <span className={`font-semibold ${insufficient ? 'text-red-600' : 'text-emerald-600'}`}>
                        {peso.format(Math.max(0, wallet.balance - total))}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={closeReserve}
                      className="px-3 py-2 border border-jckl-gold rounded-lg hover:bg-jckl-cream text-jckl-navy text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitReservation}
                      disabled={submitting || insufficient ||
                        (globalCutoff && reserve.pickupDate &&
                         !isOrderAllowed(reserve.pickupDate, globalCutoff))}
                      className="flex-1 bg-jckl-navy text-white px-3 py-2 rounded-lg hover:bg-jckl-light-navy disabled:opacity-60 font-medium text-sm"
                    >
                      {submitting ? "Submitting..." : "Submit Reservation"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPreview(null)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-xl bg-white rounded-xl shadow-xl overflow-hidden">
              <div className="relative h-56 bg-gray-100">
                {preview.img ? (
                  <img src={preview.img} alt={preview.name} className="h-full w-full object-cover" />
                  ) : (
                  <div className="h-full w-full flex items-center justify-center text-6xl">
                    {getCategoryEmoji(preview.category, preview.iconID ?? categoriesMap[preview.category])}
                  </div>
                )}
                <button
                  onClick={() => setPreview(null)}
                  className="absolute top-2 right-2 p-2 bg-white/90 rounded-full hover:bg-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{preview.name}</h3>
                    <div className="text-sm text-jckl-slate">{preview.category}</div>
                  </div>
                  <div className="text-xl font-bold">{peso.format(preview.price)}</div>
                </div>
                {preview.desc && <p className="text-sm text-jckl-slate">{preview.desc}</p>}
                <div className="flex items-center justify-between pt-2">
                  {preview.stock <= 0 ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">Out of stock</span>
                  ) : preview.stock <= 5 ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700 animate-pulse">
                      ⚠️ Only {preview.stock} left!
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                      ✓ {preview.stock} in stock
                    </span>
                  )}
                  {!publicView && (
                    <button
                      onClick={() => {
                        inc(preview.id);
                        setPreview(null);
                      }}
                      disabled={preview.stock <= 0}
                      className="bg-jckl-navy text-white px-4 py-2 rounded-lg hover:bg-jckl-light-navy disabled:opacity-60 inline-flex items-center gap-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Add to Cart
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pickup Date Pop-up Modal */}
      {showPickupDatePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Select Pickup Date</h3>
              <button
                onClick={() => setShowPickupDatePopup(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <RestrictedDateCalendar
                value={reservation.pickupDate}
                cutoff={globalCutoff}
                onChange={(next) => {
                  handlePickupChange('pickupDate', next);
                  setShowPickupDatePopup(false);
                }}
                min={getMinDate()}
                rules={dateRestrictions}
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowPickupDatePopup(false)}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              {reservation.pickupDate && (
                <button
                  onClick={() => setShowPickupDatePopup(false)}
                  className="px-4 py-2 text-sm bg-jckl-navy text-white rounded-lg hover:bg-jckl-light-navy transition-colors"
                >
                  Confirm
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
      
      {!publicView && <BottomNav />}
    </div>
  );
}