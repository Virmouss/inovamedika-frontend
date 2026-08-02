import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Shield, 
    UserPlus, 
    Users, 
    Activity, 
    CheckCircle2, 
    Edit2, 
    Trash2, 
    UserX, 
    UserCheck, 
    X, 
    Search, 
    KeyRound, 
    AlertTriangle,
    Stethoscope
} from 'lucide-react';
import { API_BASE } from '../config/api';

const DashboardPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    
    // Filters & Search
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // Create Modal
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [formData, setFormData] = useState({ 
        username: '', 
        password: '', 
        role: 'Registrator', 
        doctorName: '', 
        spesialis: '' 
    });

    // Edit Modal
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [editFormData, setEditFormData] = useState({
        username: '',
        password: '',
        role: 'Registrator',
        doctorName: '',
        spesialis: '',
        is_active: true
    });

    // Delete Confirmation Modal
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${API_BASE}/users`);
            setUsers(res.data.data);
        } catch (err) {
            setError('Failed to fetch users. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const showSuccess = (msg) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(''), 3500);
    };

    // ---------- CREATE USER ----------
    const handleAddUser = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await axios.post(`${API_BASE}/users`, formData);
            setIsCreateModalOpen(false);
            setFormData({ username: '', password: '', role: 'Registrator', doctorName: '', spesialis: '' });
            showSuccess('New user created successfully!');
            fetchUsers();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to add user');
        }
    };

    // ---------- EDIT USER ----------
    const openEditModal = (user) => {
        setEditingUser(user);
        setEditFormData({
            username: user.username,
            password: '', // blank by default (leave unchanged)
            role: user.role,
            doctorName: user.doctor_name || '',
            spesialis: user.doctor_spesialis || '',
            is_active: user.is_active !== false
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const payload = {
                username: editFormData.username,
                role: editFormData.role,
                is_active: editFormData.is_active
            };
            if (editFormData.password.trim() !== '') {
                payload.password = editFormData.password;
            }
            if (editFormData.role === 'Doctor') {
                payload.doctorName = editFormData.doctorName;
                payload.spesialis = editFormData.spesialis;
            }

            await axios.put(`${API_BASE}/users/${editingUser.id}`, payload);
            setIsEditModalOpen(false);
            showSuccess(`User "${editFormData.username}" updated successfully!`);
            fetchUsers();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update user');
        }
    };

    // ---------- TOGGLE DISABLE / ENABLE STATUS ----------
    const handleToggleStatus = async (targetUser) => {
        if (targetUser.id === currentUser.id) {
            setError('You cannot disable your own admin account.');
            return;
        }

        const newStatus = targetUser.is_active === false;
        const actionLabel = newStatus ? 'enabled' : 'disabled';

        try {
            await axios.put(`${API_BASE}/users/${targetUser.id}/status`, { is_active: newStatus });
            showSuccess(`User "${targetUser.username}" is now ${actionLabel}.`);
            fetchUsers();
        } catch (err) {
            setError(err.response?.data?.error || `Failed to ${newStatus ? 'enable' : 'disable'} user`);
        }
    };

    // ---------- DELETE USER ----------
    const openDeleteModal = (user) => {
        if (user.id === currentUser.id) {
            setError('You cannot delete your own admin account.');
            return;
        }
        setUserToDelete(user);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        try {
            await axios.delete(`${API_BASE}/users/${userToDelete.id}`);
            setIsDeleteModalOpen(false);
            showSuccess(`User "${userToDelete.username}" deleted successfully!`);
            setUserToDelete(null);
            fetchUsers();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to delete user');
            setIsDeleteModalOpen(false);
        }
    };

    // ---------- FILTERED USERS ----------
    const filteredUsers = users.filter(u => {
        const matchesSearch = u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (u.doctor_name && u.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;

        const matchesStatus = statusFilter === 'ALL' || 
            (statusFilter === 'ACTIVE' && u.is_active !== false) ||
            (statusFilter === 'DISABLED' && u.is_active === false);

        return matchesSearch && matchesRole && matchesStatus;
    });

    const totalActive = users.filter(u => u.is_active !== false).length;
    const totalDisabled = users.filter(u => u.is_active === false).length;

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-64 space-y-4 animate-fade-in">
            <Activity className="animate-pulse text-clinic-500" size={32} />
            <div className="text-slate-500 font-medium tracking-wide">Loading Dashboard...</div>
        </div>
    );

    return (
        <div className="animate-fade-in space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Admin User Management</h1>
                    <p className="text-slate-500 mt-2 font-medium">Manage administrators, doctors, registrators, and access permissions</p>
                </div>
                <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="group bg-gradient-to-r from-clinic-600 to-clinic-500 hover:from-clinic-700 hover:to-clinic-600 text-white px-6 py-3 rounded-xl flex items-center space-x-2 transition-all duration-300 shadow-lg shadow-clinic-500/30 hover:shadow-clinic-500/50 hover:-translate-y-0.5"
                >
                    <UserPlus size={18} className="group-hover:rotate-12 transition-transform" />
                    <span className="font-semibold tracking-wide text-sm">Add New User</span>
                </button>
            </div>

            {/* Alerts */}
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 flex items-center justify-between shadow-sm animate-slide-up">
                    <div className="flex items-center space-x-3">
                        <AlertTriangle size={20} />
                        <span className="font-medium">{error}</span>
                    </div>
                    <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
                        <X size={18} />
                    </button>
                </div>
            )}
            
            {successMessage && (
                <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl border border-emerald-200 flex items-center justify-between shadow-sm animate-slide-up">
                    <div className="flex items-center space-x-3">
                        <CheckCircle2 size={20} />
                        <span className="font-medium">{successMessage}</span>
                    </div>
                    <button onClick={() => setSuccessMessage('')} className="text-emerald-400 hover:text-emerald-600">
                        <X size={18} />
                    </button>
                </div>
            )}

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center space-x-4 hover:shadow-md transition-shadow">
                    <div className="bg-blue-50 p-4 rounded-2xl text-blue-600">
                        <Users size={28} />
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-slate-800">{users.length}</div>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Users</div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center space-x-4 hover:shadow-md transition-shadow">
                    <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600">
                        <UserCheck size={28} />
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-emerald-600">{totalActive}</div>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Users</div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center space-x-4 hover:shadow-md transition-shadow">
                    <div className="bg-rose-50 p-4 rounded-2xl text-rose-600">
                        <UserX size={28} />
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-rose-600">{totalDisabled}</div>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Disabled Users</div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center space-x-4 hover:shadow-md transition-shadow">
                    <div className="bg-purple-50 p-4 rounded-2xl text-purple-600">
                        <Shield size={28} />
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-slate-800">
                            {users.filter(u => u.role === 'Admin').length}
                        </div>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Admins</div>
                    </div>
                </div>
            </div>

            {/* Main Table Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative">
                {/* Search & Filter Toolbar */}
                <div className="p-6 border-b border-slate-100/60 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center space-x-3">
                        <div className="bg-white shadow-sm p-2 rounded-xl text-clinic-600 border border-slate-100">
                            <Shield size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">User Accounts List</h2>
                            <p className="text-xs text-slate-400">View, edit, disable, or delete user accounts</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search user or doctor..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-clinic-500 transition-colors"
                            />
                        </div>

                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 focus:outline-none focus:border-clinic-500"
                        >
                            <option value="ALL">All Roles</option>
                            <option value="Admin">Admin</option>
                            <option value="Doctor">Doctor</option>
                            <option value="Registrator">Registrator</option>
                        </select>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 focus:outline-none focus:border-clinic-500"
                        >
                            <option value="ALL">All Status</option>
                            <option value="ACTIVE">Active Only</option>
                            <option value="DISABLED">Disabled Only</option>
                        </select>
                    </div>
                </div>
                
                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50/30 text-slate-500 font-semibold uppercase tracking-wider text-xs">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Access Level</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Registered Date</th>
                                <th className="px-6 py-4 text-center">Disable / Enable</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/60">
                            {filteredUsers.map(user => {
                                const isSelf = user.id === currentUser.id;
                                const isActive = user.is_active !== false;

                                return (
                                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${
                                                    user.role === 'Admin' ? 'bg-purple-100 text-purple-700' :
                                                    user.role === 'Doctor' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-emerald-100 text-emerald-700'
                                                }`}>
                                                    {user.username.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800 flex items-center space-x-2">
                                                        <span>{user.username}</span>
                                                        {isSelf && (
                                                            <span className="text-[10px] uppercase font-extrabold bg-clinic-100 text-clinic-800 px-2 py-0.5 rounded-full">
                                                                You
                                                            </span>
                                                        )}
                                                    </div>
                                                    {user.doctor_name && (
                                                        <div className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                                                            <Stethoscope size={12} className="text-blue-500" />
                                                            <span>{user.doctor_name} ({user.doctor_spesialis})</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold tracking-wide border ${
                                                user.role === 'Admin' ? 'bg-purple-50 text-purple-700 border-purple-200/50' : 
                                                user.role === 'Doctor' ? 'bg-blue-50 text-blue-700 border-blue-200/50' :
                                                'bg-emerald-50 text-emerald-700 border-emerald-200/50'
                                            }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {isActive ? (
                                                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                    <span>Active</span>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                                    <span>Disabled</span>
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 font-medium">
                                            {new Date(user.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                disabled={isSelf}
                                                onClick={() => handleToggleStatus(user)}
                                                title={isSelf ? "You cannot disable your own account" : (isActive ? "Disable this user" : "Enable this user")}
                                                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                                    isSelf
                                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                                                        : isActive
                                                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/60 hover:shadow-sm'
                                                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/60 hover:shadow-sm'
                                                }`}
                                            >
                                                {isActive ? (
                                                    <>
                                                        <UserX size={14} />
                                                        <span>Disable</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <UserCheck size={14} />
                                                        <span>Enable</span>
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => openEditModal(user)}
                                                    className="p-2 text-slate-400 hover:text-clinic-600 hover:bg-clinic-50 rounded-lg transition-colors"
                                                    title="Edit User"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    disabled={isSelf}
                                                    onClick={() => openDeleteModal(user)}
                                                    className={`p-2 rounded-lg transition-colors ${
                                                        isSelf 
                                                            ? 'text-slate-200 cursor-not-allowed' 
                                                            : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                                    }`}
                                                    title={isSelf ? "Cannot delete own account" : "Delete User"}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    
                    {filteredUsers.length === 0 && (
                        <div className="p-12 text-center flex flex-col items-center text-slate-400 space-y-3">
                            <Users size={40} className="text-slate-200" />
                            <p className="font-medium tracking-wide">No users match the search/filter criteria.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ==================== CREATE USER MODAL ==================== */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl border border-white/20 animate-slide-up">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-slate-800">Create New User</h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleAddUser} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Username</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={formData.username} 
                                    onChange={e => setFormData({...formData, username: e.target.value})} 
                                    className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:border-clinic-400 focus:ring-4 focus:ring-clinic-400/10 focus:bg-white transition-all outline-none text-slate-700 font-medium" 
                                    placeholder="Enter username" 
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Password</label>
                                <input 
                                    type="password" 
                                    required 
                                    value={formData.password} 
                                    onChange={e => setFormData({...formData, password: e.target.value})} 
                                    className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:border-clinic-400 focus:ring-4 focus:ring-clinic-400/10 focus:bg-white transition-all outline-none text-slate-700 font-medium" 
                                    placeholder="••••••••" 
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Role</label>
                                <select 
                                    value={formData.role} 
                                    onChange={e => setFormData({...formData, role: e.target.value})} 
                                    className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:border-clinic-400 focus:ring-4 focus:ring-clinic-400/10 focus:bg-white transition-all outline-none text-slate-700 font-medium cursor-pointer"
                                >
                                    <option value="Registrator">Registrator</option>
                                    <option value="Doctor">Medical Doctor</option>
                                    <option value="Admin">Administrator</option>
                                </select>
                            </div>
                            {formData.role === 'Doctor' && (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Doctor Name</label>
                                        <input 
                                            type="text" 
                                            required 
                                            value={formData.doctorName} 
                                            onChange={e => setFormData({...formData, doctorName: e.target.value})} 
                                            className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:border-clinic-400 focus:ring-4 focus:ring-clinic-400/10 focus:bg-white transition-all outline-none text-slate-700 font-medium" 
                                            placeholder="e.g. Dr. Budi Santoso" 
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Specialization</label>
                                        <input 
                                            type="text" 
                                            required 
                                            value={formData.spesialis} 
                                            onChange={e => setFormData({...formData, spesialis: e.target.value})} 
                                            className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:border-clinic-400 focus:ring-4 focus:ring-clinic-400/10 focus:bg-white transition-all outline-none text-slate-700 font-medium" 
                                            placeholder="e.g. Penyakit Dalam, Anak, Umum" 
                                        />
                                    </div>
                                </>
                            )}
                            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-5 py-2.5 font-semibold text-sm text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                                <button type="submit" className="px-5 py-2.5 font-semibold text-sm text-white bg-gradient-to-r from-clinic-600 to-clinic-500 rounded-xl hover:from-clinic-700 hover:to-clinic-600 transition-all shadow-md shadow-clinic-500/30">Create User</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ==================== EDIT USER MODAL ==================== */}
            {isEditModalOpen && editingUser && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl border border-white/20 animate-slide-up">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-slate-800">Edit User</h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateUser} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Username</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={editFormData.username} 
                                    onChange={e => setEditFormData({...editFormData, username: e.target.value})} 
                                    className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:border-clinic-400 focus:ring-4 focus:ring-clinic-400/10 focus:bg-white transition-all outline-none text-slate-700 font-medium" 
                                />
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">New Password</label>
                                    <span className="text-[11px] text-slate-400">Leave blank to keep unchanged</span>
                                </div>
                                <div className="relative">
                                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input 
                                        type="password" 
                                        value={editFormData.password} 
                                        onChange={e => setEditFormData({...editFormData, password: e.target.value})} 
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:border-clinic-400 focus:ring-4 focus:ring-clinic-400/10 focus:bg-white transition-all outline-none text-slate-700 font-medium" 
                                        placeholder="Enter new password (optional)" 
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Role</label>
                                <select 
                                    disabled={editingUser.id === currentUser.id}
                                    value={editFormData.role} 
                                    onChange={e => setEditFormData({...editFormData, role: e.target.value})} 
                                    className={`w-full px-4 py-2.5 rounded-xl border border-slate-200 font-medium outline-none ${
                                        editingUser.id === currentUser.id 
                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                                            : 'bg-slate-50 text-slate-700 focus:border-clinic-400 focus:ring-4 focus:ring-clinic-400/10 focus:bg-white cursor-pointer'
                                    }`}
                                >
                                    <option value="Registrator">Registrator</option>
                                    <option value="Doctor">Medical Doctor</option>
                                    <option value="Admin">Administrator</option>
                                </select>
                                {editingUser.id === currentUser.id && (
                                    <p className="text-[11px] text-amber-600 mt-1 ml-1">You cannot change your own admin role.</p>
                                )}
                            </div>

                            {editFormData.role === 'Doctor' && (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Doctor Name</label>
                                        <input 
                                            type="text" 
                                            required 
                                            value={editFormData.doctorName} 
                                            onChange={e => setEditFormData({...editFormData, doctorName: e.target.value})} 
                                            className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:border-clinic-400 focus:ring-4 focus:ring-clinic-400/10 focus:bg-white transition-all outline-none text-slate-700 font-medium" 
                                            placeholder="e.g. Dr. Budi Santoso" 
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Specialization</label>
                                        <input 
                                            type="text" 
                                            required 
                                            value={editFormData.spesialis} 
                                            onChange={e => setEditFormData({...editFormData, spesialis: e.target.value})} 
                                            className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:border-clinic-400 focus:ring-4 focus:ring-clinic-400/10 focus:bg-white transition-all outline-none text-slate-700 font-medium" 
                                            placeholder="e.g. Penyakit Dalam, Anak, Umum" 
                                        />
                                    </div>
                                </>
                            )}

                            {/* Active Status Checkbox */}
                            <div className="pt-2">
                                <label className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                                    editFormData.is_active 
                                        ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900' 
                                        : 'bg-rose-50/50 border-rose-200 text-rose-900'
                                }`}>
                                    <input 
                                        type="checkbox"
                                        disabled={editingUser.id === currentUser.id}
                                        checked={editFormData.is_active}
                                        onChange={e => setEditFormData({...editFormData, is_active: e.target.checked})}
                                        className="w-4 h-4 text-clinic-600 rounded focus:ring-clinic-500"
                                    />
                                    <span className="text-sm font-medium">
                                        Account Active {editFormData.is_active ? '(Enabled)' : '(Disabled - cannot log in)'}
                                    </span>
                                </label>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 font-semibold text-sm text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                                <button type="submit" className="px-5 py-2.5 font-semibold text-sm text-white bg-gradient-to-r from-clinic-600 to-clinic-500 rounded-xl hover:from-clinic-700 hover:to-clinic-600 transition-all shadow-md shadow-clinic-500/30">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ==================== DELETE CONFIRMATION MODAL ==================== */}
            {isDeleteModalOpen && userToDelete && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
                    <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-white/20 animate-slide-up text-center">
                        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
                            <AlertTriangle size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Delete User Account?</h3>
                        <p className="text-sm text-slate-500 mt-2">
                            Are you sure you want to delete user <strong className="text-slate-800">"{userToDelete.username}"</strong> ({userToDelete.role})? This action cannot be undone.
                        </p>
                        <div className="flex justify-center space-x-3 mt-6">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="px-5 py-2.5 font-semibold text-sm text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteUser}
                                className="px-5 py-2.5 font-semibold text-sm text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition-all shadow-md shadow-rose-600/30"
                            >
                                Delete User
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardPage;
