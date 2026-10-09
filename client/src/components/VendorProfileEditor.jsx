import { useEffect, useState } from 'react';
import { getOwnVendorProfile, updateOwnVendorProfile } from '../services/vendorService';

const emptyProfile = {
  businessName: '',
  businessDescription: '',
  businessLocation: '',
  yearsOfExperience: '',
  profileImage: '',
  publicContact: '',
};

export default function VendorProfileEditor() {
  const [profile, setProfile] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getOwnVendorProfile()
      .then((result) => {
        if (active) {
          setProfile({
            ...emptyProfile,
            ...result,
            yearsOfExperience: result.yearsOfExperience ?? '',
          });
        }
      })
      .catch((apiError) => {
        if (active) setError(apiError.response?.data?.message || 'Business profile could not be loaded.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const change = (event) => setProfile((current) => ({ ...current, [event.target.name]: event.target.value }));

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await updateOwnVendorProfile({
        ...profile,
        yearsOfExperience: profile.yearsOfExperience === '' ? null : Number(profile.yearsOfExperience),
      });
      setProfile({ ...emptyProfile, ...response.data, yearsOfExperience: response.data.yearsOfExperience ?? '' });
      setMessage(response.message);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Business profile could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="dashboard-empty">Loading business profile…</p>;

  return (
    <form className="vendor-profile-edit-form" onSubmit={save}>
      {error && <div className="venue-alert error" role="alert">{error}</div>}
      {message && <div className="venue-alert success" role="status">{message}</div>}
      <label>Company name<input name="businessName" value={profile.businessName} onChange={change} maxLength="120" required /></label>
      <label>Business description<textarea name="businessDescription" value={profile.businessDescription} onChange={change} maxLength="2000" rows="3" /></label>
      <label>Business location<input name="businessLocation" value={profile.businessLocation} onChange={change} maxLength="160" placeholder="City, State" /></label>
      <label>Years of experience<input name="yearsOfExperience" type="number" min="0" max="100" step="1" value={profile.yearsOfExperience} onChange={change} /></label>
      <label>Profile image URL<input name="profileImage" type="url" value={profile.profileImage} onChange={change} maxLength="2048" /></label>
      <label>Public contact<input name="publicContact" value={profile.publicContact} onChange={change} maxLength="100" /></label>
      <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save business profile'}</button>
    </form>
  );
}
