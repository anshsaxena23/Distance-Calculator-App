import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AuthPage.css'; // Ensure this file exists and contains the layout CSS
import SuccessAlert from './SuccessAlert';

// The Nginx proxy path set up in docker-compose
// const API_BASE_URL = '/api';
const API_BASE_URL = 'http://localhost:8000/api';

const AuthPage = () => {
    const navigate = useNavigate();
    const [successMessage, setSuccessMessage] = useState(null);
    // --- STATE MANAGEMENT ---
    // Default to Login View (true)
    const [isLoginView, setIsLoginView] = useState(true); 
    
    // State for Signup Form
    const [signupData, setSignupData] = useState({ username: '', password: ''});
    const [signupStatus, setSignupStatus] = useState({ loading: false, message: null, error: false });

    // State for Login Form
    const [loginData, setLoginData] = useState({ username: '', password: '' });
    const [loginStatus, setLoginStatus] = useState({ loading: false, message: null, error: false });

    // --- HANDLERS ---
    
    const toggleView = (viewName) => {
        setIsLoginView(viewName === 'login');
        // Clear statuses when switching views
        setSignupStatus({ loading: false, message: null, error: false });
        setLoginStatus({ loading: false, message: null, error: false });
    };

    const handleSignupChange = (e) => {
        setSignupData({ ...signupData, [e.target.name]: e.target.value });
    };

    const handleLoginChange = (e) => {
        setLoginData({ ...loginData, [e.target.name]: e.target.value });
    };

    // --- API LOGIC ---
    
    const handleSignupSubmit = async (e) => {
        e.preventDefault();
        setSignupStatus({ loading: true, message: null, error: false });

        try {
            // Note: FastAPI signup endpoint is /signup
            await axios.post(`${API_BASE_URL}/signup`, signupData);
            
            setSignupStatus({ 
                loading: false, 
                message: "Signup successful! Please log in.", 
                error: false 
            });
            setSuccessMessage('User created successfully! You can now log in.');

            setSignupData({ username: '', password: ''}); 
            // Switch to login view on successful signup
            setIsLoginView(true);
        } catch (error) {
            const errorMessage = error.response?.data?.detail || "Signup failed due to network error or server issue.";
            setSignupStatus({ loading: false, message: errorMessage, error: true });
        }
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoginStatus({ loading: true, message: null, error: false });

        try {
            const response = await axios.post(`${API_BASE_URL}/login`, loginData);
            
            localStorage.setItem('access_token', response.data.access_code);
            localStorage.setItem('user_id', response.data.user_id);
            setLoginStatus({ loading: false, message: "Login successful!", error: false });
            setSuccessMessage('Login successful!');
            
            // Redirect to the secured page
            navigate('/calculator'); 
        } catch (error) {
            const errorMessage = error.response?.data?.detail || "Login failed.";
            // navigate('/calculator');
            setLoginStatus({ loading: false, message: errorMessage, error: true });
        }
    };

    // --- RENDERING HELPERS ---
    
    const StatusMessage = ({ status }) => (
        status.message && (
            <p className={status.error ? "error-message" : "success-message"}>
                {status.message}
            </p>
        )
    );

    const LoginForm = (
        <div className="form-card login-card">
            <h3>Log In</h3>
            <form onSubmit={handleLoginSubmit}>
                <StatusMessage status={loginStatus} />
                <input type="text" name="username" placeholder="Username" value={loginData.username} onChange={handleLoginChange} required />
                <input type="password" name="password" placeholder="Password" value={loginData.password} onChange={handleLoginChange} required />
                <button type="submit" disabled={loginStatus.loading}>
                    {loginStatus.loading ? 'Logging In...' : 'Log In'}
                </button>
            </form>
        </div>
    );

    const SignupForm = (
        <div className="form-card signup-card">
            <h3>Sign Up</h3>
            <form onSubmit={handleSignupSubmit}>
                <StatusMessage status={signupStatus} />
                <input type="text" name="username" placeholder="Username" value={signupData.username} onChange={handleSignupChange} required />
                {/* <input type="email" name="email" placeholder="Email" value={signupData.email} onChange={handleSignupChange} required /> */}
                <input type="password" name="password" placeholder="Password" value={signupData.password} onChange={handleSignupChange} required />
                <button type="submit" disabled={signupStatus.loading}>
                    {signupStatus.loading ? 'Signing Up...' : 'Sign Up Now'}
                </button>
            </form>
        </div>
    );

    // --- MAIN COMPONENT JSX ---
    return (
        <div className="auth-container">
            {/* Header Section */}
            <header className="header">
                <div className="logo">Access Hub</div>
                <div className="header-actions">
                    {/* SIGN UP Button: Switches to the Signup form */}
                    <button 
                        className={`btn ${isLoginView ? 'btn-active' : 'btn-signup'}`} 
                        onClick={() => toggleView('signup')}
                    >
                        Sign Up
                    </button>
                    
                    {/* LOG IN Button: Switches to the Login form */}
                    <button 
                        className={`btn ${!isLoginView ? 'btn-active' : 'btn-login'}`}
                        onClick={() => toggleView('login')}
                    >
                        Log In
                    </button>
                </div>
            </header>
            <div className="divider"></div>
            {successMessage && (
                <SuccessAlert 
                    message={successMessage}
                    onClose={() => setSuccessMessage(null)} // Function to hide it
                />
            )}
            <main className="main-content">
                {/* 1. Info Card (Always present on the left) */}
                <div className="info-card">
                    <h3>Welcome to the Platform</h3>
                    <p>Your solution for text analysis and distance calculations.</p>
                    <div className="globe-icon">🌍</div>
                </div>

                {/* 2. Form (Conditional rendering based on isLoginView) */}
                {isLoginView ? LoginForm : SignupForm}
            </main>
        </div>
    );
};

export default AuthPage;