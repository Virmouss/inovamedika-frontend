import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import { User, Activity, Edit2, Trash2, Calendar, FileText, ArrowLeft, X, ChevronRight } from 'lucide-react';
import { API_BASE } from '../config/api';

const PatientDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const isDoctor = user?.role === 'Doctor';
    const isRegistrator = user?.role === 'Registrator';
    const isAdmin = user?.role === 'Admin';

    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState([]);
    const [loadingRecords, setLoadingRecords] = useState(false);

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await axios.get(`${API_BASE}/patients/${id}`);
                setPatient(res.data.data);
            } catch (err) {
                console.error('Failed to fetch patient details');
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    useEffect(() => {
        if (patient && (isDoctor || isAdmin)) {
            const fetchRecords = async () => {
                setLoadingRecords(true);
                try {
                    const res = await axios.get(`${API_BASE}/medical-records/patient/${id}`);
                    setRecords(res.data.data);
                } catch (err) {
                    setRecords([]);
                } finally {
                    setLoadingRecords(false);
                }
            };
            fetchRecords();
        }
    }, [patient, id, isDoctor, isAdmin]);

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this patient record?')) {
            try {
                await axios.delete(`${API_BASE}/patients/${id}`);
                navigate('/patients');
            } catch (err) {
                alert('Failed to delete patient');
            }
        }
    };

    const openEditModal = () => {
        setFormData({
            nik: patient.nik,
            nama: patient.nama,
            kelamin: patient.kelamin,
            tanggal_lahir: patient.tanggal_lahir ? new Date(patient.tanggal_lahir).toISOString().split('T')[0] : '',
            nomor_telepon: patient.nomor_telepon || '',
            alamat: patient.alamat || ''
        });
        setIsEditModalOpen(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`${API_BASE}/patients/${id}`, formData);
            setIsEditModalOpen(false);
            const res = await axios.get(`${API_BASE}/patients/${id}`);
            setPatient(res.data.data);
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to update patient');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4 animate-fade-in">
                <Activity className="animate-pulse text-clinic-500" size={32} />
                <div className="text-slate-500 font-medium tracking-wide">Loading Details...</div>
            </div>
        );
    }

    if (!patient) {
        return (
            <div className="p-16 text-center text-slate-400">
                <User size={32} className="mx-auto mb-3 text-slate-300" />
                <p className="font-semibold text-slate-500">Patient not found</p>
                <button onClick={() => navigate('/patients')} className="mt-4 text-clinic-600 hover:underline">Return to Directory</button>
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center space-x-4">
                    <button onClick={() => navigate('/patients')} className="p-2 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Patient Profile</h1>
                        <p className="text-slate-500 mt-2 font-medium">Detailed information and history</p>
                    </div>
                </div>
                {/* Actions (Edit/Delete) */}
                {(isAdmin || isRegistrator) && (
                    <div className="flex space-x-3">
                        <button onClick={openEditModal} className="flex items-center space-x-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 hover:text-clinic-600 hover:border-clinic-200 hover:bg-clinic-50 rounded-xl font-semibold text-sm transition-colors shadow-sm">
                            <Edit2 size={16} />
                            <span>Edit Profile</span>
                        </button>
                        <button onClick={handleDelete} className="flex items-center space-x-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 rounded-xl font-semibold text-sm transition-colors shadow-sm">
                            <Trash2 size={16} />
                            <span>Delete</span>
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden col-span-1 h-max">
                    <div className="p-8 flex flex-col items-center border-b border-slate-100/60 bg-gradient-to-b from-slate-50/50 to-white">
                        <div className="h-24 w-24 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-4xl mb-4 border border-emerald-100 shadow-sm">
                            {patient.nama.charAt(0).toUpperCase()}
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 text-center">{patient.nama}</h2>
                        <p className="text-slate-500 font-mono mt-1 text-sm bg-slate-100 px-3 py-1 rounded-full">NIK: {patient.nik}</p>
                    </div>
                    <div className="p-6 grid grid-cols-1 gap-y-5">
                        <div>
                            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Gender</p>
                            <p className="text-sm font-bold text-slate-700">{patient.kelamin}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Date of Birth</p>
                            <p className="text-sm font-bold text-slate-700">{new Date(patient.tanggal_lahir).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Contact Number</p>
                            <p className="text-sm font-bold text-slate-700">{patient.nomor_telepon || '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Residential Address</p>
                            <p className="text-sm font-bold text-slate-700">{patient.alamat || '—'}</p>
                        </div>
                    </div>
                </div>

                {/* Medical Records List */}
                {(isDoctor || isAdmin) && (
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden lg:col-span-2 flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex items-center space-x-3 bg-slate-50/50">
                            <div className="bg-white shadow-sm p-2 rounded-xl text-blue-600 border border-slate-100">
                                <FileText size={20} />
                            </div>
                            <h2 className="text-lg font-bold text-slate-800">Medical History</h2>
                        </div>
                        
                        <div className="p-6 flex-1 bg-slate-50/30">
                            {loadingRecords ? (
                                <div className="flex items-center justify-center py-12"><Activity className="animate-pulse text-blue-500" size={28} /></div>
                            ) : records.length === 0 ? (
                                <div className="py-16 text-center text-slate-400 bg-white border border-slate-100 border-dashed rounded-2xl">
                                    <FileText size={32} className="mx-auto mb-3 text-slate-300" />
                                    <p className="font-semibold text-slate-500">No medical records</p>
                                    <p className="text-sm mt-1">This patient has no recorded visits yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {records.map(record => (
                                        <div key={record.id} className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-blue-200 transition-colors shadow-sm group">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center space-x-2">
                                                    <Calendar size={14} className="text-slate-400" />
                                                    <span className="text-sm font-bold text-slate-700">
                                                        {new Date(record.visit_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                    </span>
                                                    <span className="text-xs text-slate-500 font-medium px-2 py-0.5 bg-slate-100 rounded-md">Dr. {record.doctor_name}</span>
                                                </div>
                                                <button onClick={() => navigate(`/medical-records/${record.id}`)} className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100 flex items-center space-x-1">
                                                    <span>View Details</span>
                                                    <ChevronRight size={12} />
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                {record.diagnosa && (
                                                    <div>
                                                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Diagnosa</p>
                                                        <p className="text-slate-700 mt-0.5 font-medium truncate">{record.diagnosa}</p>
                                                    </div>
                                                )}
                                                {record.keluhan_awal && (
                                                    <div>
                                                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Keluhan</p>
                                                        <p className="text-slate-700 mt-0.5 font-medium truncate">{record.keluhan_awal}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Patient Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl w-full max-w-xl p-8 shadow-2xl">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold text-slate-800">Update Patient Record</h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdate} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">NIK Number</label>
                                    <input type="text" required value={formData.nik} onChange={e => setFormData({...formData, nik: e.target.value})} className="w-full px-4 py-3 bg-slate-50/50 rounded-xl border border-slate-200 focus:border-clinic-400 focus:ring-4 focus:ring-clinic-400/10 focus:bg-white outline-none text-slate-700 font-medium" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                                    <input type="text" required value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} className="w-full px-4 py-3 bg-slate-50/50 rounded-xl border border-slate-200 focus:border-clinic-400 focus:ring-4 focus:ring-clinic-400/10 focus:bg-white outline-none text-slate-700 font-medium" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Gender</label>
                                    <select value={formData.kelamin} onChange={e => setFormData({...formData, kelamin: e.target.value})} className="w-full px-4 py-3 bg-slate-50/50 rounded-xl border border-slate-200 focus:border-clinic-400 focus:ring-4 focus:ring-clinic-400/10 focus:bg-white outline-none text-slate-700 font-medium cursor-pointer">
                                        <option value="Laki-laki">Laki-laki (Male)</option>
                                        <option value="Perempuan">Perempuan (Female)</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Date of Birth</label>
                                    <input type="date" required value={formData.tanggal_lahir} onChange={e => setFormData({...formData, tanggal_lahir: e.target.value})} className="w-full px-4 py-3 bg-slate-50/50 rounded-xl border border-slate-200 focus:border-clinic-400 focus:ring-4 focus:ring-clinic-400/10 focus:bg-white outline-none text-slate-700 font-medium" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Phone Number</label>
                                <input type="text" value={formData.nomor_telepon} onChange={e => setFormData({...formData, nomor_telepon: e.target.value})} className="w-full px-4 py-3 bg-slate-50/50 rounded-xl border border-slate-200 focus:border-clinic-400 focus:ring-4 focus:ring-clinic-400/10 focus:bg-white outline-none text-slate-700 font-medium" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Residential Address</label>
                                <textarea rows="3" value={formData.alamat} onChange={e => setFormData({...formData, alamat: e.target.value})} className="w-full px-4 py-3 bg-slate-50/50 rounded-xl border border-slate-200 focus:border-clinic-400 focus:ring-4 focus:ring-clinic-400/10 focus:bg-white outline-none text-slate-700 font-medium resize-none"></textarea>
                            </div>
                            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-slate-100">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-6 py-3 font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                                <button type="submit" className="px-6 py-3 font-semibold text-white bg-clinic-600 hover:bg-clinic-700 rounded-xl transition-colors shadow-md shadow-clinic-500/30">
                                    Update Profile
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientDetailsPage;
