import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const purpose = searchParams.get('purpose') === 'reset' ? 'reset' : 'verify';
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (purpose === 'reset') {
      if (!password || password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const endpoint = purpose === 'reset' ? '/auth/reset-password' : '/auth/verify-email';
      const payload = purpose === 'reset'
        ? { email, otp, password }
        : { email, otp };

      const response = await api.post(endpoint, payload);
      setMessage(response.data.message);
      setTimeout(() => navigate('/login'), 1400);
    } catch (apiError) {
      setError(apiError.response?.data?.message || (purpose === 'reset' ? 'Reset failed.' : 'Verification failed.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setMessage('');

    try {
      const endpoint = purpose === 'reset' ? '/auth/forgot-password' : '/auth/resend-otp';
      const response = await api.post(endpoint, { email });
      setMessage(response.data.message);
    } catch (apiError) {
      setError(apiError.response?.data?.message || (purpose === 'reset' ? 'Could not resend reset code.' : 'Could not resend OTP.'));
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-badge">{purpose === 'reset' ? 'Reset password' : 'Verify email'}</span>
          <h1>{purpose === 'reset' ? 'Use your reset code' : 'Enter the 6-digit OTP'}</h1>
        </div>

        <p className="verify-email-copy">
          {purpose === 'reset'
            ? 'We sent a password reset code to:'
            : 'We sent a code to:'}{' '}
          <strong>{email || 'your email'}</strong>
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>OTP</span>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              required
            />
          </label>

          {purpose === 'reset' && (
            <>
              <label>
                <span>New password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 6 characters"
                  required
                />
              </label>

              <label>
                <span>Confirm password</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm your new password"
                  required
                />
              </label>
            </>
          )}

          {error && <p className="auth-message error">{error}</p>}
          {message && <p className="auth-message success">{message}</p>}

          <button type="submit" className="primary-btn" disabled={isSubmitting}>
            {isSubmitting ? (purpose === 'reset' ? 'Resetting...' : 'Verifying...') : (purpose === 'reset' ? 'Reset password' : 'Verify OTP')}
          </button>
        </form>

        <button type="button" className="secondary-btn" onClick={handleResendOtp}>
          {purpose === 'reset' ? 'Resend reset code' : 'Resend OTP'}
        </button>

        <p className="auth-footer">
          <Link to="/login">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
