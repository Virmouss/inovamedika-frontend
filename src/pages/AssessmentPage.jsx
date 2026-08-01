import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import {
    Stethoscope, Activity, ChevronRight, User, RefreshCw,
    Plus, X, ClipboardList
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const STATUS_STYLES = {
    waiting: 'bg-amber-50 text-amber-700 border-amber-200/50',
    called: 'bg-blue-50 text-blue-700 border-blue-200/50',
    assessing: 'bg-purple-50 text-purple-700 border-purple-200/50',
    done: 'bg-emerald-50 text-emerald-700 border-emerald-200/50',
    cancelled: 'bg-red-50 text-red-700 border-red-200/50',
};

const emptyForm = {
    keluhan_awal: '', tekanan_darah: '', suhu_tubuh: '',
    berat_badan: '', diagnosa: '', rencana_terapi: '',
    tindakan_medis: '', resep_obat: '',
};

const AssessmentPage = () => {
    const { user } = useContext(AuthContext);
    const [todayPatients, setTodayPatients] = useState([]);
    const [loadingPatients, setLoadingPatients] = useState(true);
    const [selectedAppt, setSelectedAppt] = useState(null);
    const [latestRecord, setLatestRecord] = useState(null);
    const [confirmAppt, setConfirmAppt] = useState(null);      // Begin Assessment confirmation
    const [cancelConfirmAppt, setCancelConfirmAppt] = useState(null); // Cancel Assessment confirmation
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState({ ...emptyForm });

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
        if (selectedAppt) fetchLatestRecord(selectedAppt.patient_id);
        else setLatestRecord(null);
    }, [selectedAppt, fetchLatestRecord]);

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

    const openForm = () => {
        setFormData({ ...emptyForm, keluhan_awal: selectedAppt?.keluhan_awal || '' });
        setIsFormOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE}/medical-records`, {
                ...formData,
                patient_id: selectedAppt.patient_id,
                doctor_id: user.doctor_id,
                appointment_id: selectedAppt.id,
                visit_date: new Date().toISOString(),
            });
            setIsFormOpen(false);
            setSelectedAppt(null);
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
                                            <>
                                                <button onClick={() => setCancelConfirmAppt(selectedAppt)}
                                                    className="flex items-center space-x-2 px-4 py-2.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-xl text-sm font-semibold transition-colors">
                                                    <X size={16} />
                                                    <span>Cancel Assessment</span>
                                                </button>
                                                <button onClick={openForm}
                                                    className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-clinic-600 to-clinic-500 hover:from-clinic-700 hover:to-clinic-600 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-clinic-500/30">
                                                    <Plus size={16} />
                                                    <span>Write Medical Record</span>
                                                </button>
                                            </>
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

            {/* Write Medical Record Form */}
            {isFormOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-8 pb-0">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">New Medical Record</h2>
                                <p className="text-slate-500 text-sm mt-1">Patient: <strong>{selectedAppt?.patient_name}</strong></p>
                            </div>
                            <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Vitals</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {[
                                        { label: 'Tekanan Darah', key: 'tekanan_darah', placeholder: 'e.g. 120/80' },
                                        { label: 'Suhu Tubuh (°C)', key: 'suhu_tubuh', placeholder: 'e.g. 36.5', type: 'number', step: '0.1' },
                                        { label: 'Berat Badan (kg)', key: 'berat_badan', placeholder: 'e.g. 65', type: 'number', step: '0.1' },
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
                                        { label: 'Keluhan Awal', key: 'keluhan_awal', placeholder: "Patient's initial complaint..." },
                                        { label: 'Diagnosa', key: 'diagnosa', placeholder: 'Diagnosis...' },
                                        { label: 'Rencana Terapi', key: 'rencana_terapi', placeholder: 'Treatment plan...' },
                                        { label: 'Tindakan Medis', key: 'tindakan_medis', placeholder: 'Medical procedures...' },
                                        { label: 'Resep Obat', key: 'resep_obat', placeholder: 'Prescription details...' },
                                    ].map(f => (
                                        <div key={f.key} className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">{f.label}</label>
                                            <textarea rows="2" placeholder={f.placeholder} value={formData[f.key]}
                                                onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-50/50 rounded-xl border border-slate-200 focus:border-clinic-400 focus:ring-4 focus:ring-clinic-400/10 focus:bg-white transition-all outline-none text-slate-700 font-medium resize-none" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setIsFormOpen(false)} className="px-6 py-3 font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">Cancel</button>
                                <button type="submit" className="px-6 py-3 font-semibold text-white bg-gradient-to-r from-clinic-600 to-clinic-500 rounded-xl hover:from-clinic-700 hover:to-clinic-600 shadow-md shadow-clinic-500/30">
                                    Save Record & Mark Done
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssessmentPage;
