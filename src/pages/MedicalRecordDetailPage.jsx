import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import {
    Activity, ArrowLeft, Calendar, User, Stethoscope,
    FileText, Edit2, Trash2, X, Pill, Thermometer, Weight, HeartPulse
} from 'lucide-react';
import { API_BASE } from '../config/api';

const emptyForm = {
    keluhan_awal: '', tekanan_darah: '', suhu_tubuh: '',
    berat_badan: '', diagnosa: '', rencana_terapi: '', tindakan_medis: '',
};

const MedicalRecordDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const isDoctor = user?.role === 'Doctor';
    const isAdmin = user?.role === 'Admin';
    const canEdit = isDoctor || isAdmin;

    const [record, setRecord] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [formData, setFormData] = useState({ ...emptyForm });

    const fetchRecord = async () => {
        try {
            const res = await axios.get(`${API_BASE}/medical-records/${id}`);
            setRecord(res.data.data);
        } catch (err) {
            if (err.response?.status === 404) setNotFound(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecord();
    }, [id]);

    const openEdit = () => {
        setFormData({
            keluhan_awal: record.keluhan_awal || '',
            tekanan_darah: record.tekanan_darah || '',
            suhu_tubuh: record.suhu_tubuh || '',
            berat_badan: record.berat_badan || '',
            diagnosa: record.diagnosa || '',
            rencana_terapi: record.rencana_terapi || '',
            tindakan_medis: record.tindakan_medis || '',
        });
        setIsEditModalOpen(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`${API_BASE}/medical-records/${id}`, formData);
            setIsEditModalOpen(false);
            fetchRecord();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to update record');
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Delete this medical record? This action cannot be undone.')) return;
        try {
            await axios.delete(`${API_BASE}/medical-records/${id}`);
            navigate(-1);
        } catch (err) {
            alert('Failed to delete record');
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-64 space-y-4 animate-fade-in">
            <Activity className="animate-pulse text-clinic-500" size={32} />
            <div className="text-slate-500 font-medium tracking-wide">Loading Record...</div>
        </div>
    );

    if (notFound || !record) return (
        <div className="p-16 text-center text-slate-400">
            <FileText size={36} className="mx-auto mb-3 text-slate-300" />
            <p className="font-semibold text-slate-500">Medical record not found</p>
            <button onClick={() => navigate(-1)} className="mt-4 text-clinic-600 hover:underline font-medium text-sm">
                Go Back
            </button>
        </div>
    );

    const vitals = [
        { label: 'Tekanan Darah', value: record.tekanan_darah, icon: HeartPulse, unit: '' },
        { label: 'Suhu Tubuh', value: record.suhu_tubuh, icon: Thermometer, unit: '°C' },
        { label: 'Berat Badan', value: record.berat_badan, icon: Weight, unit: ' kg' },
    ];

    const clinicalNotes = [
        { label: 'Keluhan Awal', value: record.keluhan_awal },
        { label: 'Diagnosa', value: record.diagnosa },
        { label: 'Rencana Terapi', value: record.rencana_terapi },
        { label: 'Tindakan Medis', value: record.tindakan_medis },
    ].filter(n => n.value);

    const prescriptions = record.prescriptions || [];

    return (
        <div className="animate-fade-in space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Medical Record</h1>
                        <p className="text-slate-500 mt-1 font-medium flex items-center space-x-2">
                            <Calendar size={14} />
                            <span>
                                {new Date(record.visit_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                        </p>
                    </div>
                </div>
                {canEdit && (
                    <div className="flex space-x-3">
                        <button
                            onClick={openEdit}
                            className="flex items-center space-x-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 hover:text-clinic-600 hover:border-clinic-200 hover:bg-clinic-50 rounded-xl font-semibold text-sm transition-colors shadow-sm"
                        >
                            <Edit2 size={16} />
                            <span>Edit Record</span>
                        </button>
                        <button
                            onClick={handleDelete}
                            className="flex items-center space-x-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 rounded-xl font-semibold text-sm transition-colors shadow-sm"
                        >
                            <Trash2 size={16} />
                            <span>Delete</span>
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Patient & Doctor Info */}
                <div className="space-y-6">
                    {/* Patient Info */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center space-x-3">
                            <div className="bg-white shadow-sm p-2 rounded-xl text-clinic-600 border border-slate-100">
                                <User size={18} />
                            </div>
                            <h2 className="font-bold text-slate-800">Patient</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center space-x-3">
                                <div className="h-12 w-12 rounded-full bg-clinic-50 text-clinic-600 flex items-center justify-center font-bold text-xl border border-clinic-100 flex-shrink-0">
                                    {record.patient_name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <button
                                        onClick={() => navigate(`/patients/${record.patient_id}`)}
                                        className="font-bold text-slate-800 hover:text-clinic-600 transition-colors text-left"
                                    >
                                        {record.patient_name}
                                    </button>
                                    <p className="text-xs text-slate-500 font-mono mt-0.5">{record.patient_nik}</p>
                                </div>
                            </div>
                            {[
                                { label: 'Gender', value: record.patient_kelamin },
                                { label: 'Date of Birth', value: record.patient_dob ? new Date(record.patient_dob).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : null },
                                { label: 'Phone', value: record.patient_phone },
                                { label: 'Address', value: record.patient_alamat },
                            ].filter(f => f.value).map(f => (
                                <div key={f.label}>
                                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{f.label}</p>
                                    <p className="text-sm font-medium text-slate-700 mt-0.5">{f.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Doctor Info */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center space-x-3">
                            <div className="bg-white shadow-sm p-2 rounded-xl text-blue-600 border border-slate-100">
                                <Stethoscope size={18} />
                            </div>
                            <h2 className="font-bold text-slate-800">Doctor</h2>
                        </div>
                        <div className="p-6 space-y-1">
                            <p className="font-bold text-slate-800">{record.doctor_name}</p>
                            <p className="text-sm text-slate-500">{record.doctor_spesialis}</p>
                        </div>
                    </div>

                    {/* Vitals */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center space-x-3">
                            <div className="bg-white shadow-sm p-2 rounded-xl text-red-500 border border-slate-100">
                                <HeartPulse size={18} />
                            </div>
                            <h2 className="font-bold text-slate-800">Vitals</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            {vitals.map(v => (
                                <div key={v.label} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                                    <div className="flex items-center space-x-2 text-slate-500">
                                        <v.icon size={14} />
                                        <span className="text-xs font-semibold uppercase tracking-wide">{v.label}</span>
                                    </div>
                                    <span className="font-bold text-slate-800 text-sm">
                                        {v.value ? `${v.value}${v.unit}` : '—'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Clinical Notes & Prescriptions */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Clinical Notes */}
                    {clinicalNotes.length > 0 && (
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center space-x-3">
                                <div className="bg-white shadow-sm p-2 rounded-xl text-clinic-600 border border-slate-100">
                                    <FileText size={18} />
                                </div>
                                <h2 className="font-bold text-slate-800">Clinical Notes</h2>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                {clinicalNotes.map(n => (
                                    <div key={n.label}>
                                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1.5">{n.label}</p>
                                        <p className="text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-line">{n.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Prescriptions */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center space-x-3">
                            <div className="bg-white shadow-sm p-2 rounded-xl text-emerald-600 border border-slate-100">
                                <Pill size={18} />
                            </div>
                            <div>
                                <h2 className="font-bold text-slate-800">Prescriptions</h2>
                                <p className="text-xs text-slate-400 mt-0.5">{prescriptions.length} medicine{prescriptions.length !== 1 ? 's' : ''} prescribed</p>
                            </div>
                        </div>
                        <div className="p-6">
                            {prescriptions.length === 0 ? (
                                <div className="py-10 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                                    <Pill size={28} className="mx-auto mb-2 text-slate-300" />
                                    <p className="font-medium text-slate-500 text-sm">No prescriptions on this record</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {prescriptions.map((p, idx) => (
                                        <div key={p.id} className="flex items-start space-x-4 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/60">
                                            <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm flex-shrink-0 mt-0.5">
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-slate-800 text-sm">{p.obat}</p>
                                                <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                                                    {p.dosis && (
                                                        <span className="text-xs text-slate-500 font-medium">
                                                            <span className="text-slate-400 uppercase tracking-wide">Dosis:</span> {p.dosis}
                                                        </span>
                                                    )}
                                                    {p.instruksi && (
                                                        <span className="text-xs text-slate-500 font-medium">
                                                            <span className="text-slate-400 uppercase tracking-wide">Cara Pakai:</span> {p.instruksi}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Record Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-8 pb-0">
                            <h2 className="text-2xl font-bold text-slate-800">Edit Medical Record</h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-full">
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
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-6 py-3 font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">Cancel</button>
                                <button type="submit" className="px-6 py-3 font-semibold text-white bg-gradient-to-r from-clinic-600 to-clinic-500 rounded-xl hover:from-clinic-700 hover:to-clinic-600 shadow-md shadow-clinic-500/30">Update Record</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MedicalRecordDetailPage;
