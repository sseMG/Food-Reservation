import React, { useEffect, useState, useMemo } from "react";
import Navbar from "../../components/adminavbar";
import AdminBottomNav from "../../components/mobile/AdminBottomNav";
import { api } from "../../lib/api";
import { useModal } from "../../contexts/ModalContext";
import { Link } from "react-router-dom";
import { 
  Pencil, X, Trash, Search, ArrowUpDown, ArrowUp, ArrowDown,
  Users, Filter, Loader2, Upload, Camera, UserCircle2, Check, AlertCircle, Archive
} from "lucide-react";

const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });
const USER_PROFILE_UPDATED = 'USER_PROFILE_UPDATED';

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
          fallback.className = `${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center font-semibold text-jckl-navy`;
          fallback.textContent = fallbackInitial;
          if (e.target.parentElement) {
            e.target.parentElement.appendChild(fallback);
          }
        }}
      />
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center font-semibold text-jckl-navy`}>
      {fallbackInitial}
    </div>
  );
};

export default function AdminUsers() {
  const { showAlert, showConfirm } = useModal();
  const [users, setUsers] = useState([]);
  const [archivedCount, setArchivedCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    note: ''
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterZeroBalance, setFilterZeroBalance] = useState(false);
  const [filterPendingOnly, setFilterPendingOnly] = useState(false);
  const [sortField, setSortField] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [approvingIdInline, setApprovingIdInline] = useState(null);
  const [rejectingIdInline, setRejectingIdInline] = useState(null);
  
  // Approval system state
  const [approvingId, setApprovingId] = useState(null);
  const [approvalForm, setApprovalForm] = useState({
    approvalNotes: ''
  });
  const [rejectionForm, setRejectionForm] = useState({
    rejectionReason: ''
  });
  const [selectedPendingUser, setSelectedPendingUser] = useState(null);
  const [selectedRejectUser, setSelectedRejectUser] = useState(null);
  
  // Balance editing state
  const [balanceEditUser, setBalanceEditUser] = useState(null);
  const [balanceLoginEmail, setBalanceLoginEmail] = useState('');
  const [balanceLoginPassword, setBalanceLoginPassword] = useState('');
  const [balanceLoginLoading, setBalanceLoginLoading] = useState(false);
  const [balanceLoginError, setBalanceLoginError] = useState('');
  const [balancePasswordVerified, setBalancePasswordVerified] = useState(false);
  const [newBalance, setNewBalance] = useState('');
  const [balanceUpdateLoading, setBalanceUpdateLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get("/admin/users");
      const usersArr = Array.isArray(data) ? data : (data.data ? data.data : []);

      const balances = await Promise.all(
        usersArr.map(async (u) => {
          try {
            if (u.balance !== undefined) {
              return Number(u.balance);
            }
            
            const walletRes = await api.get(`/admin/users/${u.id}/wallet`);
            const balance = walletRes?.balance ?? walletRes?.wallet?.balance ?? walletRes?.wallet ?? 0;
            return Number(balance);
          } catch (err) {
            console.error(`Failed to load wallet for user ${u.id}:`, err);
            return 0;
          }
        })
      );

      const merged = usersArr.map((u, i) => ({ ...u, balance: balances[i] }));
      setUsers(merged);

      // Load archived count
      try {
        const archivedData = await api.get("/admin/users/archived");
        const archivedArr = Array.isArray(archivedData) ? archivedData : (archivedData.data ? archivedData.data : []);
        setArchivedCount(archivedArr.length);
      } catch (err) {
        console.error("Failed to load archived users count:", err);
        setArchivedCount(0);
      }
    } catch (e) {
      console.error("load users failed", e);
      setUsers([]);
      await showAlert("Failed to load users", "warning");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    let result = users;

    if (filterZeroBalance) {
      result = result.filter(u => Number(u.balance || 0) === 0);
    }

    if (filterPendingOnly) {
      result = result.filter(u => u.status === "pending");
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(u => {
        const matchId = String(u.id || '').toLowerCase().includes(query);
        const matchName = String(u.name || '').toLowerCase().includes(query);
        const matchEmail = String(u.email || '').toLowerCase().includes(query);
        const matchPhone = String(u.phone || '').toLowerCase().includes(query);
        const matchBalance = String(Number(u.balance || 0)).includes(query);
        
        return matchId || matchName || matchEmail || matchPhone || matchBalance;
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
        case "phone":
          aVal = a.phone?.toLowerCase() || "";
          bVal = b.phone?.toLowerCase() || "";
          break;
        case "balance":
          aVal = Number(a.balance || 0);
          bVal = Number(b.balance || 0);
          break;
        case "createdAt":
          aVal = new Date(a.createdAt || 0).getTime();
          bVal = new Date(b.createdAt || 0).getTime();
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
  }, [users, searchQuery, filterZeroBalance, filterPendingOnly, sortField, sortOrder]);

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
      return <ArrowUpDown className="w-4 h-4 text-jckl-slate" />;
    }
    return sortOrder === "asc" 
      ? <ArrowUp className="w-4 h-4 text-jckl-navy" />
      : <ArrowDown className="w-4 h-4 text-jckl-navy" />;
  };

  useEffect(() => { load(); }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (!editUser && !selectedPendingUser && !selectedRejectUser && !balanceEditUser) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [editUser, selectedPendingUser, selectedRejectUser, balanceEditUser]);

  const handleEdit = (user) => {
    setEditUser(user);
    setEditForm({
      name: user.name,
      phone: user.phone || '',
      note: ''
    });
    setPhotoFile(null);
    setRemovePhoto(false);
  };

  const handlePhotoChange = (e) => {
    if (e.target.files?.[0]) {
      setPhotoFile(e.target.files[0]);
      setRemovePhoto(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editUser) return;

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('name', editForm.name);
      formData.append('phone', editForm.phone);
      formData.append('removePhoto', removePhoto);
      formData.append('note', editForm.note || "");
      if (photoFile) {
        formData.append('photo', photoFile);
      }

      const res = await api.patch(`/admin/users/${editUser.id}`, formData);
      
      if (res && (res.ok || res.user)) {
        const updated = res.user || res;
        setUsers(users.map(u => 
          u.id === editUser.id ? { ...u, ...updated } : u
        ));
        
        const event = new CustomEvent(USER_PROFILE_UPDATED, {
          detail: {
            userId: editUser.id,
            updates: updated
          }
        });
        window.dispatchEvent(event);
        
        setEditUser(null);
      }
    } catch (err) {
      console.error('Update failed:', err);
      await showAlert(err.response?.data?.error || 'Failed to update user', "warning");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteUser = async (id) => {
    const u = users.find(x => String(x.id) === String(id));
    if (!u) return;

    if (String(u.role || '').toLowerCase() === 'admin' || u.isAdmin) {
      await showAlert("Administrator accounts cannot be deleted.", "warning");
      return;
    }

    if ((u.balance || 0) !== 0) {
      await showAlert("User must have zero balance before deletion.", "warning");
      return;
    }
    const confirmed = await showConfirm(
      `Delete user "${u.name}"? This will remove the account from the system but keep their historical records for reports.`,
      "Delete User"
    );
    if (!confirmed) return;
    setDeletingId(id);
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(prev => prev.filter(x => String(x.id) !== String(id)));
      // Update archived count
      setArchivedCount(prev => prev + 1);
    } catch (err) {
      console.error("delete user failed", err);
      await showAlert(err.message || "Failed to delete user", "warning");
    } finally {
      setDeletingId(null);
    }
  };

  const canDelete = (u) => {
    return (
      Number(u.balance || 0) === 0 &&
      String(u.role || '').toLowerCase() !== 'admin' &&
      !u.isAdmin &&
      u.status !== 'pending'
    );
  };

  const approveUser = async (userId) => {
    if (!userId) return;
    setApprovingId(userId);
    try {
      await api.post(`/admin/users/${userId}/approve`, {
        approvalNotes: approvalForm.approvalNotes
      });
      
      // Update user status in state
      setUsers(users.map(u => 
        String(u.id) === String(userId) ? { ...u, status: "approved" } : u
      ));
      
      setSelectedPendingUser(null);
      setApprovalForm({ approvalNotes: '' });
      await showAlert('User approved successfully. Confirmation email sent.', "success");
    } catch (err) {
      console.error('Approval failed:', err);
      await showAlert(err.response?.data?.error || 'Failed to approve user', "warning");
    } finally {
      setApprovingId(null);
    }
  };

  const rejectUser = async (userId) => {
    if (!userId) return;
    
    setRejectingIdInline(userId);
    try {
      await api.post(`/admin/users/${userId}/reject`, {
        rejectionReason: rejectionForm.rejectionReason
      });
      
      // Remove user from state (account is deleted)
      setUsers(users.filter(u => String(u.id) !== String(userId)));
      
      setSelectedRejectUser(null);
      setRejectionForm({ rejectionReason: '' });
      await showAlert('Registration rejected. User account has been deleted.', "success");
    } catch (err) {
      console.error('Rejection failed:', err);
      await showAlert(err.response?.data?.error || 'Failed to reject user', "warning");
    } finally {
      setRejectingIdInline(null);
    }
  };

  const approveUserInline = async (userId) => {
    if (!userId) return;
    setApprovingIdInline(userId);
    try {
      await api.post(`/admin/users/${userId}/approve`, {
        approvalNotes: ""
      });
      
      // Update user status in state
      setUsers(users.map(u => 
        String(u.id) === String(userId) ? { ...u, status: "approved" } : u
      ));
      
      await showAlert('User approved successfully. Confirmation email sent.', "success");
    } catch (err) {
      console.error('Approval failed:', err);
      await showAlert(err.response?.data?.error || 'Failed to approve user', "warning");
    } finally {
      setApprovingIdInline(null);
    }
  };

  // Balance editing functions
  const handleBalanceClick = (user) => {
    setBalanceEditUser(user);
    setBalanceLoginEmail(user.email);
    setBalanceLoginPassword('');
    setNewBalance(String(user.balance || 0));
    setBalanceLoginError('');
    setBalancePasswordVerified(false);
    setSearchQuery(''); // Clear search to prevent filtering
  };

  const handleBalanceLogin = async () => {
    if (!balanceEditUser || !balanceLoginPassword.trim()) {
      setBalanceLoginError('Password is required');
      return;
    }

    setBalanceLoginLoading(true);
    setBalanceLoginError('');
    try {
      // Verify credentials before allowing balance edit
      const loginRes = await api.post('/auth/login', {
        email: balanceLoginEmail,
        password: balanceLoginPassword
      });

      // Check if login was successful - if we get here without throwing an error, it succeeded
      // The api wrapper unwraps the response, so loginRes will have token and user
      if (loginRes && loginRes.token && loginRes.user) {
        // Credentials verified - move to balance edit interface
        setBalancePasswordVerified(true);
        setBalanceLoginPassword('');
      } else {
        setBalanceLoginError('Authentication failed. Please try again.');
      }
    } catch (err) {
      console.error('Login verification failed:', err);
      setBalanceLoginError(err.response?.data?.error || err.message || 'Invalid credentials');
    } finally {
      setBalanceLoginLoading(false);
    }
  };

  const handleBalanceUpdate = async () => {
    if (!balanceEditUser) return;

    const newBalanceNum = parseFloat(newBalance);
    if (isNaN(newBalanceNum) || newBalanceNum < 0) {
      await showAlert('Please enter a valid balance amount', "warning");
      return;
    }

    setBalanceUpdateLoading(true);
    try {
      // Update user balance through wallet endpoint
      await api.post(`/admin/users/${balanceEditUser.id}/wallet/set-balance`, {
        newBalance: newBalanceNum
      });

      // Update local state
      setUsers(users.map(u =>
        String(u.id) === String(balanceEditUser.id) ? { ...u, balance: newBalanceNum } : u
      ));

      await showAlert('Balance updated successfully', "success");
      closeBalanceModal();
    } catch (err) {
      console.error('Balance update failed:', err);
      await showAlert(err.response?.data?.error || 'Failed to update balance', "warning");
    } finally {
      setBalanceUpdateLoading(false);
    }
  };

  const totalBalance = useMemo(() => {
    return filteredUsers.reduce((sum, u) => sum + Number(u.balance || 0), 0);
  }, [filteredUsers]);

  const closeBalanceModal = () => {
    setBalanceEditUser(null);
    setBalanceLoginEmail('');
    setBalanceLoginPassword('');
    setNewBalance('');
    setBalanceLoginError('');
    setBalancePasswordVerified(false);
  };

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-8">
      <Navbar />
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold text-jckl-navy">User Management</h1>
                <p className="text-xs sm:text-sm text-jckl-slate">
                  {filteredUsers.length} of {users.length} account{users.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <Link
              to="/admin/archived-users"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-xl font-medium text-sm hover:bg-amber-700 transition"
              title={`View ${archivedCount} archived user${archivedCount !== 1 ? 's' : ''}`}
            >
              <Archive className="w-4 h-4" />
              <span className="hidden sm:inline">Archived</span>
              {archivedCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full ml-1">
                  {archivedCount}
                </span>
              )}
            </Link>
          </div>

          {/* Total Balance Counter */}
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Total Balance (Filtered Users)</p>
              <p className="text-2xl sm:text-3xl font-bold text-emerald-600 mt-1">
                {peso.format(totalBalance)}
              </p>
            </div>
            <div className="hidden sm:flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100">
              <span className="text-2xl">💰</span>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-jckl-slate pointer-events-none" />
              <input
                type="text"
                placeholder="Search by ID, name, email, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-jckl-gold rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-jckl-gold focus:border-transparent transition"
              />
            </div>
            
            <button
              onClick={() => setFilterPendingOnly(!filterPendingOnly)}
              className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                filterPendingOnly
                  ? "bg-amber-600 text-white shadow-lg shadow-amber-200"
                  : "bg-white border border-jckl-gold text-jckl-slate hover:bg-white"
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Pending</span>
              <span className="sm:hidden">⏳</span>
            </button>

            <button
              onClick={() => setFilterZeroBalance(!filterZeroBalance)}
              className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                filterZeroBalance
                  ? "bg-jckl-navy text-white shadow-lg shadow-blue-200"
                  : "bg-white border border-jckl-gold text-jckl-slate hover:bg-white"
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Zero Balance</span>
              <span className="sm:hidden">₱0</span>
            </button>
          </div>
        </div>
        {/* Approved/Rejected Users Section */}
        <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-jckl-gold overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-white">
                <tr className="text-left text-xs font-semibold text-jckl-slate uppercase tracking-wider">
                  <th className="px-6 py-4">Profile</th>
                  <th 
                    className="px-6 py-4 cursor-pointer hover:bg-jckl-cream select-none transition"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-2">
                      Full name
                      <SortIcon field="name" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 cursor-pointer hover:bg-jckl-cream select-none transition"
                    onClick={() => handleSort("email")}
                  >
                    <div className="flex items-center gap-2">
                      Email
                      <SortIcon field="email" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 cursor-pointer hover:bg-jckl-cream select-none transition"
                    onClick={() => handleSort("phone")}
                  >
                    <div className="flex items-center gap-2">
                      Phone
                      <SortIcon field="phone" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 cursor-pointer hover:bg-jckl-cream select-none transition"
                    onClick={() => handleSort("balance")}
                  >
                    <div className="flex items-center gap-2">
                      Balance
                      <SortIcon field="balance" />
                    </div>
                  </th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-jckl-gold">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-10 w-10 bg-gray-200 rounded-full" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-28" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-48" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-56" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-36" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-28" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24" /></td>
                    </tr>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-12 text-center">
                      <UserCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm font-medium text-jckl-navy">No users found</p>
                      <p className="text-xs text-jckl-slate mt-1">Try adjusting your search or filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-white transition-colors">
                      <td className="px-6 py-4">
                        <Avatar user={u} size="md" />
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-jckl-navy">{u.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-jckl-slate text-sm">{u.email}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-jckl-slate">{u.phone || "—"}</span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleBalanceClick(u)}
                          className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer transition"
                          title="Click to edit balance"
                        >
                          {peso.format(Number(u.balance || 0))}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        {u.status === 'pending' ? (
                          <div className="flex flex-col gap-1.5">
                            <button
                              onClick={() => approveUserInline(u.id)}
                              disabled={approvingIdInline === u.id}
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed w-full"
                            >
                              {approvingIdInline === u.id ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  Approving...
                                </>
                              ) : (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  Approve
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRejectUser(u);
                                setRejectionForm({ rejectionReason: '' });
                              }}
                              disabled={rejectingIdInline === u.id}
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition disabled:opacity-60 disabled:cursor-not-allowed w-full"
                            >
                              {rejectingIdInline === u.id ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  Rejecting...
                                </>
                              ) : (
                                <>
                                  <X className="w-3.5 h-3.5" />
                                  Reject
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                            u.status === 'approved'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-jckl-cream text-jckl-slate'
                          }`}>
                            {u.status && u.status !== 'approved' ? u.status.charAt(0).toUpperCase() + u.status.slice(1) : 'Approved'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          String(u.role || '').toLowerCase() === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleEdit(u)}
                            disabled={u.status === 'pending'}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                              u.status === 'pending'
                                ? "bg-jckl-cream text-jckl-slate cursor-not-allowed"
                                : "bg-jckl-navy text-white hover:bg-jckl-navy"
                            }`}
                            title={u.status === 'pending' ? "Cannot edit pending accounts" : "Edit user"}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </button>

                          <button
                            onClick={() => deleteUser(u.id)}
                            disabled={deletingId === u.id || !canDelete(u)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                              canDelete(u)
                                ? "bg-red-600 text-white hover:bg-red-700"
                                : "bg-jckl-cream text-jckl-slate cursor-not-allowed"
                            }`}
                            title={
                              u.status === 'pending'
                                ? "Cannot delete pending accounts"
                                : String(u.role || '').toLowerCase() === 'admin' || u.isAdmin
                                ? "Cannot delete administrator"
                                : Number(u.balance || 0) !== 0
                                ? "User must have zero balance"
                                : "Delete user"
                            }
                          >
                            {deletingId === u.id ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              <>
                                <Trash className="w-3.5 h-3.5" />
                                Delete
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
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-jckl-gold animate-pulse">
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
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-jckl-gold">
              <UserCircle2 className="w-16 h-16 text-gray-300 mx-auto mb-3" />
              <p className="text-base font-medium text-jckl-navy">No users found</p>
              <p className="text-sm text-jckl-slate mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredUsers.map((u) => (
              <div key={u.id} className="bg-white rounded-2xl p-4 shadow-sm border border-jckl-gold hover:shadow-md transition-shadow">
                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                  <Avatar user={u} size="lg" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-jckl-navy truncate">{u.name}</h3>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                      String(u.role || '').toLowerCase() === 'admin'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {u.role}
                    </span>
                  </div>
                  <div className="text-right">
                    <button
                      onClick={() => handleBalanceClick(u)}
                      className="text-sm font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer transition"
                      title="Click to edit balance"
                    >
                      {peso.format(Number(u.balance || 0))}
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-jckl-slate">Email</span>
                    <span className="text-jckl-navy text-right truncate ml-2 max-w-[200px]">{u.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-jckl-slate">Phone</span>
                    <span className="text-jckl-navy">{u.phone || "—"}</span>
                  </div>
                  {u.status === 'pending' && (
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-2">
                      <span className="text-jckl-slate">Status</span>
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        Pending
                      </span>
                    </div>
                  )}
                </div>

                {/* Approval Actions for Pending Users */}
                {u.status === 'pending' && (
                  <div className="flex gap-2 pt-3 border-t border-gray-100 mb-3">
                    <button
                      onClick={() => approveUserInline(u.id)}
                      disabled={approvingIdInline === u.id}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {approvingIdInline === u.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Approving...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Approve
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRejectUser(u);
                        setRejectionForm({ rejectionReason: '' });
                      }}
                      disabled={rejectingIdInline === u.id}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {rejectingIdInline === u.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Rejecting...
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4" />
                          Reject
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <button 
                    onClick={() => handleEdit(u)}
                    disabled={u.status === 'pending'}
                    className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition active:scale-95 ${
                      u.status === 'pending'
                        ? "bg-jckl-cream text-jckl-slate cursor-not-allowed"
                        : "bg-jckl-navy text-white hover:bg-jckl-navy"
                    }`}
                    title={u.status === 'pending' ? "Cannot edit pending accounts" : "Edit user"}
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </button>

                  <button
                    onClick={() => deleteUser(u.id)}
                    disabled={deletingId === u.id || !canDelete(u)}
                    className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition active:scale-95 ${
                      canDelete(u)
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "bg-jckl-cream text-jckl-slate cursor-not-allowed"
                    }`}
                  >
                    {deletingId === u.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash className="w-4 h-4" />
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Edit Modal */}
        {editUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 max-h-[75vh] overflow-hidden flex flex-col mb-20 lg:mb-0">
              {/* Sticky Header */}
              <div className="sticky top-0 bg-white border-b border-jckl-gold p-4 sm:p-6 rounded-t-2xl z-10 flex-shrink-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-jckl-navy">Edit User Profile</h3>
                    <p className="text-xs sm:text-sm text-jckl-slate mt-1">Update user information</p>
                  </div>
                  <button 
                    onClick={() => setEditUser(null)}
                    className="p-2 hover:bg-jckl-cream rounded-full transition flex-shrink-0"
                  >
                    <X className="w-5 h-5 text-jckl-slate" />
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto flex-1">
                {/* Fixed Profile Picture Section */}
                <div className="sticky top-0 bg-white p-4 sm:p-6 border-b border-jckl-gold flex-shrink-0">
                  <div className="flex items-center gap-4 p-4 bg-white rounded-xl">
                    <div className="relative flex-shrink-0">
                      {!removePhoto && (editUser.profilePictureUrl || photoFile) ? (
                        <img 
                          src={photoFile ? URL.createObjectURL(photoFile) : editUser.profilePictureUrl}
                          alt=""
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-white shadow-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-2xl font-bold text-jckl-navy flex-shrink-0">
                          {editUser.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-jckl-navy rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                        <Camera className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                        id="photo-upload"
                      />
                      <div className="flex flex-col sm:flex-row gap-2">
                        <label 
                          htmlFor="photo-upload"
                          className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-jckl-navy text-white rounded-lg text-sm font-medium cursor-pointer hover:bg-jckl-navy transition"
                        >
                          <Upload className="w-4 h-4" />
                          <span className="hidden sm:inline">Upload</span>
                          <span className="sm:hidden">Upload</span>
                        </label>
                        {(editUser.profilePictureUrl || photoFile) && (
                          <button
                            type="button"
                            onClick={() => {
                              setPhotoFile(null);
                              setRemovePhoto(true);
                            }}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 border border-red-600 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition"
                          >
                            <X className="w-4 h-4" />
                            <span className="hidden sm:inline">Remove</span>
                            <span className="sm:hidden">Remove</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-semibold text-jckl-slate mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.name}
                      onChange={e => setEditForm({...editForm, name: e.target.value})}
                      className="w-full px-4 py-3 border border-jckl-gold rounded-xl focus:outline-none focus:ring-2 focus:ring-jckl-gold focus:border-transparent transition"
                      placeholder="Enter full name"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-semibold text-jckl-slate mb-2">
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={e => setEditForm({...editForm, phone: e.target.value})}
                      className="w-full px-4 py-3 border border-jckl-gold rounded-xl focus:outline-none focus:ring-2 focus:ring-jckl-gold focus:border-transparent transition"
                      placeholder="09•• ••• ••••"
                    />
                  </div>

                  {/* Admin Note */}
                  <div>
                    <label className="block text-sm font-semibold text-jckl-slate mb-2">
                      Optional Note to User
                    </label>
                    <textarea
                      value={editForm.note}
                      onChange={e => setEditForm({...editForm, note: e.target.value})}
                      placeholder="Write a message to the user about this update (optional)"
                      className="w-full px-4 py-3 border border-jckl-gold rounded-xl focus:outline-none focus:ring-2 focus:ring-jckl-gold focus:border-transparent transition resize-none"
                      rows={3}
                    />
                    <p className="text-xs text-jckl-slate mt-1">
                      The user will be notified of changes and see this message
                    </p>
                  </div>

                  {/* Spacer for button visibility */}
                  <div className="h-4" />

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-jckl-gold">
                    <button
                      type="button"
                      onClick={() => setEditUser(null)}
                      disabled={submitting}
                      className="flex-1 px-4 py-3 text-sm font-semibold text-jckl-slate bg-white border border-jckl-gold rounded-xl hover:bg-white transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Approval Modal */}
        {selectedPendingUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-t-2xl">
                <h3 className="text-xl font-bold text-white">Approve Registration</h3>
                <p className="text-green-100 text-sm mt-1">Review and approve this student account</p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-jckl-slate">Student Name</p>
                  <p className="text-lg font-semibold text-jckl-navy">{selectedPendingUser.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-xl">
                  <div>
                    <p className="text-xs text-jckl-slate uppercase tracking-wide">Email</p>
                    <p className="text-sm font-medium text-jckl-navy truncate">{selectedPendingUser.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-jckl-slate uppercase tracking-wide">Phone</p>
                    <p className="text-sm font-medium text-jckl-navy">{selectedPendingUser.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-jckl-slate uppercase tracking-wide">Registered</p>
                    <p className="text-sm font-medium text-jckl-navy">{new Date(selectedPendingUser.createdAt || Date.now()).toLocaleDateString()}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-jckl-slate mb-2">
                    Approval Notes (Optional)
                  </label>
                  <textarea
                    value={approvalForm.approvalNotes}
                    onChange={e => setApprovalForm({...approvalForm, approvalNotes: e.target.value})}
                    placeholder="Add any notes about this approval..."
                    className="w-full px-4 py-3 border border-jckl-gold rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition resize-none"
                    rows={3}
                  />
                </div>
              </div>

              <div className="bg-white p-6 rounded-b-2xl flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPendingUser(null);
                    setApprovalForm({ approvalNotes: '' });
                  }}
                  disabled={approvingId === selectedPendingUser?.id}
                  className="flex-1 px-4 py-3 text-sm font-semibold text-jckl-slate bg-white border border-jckl-gold rounded-xl hover:bg-white transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => approveUser(selectedPendingUser?.id)}
                  disabled={approvingId === selectedPendingUser?.id}
                  className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl hover:from-green-700 hover:to-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {approvingId === selectedPendingUser?.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Approve
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rejection Modal */}
        {selectedRejectUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-t-2xl">
                <h3 className="text-xl font-bold text-white">Reject Registration</h3>
                <p className="text-red-100 text-sm mt-1">Reject this student account</p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-jckl-slate">Student Name</p>
                  <p className="text-lg font-semibold text-jckl-navy">{selectedRejectUser.name}</p>
                </div>

                <div className="bg-red-50 p-4 rounded-xl">
                  <p className="text-xs text-red-600 uppercase tracking-wide font-semibold mb-1">⚠️ Warning</p>
                  <p className="text-xs text-red-700">
                    This will permanently delete the user account and send a rejection email to {selectedRejectUser.email}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-jckl-slate mb-2">
                    Rejection Reason (Optional)
                  </label>
                  <textarea
                    value={rejectionForm.rejectionReason}
                    onChange={e => setRejectionForm({...rejectionForm, rejectionReason: e.target.value})}
                    placeholder="Provide a reason for rejecting this registration..."
                    className="w-full px-4 py-3 border border-jckl-gold rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition resize-none"
                    rows={3}
                  />
                </div>
              </div>

              <div className="bg-white p-6 rounded-b-2xl flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRejectUser(null);
                    setRejectionForm({ rejectionReason: '' });
                  }}
                  disabled={rejectingIdInline === selectedRejectUser?.id}
                  className="flex-1 px-4 py-3 text-sm font-semibold text-jckl-slate bg-white border border-jckl-gold rounded-xl hover:bg-white transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => rejectUser(selectedRejectUser?.id)}
                  disabled={rejectingIdInline === selectedRejectUser?.id}
                  className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 rounded-xl hover:from-red-700 hover:to-red-800 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {rejectingIdInline === selectedRejectUser?.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4" />
                      Reject Registration
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Balance Edit Modal */}
        {balanceEditUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-t-2xl">
                <h3 className="text-xl font-bold text-white">Edit User Balance</h3>
                <p className="text-red-100 text-sm mt-1">{balanceEditUser.name}</p>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Only show login form if password hasn't been verified */}
                {!balancePasswordVerified ? (
                  <>
                    {/* Warning Banner */}
                    <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded">
                      <p className="text-sm font-semibold text-red-900 mb-2">⚠️ Authorization Warning</p>
                      <p className="text-xs text-red-800">
                        By logging in, you authorize the Administrator to edit or clear the balance of your user profile. This action will be logged for security purposes.
                      </p>
                    </div>

                    {/* Error Message */}
                    {balanceLoginError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-xs text-red-700 font-medium">{balanceLoginError}</p>
                      </div>
                    )}

                    {/* Email (Read-only) */}
                    <div>
                      <label className="block text-sm font-semibold text-jckl-slate mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={balanceLoginEmail}
                        disabled
                        className="w-full px-4 py-2 border border-jckl-gold rounded-lg bg-white text-jckl-slate text-sm"
                      />
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-sm font-semibold text-jckl-slate mb-2">
                        User Password
                      </label>
                      <input
                        type="password"
                        value={balanceLoginPassword}
                        onChange={(e) => {
                          setBalanceLoginPassword(e.target.value);
                          setBalanceLoginError('');
                        }}
                        placeholder="Enter user's password to authorize"
                        className="w-full px-4 py-3 border border-jckl-gold rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition text-sm"
                        onKeyPress={(e) => e.key === 'Enter' && handleBalanceLogin()}
                      />
                      <p className="text-xs text-jckl-slate mt-1">
                        This verifies the user's identity before allowing balance modification
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={closeBalanceModal}
                        disabled={balanceLoginLoading}
                        className="flex-1 px-4 py-3 text-sm font-semibold text-jckl-slate bg-white border border-jckl-gold rounded-lg hover:bg-white transition disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleBalanceLogin}
                        disabled={balanceLoginLoading || !balanceLoginPassword.trim()}
                        className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 rounded-lg hover:from-red-700 hover:to-red-800 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {balanceLoginLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          'Verify & Continue'
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Balance Edit Interface */}
                    <div className="bg-emerald-50 p-4 rounded-lg">
                      <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wide mb-1">Current Balance</p>
                      <p className="text-2xl font-bold text-emerald-600">
                        {peso.format(Number(balanceEditUser.balance || 0))}
                      </p>
                    </div>

                    {/* New Balance Input */}
                    <div>
                      <label className="block text-sm font-semibold text-jckl-slate mb-2">
                        New Balance Amount
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-jckl-slate font-semibold">₱</span>
                        <input
                          type="number"
                          value={newBalance}
                          onChange={(e) => setNewBalance(e.target.value)}
                          placeholder="0.00"
                          min="0"
                          max="999999999.99"
                          step="0.01"
                          className="w-full pl-8 pr-4 py-3 border border-jckl-gold rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition text-sm"
                        />
                      </div>
                      <p className="text-xs text-jckl-slate mt-1">
                        Set the new balance amount for this user
                      </p>
                    </div>

                    {/* Verification Info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs text-blue-800">
                        ✓ User credentials verified. You can now update the balance.
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={closeBalanceModal}
                        disabled={balanceUpdateLoading}
                        className="flex-1 px-4 py-3 text-sm font-semibold text-jckl-slate bg-white border border-jckl-gold rounded-lg hover:bg-white transition disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleBalanceUpdate}
                        disabled={balanceUpdateLoading || !newBalance}
                        className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {balanceUpdateLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          'Update Balance'
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Nav (mobile) */}
      <AdminBottomNav />
    </div>
  );
}
