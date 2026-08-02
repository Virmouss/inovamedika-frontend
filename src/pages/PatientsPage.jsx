import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { Users, Plus, Search, Activity, User, ChevronRight } from 'lucide-react';
import Pagination from '../components/Pagination';
import { API_BASE } from '../config/api';

const PAGE_SIZE = 10;

const PatientsPage = () => {
    const { user } = useContext(AuthContext);
    const isDoctor = user?.role === 'Doctor';
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

    // Add Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ nik: '', nama: '', kelamin: 'Laki-laki', tanggal_lahir: '', nomor_telepon: '', alamat: '' });

    const fetchPatients = useCallback(async (currentPage = page, query = search) => {
        setLoading(true);
        try {
            const params = { page: currentPage, limit: PAGE_SIZE };
            if (query) params.search = query;
            const res = await axios.get(`${API_BASE}/patients`, { params });
            setPatients(res.data.data);
            if (res.data.pagination) {
                setPagination(res.data.pagination);
            }
        } catch (err) {
            setError('Failed to fetch patients. Please check your connection.');
        } finally {
            setLoading(false);
        }
    }, []); // eslint-disable-line

    useEffect(() => {
        fetchPatients(page, search);
    }, [page]); // eslint-disable-line

    // Debounce search — reset to page 1 on new query
    useEffect(() => {
        const t = setTimeout(() => {
            setPage(1);
            fetchPatients(1, search);
        }, 400);
        return () => clearTimeout(t);
    }, [search]); // eslint-disable-line

    const openAddModal = () => {
        setFormData({ nik: '', nama: '', kelamin: 'Laki-laki', tanggal_lahir: '', nomor_telepon: '', alamat: '' });
        setIsModalOpen(true);
    };

    const handleSubmitPatient = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE}/patients`, formData);
            setIsModalOpen(false);
            setFormData({ nik: '', nama: '', kelamin: 'Laki-laki', tanggal_lahir: '', nomor_telepon: '', alamat: '' });
            fetchPatients(page, search);
        } catch (err) {
            alert(err.response?.data?.error || `Failed to add patient`);
        }
    };

    return (
        <div className="animate-fade-in space-y-8">
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Patient Directory</h1>
                    <p className="text-slate-500 mt-2 font-medium">Manage and view clinic patient records</p>
                </div>
                <div className="flex space-x-3">
                    {!isDoctor && (
                        <button
                            onClick={openAddModal}
                            className="group bg-gradient-to-r from-clinic-600 to-clinic-500 hover:from-clinic-700 hover:to-clinic-600 text-white px-6 py-3 rounded-xl flex items-center space-x-2 transition-all duration-300 shadow-lg shadow-clinic-500/30 hover:shadow-clinic-500/50 hover:-translate-y-0.5"
                        >
                            <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                            <span className="font-semibold tracking-wide text-sm">New Patient</span>
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 flex items-center space-x-3 shadow-sm animate-slide-up">
                    <Activity size={20} />
                    <span className="font-medium">{error}</span>
                </div>
            )}

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative">
                <div className="p-6 border-b border-slate-100/60 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                        <div className="bg-white shadow-sm p-2 rounded-xl text-clinic-600 border border-slate-100">
                            <Users size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">Patients List</h2>
                        {pagination.total > 0 && (
                            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                                {pagination.total} total
                            </span>
                        )}
                    </div>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-clinic-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search by NIK or Name..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-medium text-sm focus:border-clinic-400 focus:ring-4 focus:ring-clinic-400/10 outline-none w-full md:w-80 transition-all shadow-sm placeholder:text-slate-400"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Activity className="animate-pulse text-clinic-500" size={28} />
                    </div>
                ) : (
                    <>
                        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-4 bg-slate-50/30">
                            {patients.map(patient => (
                                <div key={patient.id} className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
                                    <div className="flex items-center space-x-4">
                                        <div className="h-12 w-12 rounded-full bg-clinic-50 text-clinic-600 flex items-center justify-center font-bold text-lg border border-clinic-100 shrink-0">
                                            {patient.nama.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-bold text-slate-800 text-base truncate">{patient.nama}</div>
                                            <div className="text-xs text-slate-500 font-mono mt-0.5">NIK: {patient.nik}</div>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                        <button onClick={() => navigate(`/patients/${patient.id}`)} className="flex items-center space-x-1.5 px-4 py-2 text-sm font-semibold text-clinic-600 bg-clinic-50 hover:bg-clinic-100 hover:text-clinic-700 rounded-xl transition-colors">
                                            <span>View Details</span>
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {patients.length === 0 && (
                                <div className="col-span-1 lg:col-span-2 p-16 text-center flex flex-col items-center text-slate-400 space-y-4">
                                    <div className="bg-white p-4 rounded-full border border-slate-100 shadow-sm">
                                        <Users size={32} className="text-slate-300" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-600">No patients found</p>
                                        <p className="text-sm mt-1">
                                            {search ? `No results for "${search}"` : 'Add a new patient to get started with records.'}
                                        </p>
                                    </div>
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

            {/* Add Patient Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
                    <div className="bg-white rounded-3xl w-full max-w-xl p-8 shadow-2xl border border-white/20 animate-slide-up">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold text-slate-800">Register New Patient</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-full transition-colors">
                                <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmitPatient} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">NIK Number</label>
                                    <input type="text" required value={formData.nik} onChange={e => setFormData({...formData, nik: e.target.value})} className="w-full px-4 py-3 bg-slate-50/50 rounded-xl border border-slate-200 focus:border-clinic-400 focus:ring-4 focus:ring-clinic-400/10 focus:bg-white transition-all duration-300 outline-none text-slate-700 font-medium placeholder:font-normal" placeholder="e.g. 317123..." />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                                    <input type="text" required value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} className="w-full px-4 py-3 bg-slate-50/50 rounded-xl border border-slate-200 focus:border-clinic-400 focus:ring-4 focus:ring-clinic-400/10 focus:bg-white transition-all duration-300 outline-none text-slate-700 font-medium placeholder:font-normal" placeholder="John Doe" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Gender</label>
                                    <select value={formData.kelamin} onChange={e => setFormData({...formData, kelamin: e.target.value})} className="w-full px-4 py-3 bg-slate-50/50 rounded-xl border border-slate-200 focus:border-clinic-400 focus:ring-4 focus:ring-clinic-400/10 focus:bg-white transition-all duration-300 outline-none text-slate-700 font-medium appearance-none cursor-pointer">
                                        <option value="Laki-laki">Laki-laki (Male)</option>
                                        <option value="Perempuan">Perempuan (Female)</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Date of Birth</label>
                                    <input type="date" required value={formData.tanggal_lahir} onChange={e => setFormData({...formData, tanggal_lahir: e.target.value})} className="w-full px-4 py-3 bg-slate-50/50 rounded-xl border border-slate-200 focus:border-clinic-400 focus:ring-4 focus:ring-clinic-400/10 focus:bg-white transition-all duration-300 outline-none text-slate-700 font-medium" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Phone Number</label>
                                <input type="text" value={formData.nomor_telepon} onChange={e => setFormData({...formData, nomor_telepon: e.target.value})} className="w-full px-4 py-3 bg-slate-50/50 rounded-xl border border-slate-200 focus:border-clinic-400 focus:ring-4 focus:ring-clinic-400/10 focus:bg-white transition-all duration-300 outline-none text-slate-700 font-medium placeholder:font-normal" placeholder="e.g. +62812..." />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Residential Address</label>
                                <textarea rows="3" value={formData.alamat} onChange={e => setFormData({...formData, alamat: e.target.value})} className="w-full px-4 py-3 bg-slate-50/50 rounded-xl border border-slate-200 focus:border-clinic-400 focus:ring-4 focus:ring-clinic-400/10 focus:bg-white transition-all duration-300 outline-none text-slate-700 font-medium placeholder:font-normal resize-none" placeholder="Enter full address..."></textarea>
                            </div>
                            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-slate-100">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 font-semibold tracking-wide text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                                <button type="submit" className="px-6 py-3 font-semibold tracking-wide text-white bg-gradient-to-r from-clinic-600 to-clinic-500 rounded-xl hover:from-clinic-700 hover:to-clinic-600 transition-all duration-300 shadow-md shadow-clinic-500/30">
                                    Save Patient
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientsPage;
