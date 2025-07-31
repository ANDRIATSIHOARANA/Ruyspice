import React, { useState, useEffect } from 'react';
import './styles/common.css';

const Toast = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onClose) {
        onClose();
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible) return null;

  return (
    <div className={`toast toast-${type}`}>
      <div className="toast-content">
        <p>{message}</p>
      </div>
      <button className="toast-close" onClick={() => setVisible(false)}>
        ×
      </button>
    </div>
  );
};

export default Toast;