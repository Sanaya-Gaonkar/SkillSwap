import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import UserCard from '../components/UserCard';
import { Search, Compass, Users } from 'lucide-react';

export default function Discover() {
  const { user, showToast } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [students, setStudents] = useState([]);
  const [skillsCatalog, setSkillsCatalog] = useState([]);
  const [filterOptions, setFilterOptions] = useState({ courses: [], availability: [] });
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [appliedSearch, setAppliedSearch] = useState(searchParams.get('search') || '');
  const [selectedSkill, setSelectedSkill] = useState(searchParams.get('skill') || 'All');
  const [skillType, setSkillType] = useState(searchParams.get('skillType') || 'teach');
  const [selectedCourse, setSelectedCourse] = useState(searchParams.get('course') || 'All');
  const [selectedAvailability, setSelectedAvailability] = useState(searchParams.get('availability') || 'All');
  const [minimumRating, setMinimumRating] = useState(searchParams.get('minRating') || '');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [filterError, setFilterError] = useState('');

  // Load filter choices from existing profiles and the skills catalog.
  useEffect(() => {
    Promise.all([api.getSkills(), api.getUserFilterOptions()])
      .then(([skills, options]) => {
        setSkillsCatalog(skills.skills || []);
        setFilterOptions({
          courses: options.courses || [],
          availability: options.availability || []
        });
      })
      .catch((err) => {
        setFilterError(err.message || 'Could not load discovery filter options.');
      });
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const params = {};
      if (appliedSearch.trim()) params.search = appliedSearch.trim();
      if (selectedSkill !== 'All') params.skill = selectedSkill;
      if (selectedSkill !== 'All') params.skillType = skillType;
      if (selectedCourse !== 'All') params.course = selectedCourse;
      if (selectedAvailability !== 'All') params.availability = selectedAvailability;
      if (minimumRating) params.minRating = minimumRating;

      const data = await api.getUsers(params);
      setStudents(data.users || []);
    } catch (err) {
      console.error('Error fetching students:', err);
      setLoadError(err.message || 'Could not load students. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [appliedSearch, selectedSkill, skillType, selectedCourse, selectedAvailability, minimumRating]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const nextSearch = searchTerm.trim();
    setAppliedSearch(nextSearch);
    const params = new URLSearchParams();
    if (nextSearch) params.set('search', nextSearch);
    if (selectedSkill !== 'All') params.set('skill', selectedSkill);
    if (selectedSkill !== 'All') params.set('skillType', skillType);
    if (selectedCourse !== 'All') params.set('course', selectedCourse);
    if (selectedAvailability !== 'All') params.set('availability', selectedAvailability);
    if (minimumRating) params.set('minRating', minimumRating);
    setSearchParams(params);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setAppliedSearch('');
    setSelectedSkill('All');
    setSkillType('teach');
    setSelectedCourse('All');
    setSelectedAvailability('All');
    setMinimumRating('');
    setSearchParams({});
  };

  const handleConnect = async (targetUserId) => {
    try {
      await api.sendConnectionRequest(targetUserId);
      showToast('Connection request sent!', 'success');
      loadStudents();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="page-wrapper container" style={{ paddingTop: '1.75rem' }}>
      {/* Header (Section 19 & 41) */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '28px', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Compass size={28} color="var(--primary)" /> Discover Members
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '14px', marginTop: '0.25rem' }}>
          Search for a skill, explore peers who can teach it, and find learning partners.
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div className="card" style={{ marginBottom: '2rem', padding: '1.25rem' }}>
        <form onSubmit={handleSearchSubmit}>
          <div className="discover-filter-grid">
            {/* Search Input */}
            <label className="search-bar discover-search-field">
              <Search size={18} className="search-icon" />
              <input
                aria-label="Search students by name, skill, course, or bio"
                type="text"
                className="form-input"
                placeholder="Search for a skill, topic, or student name (e.g. Python, Figma, UI/UX)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </label>

            {/* Filter: Skill */}
            <label className="discover-filter-field">
              <span>Skill</span>
              <select
                aria-label="Filter by skill"
                className="form-select"
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
              >
                <option value="All">All Skills</option>
                {skillsCatalog.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name} ({s.category})
                  </option>
                ))}
              </select>
            </label>

            {selectedSkill !== 'All' && (
              <label className="discover-filter-field">
                <span>Skill direction</span>
                <select className="form-select" value={skillType} onChange={(e) => setSkillType(e.target.value)}>
                  <option value="teach">Can teach</option>
                  <option value="learn">Wants to learn</option>
                </select>
              </label>
            )}

            {/* Filter: Course */}
            <label className="discover-filter-field">
              <span>Course</span>
              <select
                aria-label="Filter by course"
                className="form-select"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
              >
                <option value="All">All Courses</option>
                {filterOptions.courses.map((course) => <option key={course} value={course}>{course}</option>)}
              </select>
            </label>

            <label className="discover-filter-field">
              <span>Availability</span>
              <select aria-label="Filter by availability" className="form-select" value={selectedAvailability} onChange={(e) => setSelectedAvailability(e.target.value)}>
                <option value="All">Any availability</option>
                {filterOptions.availability.map((availability) => <option key={availability} value={availability}>{availability}</option>)}
              </select>
            </label>

            <label className="discover-filter-field">
              <span>Minimum rating</span>
              <select aria-label="Filter by minimum rating" className="form-select" value={minimumRating} onChange={(e) => setMinimumRating(e.target.value)}>
                <option value="">Any rating</option>
                <option value="3">3+ stars</option>
                <option value="4">4+ stars</option>
                <option value="5">5 stars</option>
              </select>
            </label>

            <button type="submit" className="btn btn-primary discover-submit-button">
              Apply Filters
            </button>
          </div>
        </form>
        {filterError && <p className="discover-filter-error" role="status">{filterError}</p>}
      </div>

      {/* Results Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '20px' }}>
          Students ({students.length})
        </h2>
        {(searchTerm || selectedSkill !== 'All' || selectedCourse !== 'All' || selectedAvailability !== 'All' || minimumRating) && (
          <button
            onClick={handleClearFilters}
            className="btn btn-ghost btn-sm"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Students Card Grid */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--muted)' }}>Searching student profiles...</p>
        </div>
      ) : loadError ? (
        <div className="card empty-state" role="alert">
          <h3>Could not load students</h3>
          <p>{loadError}</p>
          <button type="button" className="btn btn-primary btn-sm" onClick={loadStudents}>Try again</button>
        </div>
      ) : students.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {students.map((student) => (
            <UserCard
              key={student.id}
              user={student}
              currentUserId={user?.id}
              onConnect={handleConnect}
            />
          ))}
        </div>
      ) : (
        <div className="card empty-state">
          <Users size={40} className="empty-state-icon" />
          <h3>No students found</h3>
          <p style={{ maxWidth: '380px', margin: '0.5rem auto' }}>
            Try removing a filter, selecting "All Skills", or searching a different skill or course.
          </p>
        </div>
      )}
    </div>
  );
}
