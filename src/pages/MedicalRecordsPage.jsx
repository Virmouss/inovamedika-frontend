import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import { FileText, Activity, Edit2, Trash2, X, Calendar, Search } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const emptyForm = {
    keluhan_awal: '', tekanan_darah: '', suhu_tubuh: '',
    berat_badan: '', diagnosa: '', rencana_terapi: '',
    tindakan_medis: '', resep_obat: '',
};

const MedicalRecordsPage = () => {
    const { user } = useContext(AuthContext);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ ...emptyForm });
    const [viewRecord, setViewRecord] = useState(null);

    const fetchRecords = useCallback(async () => {
        try {
            const res = await axios.get(`${API_BASE}/medical-records`);
            setRecords(res.data.data);
        } catch (err) {
            console.error('Failed to load records', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchRecords(); }, [fetchRecords]);

    const openEdit = (record) => {
        setFormData({
            keluhan_awal: record.keluhan_awal || '',
            tekanan_darah: record.tekanan_darah || '',
            suhu_tubuh: record.suhu_tubuh || '',
            berat_badan: record.berat_badan || '',
            diagnosa: record.diagnosa || '',
            rencana_terapi: record.rencana_terapi || '',
            tindakan_medis: record.tindakan_medis || '',
            resep_obat: record.resep_obat || '',
        });
        setEditingId(record.id);
        setIsModalOpen(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`${API_BASE}/medical-records/${editingId}`, formData);
            setIsModalOpen(false);
            fetchRecords();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to update record');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this medical record? This action cannot be undone.')) return;
        try {
            await axios.delete(`${API_BASE}/medical-records/${id}`);
            fetchRecords();
        } catch (err) {
            alert('Failed to delete record');
        }
    };

    const filtered = records.filter(r =>
        r.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.diagnosa?.toLowerCase().includes(search.toLowerCase()) ||
        r.doctor_name?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-64 space-y-4 animate-fade-in">
            <Activity className="animate-pulse text-clinic-500" size={32} />
            <div className="text-slate-500 font-medium">Loading Records...</div>
        </div>
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
                        <span className="font-bold text-slate-800">{filtered.length} Records</span>
                    </div>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-clinic-500 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Search by patient, doctor, or diagnosis..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-clinic-400 focus:ring-4 focus:ring-clinic-400/10 outline-none w-full md:w-80 transition-all"
                        />
                    </div>
                </div>

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
                                        <div className="flex space-x-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => setViewRecord(record)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View">
                                                <FileText size={15} />
                                            </button>
                                            <button onClick={() => openEdit(record)} className="p-1.5 text-slate-400 hover:text-clinic-600 hover:bg-clinic-50 rounded-lg transition-colors" title="Edit">
                                                <Edit2 size={15} />
                                            </button>
                                            <button onClick={() => handleDelete(record.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                                <Trash2 size={15} />
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
            </div>

            {/* View Record Modal */}
            {viewRecord && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-8 pb-0">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">Medical Record</h2>
                                <p className="text-slate-500 text-sm mt-1">
                                    {viewRecord.patient_name} · {new Date(viewRecord.visit_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                            <button onClick={() => setViewRecord(null)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { label: 'Tekanan Darah', value: viewRecord.tekanan_darah },
                                    { label: 'Suhu Tubuh', value: viewRecord.suhu_tubuh ? `${viewRecord.suhu_tubuh}°C` : null },
                                    { label: 'Berat Badan', value: viewRecord.berat_badan ? `${viewRecord.berat_badan} kg` : null },
                                ].map(v => (
                                    <div key={v.label} className="bg-slate-50 rounded-xl p-3">
                                        <p className="text-xs text-slate-500 font-medium">{v.label}</p>
                                        <p className="text-sm font-bold text-slate-700 mt-0.5">{v.value || '—'}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                {[
                                    { label: 'Keluhan Awal', value: viewRecord.keluhan_awal },
                                    { label: 'Diagnosa', value: viewRecord.diagnosa },
                                    { label: 'Rencana Terapi', value: viewRecord.rencana_terapi },
                                    { label: 'Tindakan Medis', value: viewRecord.tindakan_medis },
                                    { label: 'Resep Obat', value: viewRecord.resep_obat },
                                ].filter(v => v.value).map(v => (
                                    <div key={v.label}>
                                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">{v.label}</p>
                                        <p className="text-slate-700 mt-1 font-medium">{v.value}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-end pt-4 border-t border-slate-100">
                                <button onClick={() => setViewRecord(null)} className="px-6 py-3 font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Record Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-8 pb-0">
                            <h2 className="text-2xl font-bold text-slate-800">Edit Medical Record</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdate} className="p-8 space-y-6">
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Vitals</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {[
                                        { label: 'Tekanan Darah', key: 'tekanan_darah', placeholder: 'e.g. 120/80' },
                                        { label: 'Suhu Tubuh (°C)', key: 'suhu_tubuh', type: 'number', step: '0.1', placeholder: 'e.g. 36.5' },
                                        { label: 'Berat Badan (kg)', key: 'berat_badan', type: 'number', step: '0.1', placeholder: 'e.g. 65' },
                                    ].map(f => (
                                        <div key={f.key} className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">{f.label}</label>
                                            <input type={f.type || 'text'} step={f.step} placeholder={f.placeholder} value={formData[f.key]}
                                                onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-50/50 rounded-xl border border-slate-200 focus:border-clinic-400 focus:ring-4 focus:ring-clinic-400/10 focus:bg-white transition-all outline-none text-slate-700 font-medium" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Clinical Notes</h3>
                                <div className="space-y-4">
                                    {[
                                        { label: 'Keluhan Awal', key: 'keluhan_awal' },
                                        { label: 'Diagnosa', key: 'diagnosa' },
                                        { label: 'Rencana Terapi', key: 'rencana_terapi' },
                                        { label: 'Tindakan Medis', key: 'tindakan_medis' },
                                        { label: 'Resep Obat', key: 'resep_obat' },
                                    ].map(f => (
                                        <div key={f.key} className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">{f.label}</label>
                                            <textarea rows="2" value={formData[f.key]} onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-50/50 rounded-xl border border-slate-200 focus:border-clinic-400 focus:ring-4 focus:ring-clinic-400/10 focus:bg-white transition-all outline-none text-slate-700 font-medium resize-none" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">Cancel</button>
                                <button type="submit" className="px-6 py-3 font-semibold text-white bg-gradient-to-r from-clinic-600 to-clinic-500 rounded-xl hover:from-clinic-700 hover:to-clinic-600 shadow-md shadow-clinic-500/30">Update Record</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MedicalRecordsPage;
