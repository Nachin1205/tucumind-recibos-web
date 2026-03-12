import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, User } from 'lucide-react';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login({ username, password });
            window.location.href = '/';
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center">
                    <h1 className="text-3xl font-bold text-white mb-2">TUCUMIND</h1>
                    <p className="text-blue-100">Gestión de Recibos Digitales</p>
                </div>

                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
                                {error}
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700">Usuario</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="admin"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700">Contraseña</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors duration-200"
                        >
                            {loading ? 'Iniciando...' : 'Iniciar Sesión'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
