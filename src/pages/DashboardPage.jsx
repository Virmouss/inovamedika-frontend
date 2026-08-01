import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, UserPlus, Users, Activity, CheckCircle2 } from 'lucide-react';

const DashboardPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ username: '', password: '', role: 'Registrator', doctorName: '', spesialis: '' });

    const fetchUsers = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/users');
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

    const handleRoleChange = async (userId, newRole) => {
        try {
            await axios.put(`http://localhost:5000/api/users/${userId}/role`, { role: newRole });
            setSuccessMessage(`User #${userId} role updated to ${newRole}`);
            setTimeout(() => setSuccessMessage(''), 3000);
            fetchUsers();
        } catch (err) {
            alert('Failed to update role');
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/users', formData);
            setIsModalOpen(false);
            setFormData({ username: '', password: '', role: 'Registrator', doctorName: '', spesialis: '' });
            setSuccessMessage('New user created successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to add user');
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-64 space-y-4 animate-fade-in">
            <Activity className="animate-pulse text-clinic-500" size={32} />
            <div className="text-slate-500 font-medium tracking-wide">Loading Dashboard...</div>
        </div>
    );

    return (
        <div className="animate-fade-in space-y-8">
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">System Overview</h1>
                    <p className="text-slate-500 mt-2 font-medium">Manage administrators and staff access</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="group bg-gradient-to-r from-clinic-600 to-clinic-500 hover:from-clinic-700 hover:to-clinic-600 text-white px-6 py-3 rounded-xl flex items-center space-x-2 transition-all duration-300 shadow-lg shadow-clinic-500/30 hover:shadow-clinic-500/50 hover:-translate-y-0.5"
                >
                    <UserPlus size={18} className="group-hover:rotate-12 transition-transform" />
                    <span className="font-semibold tracking-wide text-sm">Add New User</span>
                </button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 flex items-center space-x-3 shadow-sm animate-slide-up">
                    <Activity size={20} />
                    <span className="font-medium">{error}</span>
                </div>
            )}
            
            {successMessage && (
                <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl border border-emerald-200 flex items-center space-x-3 shadow-sm animate-slide-up">
                    <CheckCircle2 size={20} />
                    <span className="font-medium">{successMessage}</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center space-x-4 hover:shadow-md transition-shadow">
                    <div className="bg-blue-50 p-4 rounded-2xl text-blue-600">
                        <Users size={28} />
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-slate-800">{users.length}</div>
                        <div className="text-sm font-medium text-slate-500 uppercase tracking-wide">Total Users</div>
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
                        <div className="text-sm font-medium text-slate-500 uppercase tracking-wide">Admins</div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative">
                <div className="p-6 border-b border-slate-100/60 bg-slate-50/50 flex items-center space-x-3">
                    <div className="bg-white shadow-sm p-2 rounded-xl text-clinic-600 border border-slate-100">
                        <Shield size={20} />
                    </div>
                    <h2 className="text-lg font-bold text-slate-800">User Access Management</h2>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50/30 text-slate-500 font-semibold uppercase tracking-wider text-xs">
                            <tr>
                                <th className="px-8 py-5">User ID</th>
                                <th className="px-8 py-5">Username</th>
                                <th className="px-8 py-5">Access Level</th>
                                <th className="px-8 py-5">Registered Date</th>
                                <th className="px-8 py-5">Manage Role</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/60">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-5 text-slate-400 font-medium">#{String(user.id).padStart(4, '0')}</td>
                                    <td className="px-8 py-5 font-bold text-slate-800">{user.username}</td>
                                    <td className="px-8 py-5">
                                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold tracking-wide border ${
                                            user.role === 'Admin' ? 'bg-purple-50 text-purple-700 border-purple-200/50' : 
                                            user.role === 'Doctor' ? 'bg-blue-50 text-blue-700 border-blue-200/50' :
                                            'bg-emerald-50 text-emerald-700 border-emerald-200/50'
                                        }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-slate-500 font-medium">{new Date(user.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                    <td className="px-8 py-5">
                                        <div className="relative">
                                            <select 
                                                className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 font-medium text-sm rounded-xl focus:ring-4 focus:ring-clinic-400/10 focus:border-clinic-400 block w-full p-2.5 pr-8 outline-none transition-all cursor-pointer hover:bg-white"
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            >
                                                <option value="Admin">Administrator</option>
                                                <option value="Doctor">Medical Doctor</option>
                                                <option value="Registrator">Registrator</option>
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {users.length === 0 && (
                        <div className="p-12 text-center flex flex-col items-center text-slate-400 space-y-3">
                            <Users size={40} className="text-slate-200" />
                            <p className="font-medium tracking-wide">No users registered yet.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add User Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl border border-white/20 animate-slide-up">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold text-slate-800">Create New User</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-full transition-colors">
                                <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        <form onSubmit={handleAddUser} className="space-y-5">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Username</label>
                                <input type="text" required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full px-4 py-3 bg-slate-50/50 rounded-xl border border-slate-200 focus:border-clinic-400 focus:ring-4 focus:ring-clinic-400/10 focus:bg-white transition-all duration-300 outline-none text-slate-700 font-medium placeholder:font-normal" placeholder="Enter username" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Password</label>
                                <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-3 bg-slate-50/50 rounded-xl border border-slate-200 focus:border-clinic-400 focus:ring-4 focus:ring-clinic-400/10 focus:bg-white transition-all duration-300 outline-none text-slate-700 font-medium placeholder:font-normal" placeholder="••••••••" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Role</label>
                                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-4 py-3 bg-slate-50/50 rounded-xl border border-slate-200 focus:border-clinic-400 focus:ring-4 focus:ring-clinic-400/10 focus:bg-white transition-all duration-300 outline-none text-slate-700 font-medium appearance-none cursor-pointer">
                                    <option value="Registrator">Registrator</option>
                                    <option value="Doctor">Medical Doctor</option>
                                    <option value="Admin">Administrator</option>
                                </select>
                            </div>
                            {formData.role === 'Doctor' && (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Doctor Name</label>
                                        <input type="text" required value={formData.doctorName} onChange={e => setFormData({...formData, doctorName: e.target.value})} className="w-full px-4 py-3 bg-slate-50/50 rounded-xl border border-slate-200 focus:border-clinic-400 focus:ring-4 focus:ring-clinic-400/10 focus:bg-white transition-all duration-300 outline-none text-slate-700 font-medium placeholder:font-normal" placeholder="e.g. Dr. Budi" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Specialization</label>
                                        <input type="text" required value={formData.spesialis} onChange={e => setFormData({...formData, spesialis: e.target.value})} className="w-full px-4 py-3 bg-slate-50/50 rounded-xl border border-slate-200 focus:border-clinic-400 focus:ring-4 focus:ring-clinic-400/10 focus:bg-white transition-all duration-300 outline-none text-slate-700 font-medium placeholder:font-normal" placeholder="e.g. Umum, Gigi, dll" />
                                    </div>
                                </>
                            )}
                            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-slate-100">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 font-semibold tracking-wide text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                                <button type="submit" className="px-6 py-3 font-semibold tracking-wide text-white bg-gradient-to-r from-clinic-600 to-clinic-500 rounded-xl hover:from-clinic-700 hover:to-clinic-600 transition-all duration-300 shadow-md shadow-clinic-500/30">Create User</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardPage;
