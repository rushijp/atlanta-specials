import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input } from '../components/ui';
import { APP_NAME, APP_TAGLINE } from '../config/constants';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.code === 'auth/invalid-credential' ? 'Invalid email or password' : err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    try {
      const user = await loginWithGoogle();
      if (user) navigate('/dashboard');
      // If null, redirect flow is in progress
    } catch (err) {
      if (err.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized for Google sign-in. Please contact support.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        // User clicked button multiple times, ignore
      } else {
        setError('Google sign-in failed. Please try again or use email.');
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 relative overflow-hidden">
      {/* Warm radial background */}
      <div className="absolute inset-0 bg-gradient-to-br from-wine-50 via-ivory-100 to-phera-50/30"></div>
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-wine-100/50 blur-3xl"></div>
      <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-phera-100/40 blur-3xl"></div>
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-wine-700 text-white font-bold text-xl mb-4">
            P
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{APP_NAME}</h1>
          <p className="text-sm text-gray-500 mt-1">{APP_TAGLINE}</p>
        </div>

        <div className="rounded-2xl bg-white/90 backdrop-blur-sm p-8 shadow-lifted border border-white/60">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Welcome back</h2>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <div className="flex items-center justify-between">
              <Link to="/forgot-password" className="text-sm text-wine-700 hover:text-wine-800">
                Forgot password?
              </Link>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">or</span>
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={handleGoogle}>
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" className="h-5 w-5" />
            Continue with Google
          </Button>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-wine-700 hover:text-wine-800">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
