import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';

export default function Layout() {
    const { isAuthenticated, isLoading } = useAuth();

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
        <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-6">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
