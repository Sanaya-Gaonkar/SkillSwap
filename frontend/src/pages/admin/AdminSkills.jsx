import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import SkillChip from '../../components/SkillChip';
import { Sparkles, Plus, Edit2, Trash2, ArrowLeft, X, Save } from 'lucide-react';

export default function AdminSkills() {
  const { showToast } = useAuth();
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modal / Form state for Add/Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Programming');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadSkills = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminSkills();
      setSkills(res.skills || []);
    } catch (err) {
      console.error('Error fetching admin skills:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSkills();
  }, []);

  const openAddModal = () => {
    setEditingSkill(null);
    setName('');
    setCategory('Programming');
    setDescription('');
    setModalOpen(true);
  };

  const openEditModal = (skill) => {
    setEditingSkill(skill);
    setName(skill.name);
    setCategory(skill.category);
    setDescription(skill.description || '');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Skill name is required.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      if (editingSkill) {
        await api.updateSkill(editingSkill.id, {
          name: name.trim(),
          category,
          description: description.trim()
        });
        showToast('Skill updated successfully!', 'success');
      } else {
        await api.createSkill({
          name: name.trim(),
          category,
          description: description.trim()
        });
        showToast('New skill added to catalog!', 'success');
      }
      setModalOpen(false);
      loadSkills();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (skillId, skillName) => {
    if (!window.confirm(`Are you sure you want to delete "${skillName}" from the skill database?`)) {
      return;
    }

    try {
      await api.deleteSkill(skillId);
      showToast(`Skill "${skillName}" deleted successfully.`, 'info');
      loadSkills();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const filteredSkills = skills.filter((s) => {
    if (selectedCategory === 'All') return true;
    return s.category === selectedCategory;
  });

  return (
    <div className="page-wrapper container" style={{ paddingTop: '1.75rem', maxWidth: '1000px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link to="/admin" className="btn btn-ghost btn-sm" style={{ padding: '0.4rem' }}>
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 style={{ fontSize: '24px' }}>Skill Catalog Management</h1>
            <p style={{ color: 'var(--muted)', fontSize: '13px' }}>
              Manage master database of skills across Programming, Web, Design, and Business.
            </p>
          </div>
        </div>

        <button onClick={openAddModal} className="btn btn-primary btn-sm">
          <Plus size={16} /> Add New Skill
        </button>
      </div>

      {/* Category Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {['All', 'Programming', 'Web', 'Design', 'Business', 'Other'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-outline'}`}
          >
            {cat} ({cat === 'All' ? skills.length : skills.filter((s) => s.category === cat).length})
          </button>
        ))}
      </div>

      {/* Skills Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
            Loading skills catalog...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid var(--border)', color: 'var(--muted)', fontWeight: 600 }}>
                  <th style={{ padding: '0.85rem 1rem' }}>Skill Name</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Category</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Description</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Teachers</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Learners</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSkills.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--dark)' }}>
                      {s.name}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <SkillChip name={s.category} type="neutral" size="sm" />
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--muted)', maxWidth: '280px' }}>
                      {s.description || '—'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--teal-chip-text)', fontWeight: 600 }}>
                      {s.teachers_count || 0}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--coral-chip-text)', fontWeight: 600 }}>
                      {s.learners_count || 0}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          onClick={() => openEditModal(s)}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '0.3rem' }}
                          title="Edit skill"
                        >
                          <Edit2 size={14} color="var(--primary)" />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id, s.name)}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '0.3rem' }}
                          title="Delete skill"
                        >
                          <Trash2 size={14} color="#EF4444" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Skill Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '18px' }}>
                {editingSkill ? `Edit Skill: ${editingSkill.name}` : 'Add New Skill'}
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Skill Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Flutter, Blender, Data Analytics"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Programming">Programming</option>
                  <option value="Web">Web</option>
                  <option value="Design">Design</option>
                  <option value="Business">Business</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <textarea
                  className="form-textarea"
                  placeholder="Brief description of the skill and expected student outcomes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-outline btn-sm">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary btn-sm">
                  <Save size={14} /> {submitting ? 'Saving...' : 'Save Skill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
