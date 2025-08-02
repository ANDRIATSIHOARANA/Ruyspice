import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Character3D from '../../components/Character3D';
import config from '../../config/config';
import '../styles/HeroSection.css';

const HeroSection = () => {
  const [characterAnimation, setCharacterAnimation] = useState('idle');
  const characterRef = useRef(null);
  
  // Fonction pour gérer le clic sur le personnage
  const handleCharacterClick = () => {
    setCharacterAnimation('dance');
    
    // Revenir à l'animation idle après 3 secondes
    setTimeout(() => {
      setCharacterAnimation('idle');
    }, 3000);
  };
  
  // S'assurer que le personnage fait face à l'utilisateur après le chargement
  useEffect(() => {
    const timer = setTimeout(() => {
      if (characterRef.current && characterRef.current.faceFront) {
        characterRef.current.faceFront();
      }
    }, 500); // Délai pour s'assurer que le modèle est chargé
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <section className="hero-section">
      <div className="hero-content">
        <h1 className="hero-title">
          <span className="gradient-text">Simplifiez</span> vos rendez-vous professionnels
        </h1>
        <p className="hero-subtitle">
          La plateforme innovante qui transforme la gestion des rendez-vous pour les professionnels et leurs clients
        </p>
        <div className="hero-buttons">
          <Link to="/register" className="btn btn-primary">
            Créer un compte
            <span className="btn-arrow">→</span>
          </Link>
          <Link to="/login" className="btn btn-secondary">
            Se connecter
          </Link>
        </div>
        <div className="hero-features">
          <div className="hero-feature">
            <div className="feature-icon">
              <span role="img" aria-label="Validation">✓</span>
            </div>
            <span>Prise de RDV simplifiée</span>
          </div>
          <div className="hero-feature">
            <div className="feature-icon">
              <span role="img" aria-label="Validation">✓</span>
            </div>
            <span>Disponibilité en temps réel</span>
          </div>
          <div className="hero-feature">
            <div className="feature-icon">
              <span role="img" aria-label="Validation">✓</span>
            </div>
            <span>Notification en temps réel</span>
          </div>
        </div>
      </div>
      <div className="hero-visual">
        <div className="hero-image">
          <img src="/assets/images/hero-illustration.svg" alt="Plateforme de rendez-vous" />
        </div>
        <div className="floating-elements">
          <div className="floating-card card-1">
            <div className="card-icon">
              <span role="img" aria-label="Calendrier">📅</span>
            </div>
            <div className="card-text">Rendez-vous confirmé</div>
          </div>
          <div className="floating-card card-2">
            <div className="card-icon">
              <span role="img" aria-label="Horloge">⏰</span>
            </div>
            <div className="card-text">Notification en temps réel</div>
          </div>
          <div className="floating-card card-3">
            <div className="card-icon">
              <span role="img" aria-label="Validation">✅</span>
            </div>
            <div className="card-text">Disponibilité mise à jour</div>
          </div>
        </div>
      </div>
      {/* Personne 3D - Conditionnellement rendu selon la configuration */}
      {config.FEATURES.ENABLE_3D_CHARACTER && (
        <div className="person-3d-header">
          <Character3D 
            ref={characterRef}
            url="/assets/models/character.fbx"
            animation={characterAnimation}
            position={[0, -1.2, 0]}
            scale={0.012}
            rotation={[0, 0, 0]} 
            enableControls={true}
            initialFacingFront={false}
            onClick={handleCharacterClick}
            style={{ width: '100%', height: '100%' }}
            showGround={false}
            useFallback={true}
            highPerformance={true}
          />
        </div>
      )}
      
      <div className="hero-wave">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
          <path fill="#ffffff" fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,149.3C960,160,1056,160,1152,138.7C1248,117,1344,75,1392,53.3L1440,32L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;