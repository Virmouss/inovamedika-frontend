import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import { Users, Plus, Search, Edit2, Trash2, Activity, Filter, FileText, X, Calendar } from 'lucide-react';

const PatientsPage = () => {
    const { user } = useContext(AuthContext);
    const isDoctor = user?.role === 'Doctor';
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [editingPatientId, setEditingPatientId] = useState(null);
    const [formData, setFormData] = useState({ nik: '', nama: '', kelamin: 'Laki-laki', tanggal_lahir: '', nomor_telepon: '', alamat: '' });

    const [search, setSearch] = useState('');
    const [patientRecords, setPatientRecords] = useState(null); // medical history for view
    const [loadingRecords, setLoadingRecords] = useState(false);
    const [viewingPatient, setViewingPatient] = useState(null);

    const fetchPatients = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/patients');
            setPatients(res.data.data);
        } catch (err) {
            setError('Failed to fetch patients. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchMedicalRecords = async (patient) => {
        setViewingPatient(patient);
        setLoadingRecords(true);
        setPatientRecords(null);
        try {
            const res = await axios.get(`http://localhost:5000/api/medical-records/patient/${patient.id}`);
            setPatientRecords(res.data.data);
        } catch (err) {
            setPatientRecords([]);
        } finally {
            setLoadingRecords(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this patient record?')) {
            try {
                await axios.delete(`http://localhost:5000/api/patients/${id}`);
                fetchPatients();
            } catch (err) {
                alert('Failed to delete patient');
            }
        }
    };

    const openAddModal = () => {
        setFormData({ nik: '', nama: '', kelamin: 'Laki-laki', tanggal_lahir: '', nomor_telepon: '', alamat: '' });
        setModalMode('add');
        setIsModalOpen(true);
    };

    const openEditModal = (patient) => {
        setFormData({
            nik: patient.nik,
            nama: patient.nama,
            kelamin: patient.kelamin,
            tanggal_lahir: patient.tanggal_lahir ? new Date(patient.tanggal_lahir).toISOString().split('T')[0] : '',
            nomor_telepon: patient.nomor_telepon || '',
            alamat: patient.alamat || ''
        });
        setEditingPatientId(patient.id);
        setModalMode('edit');
        setIsModalOpen(true);
    };

    const handleSubmitPatient = async (e) => {
        e.preventDefault();
        try {
            if (modalMode === 'add') {
                await axios.post('http://localhost:5000/api/patients', formData);
            } else {
                await axios.put(`http://localhost:5000/api/patients/${editingPatientId}`, formData);
            }
            setIsModalOpen(false);
            setFormData({ nik: '', nama: '', kelamin: 'Laki-laki', tanggal_lahir: '', nomor_telepon: '', alamat: '' });
            fetchPatients();
        } catch (err) {
            alert(err.response?.data?.error || `Failed to ${modalMode} patient`);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-64 space-y-4 animate-fade-in">
            <Activity className="animate-pulse text-clinic-500" size={32} />
            <div className="text-slate-500 font-medium tracking-wide">Loading Patients...</div>
        </div>
    );

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
                    </div>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-clinic-500 transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search by NIK or Name..." 
                            className="pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-medium text-sm focus:border-clinic-400 focus:ring-4 focus:ring-clinic-400/10 outline-none w-full md:w-80 transition-all shadow-sm placeholder:text-slate-400"
                        />
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50/30 text-slate-500 font-semibold uppercase tracking-wider text-xs">
                            <tr>
                                <th className="px-8 py-5">Patient Details</th>
                                <th className="px-8 py-5">NIK ID</th>
                                <th className="px-8 py-5">Gender & DOB</th>
                                <th className="px-8 py-5">Contact</th>
                                <th className="px-8 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/60">
                            {patients.map(patient => (
                                <tr key={patient.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center space-x-3">
                                            <div className="h-10 w-10 rounded-full bg-clinic-50 text-clinic-600 flex items-center justify-center font-bold text-sm border border-clinic-100">
                                                {patient.nama.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800 text-base">{patient.nama}</div>
                                                <div className="text-xs text-slate-500 mt-0.5">ID: #{String(patient.id).padStart(5, '0')}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 font-medium text-slate-600 font-mono text-xs">{patient.nik}</td>
                                    <td className="px-8 py-5">
                                        <div className="font-medium text-slate-700">{patient.kelamin}</div>
                                        <div className="text-xs text-slate-500 mt-0.5">{new Date(patient.tanggal_lahir).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                    </td>
                                    <td className="px-8 py-5 font-medium text-slate-600">{patient.nomor_telepon || '-'}</td>
                                    <td className="px-8 py-5">
                                        <div className="flex space-x-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                            {/* Doctor can view medical records */}
                                            {isDoctor && (
                                                <button
                                                    onClick={() => fetchMedicalRecords(patient)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Medical Records"
                                                >
                                                    <FileText size={18} />
                                                </button>
                                            )}
                                            {/* Registrator/Admin can edit and delete */}
                                            {!isDoctor && (
                                                <>
                                                    <button
                                                        onClick={() => openEditModal(patient)}
                                                        className="p-2 text-slate-400 hover:text-clinic-600 hover:bg-clinic-50 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(patient.id)}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {patients.length === 0 && (
                        <div className="p-16 text-center flex flex-col items-center text-slate-400 space-y-4">
                            <div className="bg-slate-50 p-4 rounded-full border border-slate-100">
                                <Users size={32} className="text-slate-300" />
                            </div>
                            <div>
                                <p className="font-semibold text-slate-600">No patients found</p>
                                <p className="text-sm mt-1">Add a new patient to get started with records.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Patient Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
                    <div className="bg-white rounded-3xl w-full max-w-xl p-8 shadow-2xl border border-white/20 animate-slide-up">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold text-slate-800">
                                {modalMode === 'add' ? 'Register New Patient' : 'Update Patient Record'}
                            </h2>
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
                                    {modalMode === 'add' ? 'Save Patient' : 'Update Record'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Doctor: View Patient Medical Records Modal */}
            {viewingPatient && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-8 pb-6 border-b border-slate-100">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">{viewingPatient.nama}</h2>
                                <p className="text-slate-500 text-sm mt-1">NIK: {viewingPatient.nik} · Medical History</p>
                            </div>
                            <button onClick={() => { setViewingPatient(null); setPatientRecords(null); }} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8">
                            {loadingRecords ? (
                                <div className="flex items-center justify-center py-10"><Activity className="animate-pulse text-clinic-500" size={28} /></div>
                            ) : patientRecords?.length === 0 ? (
                                <div className="py-10 text-center text-slate-400">
                                    <FileText size={32} className="mx-auto mb-3 text-slate-300" />
                                    <p className="font-semibold text-slate-500">No medical records found</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {patientRecords?.map(record => (
                                        <div key={record.id} className="border border-slate-100 rounded-2xl p-5">
                                            <div className="flex items-center space-x-2 mb-4">
                                                <Calendar size={13} className="text-slate-400" />
                                                <span className="text-sm font-bold text-slate-700">
                                                    {new Date(record.visit_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </span>
                                                <span className="text-xs text-slate-500">— Dr. {record.doctor_name}</span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3 mb-4">
                                                {[
                                                    { label: 'Tekanan Darah', value: record.tekanan_darah },
                                                    { label: 'Suhu Tubuh', value: record.suhu_tubuh ? `${record.suhu_tubuh}°C` : null },
                                                    { label: 'Berat Badan', value: record.berat_badan ? `${record.berat_badan} kg` : null },
                                                ].map(v => (
                                                    <div key={v.label} className="bg-slate-50 rounded-xl p-3">
                                                        <p className="text-xs text-slate-500">{v.label}</p>
                                                        <p className="text-sm font-bold text-slate-700 mt-0.5">{v.value || '—'}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                                {[
                                                    { label: 'Diagnosa', value: record.diagnosa },
                                                    { label: 'Rencana Terapi', value: record.rencana_terapi },
                                                    { label: 'Resep Obat', value: record.resep_obat },
                                                ].filter(v => v.value).map(v => (
                                                    <div key={v.label}>
                                                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">{v.label}</p>
                                                        <p className="text-slate-700 mt-0.5">{v.value}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientsPage;
