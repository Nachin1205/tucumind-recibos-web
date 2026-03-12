import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import { Dashboard, Clients, Receipts, Digitization } from './pages';
import Login from './pages/Login';

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route path="/" element={<Layout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="clientes" element={<Clients />} />
                        <Route path="recibos" element={<Receipts />} />
                        <Route path="ocr" element={<Digitization />} />
                        <Route path="config" element={<div className="p-8 text-center text-slate-500">Configuración del sistema próximamente...</div>} />
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
