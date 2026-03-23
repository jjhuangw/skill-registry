import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import SearchPage from './pages/SearchPage';
import RegisterPage from './pages/RegisterPage';
import SkillDetailPage from './pages/SkillDetailPage';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/skills/:id" element={<SkillDetailPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
