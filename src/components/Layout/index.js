import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaSyringe, FaSignOutAlt } from 'react-icons/fa';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHomepage = location.pathname === '/';

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: '#f5f5f5'
    }}>
      <header style={{
        backgroundColor: '#1976d2',
        color: 'white',
        padding: '15px 20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <h1 
            onClick={() => navigate('/')}
            style={{ 
              margin: 0, 
              fontSize: 'clamp(18px, 4vw, 24px)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <FaSyringe style={{ fontSize: '1.1em' }} />
            IV Billing System
          </h1>
          {!isHomepage && (
            <nav style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => navigate('/')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <FaSignOutAlt />
                Logout
              </button>
            </nav>
          )}
        </div>
      </header>

      <main style={{ 
        flex: 1,
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto',
        padding: '20px',
        boxSizing: 'border-box'
      }}>
        {children}
      </main>

      <footer style={{
        backgroundColor: '#263238',
        color: '#b0bec5',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}>
            IV Billing System © {new Date().getFullYear()}
          </p>
          <p style={{ margin: 0, fontSize: '12px', color: '#78909c' }}>
            Developed by <strong style={{ color: '#90caf9' }}>Faizullah Sayyed</strong>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
