import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchSkills, Skill } from '../api';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [skills, setSkills] = useState<Skill[]>([]);

  useEffect(() => {
    fetchSkills(query || undefined).then(setSkills);
  }, [query]);

  return (
    <main style={{ padding: '1rem' }}>
      <h1>Skill Registry</h1>
      <input
        placeholder="Search skills..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
      />
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {skills.map((skill) => (
          <li key={skill.id} style={{ marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
            <Link to={`/skills/${skill.id}`}><strong>{skill.name}</strong></Link>
            <p style={{ margin: '0.25rem 0 0' }}>{skill.description}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
