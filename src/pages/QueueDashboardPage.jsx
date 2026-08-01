import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Activity, Users, CalendarCheck, Clock, CheckCircle } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const QueueDashboardPage = () => {
    const [data, setData] = useState({ queue: [], stats: null, currentCalled: null });
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    const fetchQueue = useCallback(async () => {
        try {
            const res = await axios.get(`${API_BASE}/queues`);
            setData(res.data.data);
            setLastUpdated(new Date());
        } catch (err) {
            console.error('Failed to fetch queue data');
        } finally {
            setLoading(false);
        }
    }, []);

    // Auto-refresh queue every 10 seconds
    useEffect(() => {
        fetchQueue();
        const queueInterval = setInterval(fetchQueue, 10000);
        return () => clearInterval(queueInterval);
    }, [fetchQueue]);

    // Live clock tick
    useEffect(() => {
        const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(clockInterval);
    }, []);

    const { stats, currentCalled, queue } = data;
    const waitingList = queue.filter(a => a.status_kunjungan === 'waiting');

    if (loading) {
        return (
            <div className="min-h-screen bg-clinic-900 flex items-center justify-center">
                <Activity className="animate-pulse text-clinic-400" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-clinic-900 text-white flex flex-col font-sans">
            {/* Top bar */}
            <header className="flex items-center justify-between px-10 py-6 border-b border-clinic-700/50">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">InovaMedika</h1>
                    <p className="text-clinic-300 text-sm mt-0.5">Antrian Pasien Hari Ini</p>
                </div>
                <div className="text-right">
                    <p className="text-4xl font-black text-white tabular-nums tracking-widest">
                        {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </p>
                    <p className="text-clinic-300 text-sm mt-0.5">
                        {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>
            </header>

            <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 p-10">
                {/* LEFT: Currently Called — takes 2/3 of the width */}
                <div className="lg:col-span-2 flex flex-col space-y-6">
                    {/* Main queue number display */}
                    <div className="flex-1 bg-clinic-800/60 rounded-3xl border border-clinic-700/50 flex flex-col items-center justify-center p-10 text-center">
                        <p className="text-clinic-300 text-lg font-semibold uppercase tracking-[0.3em] mb-6">Nomor Antrian Dipanggil</p>
                        {currentCalled ? (
                            <>
                                <div className="text-[10rem] leading-none font-black text-white tracking-wider animate-pulse-slow drop-shadow-2xl">
                                    {currentCalled.queue_number}
                                </div>
                                <div className="mt-6 bg-clinic-700/50 rounded-2xl px-8 py-3">
                                    <p className="text-2xl font-bold text-clinic-100">{currentCalled.patient_name}</p>
                                </div>
                            </>
                        ) : (
                            <div className="text-[6rem] leading-none font-black text-clinic-600 tracking-wider">
                                —
                            </div>
                        )}
                        {!currentCalled && (
                            <p className="text-clinic-500 text-lg mt-4 font-medium">Belum ada pasien yang dipanggil</p>
                        )}
                    </div>

                    {/* Stats row */}
                    {stats && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { icon: <Users size={20} />, label: 'Total Pasien', value: stats.total_patients_today, color: 'bg-white/10 text-white' },
                                { icon: <Clock size={20} />, label: 'Menunggu', value: stats.total_waiting, color: 'bg-amber-500/20 text-amber-300' },
                                { icon: <Activity size={20} />, label: 'Sedang Diperiksa', value: parseInt(stats.total_called || 0) + parseInt(stats.total_assessing || 0), color: 'bg-blue-500/20 text-blue-300' },
                                { icon: <CheckCircle size={20} />, label: 'Selesai', value: stats.total_done, color: 'bg-emerald-500/20 text-emerald-300' },
                            ].map((s) => (
                                <div key={s.label} className={`rounded-2xl p-4 border border-white/10 ${s.color} flex flex-col items-center text-center space-y-2`}>
                                    {s.icon}
                                    <p className="text-4xl font-black">{s.value}</p>
                                    <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* RIGHT: Waiting list */}
                <div className="bg-clinic-800/60 rounded-3xl border border-clinic-700/50 flex flex-col overflow-hidden">
                    <div className="px-6 py-5 border-b border-clinic-700/50">
                        <h2 className="text-lg font-bold text-clinic-100 uppercase tracking-wider">Pasien Menunggu</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto divide-y divide-clinic-700/40 p-2">
                        {waitingList.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-clinic-600 text-center p-8 space-y-3">
                                <CalendarCheck size={36} />
                                <p className="text-sm font-medium">Tidak ada pasien menunggu</p>
                            </div>
                        ) : (
                            waitingList.map((appt) => (
                                <div key={appt.id} className="flex items-center space-x-4 p-4 rounded-xl hover:bg-clinic-700/30 transition-colors">
                                    <div className="text-2xl font-black text-clinic-300 w-16 text-center tracking-wider shrink-0">
                                        {appt.queue_number}
                                    </div>
                                    <div>
                                        <p className="font-bold text-white text-sm">{appt.patient_name}</p>
                                        <p className="text-clinic-400 text-xs">{appt.poli}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    {lastUpdated && (
                        <div className="px-6 py-3 border-t border-clinic-700/50 text-center">
                            <p className="text-clinic-500 text-xs">
                                Diperbarui: {lastUpdated.toLocaleTimeString('id-ID')}
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default QueueDashboardPage;
