import React, { useEffect, useState, useMemo } from "react";
import Navbar from "../../components/adminavbar";
import { api } from "../../lib/api";
import { Link } from "react-router-dom";
import { 
  RotateCcw, Search, ArrowUpDown, ArrowUp, ArrowDown,
  Users, Loader2, UserCircle2
} from "lucide-react";

const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });

// Avatar Component
const Avatar = ({ user, size = "md" }) => {
  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-16 h-16 text-xl",
  };

  const fallbackInitial = (user?.name || "U").charAt(0).toUpperCase();

  if (user?.profilePictureUrl) {
    return (
      <img
        src={user.profilePictureUrl}
        alt={user.name || "User"}
        className={`${sizeClasses[size]} rounded-full object-cover border-2 border-white shadow-sm`}
        onError={(e) => {
          e.target.onerror = null;
          e.target.style.display = "none";
          const fallback = document.createElement("div");
          fallback.className = `${sizeClasses[size]} rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center font-semibold text-gray-600`;
          fallback.textContent = fallbackInitial;
          e.target.parentElement.appendChild(fallback);
        }}
      />
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center font-semibold text-gray-600`}>
      {fallbackInitial}
    </div>
  );
};

export default function ArchivedUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [restoringId, setRestoringId] = useState(null);
  
  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get("/admin/users/archived");
      const usersArr = Array.isArray(data) ? data : (data.data ? data.data : []);

      const balances = await Promise.all(
        usersArr.map(async (u) => {
          try {
            if (u.balance !== undefined) {
              return Number(u.balance);
            }
            
            const walletRes = await api.get(`/admin/users/${u.id}/wallet`);
            const wallet = walletRes;
            return Number(wallet?.balance ?? wallet?.wallet ?? 0);
          } catch (err) {
            console.error(`Failed to load wallet for user ${u.id}:`, err);
            return 0;
          }
        })
      );

      const merged = usersArr.map((u, i) => ({ ...u, balance: balances[i] }));
      setUsers(merged);
    } catch (e) {
      console.error("load archived users failed", e);
      setUsers([]);
      alert("Failed to load archived users");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    let result = users;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(u => {
        const matchId = u.id?.toLowerCase().includes(query);
        const matchStudentId = u.studentId?.toLowerCase().includes(query);
        const matchName = u.name?.toLowerCase().includes(query);
        const matchEmail = u.email?.toLowerCase().includes(query);
        const matchPhone = u.phone?.toLowerCase().includes(query);
        const matchBalance = peso.format(Number(u.balance || 0)).toLowerCase().includes(query);
        
        return matchId || matchStudentId || matchName || matchEmail || matchPhone || matchBalance;
      });
    }

    result = [...result].sort((a, b) => {
      let aVal, bVal;

      switch(sortField) {
        case "name":
          aVal = a.name?.toLowerCase() || "";
          bVal = b.name?.toLowerCase() || "";
          break;
        case "email":
          aVal = a.email?.toLowerCase() || "";
          bVal = b.email?.toLowerCase() || "";
          break;
        case "studentId":
          aVal = a.studentId?.toLowerCase() || "";
          bVal = b.studentId?.toLowerCase() || "";
          break;
        case "phone":
          aVal = a.phone?.toLowerCase() || "";
          bVal = b.phone?.toLowerCase() || "";
          break;
        case "balance":
          aVal = Number(a.balance || 0);
          bVal = Number(b.balance || 0);
          break;
        case "archivedAt":
          aVal = new Date(a.archivedAt || 0).getTime();
          bVal = new Date(b.archivedAt || 0).getTime();
          break;
        default:
          return 0;
      }

      if (typeof aVal === "string") {
        return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      } else {
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      }
    });

    return result;
  }, [users, searchQuery, sortField, sortOrder]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortOrder === "asc" 
      ? <ArrowUp className="w-4 h-4 text-amber-600" />
      : <ArrowDown className="w-4 h-4 text-amber-600" />;
  };

  useEffect(() => { load(); }, []);

  const restoreUser = async (id) => {
    const u = users.find(x => String(x.id) === String(id));
    if (!u) return;

    if (!window.confirm(`Restore user "${u.name}" to active users? They will be able to log in again.`)) return;
    
    setRestoringId(id);
    try {
      await api.post(`/admin/users/${id}/restore`);
      setUsers(prev => prev.filter(x => String(x.id) !== String(id)));
      alert('User restored successfully.');
    } catch (err) {
      console.error("restore user failed", err);
      alert(err.response?.data?.error || err.message || "Failed to restore user");
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      <Navbar />
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Archived Users</h1>
                <p className="text-xs sm:text-sm text-gray-500">
                  {filteredUsers.length} of {users.length} archived account{users.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <Link
              to="/admin/users"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Active Users</span>
              <span className="sm:hidden">Active</span>
            </Link>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by ID, name, email, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
              />
            </div>
          </div>
        </div>

        {/* Archived Users Table */}
        <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-white">
                <tr className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="px-6 py-4">Profile</th>
                  <th 
                    className="px-6 py-4 cursor-pointer hover:bg-gray-100 select-none transition"
                    onClick={() => handleSort("studentId")}
                  >
                    <div className="flex items-center gap-2">
                      ID Number
                      <SortIcon field="studentId" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 cursor-pointer hover:bg-gray-100 select-none transition"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-2">
                      Full name
                      <SortIcon field="name" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 cursor-pointer hover:bg-gray-100 select-none transition"
                    onClick={() => handleSort("email")}
                  >
                    <div className="flex items-center gap-2">
                      Email
                      <SortIcon field="email" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 cursor-pointer hover:bg-gray-100 select-none transition"
                    onClick={() => handleSort("phone")}
                  >
                    <div className="flex items-center gap-2">
                      Phone
                      <SortIcon field="phone" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 cursor-pointer hover:bg-gray-100 select-none transition"
                    onClick={() => handleSort("archivedAt")}
                  >
                    <div className="flex items-center gap-2">
                      Archived Date
                      <SortIcon field="archivedAt" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 cursor-pointer hover:bg-gray-100 select-none transition"
                    onClick={() => handleSort("balance")}
                  >
                    <div className="flex items-center gap-2">
                      Last Balance
                      <SortIcon field="balance" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-10 w-10 bg-gray-200 rounded-full" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-28" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-48" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-56" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-36" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-28" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24" /></td>
                    </tr>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center">
                      <UserCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm font-medium text-gray-900">No archived users</p>
                      <p className="text-xs text-gray-500 mt-1">Users will appear here when they are archived</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <Avatar user={u} size="md" />
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-medium text-gray-700">{u.studentId}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">{u.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-600 text-sm">{u.email}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-600">{u.phone || "—"}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {u.archivedAt ? new Date(u.archivedAt).toLocaleDateString() : "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-500">
                          {peso.format(Number(u.balance || 0))}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => restoreUser(u.id)}
                            disabled={restoringId === u.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {restoringId === u.id ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Restoring...
                              </>
                            ) : (
                              <>
                                <RotateCcw className="w-3.5 h-3.5" />
                                Restore
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 animate-pulse">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32" />
                    <div className="h-3 bg-gray-200 rounded w-24" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                </div>
              </div>
            ))
          ) : filteredUsers.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-200">
              <UserCircle2 className="w-16 h-16 text-gray-300 mx-auto mb-3" />
              <p className="text-base font-medium text-gray-900">No archived users</p>
              <p className="text-sm text-gray-500 mt-1">Users will appear here when they are archived</p>
            </div>
          ) : (
            filteredUsers.map((u) => (
              <div key={u.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                  <Avatar user={u} size="lg" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{u.name}</h3>
                    <p className="text-xs font-mono text-gray-500">ID: {u.studentId}</p>
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium mt-1 bg-amber-100 text-amber-700">
                      Archived
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-500">
                      {peso.format(Number(u.balance || 0))}
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Email</span>
                    <span className="text-gray-900 text-right truncate ml-2 max-w-[200px]">{u.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Phone</span>
                    <span className="text-gray-900">{u.phone || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Archived</span>
                    <span className="text-gray-900">
                      {u.archivedAt ? new Date(u.archivedAt).toLocaleDateString() : "—"}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => restoreUser(u.id)}
                    disabled={restoringId === u.id}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-medium hover:bg-amber-700 transition active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {restoringId === u.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Restoring...
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-4 h-4" />
                        Restore
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
