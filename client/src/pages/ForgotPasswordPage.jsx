import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setMessage(response.data.message);
      setTimeout(() => {
        navigate(`/verify-email?email=${encodeURIComponent(email)}&purpose=reset`);
      }, 1200);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Could not send the reset code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-badge">Reset password</span>
          <h1>Forgot your password?</h1>
        </div>

        <p className="verify-email-copy">
          Enter your email and we will send a reset code to help you create a new password.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>Email</span>
            <input
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          {error && <p className="auth-message error">{error}</p>}
          {message && <p className="auth-message success">{message}</p>}

          <button type="submit" className="primary-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send reset code'}
          </button>
        </form>

        <p className="auth-footer">
          <Link to="/login">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
