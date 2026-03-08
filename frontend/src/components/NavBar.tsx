import { Link } from 'react-router-dom';

export default function NavBar() {
  return (
    <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc', display: 'flex', gap: '1rem' }}>
      <Link to="/">Search Skills</Link>
      <Link to="/register">Register Skill</Link>
    </nav>
  );
}
