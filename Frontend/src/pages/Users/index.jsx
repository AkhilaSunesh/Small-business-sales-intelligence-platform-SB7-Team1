import { useState, useMemo } from 'react';
import { usePageTitle } from '../../hooks/usePageTitle';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
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
  FiX
} from 'react-icons/fi';

const INITIAL_MOCK_USERS = [
  { id: 'USR001', name: 'Alok Sharma', email: 'alok.sharma@example.com', role: 'Owner', status: 'Active', lastLogin: '2026-07-12 10:15 AM' },
  { id: 'USR002', name: 'Priya Patel', email: 'priya.patel@example.com', role: 'Store Manager', status: 'Active', lastLogin: '2026-07-12 09:30 AM' },
  { id: 'USR003', name: 'Rajesh Kumar', email: 'rajesh.kumar@example.com', role: 'Sales Executive', status: 'Active', lastLogin: '2026-07-11 05:45 PM' },
  { id: 'USR004', name: 'Neha Gupta', email: 'neha.gupta@example.com', role: 'Store Manager', status: 'Inactive', lastLogin: '2026-07-05 11:20 AM' },
  { id: 'USR005', name: 'Amit Singh', email: 'amit.singh@example.com', role: 'Sales Executive', status: 'Pending', lastLogin: 'N/A' },
  { id: 'USR006', name: 'Vikram Malhotra', email: 'vikram.m@example.com', role: 'Admin', status: 'Active', lastLogin: '2026-07-12 11:00 AM' },
  { id: 'USR007', name: 'Sneha Rao', email: 'sneha.rao@example.com', role: 'Sales Executive', status: 'Pending', lastLogin: 'N/A' },
  { id: 'USR008', name: 'Devendra Verma', email: 'devendra.v@example.com', role: 'Store Manager', status: 'Active', lastLogin: '2026-07-10 02:10 PM' },
  { id: 'USR009', name: 'Anjali Sharma', email: 'anjali.s@example.com', role: 'Sales Executive', status: 'Inactive', lastLogin: '2026-06-28 04:30 PM' },
  { id: 'USR010', name: 'Rohan Mehta', email: 'rohan.mehta@example.com', role: 'Sales Executive', status: 'Active', lastLogin: '2026-07-12 08:00 AM' }
];

