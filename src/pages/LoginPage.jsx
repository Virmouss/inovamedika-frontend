import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { Stethoscope, Activity, HeartPulse } from 'lucide-react';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(username, password);
            navigate('/dashboard'); 
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-clinic-50 via-white to-clinic-100">
            {/* Abstract Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-clinic-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow"></div>
            <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-clinic-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>

            <div className="relative w-full max-w-md z-10 animate-slide-up">
                <div className="bg-white/80 backdrop-blur-xl p-10 rounded-[2rem] shadow-2xl border border-white/50">
                    <div className="flex flex-col items-center mb-10">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-clinic-400 rounded-full blur opacity-40 group-hover:opacity-70 transition-opacity duration-500"></div>
                            <div className="relative bg-gradient-to-tr from-clinic-600 to-clinic-400 p-4 rounded-full text-white mb-5 shadow-xl transform group-hover:scale-105 transition-transform duration-300">
                                <Stethoscope size={44} strokeWidth={1.5} />
                            </div>
                        </div>
                        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-clinic-800 to-clinic-500 tracking-tight mb-2">
                            InovaMedika
                        </h1>
                        <p className="text-slate-500 font-medium tracking-wide text-sm">CLINIC MANAGEMENT SYSTEM</p>
                    </div>

                    {error && (
                        <div className="bg-red-50/80 backdrop-blur-sm text-red-600 p-4 rounded-xl text-sm text-center mb-6 border border-red-200/50 animate-fade-in flex items-center justify-center space-x-2 shadow-sm">
                            <Activity size={16} className="animate-pulse" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-5 py-4 rounded-xl bg-slate-50/50 border border-slate-200 focus:border-clinic-400 focus:ring-4 focus:ring-clinic-400/10 focus:bg-white transition-all duration-300 outline-none text-slate-700 font-medium placeholder:font-normal placeholder-slate-400"
                                placeholder="Enter your username"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-5 py-4 rounded-xl bg-slate-50/50 border border-slate-200 focus:border-clinic-400 focus:ring-4 focus:ring-clinic-400/10 focus:bg-white transition-all duration-300 outline-none text-slate-700 font-medium placeholder:font-normal placeholder-slate-400"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full bg-gradient-to-r from-clinic-600 to-clinic-500 hover:from-clinic-700 hover:to-clinic-600 text-white font-semibold py-4 rounded-xl transition-all duration-300 shadow-lg shadow-clinic-500/30 hover:shadow-clinic-500/50 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                            <span className="relative flex items-center justify-center space-x-2">
                                {loading ? (
                                    <>
                                        <HeartPulse size={20} className="animate-pulse" />
                                        <span>Authenticating...</span>
                                    </>
                                ) : (
                                    <span>Access System</span>
                                )}
                            </span>
                        </button>
                    </form>
                </div>
                <div className="text-center mt-8 text-slate-400 text-sm font-medium">
                    &copy; 2026 InovaMedika Solutions
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
