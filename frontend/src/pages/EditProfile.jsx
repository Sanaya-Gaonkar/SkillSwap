import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Save, ArrowLeft, RefreshCw, Upload, ImagePlus } from 'lucide-react';

export default function EditProfile() {
  const { user, refreshUser, showToast } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [course, setCourse] = useState('');
  const [year, setYear] = useState('');
  const [institute, setInstitute] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [designation, setDesignation] = useState('');
  const [company, setCompany] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState('');
  const [availability, setAvailability] = useState('');
  const [learningMode, setLearningMode] = useState('');
  const [avatar, setAvatar] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      api.getProfile(user.id).then((res) => {
        const p = res.profile;
        setName(p.name || user.name || '');
        setCourse(p.course || '');
        setYear(p.year || '');
        setInstitute(p.institute || '');
        setExperienceYears(p.experience_years ?? '');
        setDesignation(p.designation || '');
        setCompany(p.company || '');
        setBio(p.bio || '');
        setInterests(p.interests || '');
        setAvailability(p.availability || '');
        setLearningMode(p.learning_mode || '');
        setAvatar(p.avatar || '');
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [user]);

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please choose an image file.', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('Profile photos must be 2 MB or smaller.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRandomizeAvatar = () => {
    const seed = Math.random().toString(36).substring(7);
    setAvatar(`https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Name cannot be empty.', 'error');
      return;
    }

    try {
      setSaving(true);
      await api.updateProfile(user.id, {
        name: name.trim(),
        avatar,
        course: course.trim(),
        year: year.trim(),
        institute: institute.trim(),
        experience_years: experienceYears === '' ? null : Number(experienceYears),
        designation: designation.trim(),
        company: company.trim(),
        bio: bio.trim(),
        interests: interests.trim(),
        availability: availability.trim(),
        learning_mode: learningMode.trim()
      });
      await refreshUser();
      showToast('Profile updated successfully!', 'success');
      navigate(`/profile/${user.id}`);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper container" style={{ paddingTop: '3rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--muted)' }}>Loading profile details...</p>
      </div>
    );
  }

  return (
    <div className="page-wrapper container" style={{ paddingTop: '1.75rem', maxWidth: '680px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <Link to={`/profile/${user?.id}`} className="btn btn-ghost btn-sm" style={{ padding: '0.4rem' }}>
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 style={{ fontSize: '24px' }}>Edit Profile</h1>
          <p style={{ color: 'var(--muted)', fontSize: '13px' }}>
            Update your profile photo, account details, availability, and learning preferences.
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        <form onSubmit={handleSubmit}>
          {/* Avatar Preview & Randomizer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.75rem' }}>
            <img
              src={avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${name || 'user'}`}
              alt="Avatar preview"
              style={{ width: '72px', height: '72px', borderRadius: '50%', border: '2px solid var(--primary)', backgroundColor: 'var(--light-bg)' }}
            />
            <div>
              <label className="form-label" style={{ marginBottom: '0.35rem' }}>Profile Photo</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer', gap: '0.35rem' }}>
                  <Upload size={14} /> Upload Photo
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                </label>
                <button
                type="button"
                onClick={handleRandomizeAvatar}
                className="btn btn-outline btn-sm"
                style={{ gap: '0.35rem' }}
              >
                <RefreshCw size={14} /> Use Avatar
                </button>
              </div>
            </div>
          </div>

          {/* Full Name */}
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {user?.role === 'Student' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Course</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. IT Engineering, Computer Science"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">College Year</label>
                  <select
                    className="form-select"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    required
                  >
                    <option value="">Select your year</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="Final Year">Final Year</option>
                    <option value="Postgraduate">Postgraduate</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Institute / College (optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Your institute or college"
                  value={institute}
                  onChange={(e) => setInstitute(e.target.value)}
                />
              </div>
            </>
          )}

          {user?.role === 'Teacher' && (
            <>
              <div className="form-group">
                <label className="form-label">Course I Teach</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Computer Science, Mathematics"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Years of Experience</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  step="1"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Institute (optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Your institute"
                  value={institute}
                  onChange={(e) => setInstitute(e.target.value)}
                />
              </div>
            </>
          )}

          {user?.role === 'Corporate Employee' && (
            <>
              <div className="form-group">
                <label className="form-label">Years of Experience</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  step="1"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Designation</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Product Designer"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Company (optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Your company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
            </>
          )}

          {user?.role === 'Other' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Course / Field (optional)</label>
                <input type="text" className="form-input" value={course} onChange={(e) => setCourse(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Year (optional)</label>
                <input type="text" className="form-input" value={year} onChange={(e) => setYear(e.target.value)} />
              </div>
            </div>
          )}

          {/* Bio (About Me) */}
          <div className="form-group">
            <label className="form-label">About Me (Bio)</label>
            <textarea
              className="form-textarea"
              placeholder="Tell other students about your interests, current projects, and what you enjoy learning..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
            />
          </div>

          {/* Interests */}
          <div className="form-group">
            <label className="form-label">Interests & Hobbies</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Web dev, robotics, typography, open source, reading"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
            />
          </div>

          {/* Availability */}
          <div className="form-group">
            <label className="form-label">Availability for Sessions</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Weekdays 6-8 PM, Weekends flexible"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
            />
          </div>

          {/* Learning Preference */}
          <div className="form-group">
            <label className="form-label">Learning Preference</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Screen sharing, project-based exercises, 1-on-1 walkthroughs"
              value={learningMode}
              onChange={(e) => setLearningMode(e.target.value)}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.75rem' }}>
            <Link to={`/profile/${user?.id}`} className="btn btn-outline">
              Cancel
            </Link>
            <button type="submit" disabled={saving} className="btn btn-primary" style={{ gap: '0.5rem' }}>
              <Save size={16} /> {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
