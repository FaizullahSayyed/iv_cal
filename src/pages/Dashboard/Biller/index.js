import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaFileInvoiceDollar, FaTrash, FaSignOutAlt } from 'react-icons/fa';
import API_BASE_URL from '../../../config/api';

const BillerDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientDetails, setPatientDetails] = useState(null);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/billing/patients`);
      setPatients(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load billing data');
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handlePatientClick = async (patient) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/billing/patient/${patient.id}`);
      setPatientDetails(response.data);
      setSelectedPatient(patient);
    } catch (err) {
      console.error(err);
      alert('Failed to load patient details');
    }
  };

  const closeModal = () => {
    setSelectedPatient(null);
    setPatientDetails(null);
  };

  const handleDelete = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to delete this IV assignment?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/iv-assignment/${assignmentId}`);
      const response = await axios.get(`${API_BASE_URL}/api/billing/patient/${selectedPatient.id}`);
      setPatientDetails(response.data);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete assignment');
    }
  };

  const handleDischarge = async (patient) => {
    if (!window.confirm(`Are you sure you want to discharge ${patient.name}? This will save all patient information and IV fluids to discharged records.`)) return;
    try {
      await axios.post(`${API_BASE_URL}/api/patients/${patient.id}/discharge`);
      alert('Patient discharged successfully!');
      fetchData();
      if (selectedPatient && selectedPatient.id === patient.id) {
        closeModal();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to discharge patient');
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading billing data...</div>;
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
          <FaFileInvoiceDollar size={32} color="#2e7d32" />
          <div>
            <h1 style={{ fontSize: 'clamp(20px, 5vw, 26px)', margin: 0, color: '#333' }}>Biller Dashboard</h1>
            <p style={{ color: '#666', margin: '5px 0 0 0', fontSize: '14px' }}>Track patient IV charges</p>
          </div>
        </div>
      </div>

      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        <h2 style={{ fontSize: '18px', margin: '0 0 15px 0', color: '#444' }}>Admitted Patients</h2>
        
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '300px' }}>
            <thead>
              <tr style={{ backgroundColor: '#e8f5e9' }}>
                <th style={{ padding: '12px 10px', border: '1px solid #e0e0e0', textAlign: 'left', color: '#2e7d32' }}>Patient Name</th>
                <th style={{ padding: '12px 10px', border: '1px solid #e0e0e0', textAlign: 'right', color: '#2e7d32' }}>Total IV Amount</th>
                <th style={{ padding: '12px 10px', border: '1px solid #e0e0e0', textAlign: 'center', color: '#2e7d32' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient, index) => (
                <tr key={patient.id} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: '12px 10px', border: '1px solid #e0e0e0' }}>
                    <span 
                      onClick={() => handlePatientClick(patient)}
                      style={{ 
                        color: '#1976d2', 
                        cursor: 'pointer', 
                        textDecoration: 'underline',
                        fontWeight: '500'
                      }}
                    >
                      {patient.name}
                    </span>
                  </td>
                  <td style={{ 
                    padding: '12px 10px', 
                    border: '1px solid #e0e0e0', 
                    fontWeight: 'bold', 
                    textAlign: 'right',
                    color: Number(patient.total_amount) > 0 ? '#2e7d32' : '#999'
                  }}>
                    ₹{Number(patient.total_amount).toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '12px 10px', border: '1px solid #e0e0e0', textAlign: 'center' }}>
                    <button
                      onClick={() => handleDischarge(patient)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#f57c00',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '13px',
                        fontWeight: '500'
                      }}
                    >
                      <FaSignOutAlt size={12} /> Discharge
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedPatient && patientDetails && (
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
              IV Details - <span style={{ color: '#1976d2' }}>{patientDetails.patient?.name}</span>
            </h3>
            
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '350px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#e8f5e9' }}>
                    <th style={{ padding: '10px 8px', border: '1px solid #e0e0e0', textAlign: 'left', fontSize: '13px' }}>IV Item</th>
                    <th style={{ padding: '10px 8px', border: '1px solid #e0e0e0', textAlign: 'right', fontSize: '13px' }}>Price</th>
                    <th style={{ padding: '10px 8px', border: '1px solid #e0e0e0', textAlign: 'center', fontSize: '13px' }}>Qty</th>
                    <th style={{ padding: '10px 8px', border: '1px solid #e0e0e0', textAlign: 'right', fontSize: '13px' }}>Total</th>
                    <th style={{ padding: '10px 8px', border: '1px solid #e0e0e0', textAlign: 'left', fontSize: '13px' }}>Date & Time</th>
                    <th style={{ padding: '10px 8px', border: '1px solid #e0e0e0', textAlign: 'center', fontSize: '13px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {patientDetails.assignments.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '20px', textAlign: 'center', border: '1px solid #e0e0e0', color: '#999' }}>
                        No IV fluids assigned
                      </td>
                    </tr>
                  ) : (
                    patientDetails.assignments.map((item, index) => (
                      <tr key={item.id} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <td style={{ padding: '10px 8px', border: '1px solid #e0e0e0' }}>{item.item_name}</td>
                        <td style={{ padding: '10px 8px', border: '1px solid #e0e0e0', textAlign: 'right' }}>₹{item.price_inr}</td>
                        <td style={{ padding: '10px 8px', border: '1px solid #e0e0e0', textAlign: 'center' }}>{item.quantity}</td>
                        <td style={{ padding: '10px 8px', border: '1px solid #e0e0e0', fontWeight: 'bold', textAlign: 'right', color: '#2e7d32' }}>₹{item.total}</td>
                        <td style={{ padding: '10px 8px', border: '1px solid #e0e0e0', fontSize: '12px', color: '#666' }}>
                          {new Date(item.assigned_at).toLocaleString()}
                        </td>
                        <td style={{ padding: '10px 8px', border: '1px solid #e0e0e0', textAlign: 'center' }}>
                          <button
                            onClick={() => handleDelete(item.id)}
                            style={{
                              padding: '6px 10px',
                              backgroundColor: '#f44336',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px'
                            }}
                          >
                            <FaTrash size={12} /> Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            <div style={{ 
              marginTop: '20px', 
              padding: '15px', 
              backgroundColor: '#e8f5e9', 
              borderRadius: '8px',
              textAlign: 'right'
            }}>
              <span style={{ fontSize: '14px', color: '#666' }}>Grand Total: </span>
              <strong style={{ fontSize: '20px', color: '#2e7d32' }}>
                ₹{Number(selectedPatient.total_amount).toLocaleString('en-IN')}
              </strong>
            </div>
            
            <button 
              onClick={closeModal}
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

export default BillerDashboard;
