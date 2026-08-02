import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Users, Phone, CheckCircle, XCircle, RefreshCw, Hash, Activity, UserCheck } from 'lucide-react';
import { API_BASE } from '../config/api';

const STATUS_STYLES = {
    waiting:   { badge: 'bg-amber-50 text-amber-700 border-amber-200/50',   dot: 'bg-amber-400' },
    called:    { badge: 'bg-blue-50 text-blue-700 border-blue-200/50',      dot: 'bg-blue-400' },
    assessing: { badge: 'bg-purple-50 text-purple-700 border-purple-200/50', dot: 'bg-purple-400' },
    done:      { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/50', dot: 'bg-emerald-400' },
    cancelled: { badge: 'bg-red-50 text-red-700 border-red-200/50',         dot: 'bg-red-400' },
};

const StatCard = ({ label, value, color }) => (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center space-x-4">
        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${color}`}>
            <span className="text-xl font-black">{value}</span>
        </div>
        <span className="text-slate-600 font-medium text-sm">{label}</span>
    </div>
);

const QueueManagementPage = () => {
    const [queueData, setQueueData] = useState({ queue: [], stats: null, currentCalled: null });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(null);

    const fetchQueue = useCallback(async () => {
        try {
            const res = await axios.get(`${API_BASE}/queues`);
            setQueueData(res.data.data);
            setError('');
        } catch (err) {
            setError('Failed to load queue. Please refresh.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchQueue();
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchQueue, 30000);
        return () => clearInterval(interval);
    }, [fetchQueue]);

    const handleAction = async (id, action) => {
        setActionLoading(`${id}-${action}`);
        try {
            if (action === 'call') {
                await axios.put(`${API_BASE}/queues/${id}/call`);
            } else if (action === 'remove') {
                if (!window.confirm('Remove this patient from today\'s queue?')) return;
                await axios.put(`${API_BASE}/queues/${id}/remove`);
            } else {
                await axios.put(`${API_BASE}/queues/${id}/status`, { status: action });
            }
            await fetchQueue();
        } catch (err) {
            alert(err.response?.data?.error || 'Action failed');
        } finally {
            setActionLoading(null);
        }
    };

    const { queue, stats, currentCalled } = queueData;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4 animate-fade-in">
                <Activity className="animate-pulse text-clinic-500" size={32} />
                <div className="text-slate-500 font-medium">Loading Queue...</div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Queue Management</h1>
                    <p className="text-slate-500 mt-2 font-medium">Manage today's patient queue</p>
                </div>
                <button
                    onClick={fetchQueue}
                    className="flex items-center space-x-2 px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors text-sm font-semibold"
                >
                    <RefreshCw size={16} />
                    <span>Refresh</span>
                </button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 font-medium">{error}</div>
            )}

            {/* Stats Row */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Total in Queue" value={stats.total_queue} color="bg-slate-100 text-slate-700" />
                    <StatCard label="Waiting" value={stats.total_waiting} color="bg-amber-50 text-amber-700" />
                    <StatCard label="Assessing" value={stats.total_assessing} color="bg-purple-50 text-purple-700" />
                    <StatCard label="Done" value={stats.total_done} color="bg-emerald-50 text-emerald-700" />
                </div>
            )}

            {/* Currently Called Banner */}
            {currentCalled && (
                <div className="bg-gradient-to-r from-clinic-600 to-clinic-500 text-white p-6 rounded-2xl shadow-lg flex items-center space-x-4">
                    <div className="bg-white/20 rounded-xl p-3">
                        <UserCheck size={24} />
                    </div>
                    <div>
                        <p className="text-clinic-100 text-sm font-medium uppercase tracking-wider">Currently Called</p>
                        <p className="text-3xl font-black tracking-wider">{currentCalled.queue_number}</p>
                        <p className="text-clinic-100 font-medium">{currentCalled.patient_name}</p>
                    </div>
                </div>
            )}

            {/* Queue Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100/60 bg-slate-50/50 flex items-center space-x-3">
                    <div className="bg-white shadow-sm p-2 rounded-xl text-clinic-600 border border-slate-100">
                        <Users size={20} />
                    </div>
                    <h2 className="text-lg font-bold text-slate-800">Today's Queue — {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50/30 text-slate-500 font-semibold uppercase tracking-wider text-xs">
                            <tr>
                                <th className="px-6 py-5">Queue #</th>
                                <th className="px-6 py-5">Patient</th>
                                <th className="px-6 py-5">Doctor</th>
                                <th className="px-6 py-5">Poli</th>
                                <th className="px-6 py-5">Status</th>
                                <th className="px-6 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/60">
                            {queue.map((appt) => {
                                const styles = STATUS_STYLES[appt.status_kunjungan] || STATUS_STYLES.waiting;
                                const isLoading = (key) => actionLoading === `${appt.id}-${key}`;
                                return (
                                    <tr key={appt.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center space-x-2">
                                                <Hash size={14} className="text-slate-400" />
                                                <span className="font-black text-slate-800 text-base tracking-wider">
                                                    {appt.queue_number || '—'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center space-x-3">
                                                <div className="h-9 w-9 rounded-full bg-clinic-50 text-clinic-600 flex items-center justify-center font-bold text-sm border border-clinic-100">
                                                    {appt.patient_name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800">{appt.patient_name}</div>
                                                    <div className="text-xs text-slate-500 font-mono">{appt.patient_nik}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="font-medium text-slate-700">{appt.doctor_name}</div>
                                            <div className="text-xs text-slate-500">{appt.doctor_spesialis}</div>
                                        </td>
                                        <td className="px-6 py-5 font-medium">{appt.poli || '—'}</td>
                                        <td className="px-6 py-5">
                                            <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide border capitalize ${styles.badge}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`}></span>
                                                <span>{appt.status_kunjungan}</span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center space-x-2 justify-end">
                                                {/* Call button — only for waiting */}
                                                {appt.status_kunjungan === 'waiting' && (
                                                    <button
                                                        onClick={() => handleAction(appt.id, 'call')}
                                                        disabled={!!actionLoading}
                                                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                                                        title="Call Patient"
                                                    >
                                                        {isLoading('call') ? <RefreshCw size={12} className="animate-spin" /> : <Phone size={12} />}
                                                        <span>Call</span>
                                                    </button>
                                                )}

                                                {/* Done button — for called or assessing */}
                                                {(appt.status_kunjungan === 'called' || appt.status_kunjungan === 'assessing') && (
                                                    <button
                                                        onClick={() => handleAction(appt.id, 'done')}
                                                        disabled={!!actionLoading}
                                                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                                                        title="Mark as Done"
                                                    >
                                                        {isLoading('done') ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                                                        <span>Done</span>
                                                    </button>
                                                )}

                                                {/* Remove button — for waiting or called */}
                                                {(appt.status_kunjungan === 'waiting' || appt.status_kunjungan === 'called') && (
                                                    <button
                                                        onClick={() => handleAction(appt.id, 'remove')}
                                                        disabled={!!actionLoading}
                                                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                                                        title="Remove from Queue"
                                                    >
                                                        {isLoading('remove') ? <RefreshCw size={12} className="animate-spin" /> : <XCircle size={12} />}
                                                        <span>Remove</span>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {queue.length === 0 && (
                        <div className="p-16 text-center flex flex-col items-center text-slate-400 space-y-4">
                            <div className="bg-slate-50 p-4 rounded-full border border-slate-100">
                                <Users size={32} className="text-slate-300" />
                            </div>
                            <div>
                                <p className="font-semibold text-slate-600">No patients in queue today</p>
                                <p className="text-sm mt-1">Appointments scheduled for today will appear here automatically.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QueueManagementPage;
