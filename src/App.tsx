import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProjectDetail from './pages/ProjectDetail';
import CreateScript from './pages/CreateScript';
import CreateStoryboard from './pages/CreateStoryboard';
import CreateVideo from './pages/CreateVideo';
import Works from './pages/Works';
import Profile from './pages/Profile';
import AdminRoute from './components/AdminRoute';
import AdminLayout from './pages/admin/AdminLayout';
import UserManagement from './pages/admin/UserManagement';
import ModelManagement from './pages/admin/ModelManagement';
import ProviderManagement from './pages/admin/ProviderManagement';
import Analytics from './pages/admin/Analytics';
import AdminLogin from './pages/admin/AdminLogin';
import ProjectManagement from './pages/admin/ProjectManagement';
import PromptManagement from './pages/admin/PromptManagement';
import { useAuthStore } from './store/authStore';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user } = useAuthStore();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          
          <Route path="dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="project/:id" element={
            <ProtectedRoute>
              <ProjectDetail />
            </ProtectedRoute>
          } />
          
          <Route path="project/:id/script" element={
            <ProtectedRoute>
              <CreateScript />
            </ProtectedRoute>
          } />
          
          <Route path="project/:id/storyboard" element={
            <ProtectedRoute>
              <CreateStoryboard />
            </ProtectedRoute>
          } />
          
          <Route path="project/:id/video" element={
            <ProtectedRoute>
              <CreateVideo />
            </ProtectedRoute>
          } />
          
          <Route path="works" element={
            <ProtectedRoute>
              <Works />
            </ProtectedRoute>
          } />
          
          <Route path="profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="users" replace />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="models" element={<ModelManagement />} />
            <Route path="providers" element={<ProviderManagement />} />
            <Route path="projects" element={<ProjectManagement />} />
            <Route path="prompts" element={<PromptManagement />} />
            <Route path="analytics" element={<Analytics />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
