// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { useNavigate } from 'react-router-dom';
// // Reusing main layout styles
// import './AuthPage.css'; 
// import './DistanceCalculator.css'; 

// // const API_BASE_URL = '/api'; 
// const API_BASE_URL = 'http://localhost:8000/api';

// const HistoricalQueries = () => {
//     const navigate = useNavigate();
    
//     const [queries, setQueries] = useState([]);
//     const [status, setStatus] = useState({ loading: true, error: null });

//     // --- Data Fetching Effect ---
//     useEffect(() => {
//         const fetchQueries = async () => {
//             const token = localStorage.getItem('access_token');
//             const user_id = localStorage.getItem('user_id');
//             if (!token) {
//                 navigate('/'); // Redirect to login if no token
//                 return;
//             }

//             try {
//                 // NOTE: This endpoint must exist and be secured on your FastAPI backend
//                 const response = await axios.get(`${API_BASE_URL}/historicalqueries`, {
//                     headers: {
//                         Authorization: `Bearer ${token}`,'x-user-id': user_id,
//                     }
//                 });
                
//                 setQueries(response.data); // Assuming response.data is an array of query objects
//                 setStatus({ loading: false, error: null });
//             } catch (error) {
//                 console.error("Failed to fetch historical queries:", error);
//                 if (error.response && error.response.status === 401) {
//                      // Token expired/invalid, clear local token and redirect
//                     localStorage.removeItem('access_token');
//                     navigate('/');
//                 }
//                 setStatus({ loading: false, error: "Failed to load history. Please try logging in again." });
//             }
//         };

//         fetchQueries();
//     }, [navigate]);


//     // --- Handlers ---
    
//     const handleLogout = () => {
//         // Simple client-side logout (clears token and redirects)
//         localStorage.removeItem('access_token');
//         navigate('/');
//     };
    
//     const handleBackToCalculator = () => {
//         navigate('/calculator');
//     };

//     // --- Rendering ---
    
//     const renderTableContent = () => {
//         if (status.loading) {
//             return <tr><td colSpan="4" className="status-cell">Loading historical data...</td></tr>;
//         }

//         if (status.error) {
//             return <tr><td colSpan="4" className="error-cell">{status.error}</td></tr>;
//         }

//         if (queries.length === 0) {
//             return <tr><td colSpan="4" className="status-cell">No historical queries found.</td></tr>;
//         }
        
//         return queries.map((query, index) => (
//             <tr key={index}>
//                 <td>{query.source_address}</td>
//                 <td>{query.destination_address}</td>
//                 <td>{query.distance_miles}</td>
//                 <td>{query.distance_kilometers}</td>
//             </tr>
//         ));
//     };

//     return (
//         <div className="auth-container">
//             {/* --- Header --- */}
//             <header className="header">
//                 <div className="logo">Access Hub</div>
//                 <div className="header-actions">
//                     {/* Log Out Button */}
//                     <button 
//                         className="btn btn-logout" 
//                         onClick={handleLogout}
//                         disabled={status.loading}
//                     >
//                         Log Out
//                     </button>
//                 </div>
//             </header>
//             <div className="divider"></div>

//             {/* --- Main Content --- */}
//             <main className="history-main-content">
//                 <div className="history-header-bar">
//                     <div className="title-area">
//                         <h2>Distance Calculator</h2>
//                         <p className="subtitle">Prototype web application for calculating the distance between addresses.</p>
//                     </div>
                    
//                     <div className="action-area">
//                         <button 
//                             className="btn btn-back"
//                             onClick={handleBackToCalculator}
//                         >
//                             Back to Calculator
//                         </button>
//                         {/* Trash can icon button for clearing history (functionality not implemented here) */}
//                         <button className="btn btn-reset">🗑️</button>
//                     </div>
//                 </div>

//                 <div className="history-table-section">
//                     <h3>Historical Queries</h3>
//                     <p className="subtitle">History of the user's queries.</p>
                    
//                     <div className="table-container">
//                         <table>
//                             <thead>
//                                 <tr>
//                                     <th>Source Address</th>
//                                     <th>Destination Address</th>
//                                     <th>Distance in Miles</th>
//                                     <th>Distance in Kilometers</th>
//                                 </tr>
//                             </thead>
//                             <tbody>
//                                 {renderTableContent()}
//                             </tbody>
//                         </table>
//                     </div>
//                 </div>
//             </main>
//         </div>
//     );
// };

