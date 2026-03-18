import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TUCUMIND_LOGO_SRC } from '../constants/branding';
import {
    LayoutDashboard,
    Users,
    Receipt,
    ScanText,
    Settings,
    LogOut,
    X,
} from 'lucide-react';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const { logout, user } = useAuth();

    const navItems = [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/recibos', icon: Receipt, label: 'Recibos' },
        { to: '/clientes', icon: Users, label: 'Clientes' },
        { to: '/ocr', icon: ScanText, label: 'OCR Digitalización' },
        { to: '/config', icon: Settings, label: 'Configuración' },
    ];

    return (
        <>
            <div
                className={`fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
                onClick={onClose}
                aria-hidden="true"
            />
            <aside
                className={`fixed inset-y-0 left-0 z-50 flex h-full w-72 max-w-[calc(100vw-1rem)] flex-col border-r border-slate-200 bg-white shadow-xl transition-transform duration-200 md:static md:z-auto md:w-64 md:max-w-none md:translate-x-0 md:shadow-sm ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="flex h-24 items-center justify-between border-b border-slate-100 px-5 md:px-6">
                    <div className="flex min-w-0 flex-1 items-center overflow-hidden">
                        <div className="flex h-16 w-52 items-center overflow-hidden">
                            <img
                                src={TUCUMIND_LOGO_SRC}
                                alt="TUCUMIND"
                                className="h-full w-full origin-left scale-[2.85] object-contain object-left"
                            />
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 md:hidden"
                        aria-label="Cerrar menú"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto py-4">
                    <nav className="space-y-1 px-3">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    onClick={onClose}
                                    className={({ isActive }) =>
                                        `flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                        }`
                                    }
                                >
                                    <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                                    <span className="truncate">{item.label}</span>
                                </NavLink>
                            );
                        })}
                    </nav>
                </div>

                <div className="border-t border-slate-200 p-4">
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-900">
                                {user?.username}
                            </p>
                            <p className="truncate text-xs text-slate-500">Administrador</p>
                        </div>
                        <button
                            onClick={logout}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                            title="Cerrar sesión"
                        >
                            <LogOut className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
