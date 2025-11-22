import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import AdminAvbar from "../../components/adminavbar";
import { api } from "../../lib/api";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

const ITEMS_PER_PAGE = 10;

export default function AdminNotifications() {
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

  // 🔥 NEW: Format reservation data nicely
  const renderReservationData = (data) => {
    if (!data) return null;

    // If data has items array (reservation with items)
    if (data.items && Array.isArray(data.items)) {
      return (
        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.reservationid && (
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="text-xs font-semibold text-blue-700 uppercase">Reservation ID</div>
                <div className="text-sm font-mono text-blue-900 mt-1">{data.reservationid}</div>
              </div>
            )}
            
            {data.student && (
              <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                <div className="text-xs font-semibold text-purple-700 uppercase">Student</div>
                <div className="text-sm text-purple-900 mt-1">{data.student}</div>
              </div>
            )}

            {data.grade && (
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <div className="text-xs font-semibold text-green-700 uppercase">Grade</div>
                <div className="text-sm text-green-900 mt-1">{data.grade}</div>
              </div>
            )}

            {data.section && (
              <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                <div className="text-xs font-semibold text-amber-700 uppercase">Section</div>
                <div className="text-sm text-amber-900 mt-1">{data.section}</div>
              </div>
            )}

            {data.slot && (
              <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                <div className="text-xs font-semibold text-indigo-700 uppercase">Slot</div>
                <div className="text-sm text-indigo-900 mt-1">{data.slot}</div>
              </div>
            )}

            {data.note && (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="text-xs font-semibold text-gray-700 uppercase">Note</div>
                <div className="text-sm text-gray-900 mt-1">{data.note}</div>
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

    // 🔥 NEW: Format top-up data nicely
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            {data.studentid && (
              <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                <div className="text-xs font-semibold text-indigo-700 uppercase">Student ID</div>
                <div className="text-sm font-mono text-indigo-900 mt-1">{data.studentid}</div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
    <div className="min-h-screen bg-gray-50">
      <AdminAvbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Admin Notifications</h1>
            <p className="text-sm text-gray-500">Manage system notifications — bulk mark read or delete.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} className="px-3 py-2 border rounded text-sm hover:bg-gray-50">Refresh</button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-3 border-b flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={selected.size === paginatedNotifications.length && paginatedNotifications.length > 0} onChange={toggleAll} />
              <button onClick={markSelectedRead} disabled={selected.size === 0} className="px-3 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50">Mark as read</button>
              <button onClick={deleteSelected} disabled={selected.size === 0} className="px-3 py-2 bg-red-600 text-white rounded text-sm disabled:opacity-50">Delete</button>
            </div>
            <div className="text-sm text-gray-500">{notifications.length} total</div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <p className="text-sm text-gray-500">Loading…</p>
            </div>
          ) : paginatedNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-gray-500">No notifications.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"> </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">From</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Subject</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Sent</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200">
                    {paginatedNotifications.map((n) => (
                      <tr key={n.id} className={`${n.read ? "" : "bg-blue-50"} hover:bg-gray-50`}>
                        <td className="px-6 py-4"><input type="checkbox" checked={selected.has(n.id)} onChange={() => toggle(n.id)} /></td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{n.actor?.name || "System"}</td>
                        <td className="px-6 py-4 text-sm text-gray-700 cursor-pointer" onClick={() => openPreview(n)}>
                          <div className="font-medium text-sm">{n.title}</div>
                          <div className="text-xs text-gray-500 line-clamp-2">{n.body}</div>
                        </td>
                        <td className="px-6 py-4 text-right text-xs text-gray-500">{new Date(n.createdAt).toLocaleString()}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex gap-2">
                            <button onClick={() => openPreview(n)} className="text-sm px-3 py-1 border rounded hover:bg-gray-50">Open</button>
                            <button onClick={() => deleteSingle(n.id)} className="text-sm px-3 py-1 border rounded text-red-600 hover:bg-red-50">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="p-4 border-t flex items-center justify-between">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span>
                    </span>
                    <div className="text-xs text-gray-500 hidden sm:inline">
                      ({startIndex + 1}–{Math.min(endIndex, notifications.length)} of {notifications.length})
                    </div>
                  </div>

                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Preview Modal - REDESIGNED */}
      {preview && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg overflow-hidden my-8">
            {/* Header */}
            <div className="flex items-start gap-4 p-4 sm:p-6 border-b bg-gradient-to-r from-gray-50 to-white">
              <div className="flex-shrink-0">
                {(() => {
                  const adminFallback = { name: "Canteen Admin", profilePictureUrl: "/jckl-192.png" };
                  const display = preview.actor || adminFallback;
                  return display.profilePictureUrl ? (
                    <img
                      src={display.profilePictureUrl}
                      alt=""
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-white shadow-sm"
                      onError={(e) => { 
                        e.target.onerror = null; 
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(display.name || 'CA')}&background=random`; 
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-lg font-medium text-blue-600">
                      {(display.name || "C").charAt(0)}
                    </div>
                  );
                })()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500">From {(preview.actor && preview.actor.name) || "Canteen Admin"}</div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 line-clamp-2">{preview.title}</h3>
                <div className="text-xs text-gray-400 mt-1">{new Date(preview.createdAt).toLocaleString()}</div>
              </div>

              <button 
                onClick={() => setPreview(null)} 
                className="ml-2 flex-shrink-0 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-6 max-h-[calc(100vh-300px)] overflow-y-auto space-y-4">
              {preview.body && (
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{preview.body}</p>
              )}

              {preview.data && renderReservationData(preview.data)}
            </div>

            {/* Footer */}
            <div className="px-4 sm:px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setPreview(null)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => deleteSingle(preview.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}