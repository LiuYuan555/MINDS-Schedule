'use client';

import { useState, useEffect } from 'react';
import { User, UserRole, UserStatus, MembershipType, MEMBERSHIP_LABELS, USER_STATUS_LABELS } from '@/types';
import { format, parseISO } from 'date-fns';

interface UserManagementProps {
  onClose?: () => void;
}

export default function UserManagement({ onClose }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | UserStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage({ type: 'error', text: 'Failed to fetch users' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: UserStatus) => {
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          updates: { status: newStatus },
          adminId: 'Admin',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(users.map(u => u.id === userId ? data.user : u));
        setMessage({ type: 'success', text: `User ${newStatus === 'active' ? 'approved' : 'status updated'} successfully!` });
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      setMessage({ type: 'error', text: 'Failed to update user status' });
    }
  };

  const handleUserUpdate = async (userId: string, updates: Partial<User>) => {
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          updates,
          adminId: 'Admin',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(users.map(u => u.id === userId ? data.user : u));
        setShowEditModal(false);
        setSelectedUser(null);
        setMessage({ type: 'success', text: 'User updated successfully!' });
      } else {
        throw new Error('Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setMessage({ type: 'error', text: 'Failed to update user' });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      const response = await fetch(`/api/users?userId=${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setUsers(users.filter(u => u.id !== userId));
        setMessage({ type: 'success', text: 'User deleted successfully!' });
      } else {
        throw new Error('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setMessage({ type: 'error', text: 'Failed to delete user' });
    }
  };

  const handleAddUser = async (userData: { name: string; email: string; phone: string; role: UserRole; status: UserStatus; membershipType: MembershipType }) => {
    try {
      // First create with pending, then update with actual status
      const createRes = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: `manual_${Date.now()}`,
          userName: userData.name,
          userEmail: userData.email,
          userPhone: userData.phone,
          role: userData.role,
          membershipType: userData.membershipType,
        }),
      });

      if (!createRes.ok) throw new Error('Failed to create user');

      const createData = await createRes.json();

      // If status should be active, update it
      if (userData.status !== 'pending') {
        const updateRes = await fetch('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: createData.user.id,
            updates: { status: userData.status },
            adminId: 'Admin',
          }),
        });

        if (updateRes.ok) {
          const updateData = await updateRes.json();
          setUsers([...users, updateData.user]);
        }
      } else {
        setUsers([...users, createData.user]);
      }

      setShowAddModal(false);
      setMessage({ type: 'success', text: 'User added successfully!' });
    } catch (error) {
      console.error('Error adding user:', error);
      setMessage({ type: 'error', text: 'Failed to add user' });
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesFilter = filter === 'all' || user.status === filter;
    const matchesSearch = !searchQuery || 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingCount = users.filter(u => u.status === 'pending').length;
  const activeCount = users.filter(u => u.status === 'active').length;
  const restrictedCount = users.filter(u => u.status === 'restricted').length;

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'restricted': return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'staff': return 'bg-purple-100 text-purple-800';
      case 'volunteer': return 'bg-blue-100 text-blue-800';
      case 'participant': return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Users Management</h2>
          <p className="text-sm text-gray-500">Manage user accounts and access permissions</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add User
        </button>
      </div>

      {/* Toast Message */}
      {message && (
        <div className={`px-4 py-3 rounded-lg flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.type === 'success' ? '✓' : '✕'} {message.text}
          <button onClick={() => setMessage(null)} className="ml-auto">×</button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-2xl font-bold text-gray-800">{users.length}</p>
          <p className="text-sm text-gray-500">Total Users</p>
        </div>
        <div 
          onClick={() => setFilter('pending')}
          className={`bg-white rounded-xl p-4 shadow-sm border cursor-pointer transition-all ${filter === 'pending' ? 'border-yellow-400 ring-2 ring-yellow-200' : 'border-gray-100 hover:border-yellow-300'}`}
        >
          <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
          <p className="text-sm text-gray-500">Pending Approval</p>
        </div>
        <div 
          onClick={() => setFilter('active')}
          className={`bg-white rounded-xl p-4 shadow-sm border cursor-pointer transition-all ${filter === 'active' ? 'border-green-400 ring-2 ring-green-200' : 'border-gray-100 hover:border-green-300'}`}
        >
          <p className="text-2xl font-bold text-green-600">{activeCount}</p>
          <p className="text-sm text-gray-500">Active</p>
        </div>
        <div 
          onClick={() => setFilter('restricted')}
          className={`bg-white rounded-xl p-4 shadow-sm border cursor-pointer transition-all ${filter === 'restricted' ? 'border-red-400 ring-2 ring-red-200' : 'border-gray-100 hover:border-red-300'}`}
        >
          <p className="text-2xl font-bold text-red-600">{restrictedCount}</p>
          <p className="text-sm text-gray-500">Restricted</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'pending', 'active', 'restricted'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? 'All' : USER_STATUS_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-3">👥</div>
            <p className="text-gray-500">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Membership</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{user.name || 'No name'}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        {user.phone && <p className="text-xs text-gray-400">{user.phone}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(user.status)}`}>
                        {USER_STATUS_LABELS[user.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {MEMBERSHIP_LABELS[user.membershipType || 'adhoc']}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">
                        {user.createdAt ? format(parseISO(user.createdAt), 'MMM d, yyyy') : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {user.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(user.id, 'active')}
                              className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleStatusChange(user.id, 'restricted')}
                              className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {user.status === 'active' && (
                          <button
                            onClick={() => handleStatusChange(user.id, 'restricted')}
                            className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
                          >
                            Restrict
                          </button>
                        )}
                        {user.status === 'restricted' && (
                          <button
                            onClick={() => handleStatusChange(user.id, 'active')}
                            className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
                          >
                            Activate
                          </button>
                        )}
                        <button
                          onClick={() => { setSelectedUser(user); setShowEditModal(true); }}
                          className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
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
        )}
      </div>

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => { setShowEditModal(false); setSelectedUser(null); }}
          onSave={handleUserUpdate}
        />
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddUser}
        />
      )}
    </div>
  );
}

