import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function VendorRegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post('/auth/vendor/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        businessName: form.businessName,
        phone: form.phone,
      });

      navigate(`/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Vendor registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-badge vendor">Vendor</span>
          <h1>Create vendor account</h1>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>Name</span>
            <input name="name" type="text" value={form.name} onChange={handleChange} required />
          </label>

          <label>
            <span>Email</span>
            <input name="email" type="email" value={form.email} onChange={handleChange} required />
          </label>

          <label>
            <span>Password</span>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              minLength={6}
              required
            />
          </label>

          <label>
            <span>Confirm Password</span>
            <input
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              minLength={6}
              required
            />
          </label>

          <label>
            <span>Business Name</span>
            <input name="businessName" type="text" value={form.businessName} onChange={handleChange} required />
          </label>

          <label>
            <span>Phone</span>
            <input name="phone" type="tel" value={form.phone} onChange={handleChange} required />
          </label>

          {error && <p className="auth-message error">{error}</p>}

          <button type="submit" className="primary-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Registering...' : 'Register as vendor'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
