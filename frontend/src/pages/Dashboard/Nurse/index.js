import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUserNurse, FaUserPlus, FaHistory } from 'react-icons/fa';
import API_BASE_URL from '../../../config/api';

const NurseDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [ivItems, setIvItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignModal, setAssignModal] = useState({ open: false, patient: null });
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState('');
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientDate, setNewPatientDate] = useState('');
  const [historyModal, setHistoryModal] = useState({ open: false, patient: null, history: null });
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchData = async () => {
    try {
      const [patientsRes, ivItemsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/patients`),
        axios.get(`${API_BASE_URL}/api/iv-items`)
      ]);
      setPatients(patientsRes.data);
      setIvItems(ivItemsRes.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssign = (patient) => {
    setAssignModal({ open: true, patient });
    setSelectedItem('');
    setQuantity('');
  };

  const handleViewHistory = async (patient) => {
    setLoadingHistory(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/nurse/patient/${patient.id}/iv-history`);
      setHistoryModal({ open: true, patient, history: response.data });
    } catch (err) {
      console.error(err);
      alert('Failed to load IV history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const closeHistoryModal = () => {
    setHistoryModal({ open: false, patient: null, history: null });
  };

  const handleSubmitAssignment = async () => {
    if (!selectedItem) return;
    const qty = parseInt(quantity) || 1;
    if (qty < 1) {
      alert('Quantity must be at least 1');
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/api/patient-iv-assignments`, {
        patient_id: assignModal.patient.id,
        iv_item_id: parseInt(selectedItem),
        quantity: qty
      });
      setAssignModal({ open: false, patient: null });
      alert('IV item assigned successfully!');
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to assign IV item');
    }
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    if (!newPatientName || !newPatientDate) {
      alert('Please fill in all fields');
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/api/patients`, {
        name: newPatientName,
        admission_date: newPatientDate
      });
      setNewPatientName('');
      setNewPatientDate('');
      setShowAddPatient(false);
      fetchData();
      alert('Patient added successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to add patient');
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading patients...</div>;
  if (error) return <div style={{ padding: '40px', textAlign: 'center', color: '#c62828' }}>{error}</div>;

  return (
    <div>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
          <FaUserNurse size={32} color="#1976d2" />
          <div>
            <h1 style={{ fontSize: 'clamp(20px, 5vw, 26px)', margin: 0, color: '#333' }}>Nurse Dashboard</h1>
            <p style={{ color: '#666', margin: '5px 0 0 0', fontSize: '14px' }}>Manage patient IV assignments</p>
          </div>
        </div>
      </div>

      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
          <h2 style={{ fontSize: '18px', margin: 0, color: '#444' }}>Patient List</h2>
          <button
            onClick={() => setShowAddPatient(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FaUserPlus /> Add Patient
          </button>
        </div>
        
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
            <thead>
              <tr style={{ backgroundColor: '#e3f2fd' }}>
                <th style={{ padding: '12px 10px', border: '1px solid #e0e0e0', textAlign: 'left', color: '#1976d2' }}>Name</th>
                <th style={{ padding: '12px 10px', border: '1px solid #e0e0e0', textAlign: 'left', color: '#1976d2' }}>Last IV Assigned</th>
                <th style={{ padding: '12px 10px', border: '1px solid #e0e0e0', textAlign: 'center', color: '#1976d2' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient, index) => (
                <tr key={patient.id} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: '12px 10px', border: '1px solid #e0e0e0', fontWeight: '500' }}>{patient.name}</td>
                  <td style={{ padding: '12px 10px', border: '1px solid #e0e0e0', color: patient.last_iv_assigned ? '#333' : '#999' }}>
                    {patient.last_iv_assigned 
                      ? new Date(patient.last_iv_assigned).toLocaleString()
                      : 'Not assigned yet'}
                  </td>
                  <td style={{ padding: '12px 10px', border: '1px solid #e0e0e0', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button 
                        onClick={() => handleViewHistory(patient)}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#9c27b0',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <FaHistory size={12} /> History
                      </button>
                      <button 
                        onClick={() => handleAssign(patient)}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#1976d2',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500'
                        }}
                      >
                        Assign IV
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddPatient && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '15px',
          boxSizing: 'border-box',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '25px',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '380px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>Add New Patient</h3>
            <form onSubmit={handleAddPatient}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#444' }}>Patient Name:</label>
                <input 
                  type="text"
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  placeholder="Enter patient name"
                  required
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    fontSize: '16px', 
                    borderRadius: '8px', 
                    border: '2px solid #e0e0e0',
                    backgroundColor: '#fafafa',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#444' }}>Admission Date:</label>
                <input 
                  type="date"
                  value={newPatientDate}
                  onChange={(e) => setNewPatientDate(e.target.value)}
                  required
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    fontSize: '16px', 
                    borderRadius: '8px', 
                    border: '2px solid #e0e0e0',
                    backgroundColor: '#fafafa',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  type="submit"
                  style={{ 
                    flex: 1, 
                    padding: '14px', 
                    backgroundColor: '#4caf50', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '8px', 
                    cursor: 'pointer', 
                    fontSize: '16px',
                    fontWeight: '600'
                  }}
                >
                  Add Patient
                </button>
                <button 
                  type="button"
                  onClick={() => { setShowAddPatient(false); setNewPatientName(''); setNewPatientDate(''); }}
                  style={{ 
                    flex: 1, 
                    padding: '14px', 
                    backgroundColor: '#9e9e9e', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '8px', 
                    cursor: 'pointer', 
                    fontSize: '16px',
                    fontWeight: '600'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {assignModal.open && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '15px',
          boxSizing: 'border-box',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '25px',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '380px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>
              Assign IV to <span style={{ color: '#1976d2' }}>{assignModal.patient?.name}</span>
            </h3>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#444' }}>IV Item:</label>
              <select 
                value={selectedItem} 
                onChange={(e) => setSelectedItem(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  fontSize: '16px', 
                  borderRadius: '8px', 
                  border: '2px solid #e0e0e0',
                  backgroundColor: '#fafafa'
                }}
              >
                <option value="">Select an item</option>
                {ivItems.map(item => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#444' }}>Quantity:</label>
              <input 
                type="number" 
                value={quantity} 
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  fontSize: '16px', 
                  borderRadius: '8px', 
                  border: '2px solid #e0e0e0', 
                  boxSizing: 'border-box',
                  backgroundColor: '#fafafa'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={handleSubmitAssignment}
                style={{ 
                  flex: 1, 
                  padding: '14px', 
                  backgroundColor: '#4caf50', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px', 
                  cursor: 'pointer', 
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              >
                Assign
              </button>
              <button 
                onClick={() => setAssignModal({ open: false, patient: null })}
                style={{ 
                  flex: 1, 
                  padding: '14px', 
                  backgroundColor: '#9e9e9e', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px', 
                  cursor: 'pointer', 
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {historyModal.open && historyModal.history && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '15px',
          boxSizing: 'border-box',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '25px',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '550px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>
              IV History - <span style={{ color: '#1976d2' }}>{historyModal.history.patient?.name}</span>
            </h3>
            
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '350px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#e3f2fd' }}>
                    <th style={{ padding: '10px 8px', border: '1px solid #e0e0e0', textAlign: 'left', fontSize: '13px' }}>IV Item</th>
                    <th style={{ padding: '10px 8px', border: '1px solid #e0e0e0', textAlign: 'center', fontSize: '13px' }}>Quantity</th>
                    <th style={{ padding: '10px 8px', border: '1px solid #e0e0e0', textAlign: 'left', fontSize: '13px' }}>Date & Time</th>
                  </tr>
                </thead>
                <tbody>
                  {historyModal.history.assignments.length === 0 ? (
                    <tr>
                      <td colSpan="3" style={{ padding: '20px', textAlign: 'center', border: '1px solid #e0e0e0', color: '#999' }}>
                        No IV fluids assigned yet
                      </td>
                    </tr>
                  ) : (
                    historyModal.history.assignments.map((item, index) => (
                      <tr key={item.id} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <td style={{ padding: '10px 8px', border: '1px solid #e0e0e0', fontWeight: '500' }}>{item.item_name}</td>
                        <td style={{ padding: '10px 8px', border: '1px solid #e0e0e0', textAlign: 'center' }}>{item.quantity}</td>
                        <td style={{ padding: '10px 8px', border: '1px solid #e0e0e0', fontSize: '12px', color: '#666' }}>
                          {new Date(item.assigned_at).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            <button 
              onClick={closeHistoryModal}
              style={{ 
                marginTop: '20px', 
                width: '100%',
                padding: '14px', 
                backgroundColor: '#9e9e9e', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NurseDashboard;