// Edit User Modal Component
function EditUserModal({ user, onClose, onSave }: { 
  user: User; 
  onClose: () => void; 
  onSave: (userId: string, updates: Partial<User>) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    membershipType: user.membershipType || 'adhoc',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSave(user.id, formData);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Edit User</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
            >
              <option value="participant">Participant</option>
              <option value="volunteer">Volunteer</option>
              <option value="staff">Staff</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
            >
              <option value="pending">Pending Approval</option>
              <option value="active">Active</option>
              <option value="restricted">Restricted</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Membership Type</label>
            <select
              value={formData.membershipType}
              onChange={(e) => setFormData({ ...formData, membershipType: e.target.value as MembershipType })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
            >
              {Object.entries(MEMBERSHIP_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* User Info */}
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
            <p><strong>Created:</strong> {user.createdAt ? format(parseISO(user.createdAt), 'MMM d, yyyy h:mm a') : '-'}</p>
            {user.approvedAt && <p><strong>Approved:</strong> {format(parseISO(user.approvedAt), 'MMM d, yyyy h:mm a')} by {user.approvedBy}</p>}
            {user.lastUpdatedAt && <p><strong>Last Updated:</strong> {format(parseISO(user.lastUpdatedAt), 'MMM d, yyyy h:mm a')} by {user.lastUpdatedBy}</p>}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Add User Modal Component
function AddUserModal({ onClose, onSave }: { 
  onClose: () => void; 
  onSave: (userData: { name: string; email: string; phone: string; role: UserRole; status: UserStatus; membershipType: MembershipType }) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'participant' as UserRole,
    status: 'active' as UserStatus,
    membershipType: 'adhoc' as MembershipType,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      alert('Email is required');
      return;
    }
    setIsSubmitting(true);
    await onSave(formData);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Add New User</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
            >
              <option value="participant">Participant</option>
              <option value="volunteer">Volunteer</option>
              <option value="staff">Staff</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
            >
              <option value="active">Active (Approved)</option>
              <option value="pending">Pending Approval</option>
              <option value="restricted">Restricted</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Membership Type</label>
            <select
              value={formData.membershipType}
              onChange={(e) => setFormData({ ...formData, membershipType: e.target.value as MembershipType })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
            >
              {Object.entries(MEMBERSHIP_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
            <p><strong>Note:</strong> Manually added users will be able to access the system when they sign in with the email address you specify here.</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Add User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
