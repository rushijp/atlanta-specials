import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input } from '../components/ui';
import { APP_NAME, APP_TAGLINE } from '../config/constants';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    setLoading(true);
    try {
      await register(email, password, name);
      navigate('/dashboard');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      const user = await loginWithGoogle();
      if (user) navigate('/dashboard');
    } catch (err) {
      console.error('Google sign-in error:', err.code, err.message);
      if (err.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized for Google sign-in. Add it in Firebase Console → Auth → Settings → Authorized domains.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        // User clicked button multiple times, ignore
      } else if (err.code === 'auth/internal-error') {
        setError('Google sign-in failed (internal error). Check that Google provider is enabled in Firebase Console.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Check your internet connection and try again.');
      } else {
        setError(`Google sign-in failed: ${err.code || err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 relative overflow-hidden">
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
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Create your account</h2>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
            />
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
              placeholder="At least 6 characters"
              required
            />
            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              required
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
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
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-wine-700 hover:text-wine-800">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
