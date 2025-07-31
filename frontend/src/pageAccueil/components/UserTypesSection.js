import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/UserTypesSection.css';

const UserTypesSection = () => {
  return (
    <section className="user-types-section">
      <div className="section-header animate-on-scroll">
        <h2 className="section-title">Une solution pour tous</h2>
        <p className="section-subtitle">
          Que vous soyez client ou professionnel, notre plateforme s'adapte à vos besoins
        </p>
      </div>

      <div className="user-types-container">
        <div className="user-type-card animate-on-scroll">
          <div className="card-header">
            <div className="card-icon">
              <span role="img" aria-label="Utilisateur">👤</span>
            </div>
            <h3>Pour les utilisateurs</h3>
          </div>
          <ul className="card-features">
            <li>Trouvez rapidement le professionnel idéal</li>
            <li>Réservez en quelques clics 24h/24 et 7j/7</li>
            <li>Gérez tous vos rendez-vous en un seul endroit</li>
            <li>Recevez des rappels automatiques</li>
            <li>Accédez à votre historique complet</li>
            <li>Évaluez vos expériences</li>
          </ul>
          <Link to="/register" className="card-button">
            S'inscrire comme utilisateur
            <span className="btn-arrow">→</span>
          </Link>
        </div>

        <div className="divider animate-on-scroll">
          <div className="divider-line"></div>
          <div className="divider-text">OU</div>
          <div className="divider-line"></div>
        </div>

        <div className="user-type-card animate-on-scroll">
          <div className="card-header">
            <div className="card-icon">
              <span role="img" aria-label="Professionnel">👔</span>
            </div>
            <h3>Pour les professionnels</h3>
          </div>
          <ul className="card-features">
            <li>Optimisez votre planning et votre temps</li>
            <li>Réduisez les rendez-vous manqués</li>
            <li>Gérez facilement vos disponibilités</li>
            <li>Développez votre clientèle</li>
            <li>Accédez à des statistiques détaillées</li>
            <li>Personnalisez votre profil professionnel</li>
          </ul>
          <Link to="/register" className="card-button">
            S'inscrire comme professionnel
            <span className="btn-arrow">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default UserTypesSection;
