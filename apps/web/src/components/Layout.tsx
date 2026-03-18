import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TUCUMIND_LOGO_SRC } from '../constants/branding';
import Sidebar from './Sidebar';

export default function Layout() {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        setIsSidebarOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        document.body.style.overflow = isSidebarOpen ? 'hidden' : '';

        return () => {
            document.body.style.overflow = '';
        };
    }, [isSidebarOpen]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 md:flex md:h-screen md:overflow-hidden">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <div className="flex min-h-screen min-w-0 flex-1 flex-col md:min-h-0">
                <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-sm md:hidden">
                    <button
                        type="button"
                        onClick={() => setIsSidebarOpen(true)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                        aria-label="Abrir menú"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    <div className="flex items-center">
                        <img
                            src={TUCUMIND_LOGO_SRC}
                            alt="TUCUMIND"
                            className="h-9 w-auto object-contain"
                        />
                    </div>
                    <div className="w-10" aria-hidden="true" />
                </header>
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 px-4 py-4 sm:px-6 md:px-6 md:py-6">
                    <div className="mx-auto max-w-7xl min-w-0">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
