import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactDOM from "react-dom";
import AdminAvbar from "../../components/adminavbar";
import AdminBottomNav from "../../components/mobile/AdminBottomNav";
import { api } from "../../lib/api";
import { X, ChevronLeft, ChevronRight, Trash2, CheckCheck, MoreVertical } from "lucide-react";

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

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

// Helper function to get pickup times based on grade
const getPickupTimes = (grade) => {
  if (!grade) return {};
  
  const gradeNum = parseInt(grade.replace('G', ''));
  
  if (gradeNum >= 2 && gradeNum <= 6) {
    return {
      recess: "Recess: 9:15 AM - 9:30 AM",
      lunch: "Lunch: 11:00 AM - 12:00 PM",
      after: "After Class"
    };
  } else if (gradeNum >= 7 && gradeNum <= 10) {
    return {
      recess: "Recess: 9:30 AM - 9:45 AM",
      lunch: "Lunch: 1:00 PM - 1:20 PM",
      after: "After Class"
    };
  } else if (gradeNum >= 11 && gradeNum <= 12) {
    return {
      recess: "Recess: 9:45 AM - 10:00 AM",
      lunch: "Lunch: 1:20 PM - 1:40 PM",
      after: "After Class"
    };
  }
  
  return {};
};

export default function AdminNotifications() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState(new Set());
  const [preview, setPreview] = useState(null);

  // Pagination calculations
  const totalPages = Math.ceil(notifications.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedNotifications = notifications.slice(startIndex, endIndex);

  // Format reservation data nicely
  const renderReservationData = (data) => {
    if (!data) return null;

    // If data has items array (reservation with items)
    if (data.items && Array.isArray(data.items)) {
      return (
        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {data.reservationid && (
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="text-sm font-semibold text-blue-700 uppercase">Reservation ID</div>
                <div className="text-base font-mono text-blue-900 mt-1 break-all">{data.reservationid}</div>
              </div>
            )}
            
            {data.student && (
              <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                <div className="text-sm font-semibold text-purple-700 uppercase">Student</div>
                <div className="text-base text-purple-900 mt-1">{data.student}</div>
              </div>
            )}

            {data.grade && (
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <div className="text-sm font-semibold text-green-700 uppercase">Grade</div>
                <div className="text-base text-green-900 mt-1">{data.grade}</div>
              </div>
            )}

            {data.section && (
              <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                <div className="text-sm font-semibold text-amber-700 uppercase">Section</div>
                <div className="text-base text-amber-900 mt-1">{data.section}</div>
              </div>
            )}

            {data.slot && (
              <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                <div className="text-sm font-semibold text-indigo-700 uppercase">Slot</div>
                <div className="text-base text-indigo-900 mt-1">
                  {(() => {
                    const pickupDate = data.pickupDate || data.pickup_date || data.claimDate || data.claim_date || "";
                    const when = data.when || data.slot || data.slotLabel || data.pickup || data.pickupTime || "";
                    const pickupDisplay = [pickupDate ? fmtDate(pickupDate) : "", when ? prettyPickupWindow(when) : ""]
                      .filter(Boolean)
                      .join(" • ");
                    return pickupDisplay || data.slot;
                  })()}
                </div>
                {data.grade && (
                  <div className="text-base text-indigo-700 mt-2">
                    {getPickupTimes(data.grade)[data.slot.toLowerCase()] || ''}
                  </div>
                )}
              </div>
            )}

            {data.note && (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 sm:col-span-2">
                <div className="text-sm font-semibold text-gray-700 uppercase">Note</div>
                <div className="text-base text-gray-900 mt-1">{data.note}</div>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="border rounded-lg overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Item</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Price</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Qty</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.items.map((item, idx) => {
                    const itemPrice = typeof item.price === "number" ? item.price : 0;
                    const itemQty = typeof item.qty === "number" ? item.qty : 1;
                    const subtotal = itemPrice * itemQty;
                    
                    return (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-3 py-3 text-sm text-gray-900 font-medium">{item.name || "Unknown Item"}</td>
                        <td className="px-3 py-3 text-center text-sm text-gray-700">
                          {typeof itemPrice === "number" ? peso.format(itemPrice) : "-"}
                        </td>
                        <td className="px-3 py-3 text-center text-sm text-gray-700">{itemQty}</td>
                        <td className="px-3 py-3 text-right text-sm font-semibold text-gray-900">
                          {typeof subtotal === "number" ? peso.format(subtotal) : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Total */}
            {data.total && (
              <div className="px-4 py-3 bg-blue-50 border-t border-blue-200 flex justify-end">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-gray-700">Total:</span>
                  <span className="text-lg font-bold text-blue-900">
                    {typeof data.total === "number" ? peso.format(data.total) : data.total}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Format top-up data nicely
    if (data.topupid || data.amount || data.provider) {
      // Parse student object if it's a JSON string
      let studentData = null;
      if (data.student) {
        if (typeof data.student === "string") {
          try {
            studentData = JSON.parse(data.student);
          } catch {
            studentData = { name: data.student };
          }
        } else if (typeof data.student === "object") {
          studentData = data.student;
        }
      }

      return (
        <div className="space-y-4">
          {/* Top-up Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {data.topupid && (
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="text-xs font-semibold text-blue-700 uppercase">Top-up ID</div>
                <div className="text-sm font-mono text-blue-900 mt-1 break-all">{data.topupid}</div>
              </div>
            )}

            {data.amount && (
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <div className="text-xs font-semibold text-green-700 uppercase">Amount</div>
                <div className="text-lg font-bold text-green-900 mt-1">
                  {typeof data.amount === "number" ? peso.format(data.amount) : peso.format(parseFloat(data.amount) || 0)}
                </div>
              </div>
            )}

            {data.provider && (
              <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                <div className="text-xs font-semibold text-purple-700 uppercase">Provider</div>
                <div className="text-sm text-purple-900 mt-1 capitalize">{data.provider}</div>
              </div>
            )}

            {data.reference && (
              <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                <div className="text-xs font-semibold text-orange-700 uppercase">Reference</div>
                <div className="text-sm font-mono text-orange-900 mt-1 break-all">{data.reference}</div>
              </div>
            )}
          </div>

          {/* Student Info Card */}
          {studentData && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200 space-y-3">
              <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Student Information</div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {studentData.name && (
                  <div>
                    <div className="text-xs text-blue-600 font-medium">Full Name</div>
                    <div className="text-sm text-gray-900 mt-1">{studentData.name}</div>
                  </div>
                )}

                {studentData.contact && (
                  <div>
                    <div className="text-xs text-blue-600 font-medium">Contact Number</div>
                    <div className="text-sm text-gray-900 mt-1 font-mono">{studentData.contact}</div>
                  </div>
                )}

                {studentData.email && (
                  <div className="sm:col-span-2">
                    <div className="text-xs text-blue-600 font-medium">Email</div>
                    <div className="text-sm text-gray-900 mt-1 break-all font-mono">{studentData.email}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Additional Info */}
          {(data.status || data.createdAt) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {data.status && (
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="text-xs font-semibold text-gray-700 uppercase">Status</div>
                  <div className="text-sm text-gray-900 mt-1 capitalize">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      data.status === "completed" ? "bg-green-100 text-green-700" :
                      data.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                      data.status === "failed" ? "bg-red-100 text-red-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {data.status}
                    </span>
                  </div>
                </div>
              )}

              {data.createdAt && (
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="text-xs font-semibold text-gray-700 uppercase">Date</div>
                  <div className="text-sm text-gray-900 mt-1">{new Date(data.createdAt).toLocaleString()}</div>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    // Fallback for other data types
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.entries(data).map(([k, v]) => (
          <div key={k} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-xs font-semibold text-gray-600 uppercase">{k}</div>
            <div className="text-sm text-gray-900 mt-1 break-words">
              {typeof v === "object" ? JSON.stringify(v) : String(v)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const load = async () => {
    setLoading(true);
    try {
      const d = await api.get("/notifications/admin");
      setNotifications(Array.isArray(d) ? d : []);
      setCurrentPage(1);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
      setSelected(new Set());
    }
  };

  useEffect(() => { load(); }, []);

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
    try {
      await api.post("/notifications/admin/mark-read", { ids: Array.from(selected) });
      setNotifications((prev) => prev.map(n => selected.has(n.id) ? { ...n, read: true } : n));
      setSelected(new Set());
    } catch {
      alert("Failed to mark selected as read.");
    }
  };

  const deleteSelected = async () => {
    if (!selected.size) return alert("No notifications selected.");
    if (!window.confirm("Delete selected notifications?")) return;
    try {
      await Promise.all(Array.from(selected).map(id => api.del(`/notifications/admin/${id}`).catch(() => {})));
      setNotifications((prev) => prev.filter(n => !selected.has(n.id)));
      setSelected(new Set());
      if (startIndex >= notifications.length - selected.size && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch {
      alert("Failed to delete selected notifications.");
    }
  };

  const openPreview = async (n) => {
    setPreview(n);
    if (!n.read) {
      try {
        await api.post("/notifications/admin/mark-read", { ids: [n.id] });
        setNotifications((prev) => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
      } catch {}
    }
  };

  const deleteSingle = async (id) => {
    if (!window.confirm("Delete this notification?")) return;
    try {
      await api.del(`/notifications/admin/${id}`);
      setNotifications((prev) => prev.filter(n => n.id !== id));
      if (preview?.id === id) setPreview(null);
      if (startIndex >= notifications.length - 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch {
      alert("Failed to delete notification.");
    }
  };

  return (
    <div className="min-h-screen bg-jckl-cream pb-20 md:pb-0">
      <AdminAvbar />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Header - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-jckl-navy">Admin Notifications</h1>
            <p className="text-xs sm:text-sm text-jckl-slate mt-1">Manage system notifications</p>
          </div>
          <button 
            onClick={load} 
            className="w-full sm:w-auto px-4 py-2 border border-jckl-gold text-jckl-navy rounded-lg text-sm font-medium hover:bg-jckl-cream transition"
          >
            Refresh
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-jckl-gold overflow-hidden">
          {/* Action Bar - Mobile Optimized */}
          <div className="p-3 sm:p-4 border-b border-jckl-gold bg-jckl-cream">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <input 
                  type="checkbox" 
                  checked={selected.size === paginatedNotifications.length && paginatedNotifications.length > 0} 
                  onChange={toggleAll}
                  className="w-4 h-4 rounded border-jckl-gold accent-jckl-navy"
                />
                <span className="text-xs sm:text-sm text-jckl-slate">
                  {selected.size > 0 ? `${selected.size} selected` : 'Select all'}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={markSelectedRead} 
                  disabled={selected.size === 0} 
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 bg-jckl-navy text-white rounded-lg text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-jckl-light-navy transition"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">Mark Read</span>
                  <span className="sm:hidden">Read</span>
                </button>
                <button 
                  onClick={deleteSelected} 
                  disabled={selected.size === 0} 
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 bg-jckl-accent text-white rounded-lg text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              </div>
            </div>
            
            <div className="mt-2 text-xs text-jckl-slate">
              {notifications.length} total notifications
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-jckl-cream border-t-jckl-navy mb-2"></div>
              <p className="text-sm text-jckl-slate">Loading notifications...</p>
            </div>
          ) : paginatedNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-jckl-cream flex items-center justify-center">
                <CheckCheck className="w-8 h-8 text-jckl-navy" />
              </div>
              <p className="text-sm text-jckl-slate">No notifications to display</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-jckl-cream">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-jckl-navy uppercase tracking-wider w-12"></th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-jckl-navy uppercase tracking-wider">From</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-jckl-navy uppercase tracking-wider">Subject</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-jckl-navy uppercase tracking-wider">Sent</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-jckl-navy uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-jckl-gold bg-white">
                    {paginatedNotifications.map((n) => (
                      <tr key={n.id} className={`${n.read ? "" : "bg-jckl-cream/50"} hover:bg-jckl-cream/30 transition`}>
                        <td className="px-6 py-4">
                          <input 
                            type="checkbox" 
                            checked={selected.has(n.id)} 
                            onChange={() => toggle(n.id)}
                            className="w-4 h-4 rounded border-jckl-gold accent-jckl-navy"
                          />
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-jckl-navy whitespace-nowrap">{n.actor?.name || "System"}</td>
                        <td className="px-6 py-4 text-sm text-jckl-slate cursor-pointer max-w-md" onClick={() => openPreview(n)}>
                          <div className="font-medium text-sm line-clamp-1 text-jckl-navy">{n.title}</div>
                          <div className="text-xs text-jckl-slate line-clamp-2 mt-1">{n.body}</div>
                        </td>
                        <td className="px-6 py-4 text-right text-xs text-jckl-slate whitespace-nowrap">
                          {new Date(n.createdAt).toLocaleDateString('en-PH', { 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="inline-flex gap-2">
                            <button 
                              onClick={() => openPreview(n)} 
                              className="text-sm px-3 py-1.5 border border-jckl-gold text-jckl-navy rounded-lg hover:bg-jckl-cream transition font-medium"
                            >
                              Open
                            </button>
                            <button 
                              onClick={() => deleteSingle(n.id)} 
                              className="text-sm px-3 py-1.5 border border-jckl-accent rounded-lg text-jckl-accent hover:bg-jckl-cream transition font-medium"
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

              {/* Mobile Card View */}
              <div className="lg:hidden divide-y divide-jckl-gold">
                {paginatedNotifications.map((n) => (
                  <div 
                    key={n.id} 
                    className={`p-4 ${n.read ? "bg-white" : "bg-jckl-cream/50"} hover:bg-jckl-cream/30 transition`}
                  >
                    <div className="flex items-start gap-3">
                      <input 
                        type="checkbox" 
                        checked={selected.has(n.id)} 
                        onChange={() => toggle(n.id)}
                        className="mt-1 w-4 h-4 rounded border-jckl-gold accent-jckl-navy flex-shrink-0"
                      />
                      
                      <div className="flex-1 min-w-0" onClick={() => openPreview(n)}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-jckl-navy line-clamp-2 mb-1">
                              {n.title}
                            </div>
                            <div className="text-xs text-jckl-slate mb-1">
                              From: <span className="font-medium">{n.actor?.name || "System"}</span>
                            </div>
                          </div>
                          {!n.read && (
                            <div className="flex-shrink-0">
                              <span className="inline-block w-2 h-2 bg-jckl-navy rounded-full"></span>
                            </div>
                          )}
                        </div>
                        
                        <p className="text-xs text-jckl-slate line-clamp-2 mb-2">
                          {n.body}
                        </p>
                        
                        <div className="text-xs text-jckl-slate/60">
                          {new Date(n.createdAt).toLocaleDateString('en-PH', { 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>

                      <button 
                        onClick={() => deleteSingle(n.id)}
                        className="flex-shrink-0 p-2 text-jckl-accent hover:bg-jckl-cream rounded-lg transition"
                        aria-label="Delete notification"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls - Mobile Optimized */}
              {totalPages > 1 && (
                <div className="p-3 sm:p-4 border-t border-jckl-gold bg-jckl-cream">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 border border-jckl-gold text-jckl-navy rounded-lg text-xs sm:text-sm font-medium hover:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">Previous</span>
                    </button>

                    <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                      <span className="text-xs sm:text-sm text-jckl-slate">
                        Page <span className="font-semibold text-jckl-navy">{currentPage}</span> of <span className="font-semibold text-jckl-navy">{totalPages}</span>
                      </span>
                      <span className="text-xs text-jckl-slate/60">
                        ({startIndex + 1}–{Math.min(endIndex, notifications.length)} of {notifications.length})
                      </span>
                    </div>

                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 border border-jckl-gold text-jckl-navy rounded-lg text-xs sm:text-sm font-medium hover:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Preview Modal - Mobile Optimized */}
      {preview && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
          <div className="w-full sm:max-w-2xl bg-white sm:rounded-lg shadow-lg overflow-hidden max-h-screen sm:max-h-[90vh] flex flex-col sm:my-8 animate-slide-up sm:animate-none">
            {/* Header */}
            <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-6 border-b border-jckl-gold bg-gradient-to-r from-jckl-cream to-white flex-shrink-0">
              <div className="flex-shrink-0">
                {(() => {
                  const adminFallback = { name: "Canteen Admin", profilePictureUrl: "/jckl-192.png" };
                  const display = preview.actor || adminFallback;
                  return display.profilePictureUrl ? (
                    <img
                      src={display.profilePictureUrl}
                      alt=""
                      className="w-10 h-10 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-jckl-gold shadow-sm"
                      onError={(e) => { 
                        e.target.onerror = null; 
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(display.name || 'CA')}&background=random`; 
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-jckl-navy to-jckl-purple flex items-center justify-center text-base sm:text-lg font-medium text-white">
                      {(display.name || "C").charAt(0)}
                    </div>
                  );
                })()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-xs text-jckl-slate">From {(preview.actor && preview.actor.name) || "Canteen Admin"}</div>
                <h3 className="text-base sm:text-xl font-semibold text-jckl-navy line-clamp-2 mt-0.5">{preview.title}</h3>
                <div className="text-xs text-jckl-slate/60 mt-1">
                  {new Date(preview.createdAt).toLocaleDateString('en-PH', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>

              <button 
                onClick={() => setPreview(null)} 
                className="flex-shrink-0 p-2 rounded-full text-jckl-slate hover:text-jckl-navy hover:bg-jckl-cream transition-colors"
                aria-label="Close preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body - Scrollable */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {preview.body && (
                <p className="text-sm sm:text-base text-jckl-navy leading-relaxed">{preview.body}</p>
              )}

              {preview.data && renderReservationData(preview.data)}
            </div>

            {/* Footer - Sticky */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-jckl-gold bg-jckl-cream flex gap-2 sm:gap-3 flex-shrink-0 flex-wrap justify-between">
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={() => setPreview(null)}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-white border border-jckl-gold text-jckl-navy rounded-lg text-sm font-medium hover:bg-jckl-cream transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => deleteSingle(preview.id)}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-jckl-accent text-white rounded-lg text-sm font-medium hover:opacity-90 transition-colors"
                >
                  Delete
                </button>
              </div>
              {preview?.data?.items && (
                <button
                  onClick={() => {
                    navigate("/admin/reservations");
                    setPreview(null);
                  }}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  View Reservation
                </button>
              )}
              {preview?.data?.amount && !preview?.data?.items && (
                <button
                  onClick={() => {
                    navigate("/admin/topup");
                    setPreview(null);
                  }}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  View Top-up
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
      
      {/* Bottom Nav (mobile) */}
      <AdminBottomNav />
    </div>
  );
}