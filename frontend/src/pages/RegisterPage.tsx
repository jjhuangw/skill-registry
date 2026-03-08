import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerSkill } from '../api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await registerSkill({ name, description, content });
    navigate('/');
  }

  return (
    <main style={{ padding: '1rem', maxWidth: '600px' }}>
      <h1>Register a Skill</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="name">Name</label><br />
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} required style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="description">Description</label><br />
          <input id="description" value={description} onChange={(e) => setDescription(e.target.value)} required style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="content">Content (Markdown)</label><br />
          <textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} required rows={10} style={{ width: '100%' }} />
        </div>
        <button type="submit">Submit</button>
      </form>
    </main>
  );
}
