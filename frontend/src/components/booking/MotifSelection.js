import React, { useState } from 'react';
import './MotifSelection.css';

const MotifSelection = ({ onMotifSubmit, onBack }) => {
  const [motif, setMotif] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation du motif
    if (!motif.trim()) {
      setError('Veuillez indiquer le motif de votre rendez-vous');
      return;
    }
    
    onMotifSubmit(motif);
  };

  return (
    <div className="motif-selection-container">
      <div className="motif-selection-header">
        <button className="back-button" onClick={onBack}>
          ← Retour
        </button>
        <h2 className="motif-selection-title">Motif de votre rendez-vous</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="motif-form">
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <label htmlFor="motif">Veuillez indiquer le motif de votre rendez-vous :</label>
          <textarea
            id="motif"
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            placeholder="Décrivez brièvement la raison de votre rendez-vous..."
            rows={5}
            className="motif-textarea"
          />
          <p className="form-help-text">
            Cette information aidera le professionnel à mieux préparer votre rendez-vous.
          </p>
        </div>
        
        <div className="form-actions">
          <button type="button" className="back-button-secondary" onClick={onBack}>
            Retour
          </button>
          <button type="submit" className="continue-button" disabled={!motif.trim()}>
            Continuer
          </button>
        </div>
      </form>
    </div>
  );
};

export default MotifSelection;