import { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../../hooks/usePageTitle';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import api from '../../services/api';
import {
  FiSearch,
  FiUserPlus,
  FiTrash2,
  FiEdit2,
  FiEye,
  FiChevronLeft,
  FiChevronRight,
  FiUsers,
  FiUserCheck,
  FiUserX,
  FiClock,
  FiX,
  FiAlertCircle,
  FiRefreshCw,
  FiCheckCircle,
} from 'react-icons/fi';

// ── Inline toast banner ────────────────────────────────────────────────────────
function Banner({ msg }) {
  const { t } = useTranslation();

  if (!msg) return null;
  const colour =
    msg.type === 'success'
      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
      : 'bg-rose-500/10 text-rose-300 border border-rose-500/20';
  const Icon = msg.type === 'success' ? FiCheckCircle : FiAlertCircle;
  return (
    <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium mb-4 ${colour}`}>
      <Icon size={16} className="shrink-0" />
      {msg.text}
    </div>
  );
}

function UsersPage() {
  usePageTitle('User Management');
  const { t } = useTranslation();

  // ── API state ───────────────────────────────────────────────────────────────
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [actionMsg, setActionMsg]   = useState(null); // { type, text } for mutations
  const [actionBusy, setActionBusy] = useState(null); // userId currently being mutated

  // ── Filter / sort / pagination state ────────────────────────────────────────
  const [searchTerm, setSearchTerm]   = useState('');
  const [roleFilter, setRoleFilter]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField]     = useState('name');
  const [sortOrder, setSortOrder]     = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // ── Modal state ──────────────────────────────────────────────────────────────
  const [activeModal, setActiveModal]   = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData]         = useState({ name: '', email: '', role: 'Sales Executive', status: 'Active' });
  const [formErrors, setFormErrors]     = useState({});
  const [deleteConfirmId, setDeleteConfirmId] = useState(null); // id awaiting confirmation

  // ── Fetch users from GET /api/users ─────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await api.get('/api/users', { params: { limit: 100 } });
      if (res.data?.success && Array.isArray(res.data.data)) {
        setUsers(res.data.data);
      } else {
        setUsers([]);
      }
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        (err?.response?.status === 401 ? 'Authentication required. Please log in.' :
         err?.response?.status === 403 ? 'You do not have permission to view users.' :
         err?.message || 'Failed to load users.');
      setFetchError(message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── Summary metrics ──────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:    users.length,
    active:   users.filter(u => u.status === 'Active').length,
    inactive: users.filter(u => u.status === 'Inactive').length,
    pending:  users.filter(u => u.status === 'Pending').length,
  }), [users]);

  // ── Sort & Filter ────────────────────────────────────────────────────────────
  const filteredAndSortedUsers = useMemo(() => {
    let result = [...users];
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(u =>
        u.name?.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term)
      );
    }
    if (roleFilter) {
      result = result.filter(u => {
        if (roleFilter === 'Owner' || roleFilter === 'Business Owner') {
          return u.role === 'Owner' || u.role === 'Business Owner' || u.roleId === 1;
        }
        if (roleFilter === 'Store Manager') {
          return u.role === 'Store Manager' || u.roleId === 2;
        }
        if (roleFilter === 'Sales Executive') {
          return u.role === 'Sales Executive' || u.roleId === 3;
        }
        if (roleFilter === 'Admin' || roleFilter === 'System Administrator') {
          return u.role === 'Admin' || u.role === 'System Administrator' || u.roleId === 4;
        }
        return u.role === roleFilter;
      });
    }
    if (statusFilter) result = result.filter(u => u.status === statusFilter);
    result.sort((a, b) => {
      let aVal = a[sortField] ?? '';
      let bVal = b[sortField] ?? '';
      if (typeof aVal === 'string') { aVal = aVal.toLowerCase(); bVal = bVal.toLowerCase(); }
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [users, searchTerm, roleFilter, statusFilter, sortField, sortOrder]);

  const totalPages     = Math.ceil(filteredAndSortedUsers.length / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedUsers.slice(start, start + itemsPerPage);
  }, [filteredAndSortedUsers, currentPage]);

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const showMsg = (type, text) => {
    setActionMsg({ type, text });
    setTimeout(() => setActionMsg(null), 4000);
  };

  const handleSort = (field) => {
    if (sortField === field) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('asc'); }
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchTerm(''); setRoleFilter(''); setStatusFilter(''); setCurrentPage(1);
  };

  // ── Toggle status — calls PATCH /api/users/:id/status ────────────────────────
  const handleToggleStatus = async (userId) => {
    if (actionBusy) return;
    setActionBusy(userId);
    setActionMsg(null);
    try {
      const res = await api.patch(`/api/users/${userId}/status`);
      if (res.data?.success) {
        // Optimistically update local state from the returned record
        const updated = res.data.data;
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updated } : u));
        showMsg('success', res.data.message || 'User status updated.');
      } else {
        showMsg('error', res.data?.message || 'Failed to update status.');
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (err?.response?.status === 401 ? 'Session expired. Please log in again.' :
         err?.response?.status === 403 ? 'You do not have permission to change user status.' :
         'Failed to update user status. Please try again.');
      showMsg('error', msg);
    } finally {
      setActionBusy(null);
    }
  };

  // ── Delete — calls DELETE /api/users/:id (soft-delete) ───────────────────────
  const handleDeleteUser = async (userId) => {
    if (actionBusy) return;
    setDeleteConfirmId(null);
    setActionBusy(userId);
    setActionMsg(null);
    try {
      const res = await api.delete(`/api/users/${userId}`);
      if (res.data?.success) {
        // Re-fetch so the table reflects the server state
        await fetchUsers();
        showMsg('success', res.data.message || 'User deleted successfully.');
        if (paginatedUsers.length === 1 && currentPage > 1) setCurrentPage(p => p - 1);
      } else {
        showMsg('error', res.data?.message || 'Failed to delete user.');
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (err?.response?.status === 401 ? 'Session expired. Please log in again.' :
         err?.response?.status === 403 ? 'You do not have permission to delete users.' :
         'Failed to delete user. Please try again.');
      showMsg('error', msg);
    } finally {
      setActionBusy(null);
    }
  };

  // ── Modal helpers ─────────────────────────────────────────────────────────────
  const handleOpenAddModal = () => {
    setFormData({ name: '', email: '', role: 'Sales Executive', status: 'Active' });
    setFormErrors({});
    setActiveModal('add');
  };

  const handleOpenEditModal = (user) => {
    setSelectedUser(user);
    setFormData({ name: user.name, email: user.email, role: user.role, status: user.status });
    setFormErrors({});
    setActiveModal('edit');
  };

  const handleOpenViewModal = (user) => {
    setSelectedUser(user);
    setActiveModal('view');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required.';
    else if (formData.name.trim().length < 2) errors.name = 'Name must be at least 2 characters.';
    if (!formData.email.trim()) errors.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Please enter a valid email address.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Add/Edit modal save — local-only for add; PATCH profile for edit
  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (activeModal === 'add') {
      // Adding users via API is out of scope for this task (requires password setup).
      // This keeps the local-only path for the Add modal as previously designed.
      const newId = `USR${String(users.length + 1).padStart(3, '0')}`;
      setUsers(prev => [{ id: newId, ...formData, lastLogin: 'N/A' }, ...prev]);
      showMsg('success', `User "${formData.name}" added successfully.`);
      setActiveModal(null);
    } else if (activeModal === 'edit' && selectedUser) {
      // Name update goes to the real API
      setActionBusy(selectedUser.id);
      try {
        const res = await api.patch(`/api/users/${selectedUser.id}/profile`, {
          name: formData.name.trim(),
        });
        if (res.data?.success) {
          setUsers(prev => prev.map(u =>
            u.id === selectedUser.id ? { ...u, ...res.data.data } : u
          ));
          showMsg('success', `User "${formData.name}" updated successfully.`);
          setActiveModal(null);
        } else {
          showMsg('error', res.data?.message || 'Failed to update user.');
        }
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          'Failed to update user. Please try again.';
        showMsg('error', msg);
      } finally {
        setActionBusy(null);
      }
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white">{t('usersTitle')}</h1>
          <p className="mt-2 text-sm text-slate-400">
            Monitor active dashboard participants, assign specific system permissions, and customize roles.
          </p>
        </div>
        <Button onClick={handleOpenAddModal} className="flex items-center gap-2 self-start md:self-auto">
          <FiUserPlus /> Add New User
        </Button>
      </section>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300"><FiUsers size={22} /></div>
          <div><p className="text-xs uppercase tracking-wider text-slate-400">Total Users</p><p className="text-2xl font-semibold text-white mt-1">{stats.total}</p></div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400"><FiUserCheck size={22} /></div>
          <div><p className="text-xs uppercase tracking-wider text-slate-400">Active Users</p><p className="text-2xl font-semibold text-emerald-400 mt-1">{stats.active}</p></div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-500/10 text-slate-400"><FiUserX size={22} /></div>
          <div><p className="text-xs uppercase tracking-wider text-slate-400">Inactive Users</p><p className="text-2xl font-semibold text-slate-350 mt-1">{stats.inactive}</p></div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400"><FiClock size={22} /></div>
          <div><p className="text-xs uppercase tracking-wider text-slate-400">Pending Approvals</p><p className="text-2xl font-semibold text-amber-400 mt-1">{stats.pending}</p></div>
        </div>
      </div>

      {/* Filters */}
      <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-4 top-[18px] text-slate-400" />
            <input
              type="text"
              placeholder="Search by Name or Email..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full rounded-2xl border border-white/10 bg-white/5 pl-11 pr-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
            />
          </div>
          <div className="w-full md:w-48">
            <select
              value={roleFilter}
              onChange={e => { setRoleFilter(e.target.value); setCurrentPage(1); }}
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-slate-200 outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
            >
              <option value="">All Roles</option>
              <option value="Owner">Owner</option>
              <option value="Store Manager">Store Manager</option>
              <option value="Sales Executive">Sales Executive</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <div className="w-full md:w-48">
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-slate-200 outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
          {(searchTerm || roleFilter || statusFilter) && (
            <button
              onClick={handleResetFilters}
              className="px-4 py-3 text-sm text-cyan-400 hover:text-cyan-300 font-medium hover:underline shrink-0"
            >
              Reset Filters
            </button>
          )}
        </div>
      </section>

      {/* Users Table */}
      <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 overflow-hidden">

        {/* Mutation feedback banner */}
        <Banner msg={actionMsg} />

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <FiRefreshCw size={32} className="animate-spin text-cyan-400" />
            <p className="text-sm">Loading users from database…</p>
          </div>
        )}

        {/* Error state */}
        {!loading && fetchError && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <FiAlertCircle size={36} className="text-rose-400" />
            <p className="text-sm text-rose-300 text-center max-w-sm">{fetchError}</p>
            <button
              onClick={fetchUsers}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-slate-300 hover:text-white hover:bg-white/10 transition"
            >
              <FiRefreshCw size={14} /> Retry
            </button>
          </div>
        )}

        {/* Empty — no users */}
        {!loading && !fetchError && users.length === 0 && (
          <div className="text-center py-12 space-y-3">
            <FiUsers className="text-5xl text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-white">No registered dashboard users.</h3>
            <p className="text-xs text-slate-500">Wait for directory syncing or check back later.</p>
          </div>
        )}

        {/* Empty — filters match nothing */}
        {!loading && !fetchError && users.length > 0 && filteredAndSortedUsers.length === 0 && (
          <div className="text-center py-12 text-slate-400">No matching users found based on filters.</div>
        )}

        {/* Table */}
        {!loading && !fetchError && filteredAndSortedUsers.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <th className="py-4 px-4">User ID</th>
                    <th className="py-4 px-4 cursor-pointer hover:text-white transition" onClick={() => handleSort('name')}>
                      Name {sortField === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th className="py-4 px-4 cursor-pointer hover:text-white transition" onClick={() => handleSort('email')}>
                      Email {sortField === 'email' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th className="py-4 px-4 cursor-pointer hover:text-white transition" onClick={() => handleSort('role')}>
                      Role {sortField === 'role' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-4">Last Login</th>
                    <th className="py-4 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm text-slate-200">
                  {paginatedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-white/2 transition">
                      <td className="py-4 px-4 font-mono text-xs text-slate-450">{user.id}</td>
                      <td className="py-4 px-4 font-semibold text-white">{user.name}</td>
                      <td className="py-4 px-4 text-slate-350">{user.email}</td>
                      <td className="py-4 px-4">
                        <span className="inline-flex rounded-xl bg-white/5 px-2.5 py-1 text-xs text-slate-300 border border-white/5">
                          {user.role}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          user.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20'
                            : user.status === 'Inactive'
                            ? 'bg-slate-500/10 text-slate-400 border border-white/5'
                            : 'bg-amber-500/10 text-amber-450 border border-amber-500/20'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            user.status === 'Active' ? 'bg-emerald-500'
                            : user.status === 'Inactive' ? 'bg-slate-500'
                            : 'bg-amber-500'
                          }`} />
                          {user.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-400">{user.lastLogin}</td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenViewModal(user)}
                            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
                            title="View Details"
                          >
                            <FiEye size={16} />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(user)}
                            className="p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-white/5 transition"
                            title="Edit"
                          >
                            <FiEdit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user.id)}
                            disabled={actionBusy === user.id}
                            className={`p-2 rounded-xl transition ${
                              user.status === 'Active'
                                ? 'text-slate-400 hover:text-amber-400'
                                : 'text-slate-400 hover:text-emerald-400'
                            } hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed`}
                            title={user.status === 'Active' ? 'Deactivate' : 'Activate'}
                          >
                            {actionBusy === user.id
                              ? <FiRefreshCw size={16} className="animate-spin" />
                              : user.status === 'Active'
                              ? <FiUserX size={16} />
                              : <FiUserCheck size={16} />
                            }
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(user.id)}
                            disabled={actionBusy === user.id}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-white/5 transition disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Delete"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-white/10 mt-6 pt-4 text-slate-400 text-sm">
                <div>
                  Showing{' '}
                  <span className="font-semibold text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-semibold text-white">
                    {Math.min(currentPage * itemsPerPage, filteredAndSortedUsers.length)}
                  </span>{' '}
                  of{' '}
                  <span className="font-semibold text-white">{filteredAndSortedUsers.length}</span> entries
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <FiChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <FiChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-sm rounded-[2rem] p-6 space-y-5 relative border border-white/10 shadow-2xl">
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <FiX size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 shrink-0">
                <FiTrash2 size={18} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Delete User</h3>
                <p className="text-xs text-slate-400 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-slate-300">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-white">
                {users.find(u => u.id === deleteConfirmId)?.name ?? 'this user'}
              </span>
              ? The account will be deactivated and removed from the active directory.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDeleteUser(deleteConfirmId)}
                className="flex-1 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:bg-rose-500/30 py-2.5 text-sm font-medium transition"
              >
                Yes, delete
              </button>
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 rounded-2xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 py-2.5 text-sm font-medium transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {activeModal === 'view' && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-[2rem] p-6 space-y-6 relative border border-white/10 shadow-2xl">
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <FiX size={20} />
            </button>
            <div>
              <h3 className="text-xl font-semibold text-white">User Details</h3>
              <p className="text-xs text-slate-400 mt-1 font-mono">{t('usersDesc')}</p>
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-xs text-slate-400 mb-1">Full Name</p>
                <p className="text-base text-white font-medium">{selectedUser.name}</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-xs text-slate-400 mb-1">Email Address</p>
                <p className="text-base text-white font-medium">{selectedUser.email}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs text-slate-400 mb-1">Assigned Role</p>
                  <p className="text-base text-white font-medium">{selectedUser.role}</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs text-slate-400 mb-1">User Status</p>
                  <p className="text-base text-white font-medium">{selectedUser.status}</p>
                </div>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-xs text-slate-400 mb-1">Last Logged In</p>
                <p className="text-base text-white font-medium">{selectedUser.lastLogin}</p>
              </div>
            </div>
            <Button onClick={() => setActiveModal(null)} className="w-full">Close</Button>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {(activeModal === 'add' || activeModal === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-[2rem] p-6 space-y-6 relative border border-white/10 shadow-2xl">
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <FiX size={20} />
            </button>
            <div>
              <h3 className="text-xl font-semibold text-white">
                {activeModal === 'add' ? 'Add New User' : 'Edit User Details'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {activeModal === 'add'
                  ? 'Create a new user account profile.'
                  : `Modifying profile for ${selectedUser?.id}`}
              </p>
            </div>
            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <Input
                  label="Full Name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="e.g. John Doe"
                  className={formErrors.name ? 'border-rose-500/50' : ''}
                />
                {formErrors.name && <p className="text-xs text-rose-400 mt-1">{formErrors.name}</p>}
              </div>
              <div>
                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  placeholder="e.g. john@example.com"
                  disabled={activeModal === 'edit'}
                  className={`${formErrors.email ? 'border-rose-500/50' : ''} ${activeModal === 'edit' ? 'cursor-not-allowed opacity-60' : ''}`}
                />
                {formErrors.email && <p className="text-xs text-rose-400 mt-1">{formErrors.email}</p>}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">System Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleFormChange}
                  disabled={activeModal === 'edit'}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-slate-200 outline-none transition focus:border-cyan-400/50"
                >
                  <option value="Owner">Owner</option>
                  <option value="Store Manager">Store Manager</option>
                  <option value="Sales Executive">Sales Executive</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  disabled={activeModal === 'edit'}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-slate-200 outline-none transition focus:border-cyan-400/50"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1" disabled={!!actionBusy}>
                  {actionBusy ? 'Saving…' : 'Save Changes'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setActiveModal(null)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsersPage;
