import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { FileText, Activity, Calendar, Search, ChevronRight } from 'lucide-react';
import Pagination from '../components/Pagination';

const API_BASE = 'http://localhost:5000/api';
const PAGE_SIZE = 10;

const MedicalRecordsPage = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

    const fetchRecords = useCallback(async (currentPage = 1) => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/medical-records`, {
                params: { page: currentPage, limit: PAGE_SIZE }
            });
            setRecords(res.data.data);
            if (res.data.pagination) {
                setPagination(res.data.pagination);
            }
        } catch (err) {
            console.error('Failed to load records', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchRecords(page); }, [page, fetchRecords]);

    // Client-side search filter within the current page
    const filtered = records.filter(r =>
        r.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.diagnosa?.toLowerCase().includes(search.toLowerCase()) ||
        r.doctor_name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="animate-fade-in space-y-8">
            {/* Header */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Medical Records</h1>
                <p className="text-slate-500 mt-2 font-medium">
                    {user?.role === 'Admin' ? 'All medical records in the system' : 'Your created medical records, sorted by latest'}
                </p>
            </div>

            {/* Records Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                        <div className="bg-white shadow-sm p-2 rounded-xl text-clinic-600 border border-slate-100">
                            <FileText size={20} />
                        </div>
                        <span className="font-bold text-slate-800">Medical Records</span>
                        {pagination.total > 0 && (
                            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                                {pagination.total} total
                            </span>
                        )}
                    </div>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-clinic-500 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Filter this page by patient, doctor, or diagnosis..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-clinic-400 focus:ring-4 focus:ring-clinic-400/10 outline-none w-full md:w-96 transition-all"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Activity className="animate-pulse text-clinic-500" size={28} />
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600">
                                <thead className="bg-slate-50/30 text-slate-500 font-semibold uppercase tracking-wider text-xs">
                                    <tr>
                                        <th className="px-6 py-5">Patient</th>
                                        <th className="px-6 py-5">Doctor</th>
                                        <th className="px-6 py-5">Visit Date</th>
                                        <th className="px-6 py-5">Diagnosa</th>
                                        <th className="px-6 py-5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100/60">
                                    {filtered.map(record => (
                                        <tr key={record.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="h-8 w-8 rounded-full bg-clinic-50 text-clinic-600 flex items-center justify-center font-bold text-xs border border-clinic-100">
                                                        {record.patient_name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-800">{record.patient_name}</div>
                                                        <div className="text-xs text-slate-500 font-mono">{record.patient_nik}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-700">{record.doctor_name}</div>
                                                <div className="text-xs text-slate-500">{record.doctor_spesialis}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-1.5 text-slate-600">
                                                    <Calendar size={13} className="text-slate-400" />
                                                    <span className="font-medium">
                                                        {new Date(record.visit_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 max-w-xs">
                                                <p className="truncate text-slate-700">{record.diagnosa || '—'}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => navigate(`/medical-records/${record.id}`)}
                                                        className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-clinic-600 bg-clinic-50 hover:bg-clinic-100 hover:text-clinic-700 rounded-xl transition-colors"
                                                        title="View Record"
                                                    >
                                                        <FileText size={14} />
                                                        <span>View Details</span>
                                                        <ChevronRight size={12} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filtered.length === 0 && (
                                <div className="p-16 text-center flex flex-col items-center text-slate-400 space-y-3">
                                    <FileText size={32} className="text-slate-300" />
                                    <p className="font-semibold text-slate-500">No records found</p>
                                </div>
                            )}
                        </div>

                        <Pagination
                            page={page}
                            totalPages={pagination.totalPages}
                            total={pagination.total}
                            limit={PAGE_SIZE}
                            onPageChange={newPage => setPage(newPage)}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default MedicalRecordsPage;
