import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
// Reusing AuthPage CSS for general container, header, and button styles
import './AuthPage.css'; 
import ErrorNotification from './ErrorNotification';

// const API_BASE_URL = '/api'; 
const API_BASE_URL = 'http://localhost:8000/api';

const DistanceCalculator = () => {
    const navigate = useNavigate();
    
    // --- STATE ---
    const [formData, setFormData] = useState({
        source: '',
        destination: '',
        unit: 'Miles', // Default to Miles
    });

    const [notification, setNotification] = useState({
        header: '',
        message: '',
        visible: false,
    });
    
    const [distanceResult, setDistanceResult] = useState('—'); // Default placeholder
    const [status, setStatus] = useState({ loading: false });

    // --- HANDLERS ---

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    
    const handleUnitChange = (e) => {
        setFormData({ ...formData, unit: e.target.value });
    };

    const handleLogout = () => {
        const token = localStorage.getItem('access_token');
        
        setStatus({ loading: true, error: null });

        // If a token exists, attempt to invalidate it on the server
        if (token) {
            axios.post(`${API_BASE_URL}/logout/`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            .catch((error) => {
                // Log the error but proceed with client-side logout anyway
                console.error("Server logout failed, clearing local token:", error);
            })
            .finally(() => {
                localStorage.removeItem('access_token');
                navigate('/');
            });
        } else {
            // No token, just redirect
            localStorage.removeItem('access_token');
            navigate('/');
        }
    };
    
    const handleCalculateDistance = async (e) => {
        e.preventDefault();
        setStatus({ loading: true, error: null });
        
        const token = localStorage.getItem('access_token');
        const user_id = localStorage.getItem('user_id');
        
        if (!token) {
            setStatus({ loading: false, error: "Authentication required. Please log in." });
            navigate('/'); 
            return;
        }

        // Prepare the payload for the secured FastAPI endpoint
        const payload = {
            Place1: formData.source,
            Place2: formData.destination,
            Type: formData.unit
        };
        
        try {
            // Actual API call to the secured endpoint
            const response = await axios.post(`${API_BASE_URL}/finddistances`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,'x-user-id': user_id,
                }
            });
            
            // Assuming FastAPI returns { distance: "X mi / Y km" }
            setDistanceResult(response.data.data.result); 
            setStatus({ loading: false, error: null });

        } catch (error) {
            console.error("Distance Calculation Error:", error.response || error);
        
            let header = "Calculation failed";
            let message = "Something went wrong and the calculation failed."; // Default message from image
            
            if (error.response) {
                if (error.response.status === 401) {
                    header = "Session Expired";
                    message = "Your session has expired. Please log in again.";
                    localStorage.removeItem('access_token');
                    navigate('/'); 
                } else if (error.response.data && error.response.data.detail) {
                    header = "Validation Error";
                    message = error.response.data.detail;
                }
            }
            
            // Set the new notification state
            setNotification({ header, message, visible: true });
            setStatus({ loading: false });
        
            // console.error("Distance Calculation Error:", error.response || error);
            
            // let errorMessage = "Calculation failed. Check inputs or connection.";
            
            // if (error.response) {
                // if (error.response.status === 401) {
                    // errorMessage = "Session expired. Please log in again.";
                    // localStorage.removeItem('access_token');
                    // navigate('/'); // Redirect on 401 Unauthorized
                // } else if (error.response.data && error.response.data.detail) {
                    // errorMessage = error.response.data.detail;
                // }
            // }
            
            // setStatus({ loading: false, error: errorMessage });
        }
    };

    const handleReset = () => {
        setFormData({
            source: '',
            destination: '',
            unit: 'Miles',
        });
        setDistanceResult('—');
        setStatus({ loading: false, error: null });
    };

    // --- RENDERING ---

    return (
        <div className="auth-container">
            {/* --- Header (Reusing AuthPage styles) --- */}
            {/* Render the error notification if visible */}
            {notification.visible && (
                <ErrorNotification 
                    header={notification.header}
                    message={notification.message}
                    onClose={() => setNotification({ ...notification, visible: false })}
                />
            )}
            <header className="header">
                <div className="logo">Access Hub</div>
                <div className="header-actions">
                    {/* View Historical Queries button */}
                    <button 
                        className="btn btn-history" 
                        onClick={() => navigate('/history')}
                    >
                        View Historical Queries 🕑
                    </button>
                    {/* Logout Button */}
                    <button 
                        className="btn btn-logout" 
                        onClick={handleLogout}
                        disabled={status.loading}
                    >
                        {status.loading ? 'Logging out...' : 'Log Out'}
                    </button>
                </div>
            </header>
            <div className="divider"></div>

            {/* --- Main Calculation Area --- */}
            <main className="calc-main-content">
                <div className="calc-header-section">
                    <h2>Distance Calculator</h2>
                    <p className="subtitle">Prototype web application for calculating the distance between addresses.</p>
                </div>

                {/* Status/Error Display */}
                {status.error && <p className="error-message">{status.error}</p>}

                <form onSubmit={handleCalculateDistance} className="calc-form-grid">
                    {/* Row 1: Address Inputs */}
                    <div className="address-section">
                        {/* Source Address */}
                        <div className="input-group">
                            <label htmlFor="source">Source Address</label>
                            <input 
                                id="source"
                                name="source"
                                type="text"
                                value={formData.source}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        {/* Destination Address */}
                        <div className="input-group">
                            <label htmlFor="destination">Destination Address</label>
                            <input 
                                id="destination"
                                name="destination"
                                type="text"
                                value={formData.destination}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                    </div>

                    {/* Row 2: Unit and Distance Output */}
                    <div className="output-section">
                        {/* Unit Selection */}
                        <div className="unit-group">
                            <label>Unit</label>
                            <label>
                                <input type="radio" name="unit" value="Miles" checked={formData.unit === 'Miles'} onChange={handleUnitChange} />
                                Miles
                            </label>
                            <label>
                                <input type="radio" name="unit" value="Kilometers" checked={formData.unit === 'Kilometers'} onChange={handleUnitChange} />
                                Kilometers
                            </label>
                            <label>
                                <input type="radio" name="unit" value="Both" checked={formData.unit === 'Both'} onChange={handleUnitChange} />
                                Both
                            </label>
                        </div>

                        {/* Distance Output */}
                        <div className="distance-group">
                            <label>Distance</label>
                            <div className="distance-output">{distanceResult}</div>
                        </div>
                    </div>
                    
                    {/* Row 3: Action Buttons */}
                    <div className="action-buttons">
                        <button type="submit" className="btn btn-calculate" disabled={status.loading}>
                            {status.loading ? 'Calculating...' : 'Calculate Distance'}
                        </button>
                        <button type="button" className="btn btn-reset" onClick={handleReset}>
                            🗑️
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
};

export default DistanceCalculator;