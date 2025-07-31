import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/CtaSection.css';

const CtaSection = () => {
  return (
    <section className="cta-section">
      <div className="cta-container animate-on-scroll">
        <h2 className="cta-title">Prêt à révolutionner votre gestion de rendez-vous ?</h2>
        <p className="cta-subtitle">
          Rejoignez des milliers d'utilisateurs satisfaits et transformez votre expérience dès aujourd'hui.
          Inscription gratuite et sans engagement.
        </p>
        
        <div className="cta-buttons">
          <Link to="/register" className="cta-button primary">
            Créer un compte gratuitement
            <span className="btn-arrow">→</span>
          </Link>
          <Link to="/login" className="cta-button secondary">
            Se connecter
          </Link>
        </div>
        
        <div className="cta-features">
          <div className="cta-feature">
            <div className="feature-check">✓</div>
            <span>Configuration en 2 minutes</span>
          </div>
          <div className="cta-feature">
            <div className="feature-check">✓</div>
            <span>Sans engagement</span>
          </div>
          <div className="cta-feature">
            <div className="feature-check">✓</div>
            <span>Support gratuit</span>
          </div>
        </div>
      </div>
      
      <div className="cta-background">
        <div className="cta-shape shape-1"></div>
        <div className="cta-shape shape-2"></div>
        <div className="cta-shape shape-3"></div>
      </div>
    </section>
  );
};

export default CtaSection;