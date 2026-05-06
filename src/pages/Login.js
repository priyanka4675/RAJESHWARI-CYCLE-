import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await signIn(email, password);
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: '4rem', marginBottom: 12 }}>🚲</div>
          <h1 style={{
            fontFamily: "'Baloo 2', cursive",
            color: '#ffd166',
            fontSize: '2rem',
            fontWeight: 800,
            lineHeight: 1.2
          }}>Rajeshwari Cycles</h1>
          <p style={{ color: 'rgba(200,200,220,0.6)', fontSize: '0.85rem', marginTop: 4 }}>
            Ramachandrapuram — Management System
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20,
          padding: 36
        }}>
          <h2 style={{
            fontFamily: "'Baloo 2', cursive",
            color: '#fff',
            fontSize: '1.4rem',
            marginBottom: 24
          }}>Admin Login</h2>

          {error && (
            <div className="alert alert-danger" style={{ marginBottom: 20 }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label style={{ color: 'rgba(200,200,220,0.7)' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="admin@rajeshwaricycles.com"
                style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)', color: '#fff' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
              <label style={{ color: 'rgba(200,200,220,0.7)' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)', color: '#fff' }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={loading}
            >
              {loading ? '⏳ Signing in...' : '🔐 Sign In'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: 'rgba(200,200,220,0.4)', fontSize: '0.75rem', marginTop: 20 }}>
          Rajeshwari Cycles © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
