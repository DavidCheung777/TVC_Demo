import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { Video } from 'lucide-react';

const Register: React.FC = () => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, company }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('auth.register.failed', 'Registration failed'));
      }

      if (data.token) {
        login(data.user, data.token);
        navigate('/dashboard');
      } else {
        // Handle email confirmation case if needed
        navigate('/login');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 w-full max-w-md mx-auto">
      <div className="flex flex-col items-center mb-8">
        <Video className="w-12 h-12 text-blue-600 mb-2" />
        <h2 className="text-3xl font-extrabold text-gray-900">{t('auth.register.title')}</h2>
        <p className="mt-2 text-sm text-gray-600">
          {t('auth.register.alreadyHaveAccount')} <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">{t('auth.register.orLogin')}</Link>
        </p>
      </div>

      <form className="w-full space-y-6 bg-white p-8 rounded-xl shadow-sm border border-gray-100" onSubmit={handleSubmit}>
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">{t('auth.register.name')}</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="company" className="block text-sm font-medium text-gray-700">{t('auth.register.company')}</label>
          <input
            id="company"
            name="company"
            type="text"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">{t('auth.register.email')}</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">{t('auth.register.password')}</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? t('auth.register.submitting') : t('auth.register.submit')}
        </button>
      </form>
    </div>
  );
};

export default Register;
