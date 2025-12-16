import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaUserNurse, FaMoneyBillWave, FaSyncAlt, FaMobileAlt } from 'react-icons/fa';
import API_BASE_URL from '../../config/api';

const Homepage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log(username, password);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/login`, { username, password });
      const userRole = response.data?.role;
      if (userRole === 'nurse') {
        navigate('/dashboard/nurse', { replace: true });
      } else if (userRole === 'biller') {
        navigate('/dashboard/biller', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError('Invalid username or password');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    setLoading(true);
    
    try {
      await axios.post(`${API_BASE_URL}/api/register`, { username, password });
      setSuccess('Registration successful! You can now login.');
      resetForm();
      setTimeout(() => {
        setIsLogin(true);
        setSuccess('');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: <FaUserNurse size={24} color="#1976d2" />, title: 'Nurse Portal', desc: 'Assign IV fluids to patients quickly' },
    { icon: <FaMoneyBillWave size={24} color="#2e7d32" />, title: 'Billing Dashboard', desc: 'Track revenue and patient charges' },
    { icon: <FaSyncAlt size={24} color="#f57c00" />, title: 'Real-time Updates', desc: 'Live sync between nurse and biller' },
    { icon: <FaMobileAlt size={24} color="#7b1fa2" />, title: 'Mobile Friendly', desc: 'Works on all devices' }
  ];

  const inputStyle = {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    boxSizing: 'border-box',
    backgroundColor: '#fafafa'
  };

  const labelStyle = { 
    display: 'block', 
    marginBottom: '8px', 
    fontWeight: '500',
    color: '#444',
    fontSize: '14px'
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 200px)' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '40px',
        alignItems: 'center',
        padding: '20px 0'
      }}>
        <div>
          <h2 style={{ 
            fontSize: 'clamp(28px, 5vw, 42px)', 
            color: '#1976d2',
            marginBottom: '15px',
            lineHeight: 1.2
          }}>
            Streamline Your IV Billing Process
          </h2>
          <p style={{ 
            fontSize: '16px', 
            color: '#666', 
            marginBottom: '30px',
            lineHeight: 1.6
          }}>
            A complete solution for healthcare facilities to manage IV fluid assignments 
            and billing. Nurses can quickly assign IV items to patients while billers 
            track charges in real-time.
          </p>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: '15px',
            marginBottom: '20px'
          }}>
            {features.map((feature, index) => (
              <div 
                key={index}
                style={{
                  padding: '15px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}
              >
                <div style={{ marginBottom: '8px' }}>{feature.icon}</div>
                <h4 style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#333' }}>{feature.title}</h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', marginBottom: '25px', borderRadius: '8px', overflow: 'hidden', border: '2px solid #e0e0e0' }}>
            <button
              onClick={() => { setIsLogin(true); resetForm(); }}
              style={{
                flex: 1,
                padding: '12px',
                fontSize: '14px',
                fontWeight: '600',
                backgroundColor: isLogin ? '#1976d2' : 'white',
                color: isLogin ? 'white' : '#666',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Login
            </button>
            <button
              onClick={() => { setIsLogin(false); resetForm(); }}
              style={{
                flex: 1,
                padding: '12px',
                fontSize: '14px',
                fontWeight: '600',
                backgroundColor: !isLogin ? '#1976d2' : 'white',
                color: !isLogin ? 'white' : '#666',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Register
            </button>
          </div>

          {error && (
            <div style={{
              padding: '12px',
              backgroundColor: '#ffebee',
              color: '#c62828',
              borderRadius: '6px',
              marginBottom: '20px',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              padding: '12px',
              backgroundColor: '#e8f5e9',
              color: '#2e7d32',
              borderRadius: '6px',
              marginBottom: '20px',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              {success}
            </div>
          )}
          
          {isLogin ? (
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Username</label>
                <input 
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  required 
                  placeholder="Enter your username"
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: '25px' }}>
                <label style={labelStyle}>Password</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  placeholder="Enter your password"
                  style={inputStyle}
                />
              </div>
              <button 
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '16px',
                  fontWeight: '600',
                  backgroundColor: loading ? '#90caf9' : '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div style={{ marginBottom: '15px' }}>
                <label style={labelStyle}>Username</label>
                <input 
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  required 
                  placeholder="Choose a username"
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={labelStyle}>Password</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  placeholder="Create a password"
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={labelStyle}>Confirm Password</label>
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required 
                  placeholder="Confirm your password"
                  style={inputStyle}
                />
              </div>
              <button 
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '16px',
                  fontWeight: '600',
                  backgroundColor: loading ? '#a5d6a7' : '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Registering...' : 'Create Account'}
              </button>
            </form>
          )}
          
          <p style={{ 
            textAlign: 'center', 
            marginTop: '20px', 
            fontSize: '13px', 
            color: '#888' 
          }}>
            {isLogin ? 'New user? Click Register above' : 'Already have an account? Click Login above'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Homepage;
