import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import SkillChip from '../components/SkillChip';
import { Sparkles, BookOpen, Plus, Save, Search, Check, Wand2 } from 'lucide-react';

export default function MySkills() {
  const { user, showToast } = useAuth();

  const [allSkills, setAllSkills] = useState([]);
  const [teachSkills, setTeachSkills] = useState([]);
  const [learnSkills, setLearnSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Add skill popover / search states
  const [showTeachSearch, setShowTeachSearch] = useState(false);
  const [showLearnSearch, setShowLearnSearch] = useState(false);
  const [teachSearchTerm, setTeachSearchTerm] = useState('');
  const [learnSearchTerm, setLearnSearchTerm] = useState('');
  const [customTeachName, setCustomTeachName] = useState('');
  const [customLearnName, setCustomLearnName] = useState('');
  const [customAdding, setCustomAdding] = useState(false);

  useEffect(() => {
    loadUserSkills();
  }, [user]);

  const loadUserSkills = async () => {
    try {
      setLoading(true);
      const [catalogRes, userSkillsRes] = await Promise.all([
        api.getSkills(),
        user?.id ? api.getUserSkills(user.id) : Promise.resolve({ teachSkills: [], learnSkills: [] })
      ]);

      setAllSkills(catalogRes.skills || []);

      // userSkillsRes has { teachSkills, learnSkills }
      setTeachSkills(
        userSkillsRes.teachSkills.map((us) => ({
          id: us.skill_id,
          name: us.name,
          category: us.category
        }))
      );

      setLearnSkills(
        userSkillsRes.learnSkills.map((us) => ({
          id: us.skill_id,
          name: us.name,
          category: us.category
        }))
      );
    } catch (err) {
      console.error('Error loading skills:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeachSkill = (skill) => {
    if (teachSkills.some((s) => s.id === skill.id)) return;
    setTeachSkills([...teachSkills, skill]);
    setTeachSearchTerm('');
    setShowTeachSearch(false);
  };

  const handleRemoveTeachSkill = (skillId) => {
    setTeachSkills(teachSkills.filter((s) => s.id !== skillId));
  };

  const handleAddLearnSkill = (skill) => {
    if (learnSkills.some((s) => s.id === skill.id)) return;
    setLearnSkills([...learnSkills, skill]);
    setLearnSearchTerm('');
    setShowLearnSearch(false);
  };

  const handleRemoveLearnSkill = (skillId) => {
    setLearnSkills(learnSkills.filter((s) => s.id !== skillId));
  };

  const handleAddCustomSkill = async (type) => {
    if (!user?.id) return;
    const name = (type === 'teach' ? customTeachName : customLearnName).trim();
    if (!name) {
      showToast('Enter a custom skill name first.', 'error');
      return;
    }
    try {
      setCustomAdding(true);
      const res = await api.addCustomUserSkill(user.id, { name, type, category: 'Other' });
      const skill = { id: res.skill.id, name: res.skill.name, category: res.skill.category };
      if (type === 'teach') {
        if (!teachSkills.some((s) => s.id === skill.id)) setTeachSkills((prev) => [...prev, skill]);
        setCustomTeachName('');
      } else {
        if (!learnSkills.some((s) => s.id === skill.id)) setLearnSkills((prev) => [...prev, skill]);
        setCustomLearnName('');
      }
      showToast(`Custom skill "${skill.name}" added.`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCustomAdding(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      setSaving(true);
      await api.batchSaveUserSkills(user.id, {
        teachSkillIds: teachSkills.map((s) => s.id),
        learnSkillIds: learnSkills.map((s) => s.id)
      });
      showToast('Skills saved successfully! Recommended matches have been updated.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Filter skills for search dropdowns
  const availableTeachSkills = allSkills
    .filter((s) => !teachSkills.some((ts) => ts.id === s.id))
    .filter((s) => s.name.toLowerCase().includes(teachSearchTerm.toLowerCase()));

  const availableLearnSkills = allSkills
    .filter((s) => !learnSkills.some((ls) => ls.id === s.id))
    .filter((s) => s.name.toLowerCase().includes(learnSearchTerm.toLowerCase()));

  return (
    <div className="page-wrapper container" style={{ paddingTop: '1.75rem', maxWidth: '800px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '28px' }}>My Skills</h1>
          <p style={{ color: 'var(--muted)', fontSize: '14px', marginTop: '0.25rem' }}>
            Specify what you can teach to others and what you want to learn in return.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="btn btn-primary btn-lg"
          style={{ gap: '0.5rem' }}
        >
          <Save size={18} /> {saving ? 'Saving...' : 'Save Skills'}
        </button>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--muted)' }}>Loading your skills...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Section 1: Skills I Can Teach (Section 17 & 42) */}
          <div className="card" style={{ borderLeft: '5px solid var(--secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--teal-chip-text)' }}>
                  <Sparkles size={20} /> Skills I Can Teach
                </h3>
                <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '2px' }}>
                  The topics and tools you feel comfortable explaining or demonstrating to peers.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowTeachSearch(!showTeachSearch)}
                className="btn btn-secondary btn-sm"
              >
                <Plus size={15} /> Add Skill
              </button>
            </div>

            {/* Add Skill Dropdown / Search Input */}
            {showTeachSearch && (
              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  border: '1px solid var(--border)',
                  marginBottom: '1.25rem'
                }}
              >
                <div className="search-bar" style={{ marginBottom: '0.75rem' }}>
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search catalog for a skill to teach (e.g. Python, SQL, Git)..."
                    value={teachSearchTerm}
                    onChange={(e) => setTeachSearchTerm(e.target.value)}
                    autoFocus
                  />
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                  {availableTeachSkills.length > 0 ? (
                    availableTeachSkills.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleAddTeachSkill(s)}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '12px' }}
                      >
                        + {s.name} <span style={{ opacity: 0.6, fontSize: '10px' }}>({s.category})</span>
                      </button>
                    ))
                  ) : (
                    <span className="text-small" style={{ color: 'var(--muted)' }}>No matching skills found in catalog.</span>
                  )}
                </div>

                <div className="custom-skill-row">
                  <input className="form-input" placeholder="Custom skill to teach..." value={customTeachName} onChange={(e) => setCustomTeachName(e.target.value)} />
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleAddCustomSkill('teach')} disabled={customAdding}>
                    <Wand2 size={14} /> Add Custom
                  </button>
                </div>
              </div>
            )}

            {/* Teaching Skill Chips List */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', minHeight: '44px', alignItems: 'center' }}>
              {teachSkills.length > 0 ? (
                teachSkills.map((s) => (
                  <SkillChip
                    key={s.id}
                    name={s.name}
                    type="teach"
                    onRemove={() => handleRemoveTeachSkill(s.id)}
                  />
                ))
              ) : (
                <p style={{ color: '#9CA3AF', fontSize: '13px' }}>
                  No teaching skills added yet. Click "+ Add Skill" to add skills you can share!
                </p>
              )}
            </div>
          </div>

          {/* Section 2: Skills I Want To Learn (Section 17 & 42) */}
          <div className="card" style={{ borderLeft: '5px solid #DA8465' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--coral-chip-text)' }}>
                  <BookOpen size={20} /> Skills I Want To Learn
                </h3>
                <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '2px' }}>
                  Skills you are eager to learn from other students.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowLearnSearch(!showLearnSearch)}
                className="btn btn-outline btn-sm"
                style={{ borderColor: '#DA8465', color: '#DA8465' }}
              >
                <Plus size={15} /> Add Skill
              </button>
            </div>

            {/* Add Skill Dropdown / Search Input */}
            {showLearnSearch && (
              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  border: '1px solid var(--border)',
                  marginBottom: '1.25rem'
                }}
              >
                <div className="search-bar" style={{ marginBottom: '0.75rem' }}>
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search catalog for a skill to learn (e.g. UI/UX, Figma, Excel)..."
                    value={learnSearchTerm}
                    onChange={(e) => setLearnSearchTerm(e.target.value)}
                    autoFocus
                  />
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                  {availableLearnSkills.length > 0 ? (
                    availableLearnSkills.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleAddLearnSkill(s)}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '12px' }}
                      >
                        + {s.name} <span style={{ opacity: 0.6, fontSize: '10px' }}>({s.category})</span>
                      </button>
                    ))
                  ) : (
                    <span className="text-small" style={{ color: 'var(--muted)' }}>No matching skills found in catalog.</span>
                  )}
                </div>

                <div className="custom-skill-row">
                  <input className="form-input" placeholder="Custom skill to learn..." value={customLearnName} onChange={(e) => setCustomLearnName(e.target.value)} />
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => handleAddCustomSkill('learn')} disabled={customAdding}>
                    <Wand2 size={14} /> Add Custom
                  </button>
                </div>
              </div>
            )}

            {/* Learning Skill Chips List */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', minHeight: '44px', alignItems: 'center' }}>
              {learnSkills.length > 0 ? (
                learnSkills.map((s) => (
                  <SkillChip
                    key={s.id}
                    name={s.name}
                    type="learn"
                    onRemove={() => handleRemoveLearnSkill(s.id)}
                  />
                ))
              ) : (
                <p style={{ color: '#9CA3AF', fontSize: '13px' }}>
                  No learning skills added yet. Click "+ Add Skill" to declare what you want to learn!
                </p>
              )}
            </div>
          </div>

          {/* Bottom Save Action */}
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn btn-primary btn-lg"
              style={{ minWidth: '220px' }}
            >
              <Save size={18} /> {saving ? 'Saving Changes...' : 'Save Skills'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