function UsersPage() {
  usePageTitle('User Management');

  const [users, setUsers] = useState(INITIAL_MOCK_USERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Sorting state
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'view' | 'edit' | 'add' | null
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Sales Executive',
    status: 'Active'
  });
  const [formErrors, setFormErrors] = useState({});

  // Summary Metrics calculations
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => u.status === 'Active').length;
    const inactive = users.filter(u => u.status === 'Inactive').length;
    const pending = users.filter(u => u.status === 'Pending').length;
    return { total, active, inactive, pending };
  }, [users]);

  // Sort & Filter logic
  const filteredAndSortedUsers = useMemo(() => {
    let result = [...users];

    // Filter by Search term (name or email)
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        user => 
          user.name.toLowerCase().includes(term) || 
          user.email.toLowerCase().includes(term)
      );
    }

    // Filter by Role
    if (roleFilter !== '') {
      result = result.filter(user => user.role === roleFilter);
    }

    // Filter by Status
    if (statusFilter !== '') {
      result = result.filter(user => user.status === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [users, searchTerm, roleFilter, statusFilter, sortField, sortOrder]);

  // Paginated records
  const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedUsers, currentPage]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setRoleFilter('');
    setStatusFilter('');
    setCurrentPage(1);
  };

  // Action methods
  const handleToggleStatus = (userId) => {
    setUsers(prev => prev.map(user => {
      if (user.id === userId) {
        const nextStatus = user.status === 'Active' ? 'Inactive' : 'Active';
        alert(`User status changed to ${nextStatus} for user ${user.name}`);
        return { ...user, status: nextStatus };
      }
      return user;
    }));
  };

  const handleDeleteUser = (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete user "${userName}"?`)) {
      setUsers(prev => prev.filter(user => user.id !== userId));
      alert(`User "${userName}" deleted successfully.`);
      // Reset page if current page becomes empty
      if (paginatedUsers.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      }
    }
  };

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
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Name is required.';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters.';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveUser = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (activeModal === 'add') {
      const newId = `USR${String(users.length + 1).padStart(3, '0')}`;
      const newUser = {
        id: newId,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        status: formData.status,
        lastLogin: 'N/A'
      };
      setUsers(prev => [newUser, ...prev]);
      alert(`User "${formData.name}" added successfully.`);
    } else if (activeModal === 'edit') {
      setUsers(prev => prev.map(user => {
        if (user.id === selectedUser.id) {
          return {
            ...user,
            name: formData.name,
            email: formData.email,
            role: formData.role,
            status: formData.status
          };
        }
        return user;
      }));
      alert(`User "${formData.name}" details updated.`);
    }
    setActiveModal(null);
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white">User Management</h1>
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
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300">
            <FiUsers size={22} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Total Users</p>
            <p className="text-2xl font-semibold text-white mt-1">{stats.total}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
            <FiUserCheck size={22} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Active Users</p>
            <p className="text-2xl font-semibold text-emerald-400 mt-1">{stats.active}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-500/10 text-slate-400">
            <FiUserX size={22} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Inactive Users</p>
            <p className="text-2xl font-semibold text-slate-350 mt-1">{stats.inactive}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
            <FiClock size={22} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Pending Approvals</p>
            <p className="text-2xl font-semibold text-amber-400 mt-1">{stats.pending}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search controls */}
      <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-4 top-[18px] text-slate-400" />
            <input
              type="text"
              placeholder="Search by Name or Email..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full rounded-2xl border border-white/10 bg-white/5 pl-11 pr-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
            />
          </div>

          <div className="w-full md:w-48">
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
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
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
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
        {users.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            Waiting for backend integration.
          </div>
        ) : filteredAndSortedUsers.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            No matching users found based on filters.
          </div>
        ) : (
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
                            user.status === 'Active' 
                              ? 'bg-emerald-500' 
                              : user.status === 'Inactive'
                              ? 'bg-slate-500'
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
                            className={`p-2 rounded-xl transition ${
                              user.status === 'Active' 
                                ? 'text-slate-400 hover:text-amber-400' 
                                : 'text-slate-400 hover:text-emerald-400'
                            } hover:bg-white/5`}
                            title={user.status === 'Active' ? 'Deactivate' : 'Activate'}
                          >
                            {user.status === 'Active' ? <FiUserX size={16} /> : <FiUserCheck size={16} />}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-white/5 transition"
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-white/10 mt-6 pt-4 text-slate-400 text-sm">
                <div>
                  Showing{' '}
                  <span className="font-semibold text-white">
                    {(currentPage - 1) * itemsPerPage + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-semibold text-white">
                    {Math.min(currentPage * itemsPerPage, filteredAndSortedUsers.length)}
                  </span>{' '}
                  of{' '}
                  <span className="font-semibold text-white">
                    {filteredAndSortedUsers.length}
                  </span>{' '}
                  entries
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <FiChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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

      {/* MODALS */}
      
      {/* View User Modal */}
      {activeModal === 'view' && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-[2rem] p-6 space-y-6 relative border border-white/10 shadow-2xl">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <FiX size={20} />
            </button>
            <div>
              <h3 className="text-xl font-semibold text-white">User Details</h3>
              <p className="text-xs text-slate-400 mt-1 font-mono">{selectedUser.id}</p>
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
            <Button onClick={() => setActiveModal(null)} className="w-full">
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Add / Edit User Modal */}
      {(activeModal === 'add' || activeModal === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-[2rem] p-6 space-y-6 relative border border-white/10 shadow-2xl">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <FiX size={20} />
            </button>
            <div>
              <h3 className="text-xl font-semibold text-white">
                {activeModal === 'add' ? 'Add New User' : 'Edit User Details'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {activeModal === 'add' ? 'Create a new user account profile.' : `Modifying profile for ${selectedUser?.id}`}
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
                  className={formErrors.email ? 'border-rose-500/50' : ''}
                />
                {formErrors.email && <p className="text-xs text-rose-400 mt-1">{formErrors.email}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">System Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleFormChange}
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
                  className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-slate-200 outline-none transition focus:border-cyan-400/50"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1">
                  Save Changes
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
