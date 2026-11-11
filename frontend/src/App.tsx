import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Layout from './components/Layout'

// Páginas públicas
import Login from './pages/Login'
import NotFound from './pages/NotFound'

// Páginas protegidas
import Inicio from './pages/Inicio'
import MeuPerfil from './pages/MeuPerfil'
import Usuarios from './pages/Usuarios'
import UsuarioForm from './pages/UsuarioForm'
import UsuarioSenha from './pages/UsuarioSenha'
import Estufas from './pages/Estufas'
import EstufaForm from './pages/EstufaForm'

function App() {
    return (
        <Routes>
            {/* Rotas públicas */}
            <Route path="/login" element={<Login />} />

            {/* Rotas protegidas: todos os usuários autenticados */}
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Inicio />} />
                <Route path="perfil" element={<MeuPerfil />} />

                {/* Estufas — leitura para todos, cadastro e edição para o administrador */}
                <Route path="estufas"            element={<Estufas />} />
                <Route path="estufas/nova"       element={<AdminRoute><EstufaForm /></AdminRoute>} />
                <Route path="estufas/:id/editar" element={<AdminRoute><EstufaForm /></AdminRoute>} />

                {/* Usuários — Administrador */}
                <Route path="usuarios"            element={<AdminRoute><Usuarios /></AdminRoute>} />
                <Route path="usuarios/novo"       element={<AdminRoute><UsuarioForm /></AdminRoute>} />
                <Route path="usuarios/:id/editar" element={<AdminRoute><UsuarioForm /></AdminRoute>} />
                <Route path="usuarios/:id/senha"  element={<AdminRoute><UsuarioSenha /></AdminRoute>} />

                <Route path="*" element={<NotFound />} />
            </Route>
        </Routes>
    )
}

export default App
