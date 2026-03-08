import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { fetchSkill } from '../api';
import type { Skill } from '../api';

export default function SkillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [skill, setSkill] = useState<Skill | null>(null);

  useEffect(() => {
    if (id) fetchSkill(id).then(setSkill);
  }, [id]);

  if (!skill) return <p style={{ padding: '1rem' }}>Loading...</p>;

  return (
    <main style={{ padding: '1rem', maxWidth: '800px' }}>
      <h1>{skill.name}</h1>
      <p><em>{skill.description}</em></p>
      <hr />
      <ReactMarkdown>{skill.content}</ReactMarkdown>
    </main>
  );
}
