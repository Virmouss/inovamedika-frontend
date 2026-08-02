import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import {
    Stethoscope, Activity, ChevronRight, User, RefreshCw,
    Plus, X, ClipboardList, FileText, Trash2
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const STATUS_STYLES = {
    waiting: 'bg-amber-50 text-amber-700 border-amber-200/50',
    called: 'bg-blue-50 text-blue-700 border-blue-200/50',
    assessing: 'bg-purple-50 text-purple-700 border-purple-200/50',
    done: 'bg-emerald-50 text-emerald-700 border-emerald-200/50',
    cancelled: 'bg-red-50 text-red-700 border-red-200/50',
};

const emptyPrescriptionItem = { obat: '', dosis: '', instruksi: '' };

const emptyForm = {
    keluhan_awal: '', tekanan_darah: '', suhu_tubuh: '',
    berat_badan: '', diagnosa: '', rencana_terapi: '',
    tindakan_medis: '',
};

const AssessmentPage = () => {
    const { user } = useContext(AuthContext);
    const [todayPatients, setTodayPatients] = useState([]);
    const [loadingPatients, setLoadingPatients] = useState(true);
    const [selectedAppt, setSelectedAppt] = useState(null);
    const [latestRecord, setLatestRecord] = useState(null);
    const [confirmAppt, setConfirmAppt] = useState(null);      // Begin Assessment confirmation
    const [cancelConfirmAppt, setCancelConfirmAppt] = useState(null); // Cancel Assessment confirmation
    const [formData, setFormData] = useState({ ...emptyForm });
    const [prescriptions, setPrescriptions] = useState([{ ...emptyPrescriptionItem }]);

    const fetchTodayPatients = useCallback(async () => {
        try {
            const res = await axios.get(`${API_BASE}/medical-records/today-patients`);
            // Only show waiting and called patients
            const active = res.data.data.filter(a =>
                ['waiting', 'called', 'assessing'].includes(a.status_kunjungan)
            );
            setTodayPatients(active);
        } catch (err) {
            console.error('Failed to load patients', err);
        } finally {
            setLoadingPatients(false);
        }
    }, []);

    const fetchLatestRecord = useCallback(async (patientId) => {
        try {
            const res = await axios.get(`${API_BASE}/medical-records/patient/${patientId}`);
            setLatestRecord(res.data.data[0] || null); // most recent
        } catch (err) {
            setLatestRecord(null);
        }
    }, []);

    useEffect(() => { fetchTodayPatients(); }, [fetchTodayPatients]);

    useEffect(() => {
        if (selectedAppt) {
            fetchLatestRecord(selectedAppt.patient_id);
            setFormData({ ...emptyForm, keluhan_awal: selectedAppt.keluhan_awal || '' });
            setPrescriptions([{ ...emptyPrescriptionItem }]);
        } else {
            setLatestRecord(null);
            setFormData({ ...emptyForm });
            setPrescriptions([{ ...emptyPrescriptionItem }]);
        }
    }, [selectedAppt, fetchLatestRecord]);

    const handleAddPrescription = () => {
        setPrescriptions(prev => [...prev, { ...emptyPrescriptionItem }]);
    };

    const handleRemovePrescription = (index) => {
        setPrescriptions(prev => {
            if (prev.length === 1) {
                return [{ ...emptyPrescriptionItem }];
            }
            return prev.filter((_, i) => i !== index);
        });
    };

    const handlePrescriptionChange = (index, field, value) => {
        setPrescriptions(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const handleBeginAssessment = async (appt) => {
        try {
            await axios.put(`${API_BASE}/queues/${appt.id}/status`, { status: 'assessing' });
            setConfirmAppt(null);
            await fetchTodayPatients();
            setSelectedAppt(prev => prev?.id === appt.id ? { ...prev, status_kunjungan: 'assessing' } : prev);
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to begin assessment');
        }
    };

    const handleCancelAssessment = async (appt) => {
        try {
            // Revert back to 'waiting' so the patient stays in the active queue
            await axios.put(`${API_BASE}/queues/${appt.id}/status`, { status: 'waiting' });
            setCancelConfirmAppt(null);
            await fetchTodayPatients();
            setSelectedAppt(prev => prev?.id === appt.id ? { ...prev, status_kunjungan: 'waiting' } : prev);
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to cancel assessment');
        }
    };



    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const recordRes = await axios.post(`${API_BASE}/medical-records`, {
                ...formData,
                patient_id: selectedAppt.patient_id,
                doctor_id: user.doctor_id,
                appointment_id: selectedAppt.id,
                visit_date: new Date().toISOString(),
            });

            // If any prescriptions were specified, create them linked to the new medical record
            const validPrescriptions = prescriptions.filter(p => p.obat && p.obat.trim());
            if (validPrescriptions.length > 0) {
                await axios.post(`${API_BASE}/prescriptions`, {
                    medical_record_id: recordRes.data.data.id,
                    items: validPrescriptions,
                });
            }

            setSelectedAppt(null);
            setPrescriptions([{ ...emptyPrescriptionItem }]);
            await fetchTodayPatients();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to save record');
        }
    };

    const calcAge = (dob) => {
        if (!dob) return '—';
        return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
    };

    return (
        <div className="animate-fade-in space-y-8">
            {/* Header */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Patient Assessment</h1>
                <p className="text-slate-500 mt-2 font-medium">Today's active patients — select to begin assessment</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Today's Queue */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center space-x-2">
                            <Stethoscope size={18} className="text-clinic-600" />
                            <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Today's Queue</h2>
                        </div>
                        <button onClick={fetchTodayPatients} className="text-slate-400 hover:text-clinic-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors" title="Refresh">
                            <RefreshCw size={15} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-slate-100/60">
                        {loadingPatients ? (
                            <div className="flex items-center justify-center p-8"><Activity className="animate-pulse text-slate-400" size={24} /></div>
                        ) : todayPatients.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">
                                <User size={28} className="mx-auto mb-3 text-slate-300" />
                                <p className="font-semibold text-slate-500 text-sm">No active patients</p>
                                <p className="text-xs mt-1">Waiting or called patients will appear here.</p>
                            </div>
                        ) : (
                            todayPatients.map((appt) => {
                                const isSelected = selectedAppt?.id === appt.id;
                                return (
                                    <button key={appt.id} onClick={() => setSelectedAppt(appt)}
                                        className={`w-full text-left p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group ${isSelected ? 'bg-clinic-50 border-l-4 border-clinic-500' : ''}`}>
                                        <div className="flex items-center space-x-3 min-w-0">
                                            <div className="h-9 w-9 shrink-0 rounded-full bg-clinic-100 text-clinic-700 flex items-center justify-center font-bold text-sm">
                                                {appt.patient_name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-semibold text-slate-800 text-sm truncate">{appt.patient_name}</div>
                                                <div className="flex items-center space-x-2 mt-0.5">
                                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold border capitalize ${STATUS_STYLES[appt.status_kunjungan] || ''}`}>
                                                        {appt.status_kunjungan}
                                                    </span>
                                                    {appt.queue_number && <span className="text-xs text-slate-500 font-mono">{appt.queue_number}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronRight size={16} className={`shrink-0 text-slate-400 group-hover:text-clinic-500 ${isSelected ? 'text-clinic-500' : ''}`} />
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Right Panel */}
                <div className="lg:col-span-2 space-y-6">
                    {!selectedAppt ? (
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center p-16 text-slate-400 text-center">
                            <ClipboardList size={40} className="text-slate-300 mb-4" />
                            <p className="font-semibold text-slate-500 text-lg">Select a patient</p>
                            <p className="text-sm mt-2">Choose a patient from the left to begin their assessment.</p>
                        </div>
                    ) : (
                        <>
                            {/* Patient Info */}
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                    <div className="flex items-start space-x-4">
                                        <div className="h-14 w-14 rounded-2xl bg-clinic-100 text-clinic-700 flex items-center justify-center font-black text-xl shrink-0">
                                            {selectedAppt.patient_name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-extrabold text-slate-800">{selectedAppt.patient_name}</h3>
                                            <p className="text-slate-500 text-sm mt-0.5">
                                                {selectedAppt.patient_kelamin} · {calcAge(selectedAppt.patient_dob)} tahun · NIK: {selectedAppt.patient_nik}
                                            </p>
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg font-medium">📞 {selectedAppt.patient_phone || '—'}</span>
                                                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg font-medium">Poli: {selectedAppt.poli || '—'}</span>
                                                <span className={`text-xs px-2 py-1 rounded-lg font-bold border capitalize ${STATUS_STYLES[selectedAppt.status_kunjungan] || ''}`}>
                                                    {selectedAppt.status_kunjungan}
                                                </span>
                                            </div>
                                            {selectedAppt.keluhan_awal && (
                                                <p className="text-sm text-slate-600 mt-3 bg-amber-50 border border-amber-200/50 rounded-xl px-3 py-2">
                                                    <span className="font-semibold text-amber-700">Keluhan: </span>{selectedAppt.keluhan_awal}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3 shrink-0">
                                        {selectedAppt.status_kunjungan === 'called' && (
                                            <button onClick={() => setConfirmAppt(selectedAppt)}
                                                className="flex items-center space-x-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-md shadow-purple-500/30">
                                                <Stethoscope size={16} />
                                                <span>Begin Assessment</span>
                                            </button>
                                        )}
                                        {selectedAppt.status_kunjungan === 'assessing' && (
                                            <button onClick={() => setCancelConfirmAppt(selectedAppt)}
                                                className="flex items-center space-x-2 px-4 py-2.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-xl text-sm font-semibold transition-colors">
                                                <X size={16} />
                                                <span>Cancel Assessment</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Latest Medical Record Reference */}
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                                    <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Latest Medical Record (Reference)</h2>
                                </div>
                                {!latestRecord ? (
                                    <div className="p-10 text-center text-slate-400 text-sm">
                                        <p className="font-medium text-slate-500">No previous records</p>
                                        <p className="text-xs mt-1">This is the patient's first visit.</p>
                                    </div>
                                ) : (
                                    <div className="p-6">
                                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-4">
                                            Visit: {new Date(latestRecord.visit_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} — Dr. {latestRecord.doctor_name}
                                        </p>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                                            {[
                                                { label: 'Tekanan Darah', value: latestRecord.tekanan_darah },
                                                { label: 'Suhu Tubuh', value: latestRecord.suhu_tubuh ? `${latestRecord.suhu_tubuh}°C` : null },
                                                { label: 'Berat Badan', value: latestRecord.berat_badan ? `${latestRecord.berat_badan} kg` : null },
                                            ].map(v => (
                                                <div key={v.label} className="bg-slate-50 rounded-xl p-3">
                                                    <p className="text-xs text-slate-500 font-medium">{v.label}</p>
                                                    <p className="text-sm font-bold text-slate-700 mt-0.5">{v.value || '—'}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                            {[
                                                { label: 'Diagnosa', value: latestRecord.diagnosa },
                                                { label: 'Rencana Terapi', value: latestRecord.rencana_terapi },
                                                { label: 'Resep Obat', value: latestRecord.resep_obat },
                                            ].filter(v => v.value).map(v => (
                                                <div key={v.label}>
                                                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">{v.label}</p>
                                                    <p className="text-slate-700 mt-0.5 font-medium">{v.value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* In-Line Medical Record Form (Full width below Queue & Medical Record cards) */}
            {selectedAppt && selectedAppt.status_kunjungan === 'assessing' && (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-slide-up">
                    <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-clinic-50/60 to-white flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-2xl bg-clinic-100 text-clinic-700 flex items-center justify-center font-bold">
                                <FileText size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-base">New Medical Record</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Recording assessment for <strong>{selectedAppt.patient_name}</strong> (NIK: {selectedAppt.patient_nik})</p>
                            </div>
                        </div>
                        <span className="px-3.5 py-1 bg-purple-50 text-purple-700 border border-purple-200/60 text-xs font-bold rounded-full">
                            Assessing in Progress
                        </span>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Vital Signs</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {[
                                    { label: 'Tekanan Darah', key: 'tekanan_darah', placeholder: 'e.g. 120/80 mmHg' },
                                    { label: 'Suhu Tubuh (°C)', key: 'suhu_tubuh', placeholder: 'e.g. 36.5', type: 'number', step: '0.1' },
                                    { label: 'Berat Badan (kg)', key: 'berat_badan', placeholder: 'e.g. 65', type: 'number', step: '0.1' },
                                ].map(f => (
                                    <div key={f.key} className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">{f.label}</label>
                                        <input
                                            type={f.type || 'text'}
                                            step={f.step}
                                            placeholder={f.placeholder}
                                            value={formData[f.key]}
                                            onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50/50 rounded-xl border border-slate-200 focus:border-clinic-400 focus:ring-4 focus:ring-clinic-400/10 focus:bg-white transition-all outline-none text-slate-700 font-medium"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Clinical Assessment</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Keluhan Awal</label>
                                    <textarea
                                        rows={2}
                                        placeholder="Patient's initial complaint..."
                                        value={formData.keluhan_awal}
                                        onChange={e => setFormData({ ...formData, keluhan_awal: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50/50 rounded-xl border border-slate-200 focus:border-clinic-400 focus:ring-4 focus:ring-clinic-400/10 focus:bg-white transition-all outline-none text-slate-700 font-medium resize-none"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Diagnosa</label>
                                    <textarea
                                        rows={2}
                                        placeholder="Doctor diagnosis..."
                                        value={formData.diagnosa}
                                        onChange={e => setFormData({ ...formData, diagnosa: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50/50 rounded-xl border border-slate-200 focus:border-clinic-400 focus:ring-4 focus:ring-clinic-400/10 focus:bg-white transition-all outline-none text-slate-700 font-medium resize-none"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Rencana Terapi</label>
                                    <textarea
                                        rows={2}
                                        placeholder="Treatment plan..."
                                        value={formData.rencana_terapi}
                                        onChange={e => setFormData({ ...formData, rencana_terapi: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50/50 rounded-xl border border-slate-200 focus:border-clinic-400 focus:ring-4 focus:ring-clinic-400/10 focus:bg-white transition-all outline-none text-slate-700 font-medium resize-none"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Tindakan Medis</label>
                                    <textarea
                                        rows={2}
                                        placeholder="Medical procedures performed..."
                                        value={formData.tindakan_medis}
                                        onChange={e => setFormData({ ...formData, tindakan_medis: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50/50 rounded-xl border border-slate-200 focus:border-clinic-400 focus:ring-4 focus:ring-clinic-400/10 focus:bg-white transition-all outline-none text-slate-700 font-medium resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Prescription Section with Dynamic Multi-item Inputs */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <span>Resep Obat</span>
                                    <span className="text-slate-400 font-normal normal-case text-xs tracking-normal">
                                        (Opsional — kosongkan jika tidak ada resep)
                                    </span>
                                </h4>
                                <button
                                    type="button"
                                    onClick={handleAddPrescription}
                                    className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow active:scale-95"
                                >
                                    <Plus size={14} className="stroke-[2.5]" />
                                    <span>Tambah Obat</span>
                                </button>
                            </div>

                            <div className="space-y-3">
                                {prescriptions.map((item, idx) => (
                                    <div key={idx} className="p-4 md:p-5 bg-amber-50/40 border border-amber-200/60 rounded-2xl space-y-3 transition-all hover:border-amber-300 animate-slide-up">
                                        <div className="flex items-center justify-between border-b border-amber-200/40 pb-2.5">
                                            <div className="flex items-center space-x-2">
                                                <span className="h-6 w-6 rounded-full bg-amber-200/80 text-amber-800 text-xs font-bold flex items-center justify-center">
                                                    {idx + 1}
                                                </span>
                                                <span className="text-xs font-bold text-amber-900">Obat #{idx + 1}</span>
                                            </div>
                                            {prescriptions.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemovePrescription(idx)}
                                                    className="flex items-center space-x-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors font-semibold"
                                                    title="Hapus obat ini"
                                                >
                                                    <Trash2 size={13} />
                                                    <span>Hapus</span>
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-amber-800 uppercase tracking-wider ml-1">
                                                    Nama Obat <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Paracetamol 500mg"
                                                    value={item.obat}
                                                    onChange={e => handlePrescriptionChange(idx, 'obat', e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-white rounded-xl border border-amber-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 focus:bg-white transition-all outline-none text-slate-700 font-medium text-sm"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-amber-800 uppercase tracking-wider ml-1">
                                                    Dosis
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. 3x1 tablet sehari"
                                                    value={item.dosis}
                                                    onChange={e => handlePrescriptionChange(idx, 'dosis', e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-white rounded-xl border border-amber-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 focus:bg-white transition-all outline-none text-slate-700 font-medium text-sm"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-amber-800 uppercase tracking-wider ml-1">
                                                    Instruksi / Aturan Pakai
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Sesudah makan, dihabiskan"
                                                    value={item.instruksi}
                                                    onChange={e => handlePrescriptionChange(idx, 'instruksi', e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-white rounded-xl border border-amber-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 focus:bg-white transition-all outline-none text-slate-700 font-medium text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-end pt-4 border-t border-slate-100">
                            <button
                                type="submit"
                                className="flex items-center space-x-2 px-8 py-3.5 font-bold text-white bg-gradient-to-r from-clinic-600 to-clinic-500 hover:from-clinic-700 hover:to-clinic-600 rounded-xl transition-all shadow-lg shadow-clinic-500/30 hover:shadow-clinic-500/50 hover:-translate-y-0.5"
                            >
                                <span>Save Medical Record & Complete Treatment</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Cancel Assessment Confirmation */}
            {cancelConfirmAppt && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl text-center">
                        <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
                            <X size={28} className="text-red-500" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Cancel Assessment?</h2>
                        <p className="text-slate-500 text-sm mb-8">
                            <strong>{cancelConfirmAppt.patient_name}</strong> will be moved back to <strong className="text-amber-600">Waiting</strong> status in the queue.
                        </p>
                        <div className="flex space-x-3">
                            <button onClick={() => setCancelConfirmAppt(null)} className="flex-1 px-4 py-3 font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">Keep</button>
                            <button onClick={() => handleCancelAssessment(cancelConfirmAppt)} className="flex-1 px-4 py-3 font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors">Cancel Assessment</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Begin Assessment Confirmation */}
            {confirmAppt && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl text-center">
                        <div className="h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-5">
                            <Stethoscope size={28} className="text-purple-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Begin Assessment?</h2>
                        <p className="text-slate-500 text-sm mb-8">
                            This will change <strong>{confirmAppt.patient_name}</strong>'s status to <strong className="text-purple-600">Assessing</strong>.
                        </p>
                        <div className="flex space-x-3">
                            <button onClick={() => setConfirmAppt(null)} className="flex-1 px-4 py-3 font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                            <button onClick={() => handleBeginAssessment(confirmAppt)} className="flex-1 px-4 py-3 font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors">Begin</button>
                        </div>
                    </div>
                </div>
            )}


        </div>
    );
};

export default AssessmentPage;
