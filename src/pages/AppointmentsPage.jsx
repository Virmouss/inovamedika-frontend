import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CalendarClock, Plus, Search, Edit2, Trash2, Activity, X } from 'lucide-react';
import Pagination from '../components/Pagination';
import { API_BASE } from '../config/api';

const STATUS_STYLES = {
    waiting: 'bg-amber-50 text-amber-700 border-amber-200/50',
    called: 'bg-blue-50 text-blue-700 border-blue-200/50',
    assessing: 'bg-purple-50 text-purple-700 border-purple-200/50',
    done: 'bg-emerald-50 text-emerald-700 border-emerald-200/50',
    cancelled: 'bg-red-50 text-red-700 border-red-200/50',
};

const emptyForm = {
    patient_id: '',
    doctor_id: '',
    poli: '',
    keluhan_awal: '',
    jenis_pembayaran: 'BPJS',
    jadwal_kunjungan: '',
    status_kunjungan: 'waiting',
};

const AppointmentsPage = () => {
    const [appointments, setAppointments] = useState([]);
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ ...emptyForm });

    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
    const PAGE_SIZE = 10;

    const [patientSearch, setPatientSearch] = useState('');
    const [showPatientDropdown, setShowPatientDropdown] = useState(false);

    // ---------- Data fetching ----------
    const fetchAppointments = async (currentPage = page) => {
        try {
            const params = { page: currentPage, limit: 10 };
            if (filterDate) params.date = filterDate;
            const res = await axios.get(`${API_BASE}/registrations`, { params });
            setAppointments(res.data.data);
            if (res.data.pagination) setPagination(res.data.pagination);
        } catch (err) {
            setError('Failed to fetch appointments.');
        } finally {
            setLoading(false);
        }
    };

    const fetchPatients = async (query = '') => {
        try {
            const res = await axios.get(`${API_BASE}/patients${query ? `?search=${query}` : ''}`);
            setPatients(res.data.data);
        } catch (err) {
            console.error('Failed to fetch patients', err);
        }
    };

    const fetchDoctors = async () => {
        try {
            const res = await axios.get(`${API_BASE}/registrations/doctors`);
            setDoctors(res.data.data);
        } catch (err) {
            console.error('Failed to fetch doctors', err);
        }
    };

    useEffect(() => {
        fetchDoctors();
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchPatients(patientSearch);
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [patientSearch]);

    useEffect(() => {
        setPage(1);
        fetchAppointments(1);
    }, [filterDate]); // eslint-disable-line

    useEffect(() => {
        fetchAppointments(page);
    }, [page]); // eslint-disable-line

    // ---------- Handlers ----------
    const openAddModal = () => {
        setFormData({ ...emptyForm });
        setPatientSearch('');
        setModalMode('add');
        setIsModalOpen(true);
    };

    const openEditModal = (appt) => {
        setFormData({
            patient_id: appt.patient_id,
            doctor_id: appt.doctor_id,
            poli: appt.poli || '',
            keluhan_awal: appt.keluhan_awal || '',
            jenis_pembayaran: appt.jenis_pembayaran || 'BPJS',
            jadwal_kunjungan: appt.jadwal_kunjungan ? new Date(appt.jadwal_kunjungan).toISOString().slice(0, 16) : '',
            status_kunjungan: appt.status_kunjungan || 'waiting',
        });
        setPatientSearch(appt.patient_name || '');
        setEditingId(appt.id);
        setModalMode('edit');
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (modalMode === 'add') {
                await axios.post(`${API_BASE}/registrations`, formData);
            } else {
                await axios.put(`${API_BASE}/registrations/${editingId}`, formData);
            }
            setIsModalOpen(false);
            setFormData({ ...emptyForm });
            fetchAppointments();
        } catch (err) {
            alert(err.response?.data?.error || `Failed to ${modalMode} appointment`);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this appointment?')) {
            try {
                await axios.delete(`${API_BASE}/registrations/${id}`);
                fetchAppointments();
            } catch (err) {
                alert('Failed to delete appointment');
            }
        }
    };

    // ---------- Filtered data ----------
    const filtered = appointments.filter((a) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            a.patient_name?.toLowerCase().includes(term) ||
            a.patient_nik?.toLowerCase().includes(term) ||
            a.doctor_name?.toLowerCase().includes(term) ||
            a.poli?.toLowerCase().includes(term)
        );
    });

    // ---------- Render ----------
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4 animate-fade-in">
                <Activity className="animate-pulse text-clinic-500" size={32} />
                <div className="text-slate-500 font-medium tracking-wide">Loading Appointments...</div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Appointment Management</h1>
                    <p className="text-slate-500 mt-2 font-medium">Create, edit and manage patient appointments</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="group bg-gradient-to-r from-clinic-600 to-clinic-500 hover:from-clinic-700 hover:to-clinic-600 text-white px-6 py-3 rounded-xl flex items-center space-x-2 transition-all duration-300 shadow-lg shadow-clinic-500/30 hover:shadow-clinic-500/50 hover:-translate-y-0.5"
                >
                    <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                    <span className="font-semibold tracking-wide text-sm">New Appointment</span>
                </button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 flex items-center space-x-3 shadow-sm animate-slide-up">
                    <Activity size={20} />
                    <span className="font-medium">{error}</span>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative">
                {/* Toolbar */}
                <div className="p-6 border-b border-slate-100/60 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                        <div className="bg-white shadow-sm p-2 rounded-xl text-clinic-600 border border-slate-100">
                            <CalendarClock size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">Appointments List</h2>
                        {pagination.total > 0 && (
                            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                                {pagination.total} total
                            </span>
                        )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-medium text-sm focus:border-clinic-400 focus:ring-4 focus:ring-clinic-400/10 outline-none transition-all shadow-sm"
                        />
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-clinic-500 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search patient, doctor, poli..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl font-medium text-sm focus:border-clinic-400 focus:ring-4 focus:ring-clinic-400/10 outline-none w-full md:w-72 transition-all shadow-sm placeholder:text-slate-400"
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50/30 text-slate-500 font-semibold uppercase tracking-wider text-xs">
                            <tr>
                                <th className="px-6 py-5">Patient</th>
                                <th className="px-6 py-5">Doctor</th>
                                <th className="px-6 py-5">Poli</th>
                                <th className="px-6 py-5">Schedule</th>
                                <th className="px-6 py-5">Payment</th>
                                <th className="px-6 py-5">Status</th>
                                <th className="px-6 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/60">
                            {filtered.map((appt) => (
                                <tr key={appt.id} className="hover:bg-slate-50/50 transition-colors group">
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
                                    <td className="px-6 py-5 font-medium text-slate-700">{appt.poli || '-'}</td>
                                    <td className="px-6 py-5">
                                        <div className="font-medium text-slate-700">
                                            {new Date(appt.jadwal_kunjungan).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {new Date(appt.jadwal_kunjungan).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 font-medium text-slate-600">{appt.jenis_pembayaran || '-'}</td>
                                    <td className="px-6 py-5">
                                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold tracking-wide border capitalize ${STATUS_STYLES[appt.status_kunjungan] || ''}`}>
                                            {appt.status_kunjungan}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex space-x-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => openEditModal(appt)}
                                                className="p-2 text-slate-400 hover:text-clinic-600 hover:bg-clinic-50 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(appt.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filtered.length === 0 && (
                        <div className="p-16 text-center flex flex-col items-center text-slate-400 space-y-4">
                            <div className="bg-slate-50 p-4 rounded-full border border-slate-100">
                                <CalendarClock size={32} className="text-slate-300" />
                            </div>
                            <div>
                                <p className="font-semibold text-slate-600">No appointments found</p>
                                <p className="text-sm mt-1">Create a new appointment to get started.</p>
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
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
                    <div className="bg-white rounded-3xl w-full max-w-xl p-8 shadow-2xl border border-white/20 animate-slide-up max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold text-slate-800">
                                {modalMode === 'add' ? 'Create Appointment' : 'Edit Appointment'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Patient Searchable Select */}
                            <div className="space-y-1 relative">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Patient</label>
                                <input
                                    type="text"
                                    required={!formData.patient_id}
                                    placeholder="Search patient by name or NIK..."
                                    value={patientSearch}
                                    onChange={(e) => {
                                        setPatientSearch(e.target.value);
                                        setFormData({ ...formData, patient_id: '' }); // reset ID if they type
                                        setShowPatientDropdown(true);
                                    }}
                                    onFocus={() => setShowPatientDropdown(true)}
                                    onBlur={() => setTimeout(() => setShowPatientDropdown(false), 200)}
                                    className="w-full px-4 py-3 bg-slate-50/50 rounded-xl border border-slate-200 focus:border-clinic-400 focus:ring-4 focus:ring-clinic-400/10 focus:bg-white transition-all duration-300 outline-none text-slate-700 font-medium"
                                />
                                {showPatientDropdown && patients.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                                        {patients.map(p => (
                                            <div 
                                                key={p.id}
                                                className="px-4 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0"
                                                onClick={() => {
                                                    setFormData({ ...formData, patient_id: p.id });
                                                    setPatientSearch(p.nama);
                                                    setShowPatientDropdown(false);
                                                }}
                                            >
                                                <div className="font-semibold text-slate-800 text-sm">{p.nama}</div>
                                                <div className="text-xs text-slate-500">{p.nik}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {showPatientDropdown && patients.length === 0 && patientSearch && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg p-4 text-center text-sm text-slate-500">
                                        No patients found.
                                    </div>
                                )}
                            </div>

                            {/* Doctor select */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Doctor</label>
                                <select
                                    required
                                    value={formData.doctor_id}
                                    onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50/50 rounded-xl border border-slate-200 focus:border-clinic-400 focus:ring-4 focus:ring-clinic-400/10 focus:bg-white transition-all duration-300 outline-none text-slate-700 font-medium appearance-none cursor-pointer"
                                >
                                    <option value="">Select a doctor</option>
                                    {doctors.map((d) => (
                                        <option key={d.id} value={d.id}>
                                            {d.name} — {d.spesialis}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Poli */}
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Poli</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.poli}
                                        onChange={(e) => setFormData({ ...formData, poli: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50/50 rounded-xl border border-slate-200 focus:border-clinic-400 focus:ring-4 focus:ring-clinic-400/10 focus:bg-white transition-all duration-300 outline-none text-slate-700 font-medium placeholder:font-normal"
                                        placeholder="e.g. Poli Umum"
                                    />
                                </div>

                                {/* Payment Type */}
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Payment Type</label>
                                    <select
                                        value={formData.jenis_pembayaran}
                                        onChange={(e) => setFormData({ ...formData, jenis_pembayaran: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50/50 rounded-xl border border-slate-200 focus:border-clinic-400 focus:ring-4 focus:ring-clinic-400/10 focus:bg-white transition-all duration-300 outline-none text-slate-700 font-medium appearance-none cursor-pointer"
                                    >
                                        <option value="BPJS">BPJS</option>
                                        <option value="Umum">Umum (Cash)</option>
                                        <option value="Asuransi">Asuransi</option>
                                    </select>
                                </div>
                            </div>

                            {/* Schedule */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Visit Schedule</label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={formData.jadwal_kunjungan}
                                    onChange={(e) => setFormData({ ...formData, jadwal_kunjungan: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50/50 rounded-xl border border-slate-200 focus:border-clinic-400 focus:ring-4 focus:ring-clinic-400/10 focus:bg-white transition-all duration-300 outline-none text-slate-700 font-medium"
                                />
                            </div>

                            {/* Complaint */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Initial Complaint</label>
                                <textarea
                                    rows="3"
                                    value={formData.keluhan_awal}
                                    onChange={(e) => setFormData({ ...formData, keluhan_awal: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50/50 rounded-xl border border-slate-200 focus:border-clinic-400 focus:ring-4 focus:ring-clinic-400/10 focus:bg-white transition-all duration-300 outline-none text-slate-700 font-medium placeholder:font-normal resize-none"
                                    placeholder="Describe the patient's initial complaint..."
                                ></textarea>
                            </div>

                            {/* Status (only in edit mode) */}
                            {modalMode === 'edit' && (
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Visit Status</label>
                                    <select
                                        value={formData.status_kunjungan}
                                        onChange={(e) => setFormData({ ...formData, status_kunjungan: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50/50 rounded-xl border border-slate-200 focus:border-clinic-400 focus:ring-4 focus:ring-clinic-400/10 focus:bg-white transition-all duration-300 outline-none text-slate-700 font-medium appearance-none cursor-pointer"
                                    >
                                        <option value="waiting">Waiting</option>
                                        <option value="called">Called</option>
                                        <option value="assessing">Assessing</option>
                                        <option value="done">Done</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                            )}

                            {/* Buttons */}
                            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-3 font-semibold tracking-wide text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-3 font-semibold tracking-wide text-white bg-gradient-to-r from-clinic-600 to-clinic-500 rounded-xl hover:from-clinic-700 hover:to-clinic-600 transition-all duration-300 shadow-md shadow-clinic-500/30"
                                >
                                    {modalMode === 'add' ? 'Create Appointment' : 'Update Appointment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppointmentsPage;