// export default HistoricalQueries;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
// Reusing main layout styles
import './AuthPage.css'; 
import './DistanceCalculator.css'; 

// Use the absolute URL since Nginx proxy is problematic right now
const API_BASE_URL = 'http://localhost:8000/api'; 

const HistoricalQueries = () => {
    const navigate = useNavigate();
    
    // State to hold the array of historical query records
    const [queries, setQueries] = useState([]);
    const [status, setStatus] = useState({ loading: true, error: null });

    // --- Data Fetching Effect ---
    useEffect(() => {
        const fetchQueries = async () => {
            const token = localStorage.getItem('access_token');
            const user_id = localStorage.getItem('user_id');

            if (!token || !user_id) {
                navigate('/'); // Redirect to login if auth info is missing
                return;
            }

            try {
                // NOTE: Using /historical_queries (standard plural)
                const response = await axios.get(`${API_BASE_URL}/history`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'X-User-ID': user_id, // Use standard header convention
                    }
                });
                
                // --- FIX: EXTRACT THE ARRAY FROM THE 'data' KEY ---
                // The API returns: { "data": [...] }
                // We must use .data.data to get the array:
                if (response.data && Array.isArray(response.data.data)) {
                    setQueries(response.data.data); 
                    setStatus({ loading: false, error: null });
                } else {
                    // Handle case where API response structure is unexpected
                    setQueries([]);
                    setStatus({ loading: false, error: "Received unexpected data structure from the server." });
                }
                
            } catch (error) {
                console.error("Failed to fetch historical queries:", error.response || error);
                
                if (error.response && error.response.status === 401) {
                    // Token expired/invalid, clear local token and redirect
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('user_id');
                    navigate('/');
                }
                setStatus({ loading: false, error: "Failed to load history. Please try logging in again." });
            }
        };

        fetchQueries();
    }, [navigate]);


    // --- Handlers ---
    
    const handleLogout = () => {
        // Clear all auth info and redirect
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_id');
        navigate('/');
    };
    
    const handleBackToCalculator = () => {
        navigate('/calculator');
    };

    // --- Rendering ---
    
    const renderTableContent = () => {
        if (status.loading) {
            return <tr><td colSpan="5" className="status-cell">Loading historical data...</td></tr>;
        }

        if (status.error) {
            return <tr><td colSpan="5" className="error-cell">{status.error}</td></tr>;
        }

        if (queries.length === 0) {
            return <tr><td colSpan="5" className="status-cell">No historical queries found.</td></tr>;
        }
        
        // Ensure column names match the API response exactly (Place1, Place2, Miles, Kilometers)
        return queries.map((query, index) => (
            <tr key={query.id || index}> 
                <td>{query.searched_at ? new Date(query.searched_at).toLocaleString() : 'N/A'}</td>
                <td>{query.Place1}</td>
                <td>{query.Place2}</td>
                <td>{query.Miles}</td>
                <td>{query.Kilometers}</td>
            </tr>
        ));
    };

    return (
        <div className="auth-container">
            {/* --- Header --- */}
            <header className="header">
                <div className="logo">Access Hub</div>
                <div className="header-actions">
                    <button 
                        className="btn btn-logout" 
                        onClick={handleLogout}
                        disabled={status.loading}
                    >
                        Log Out
                    </button>
                </div>
            </header>
            <div className="divider"></div>

            {/* --- Main Content --- */}
            <main className="history-main-content">
                <div className="history-header-bar">
                    <div className="title-area">
                        <h2>Distance Calculator</h2>
                        <p className="subtitle">Prototype web application for calculating the distance between addresses.</p>
                    </div>
                    
                    <div className="action-area">
                        <button 
                            className="btn btn-back"
                            onClick={handleBackToCalculator}
                        >
                            Back to Calculator
                        </button>
                        <button className="btn btn-reset" disabled>🗑️</button> {/* Disabled reset for now */}
                    </div>
                </div>

                <div className="history-table-section">
                    <h3>Historical Queries</h3>
                    <p className="subtitle">History of the user's queries.</p>
                    
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Time Queried</th> {/* Added time field */}
                                    <th>Source Address</th>
                                    <th>Destination Address</th>
                                    <th>Distance in Miles</th>
                                    <th>Distance in Kilometers</th>
                                </tr>
                            </thead>
                            <tbody>
                                {renderTableContent()}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default HistoricalQueries;