import React from 'react';
// Import dedicated CSS for the notification, or add these styles to AuthPage.css
import './ErrorNotification.css'; 

/**
 * Reusable component to display a styled error notification blip.
 * @param {object} props
 * @param {string} props.header - The title of the error (e.g., "Calculation failed").
 * @param {string} props.message - The detailed error message.
 * @param {function} props.onClose - Function to call when the 'x' button is clicked.
 */
const ErrorNotification = ({ header, message, onClose }) => {
    // If no message or header is provided, don't render anything
    if (!message && !header) {
        return null;
    }

    return (
        <div className="notification-blip-container">
            <div className="error-blip">
                <div className="blip-content">
                    <div className="blip-header">
                        <span className="icon">⚠️</span> {/* Error icon */}
                        <strong className="blip-title">{header}</strong>
                    </div>
                    <p className="blip-message">{message}</p>
                </div>
                {/* Close button */}
                <button className="blip-close" onClick={onClose}>
                    &times;
                </button>
            </div>
        </div>
    );
};

export default ErrorNotification;