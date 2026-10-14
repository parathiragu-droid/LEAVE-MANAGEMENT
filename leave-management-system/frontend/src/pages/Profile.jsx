import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { profileService } from '../services/profileService';
import { getFriendlyErrorMessage } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import './Profile.css';

export const Profile = () => {
  const { user, updateUser } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await profileService.getProfile();
        if (isMounted) {
          setProfileData(data);
          setName(data.name || '');
        }
      } catch (err) {
        if (isMounted) {
          showError(getFriendlyErrorMessage(err, 'Failed to load profile.'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [showError]);

  const handleNameChange = (e) => {
    setName(e.target.value);
    if (nameError) {
      setNameError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('Name cannot be blank.');
      return;
    }
    if (trimmed.length < 2) {
      setNameError('Name must be at least 2 characters.');
      return;
    }
    if (trimmed.length > 50) {
      setNameError('Name cannot exceed 50 characters.');
      return;
    }

    try {
      setSaving(true);
      const updated = await profileService.updateProfile({ name: trimmed });
      setProfileData(updated);
      setName(updated.name);
      updateUser({ name: updated.name });
      showSuccess('Profile updated successfully.');
    } catch (err) {
      showError(getFriendlyErrorMessage(err, 'Failed to update profile.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <LoadingSpinner size="lg" text="Loading your profile..." />
      </div>
    );
  }

  return (
    <div className="page-container profile-page">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar" aria-hidden="true">
            {profileData?.name ? profileData.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h1 className="profile-title">Account Profile</h1>
            <p className="profile-subtitle">Manage your personal account details</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="profile-form" noValidate>
          {/* Full Name (Editable) */}
          <div className="form-group">
            <label htmlFor="profile-name" className="form-label">
              Full Name <span className="required-star">*</span>
            </label>
            <input
              type="text"
              id="profile-name"
              className={`form-input ${nameError ? 'input-error' : ''}`}
              value={name}
              onChange={handleNameChange}
              disabled={saving}
              placeholder="Your full name"
              required
              minLength={2}
              maxLength={50}
            />
            {nameError && (
              <span className="field-error" role="alert">
                {nameError}
              </span>
            )}
          </div>

          {/* Email Address (Read-only) */}
          <div className="form-group">
            <div className="label-with-badge">
              <label htmlFor="profile-email" className="form-label">
                Email Address
              </label>
              <span className="read-only-badge" title="Email changes require administrative verification">
                Read-only
              </span>
            </div>
            <input
              type="email"
              id="profile-email"
              className="form-input form-input-readonly"
              value={profileData?.email || ''}
              readOnly
              disabled
              aria-describedby="email-readonly-hint"
            />
            <small id="email-readonly-hint" className="field-hint">
              Email is your unique login identity and cannot be altered directly.
            </small>
          </div>

          {/* System Role (Read-only) */}
          <div className="form-group">
            <div className="label-with-badge">
              <label htmlFor="profile-role" className="form-label">
                System Role
              </label>
              <span className="read-only-badge">Managed by System</span>
            </div>
            <div className="role-display-box" id="profile-role">
              <span
                className={`badge ${profileData?.role === 'ADMIN' ? 'badge-admin' : 'badge-employee'}`}
              >
                {profileData?.role}
              </span>
              <span className="role-description">
                {profileData?.role === 'ADMIN'
                  ? 'Administrator privileges with leave review capabilities'
                  : 'Standard employee with leave application and tracking access'}
              </span>
            </div>
          </div>

          <div className="profile-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || (name.trim() === profileData?.name && !nameError)}
              id="profile-save-btn"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
