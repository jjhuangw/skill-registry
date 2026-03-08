import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { fetchSkill, deleteSkill } from '../api';
import type { Skill } from '../api';

export default function SkillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [skill, setSkill] = useState<Skill | null>(null);

  useEffect(() => {
    if (id) fetchSkill(id).then(setSkill);
  }, [id]);

  if (!skill) return <p style={{ padding: '1rem' }}>Loading...</p>;

  async function handleDelete() {
    if (!window.confirm('Delete this skill?')) return;
    try {
      await deleteSkill(skill!.id);
      navigate('/');
    } catch {
      alert('Failed to delete skill. Please try again.');
    }
  }

  return (
    <main style={{ padding: '1rem', maxWidth: '800px' }}>
      <h1>{skill.name}</h1>
      <p><em>{skill.description}</em></p>
      <hr />
      <ReactMarkdown>{skill.content}</ReactMarkdown>
      <button onClick={handleDelete} style={{ marginTop: '1rem' }}>
        Delete
      </button>
    </main>
  );
}
