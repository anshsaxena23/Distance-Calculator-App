import React, { useEffect } from 'react';
import './SuccessAlert.css'; // You will need to create this CSS file

/**
 * A temporary alert component to display success messages.
 * It automatically hides after a duration.
 * * @param {string} message - The success message to display.
 * @param {function} onClose - Function to call when the alert should close.
 * @param {number} duration - Time in milliseconds before the alert auto-hides.
 */
const SuccessAlert = ({ message, onClose, duration = 4000 }) => {
    
    // Automatically hide the alert after the specified duration
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        // Cleanup function to clear the timer if the component is unmounted early
        return () => clearTimeout(timer);
    }, [onClose, duration]);

    return (
        // Renders fixed at the top-center of the viewport
        <div className="success-alert-container">
            <div className="success-alert-content">
                <span className="success-icon">✅</span>
                <p>{message}</p>
                <button className="close-btn" onClick={onClose}>&times;</button>
            </div>
        </div>
    );
};

export default SuccessAlert;