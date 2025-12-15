import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import FullScreenLoader from "../../components/FullScreenLoader";
import { 
  X, 
  Trash2, 
  Check, 
  RefreshCw, 
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle,
  Package,
  DollarSign,
  User,
  Clock,
  Calendar
} from "lucide-react";

const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });
const ITEMS_PER_PAGE = 10;

function fmtDate(v) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
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

export default function Notifications() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState(new Set());
  const [preview, setPreview] = useState(null);
  const [reservationDetails, setReservationDetails] = useState({});
  const [showBulkActions, setShowBulkActions] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const d = await api.get("/notifications");
      setNotifications(Array.isArray(d) ? d : []);
      setCurrentPage(1); // Reset to first page on refresh
    } catch (e) {
      setNotifications([]);
    } finally {
      setLoading(false);
      setInitialLoad(false);
      setSelected(new Set());
    }
  };

  useEffect(() => { load(); }, []);

  // Pagination calculations
  const totalPages = Math.ceil(notifications.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedNotifications = notifications.slice(startIndex, endIndex);

  const toggle = (id) => {
    setSelected((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
  };

  const toggleAll = () => {
    if (selected.size === paginatedNotifications.length) setSelected(new Set());
    else setSelected(new Set(paginatedNotifications.map(n => n.id)));
  };

  const markSelectedRead = async () => {
    if (!selected.size) return alert("No notifications selected.");
    if (!window.confirm("Mark selected notifications as read?")) return;
    try {
      await Promise.all(Array.from(selected).map(id => api.patch(`/notifications/${id}/read`).catch(() => {})));
      setNotifications((prev) => prev.map(n => selected.has(n.id) ? { ...n, read: true } : n));
      setSelected(new Set());
      setShowBulkActions(false);
    } catch {
      alert("Failed to mark selected as read.");
    }
  };

  const deleteSelected = async () => {
    if (!selected.size) return alert("No notifications selected.");
    if (!window.confirm("Delete selected notifications?")) return;
    try {
      await Promise.all(Array.from(selected).map(id => api.del(`/notifications/${id}`).catch(() => {})));
      setNotifications((prev) => prev.filter(n => !selected.has(n.id)));
      setSelected(new Set());
      setShowBulkActions(false);
      // Adjust page if necessary
      if (startIndex >= notifications.length - selected.size && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch {
      alert("Failed to delete selected notifications.");
    }
  };

  const openPreview = async (n) => {
    setPreview(n);
    
    if (n.data?.reservationId) {
      try {
        const res = await api.get(`/reservations/${n.data.reservationId}`);
        const reservation = res?.data || res;
        setReservationDetails(prev => ({
          ...prev,
          [n.data.reservationId]: reservation
        }));
      } catch (err) {
        console.error("Failed to fetch reservation:", err);
      }
    }
    
    if (!n.read) {
      try {
        await api.patch(`/notifications/${n.id}/read`);
        setNotifications((prev) => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
      } catch {}
    }
  };

  const deleteSingle = async (id) => {
    if (!window.confirm("Delete this notification?")) return;
    try {
      await api.del(`/notifications/${id}`);
      setNotifications((prev) => prev.filter(n => n.id !== id));
      if (preview?.id === id) setPreview(null);
      // Adjust page if necessary
      if (startIndex >= notifications.length - 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch {
      alert("Failed to delete notification.");
    }
  };

  const markSingleRead = async (id, e) => {
    e.stopPropagation();
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch {}
  };

  const getStatusIcon = (status) => {
    const statusLower = String(status).toLowerCase();
    if (statusLower === 'approved') return <CheckCircle className="w-4 h-4" />;
    if (statusLower === 'rejected' || statusLower === 'cancelled') return <XCircle className="w-4 h-4" />;
    if (statusLower === 'pending') return <AlertCircle className="w-4 h-4" />;
    return null;
  };

  const getStatusColorClass = (status) => {
    const statusLower = String(status).toLowerCase();
    if (statusLower === 'approved') return 'bg-green-100 text-green-700 border-green-200';
    if (statusLower === 'rejected' || statusLower === 'cancelled') return 'bg-red-100 text-red-700 border-red-200';
    if (statusLower === 'pending') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // Stats
  const unreadCount = notifications.filter(n => !n.read).length;

  // Full-screen loading overlay (ONLY on initial load)
  if (loading && initialLoad) {
    return <FullScreenLoader message="Loading notifications..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-4">
      {/* Header */}
      <div className="bg-white border-b border-jckl-gold sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Link to="/dashboard" className="p-2 -ml-2 hover:bg-jckl-cream rounded-lg md:hidden">
                <ChevronLeft className="w-5 h-5 text-jckl-navy" />
              </Link>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-semibold text-jckl-navy truncate">Notifications</h1>
                <p className="text-xs sm:text-sm text-jckl-slate">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Mobile: Bulk action toggle */}
              <button 
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="md:hidden p-2 rounded-lg hover:bg-jckl-cream"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {/* Desktop: Back link */}
              <Link to="/dashboard" className="hidden md:inline-flex text-sm text-jckl-navy hover:underline font-medium">
                Back to Dashboard
              </Link>
              
              <button 
                onClick={load} 
                disabled={loading}
                className="inline-flex items-center gap-2 px-3 py-2 border border-jckl-gold rounded-lg text-sm text-jckl-navy hover:bg-jckl-cream disabled:opacity-60 font-medium"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* Mobile Bulk Actions Dropdown */}
          {showBulkActions && (
            <div className="mt-3 pt-3 border-t border-jckl-gold md:hidden space-y-2">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  className="h-4 w-4 rounded border-jckl-gold accent-jckl-navy"
                  checked={selected.size === paginatedNotifications.length && paginatedNotifications.length > 0} 
                  onChange={toggleAll} 
                />
                <span className="text-sm text-jckl-slate">
                  {selected.size > 0 ? `${selected.size} selected` : 'Select all'}
                </span>
              </div>
              {selected.size > 0 && (
                <div className="flex gap-2">
                  <button 
                    onClick={markSelectedRead} 
                    className="flex-1 px-3 py-2 bg-jckl-navy text-white rounded-lg text-sm font-medium hover:bg-jckl-light-navy"
                  >
                    Mark as read
                  </button>
                  <button 
                    onClick={deleteSelected} 
                    className="flex-1 px-3 py-2 bg-jckl-accent text-white rounded-lg text-sm font-medium hover:opacity-90"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        {/* Desktop Bulk Actions */}
        <div className="hidden md:block bg-white rounded-xl shadow-sm border border-jckl-gold mb-4">
          <div className="p-3 sm:p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                className="h-4 w-4 rounded border-jckl-gold accent-jckl-navy"
                checked={selected.size === paginatedNotifications.length && paginatedNotifications.length > 0} 
                onChange={toggleAll} 
              />
              <button 
                onClick={markSelectedRead} 
                className="inline-flex items-center gap-2 px-3 py-2 bg-jckl-navy text-white rounded-lg text-sm font-medium hover:bg-jckl-light-navy disabled:opacity-50"
                disabled={selected.size === 0}
              >
                <Check className="w-4 h-4" />
                Mark as read
              </button>
              <button 
                onClick={deleteSelected} 
                className="inline-flex items-center gap-2 px-3 py-2 bg-jckl-accent text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
                disabled={selected.size === 0}
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
            <div className="text-sm text-jckl-slate">
              {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="bg-white rounded-xl border border-jckl-gold p-8 sm:p-10 text-center">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-jckl-navy" />
            <p className="text-sm text-jckl-slate">Loading notifications…</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-xl border border-jckl-gold p-8 sm:p-10 text-center">
            <div className="w-16 h-16 bg-jckl-cream rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-8 h-8 text-jckl-navy" />
            </div>
            <p className="text-sm text-jckl-slate">No notifications yet.</p>
          </div>
        ) : (
          <>
            {/* Mobile: Card View */}
            <div className="md:hidden space-y-2">
              {paginatedNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`bg-white rounded-xl shadow-sm border overflow-hidden ${
                    n.read ? 'border-jckl-gold' : 'border-jckl-purple bg-jckl-cream/30'
                  }`}
                >
                  <div className="p-3" onClick={() => openPreview(n)}>
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selected.has(n.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggle(n.id);
                        }}
                        className="mt-1 h-4 w-4 rounded border-jckl-gold accent-jckl-navy flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      />

                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        {(() => {
                          const adminFallback = { name: "Canteen Admin", profilePictureUrl: "/jckl-192.png" };
                          const display = n.actor || adminFallback;
                          return display.profilePictureUrl ? (
                            <img
                              src={display.profilePictureUrl}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover border-2 border-jckl-gold shadow-sm"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(display.name || 'CA')}&background=random`;
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-jckl-navy to-jckl-purple flex items-center justify-center text-sm font-medium text-white border-2 border-jckl-gold shadow-sm">
                              {(display.name || "C").charAt(0)}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm font-medium text-jckl-navy truncate">
                            {(n.actor && n.actor.name) || "Canteen Admin"}
                          </p>
                          <span className="text-[10px] text-jckl-slate whitespace-nowrap flex-shrink-0">
                            <Clock className="w-3 h-3 inline mr-0.5" />
                            {new Date(n.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <h4 className="text-sm font-medium text-jckl-navy line-clamp-1 mb-1">
                          {n.title}
                        </h4>
                        
                        <p className="text-xs text-jckl-slate line-clamp-2 mb-2">
                          {n.body}
                        </p>

                        {/* Preview badges */}
                        {n.data && (
                          <div className="flex items-center gap-2 flex-wrap">
                            {n.data.amount && !n.data.items && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-jckl-gold/20 text-jckl-navy rounded text-xs font-medium border border-jckl-gold">
                                <DollarSign className="w-3 h-3" />
                                {peso.format(n.data.amount)}
                              </span>
                            )}
                            {n.data.items && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-jckl-purple/20 text-jckl-purple rounded text-xs font-medium border border-jckl-purple">
                                <Package className="w-3 h-3" />
                                {n.data.items.length} items
                              </span>
                            )}
                            {n.data.status && (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${getStatusColorClass(n.data.status)}`}>
                                {getStatusIcon(n.data.status)}
                                {n.data.status}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  {!n.read && (
                    <div className="px-3 pb-3">
                      <button
                        onClick={(e) => markSingleRead(n.id, e)}
                        className="w-full py-2 text-xs text-jckl-navy hover:text-jckl-light-navy font-medium hover:bg-jckl-cream rounded"
                      >
                        Mark as read
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop: Table View */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-jckl-gold overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-jckl-cream">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-jckl-navy uppercase tracking-wider w-12"></th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-jckl-navy uppercase tracking-wider">From</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-jckl-navy uppercase tracking-wider">Subject</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-jckl-navy uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-jckl-navy uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-jckl-gold">
                    {paginatedNotifications.map((n) => (
                      <tr key={n.id} className={`${n.read ? "" : "bg-jckl-cream/50"} hover:bg-jckl-cream/30`}>
                        <td className="px-6 py-4">
                          <input 
                            type="checkbox" 
                            className="h-4 w-4 rounded border-jckl-gold accent-jckl-navy"
                            checked={selected.has(n.id)} 
                            onChange={() => toggle(n.id)} 
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {(() => {
                              const adminFallback = { name: "Canteen Admin", profilePictureUrl: "/jckl-192.png" };
                              const display = n.actor || adminFallback;
                              return display.profilePictureUrl ? (
                                <img
                                  src={display.profilePictureUrl}
                                  alt=""
                                  className="w-8 h-8 rounded-full object-cover border border-jckl-gold"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(display.name || 'CA')}&background=random`;
                                  }}
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-jckl-navy to-jckl-purple flex items-center justify-center text-xs font-medium text-white">
                                  {(display.name || "C").charAt(0)}
                                </div>
                              );
                            })()}
                            <span className="text-sm font-medium text-jckl-navy">
                              {(n.actor && n.actor.name) || "Canteen Admin"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 cursor-pointer" onClick={() => openPreview(n)}>
                          <div className="text-sm font-medium text-jckl-navy">{n.title}</div>
                          <div className="text-xs text-jckl-slate line-clamp-1">{n.body}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-xs text-jckl-slate">{new Date(n.createdAt).toLocaleDateString()}</div>
                          <div className="text-[10px] text-jckl-slate/60">{new Date(n.createdAt).toLocaleTimeString()}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex gap-2">
                            <button 
                              onClick={() => openPreview(n)} 
                              className="px-3 py-1.5 text-xs border border-jckl-gold text-jckl-navy rounded-lg hover:bg-jckl-cream font-medium"
                            >
                              Open
                            </button>
                            <button 
                              onClick={() => deleteSingle(n.id)} 
                              className="px-3 py-1.5 text-xs border border-jckl-accent text-jckl-accent rounded-lg hover:bg-jckl-cream font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-jckl-gold text-jckl-navy rounded-lg text-sm font-medium hover:bg-jckl-cream disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-jckl-slate">
                    Page <span className="font-semibold text-jckl-navy">{currentPage}</span> of <span className="font-semibold text-jckl-navy">{totalPages}</span>
                  </span>
                  <div className="text-xs text-jckl-slate hidden sm:inline">
                    ({startIndex + 1}–{Math.min(endIndex, notifications.length)} of {notifications.length})
                  </div>
                </div>

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-jckl-gold text-jckl-navy rounded-lg text-sm font-medium hover:bg-jckl-cream disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Preview Modal - same as before */}
      {preview && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
          <div className="w-full sm:max-w-3xl bg-white sm:rounded-lg shadow-lg overflow-hidden max-h-screen sm:max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5 border-b border-jckl-gold flex-shrink-0">
              <div className="flex-shrink-0">
                {(() => {
                  const adminFallback = { name: "Canteen Admin", profilePictureUrl: "/jckl-192.png" };
                  const display = preview.actor || adminFallback;
                  return display.profilePictureUrl ? (
                    <img
                      src={display.profilePictureUrl}
                      alt=""
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-jckl-gold shadow-sm"
                      onError={(e) => { 
                        e.target.onerror = null; 
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(display.name || 'CA')}&background=random`; 
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-jckl-navy to-jckl-purple flex items-center justify-center text-lg font-medium text-white">
                      {(display.name || "C").charAt(0)}
                    </div>
                  );
                })()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-xs text-jckl-slate">From {(preview.actor && preview.actor.name) || "Canteen Admin"}</div>
                <h3 className="text-lg sm:text-xl font-semibold text-jckl-navy line-clamp-2">{preview.title}</h3>
                <div className="flex items-center gap-1 text-xs text-jckl-slate/60 mt-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(preview.createdAt).toLocaleString()}
                </div>
              </div>

              <button 
                onClick={() => setPreview(null)} 
                className="p-2 rounded-full text-jckl-slate hover:text-jckl-navy hover:bg-jckl-cream flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body - Scrollable */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              <p className="text-sm text-jckl-navy mb-4 whitespace-pre-wrap">{preview.body}</p>

              {preview.data && (
                <div className="bg-jckl-cream border border-jckl-gold rounded-lg p-4 sm:p-5 space-y-4">
                  {/* Reservation Details */}
                  {preview.data.reservationId && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Package className="w-4 h-4 text-jckl-navy" />
                        <span className="text-jckl-slate">Reservation ID:</span>
                        <span className="font-medium text-jckl-navy">{preview.data.reservationId}</span>
                      </div>

                      {/* Items */}
                      {(() => {
                        const resData = reservationDetails[preview.data.reservationId];
                        const items = resData?.items || preview.data.items;
                        return Array.isArray(items) && items.length > 0 ? (
                          <div className="space-y-2">
                            <div className="text-xs font-medium text-jckl-navy uppercase">Order Items</div>
                            <div className="rounded-md border border-jckl-gold bg-white overflow-hidden divide-y divide-jckl-gold">
                              {items.map((it, i) => (
                                <div key={i} className="flex items-center justify-between px-3 sm:px-4 py-3 text-sm">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-jckl-navy">{it.qty || 1}×</span>
                                      <span className="text-jckl-slate truncate">{it.name}</span>
                                    </div>
                                    <div className="text-xs text-jckl-slate mt-0.5">@ {peso.format(it.price || 0)}</div>
                                  </div>
                                  <div className="text-right flex-shrink-0 ml-3">
                                    <div className="font-medium text-jckl-navy">{peso.format((it.price || 0) * (it.qty || 1))}</div>
                                  </div>
                                </div>
                              ))}

                              <div className="px-3 sm:px-4 py-3 bg-jckl-gold/10 flex justify-between items-center">
                                <span className="font-semibold text-jckl-navy">Total</span>
                                <span className="text-lg font-bold text-jckl-navy">
                                  {peso.format((resData?.total) || (preview.data.total) || 0)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : null;
                      })()}

                      {/* Student Details */}
                      {(preview.data.grade || preview.data.section || preview.data.student) && (
                        <div className="pt-3 border-t border-jckl-gold">
                          <div className="flex items-center gap-2 text-xs font-medium text-jckl-navy uppercase mb-2">
                            <User className="w-4 h-4" />
                            Student Details
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            {preview.data.student && (
                              <div className="flex items-center gap-2">
                                <span className="text-jckl-slate">Name:</span>
                                <span className="font-medium text-jckl-navy">{preview.data.student}</span>
                              </div>
                            )}
                            {preview.data.grade && (
                              <div className="flex items-center gap-2">
                                <span className="text-jckl-slate">Grade:</span>
                                <span className="font-medium text-jckl-navy">{preview.data.grade}</span>
                              </div>
                            )}
                            {preview.data.section && (
                              <div className="flex items-center gap-2">
                                <span className="text-jckl-slate">Section:</span>
                                <span className="font-medium text-jckl-navy">{preview.data.section}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {preview.data.note && (
                        <div className="bg-jckl-gold/10 border border-jckl-gold rounded-lg p-3">
                          <div className="text-xs font-medium text-jckl-navy mb-1">Note</div>
                          <p className="text-sm text-jckl-slate">{preview.data.note}</p>
                        </div>
                      )}

                      {preview.data.slot && (
                        <div className="flex items-center gap-2 text-sm pt-3 border-t border-jckl-gold">
                          <Clock className="w-4 h-4 text-jckl-navy" />
                          <span className="text-jckl-slate">Pickup:</span>
                          <span className="font-medium text-jckl-navy">
                            {(() => {
                              const pickupDate = preview.data.pickupDate || preview.data.pickup_date || preview.data.claimDate || preview.data.claim_date || "";
                              const when = preview.data.when || preview.data.slot || preview.data.slotLabel || preview.data.pickup || preview.data.pickupTime || "";
                              const pickupDisplay = [pickupDate ? fmtDate(pickupDate) : "", when ? prettyPickupWindow(when) : ""]
                                .filter(Boolean)
                                .join(" • ");
                              return pickupDisplay || preview.data.slot;
                            })()}
                          </span>
                        </div>
                      )}

                      {preview.data.status && (
                        <div className="pt-3 border-t border-jckl-gold">
                          <div className="text-xs font-medium text-jckl-navy uppercase mb-2">Status</div>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColorClass(preview.data.status)}`}>
                            {getStatusIcon(preview.data.status)}
                            {preview.data.status}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Top-up Details */}
                  {preview.data.amount && !preview.data.items && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-jckl-navy" />
                          <span className="text-jckl-slate">Amount</span>
                        </div>
                        <span className="font-semibold text-jckl-navy">{peso.format(preview.data.amount)}</span>
                      </div>
                      {preview.data.provider && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-jckl-slate">Method</span>
                          <span className="font-medium capitalize text-jckl-navy">{preview.data.provider}</span>
                        </div>
                      )}
                      {(preview.data.reference || preview.data.txId) && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-jckl-slate">Reference</span>
                          <span className="font-mono text-xs font-medium text-jckl-navy">{preview.data.reference || preview.data.txId}</span>
                        </div>
                      )}
                      {preview.data.status && (
                        <div className="flex items-center justify-between text-sm pt-2 border-t border-jckl-gold">
                          <span className="text-jckl-slate">Status</span>
                          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border ${getStatusColorClass(preview.data.status)}`}>
                            {getStatusIcon(preview.data.status)}
                            {preview.data.status}
                          </span>
                        </div>
                      )}
                      {preview.data.status?.toLowerCase() === 'rejected' && preview.data.rejectionReason && (
                        <div className="bg-jckl-accent/10 border border-jckl-accent rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <XCircle className="w-4 h-4 text-jckl-accent flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="text-xs font-medium text-jckl-accent mb-1">Rejection Reason</div>
                              <p className="text-sm text-jckl-accent/80">{preview.data.rejectionReason}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-jckl-gold flex flex-col sm:flex-row justify-between gap-2 sm:gap-3 flex-shrink-0 bg-jckl-cream flex-wrap">
              <div className="flex gap-2 sm:gap-3 order-2 sm:order-1">
                <button 
                  onClick={() => setPreview(null)} 
                  className="w-full sm:w-auto px-4 py-2 bg-white border border-jckl-gold text-jckl-navy rounded-lg text-sm font-medium hover:bg-jckl-cream"
                >
                  Close
                </button>
                <button 
                  onClick={() => deleteSingle(preview.id)} 
                  className="w-full sm:w-auto px-4 py-2 bg-jckl-accent text-white rounded-lg text-sm font-medium hover:opacity-90"
                >
                  Delete Notification
                </button>
              </div>
              {preview?.data?.items && (
                <button 
                  onClick={() => {
                    navigate("/transactions");
                    setPreview(null);
                  }} 
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 order-1 sm:order-2"
                >
                  View Reservation
                </button>
              )}
              {preview?.data?.amount && !preview?.data?.items && (
                <button 
                  onClick={() => {
                    navigate("/topup-history");
                    setPreview(null);
                  }} 
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 order-1 sm:order-2"
                >
                  View Top-up
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}