import React from 'react';
import '../styles/BenefitsSection.css';

const BenefitsSection = () => {
  return (
    <section className="benefits-section">
      <div className="benefits-content">
        <div className="section-header animate-on-scroll">
          <h2 className="section-title">Pourquoi nous choisir ?</h2>
          <p className="section-subtitle">
            Des avantages uniques qui font la différence
          </p>
        </div>

        <div className="benefits-list">
          <div className="benefit-item animate-on-scroll">
            <div className="benefit-number">01</div>
            <div className="benefit-details">
              <h3>Interface intuitive et moderne</h3>
              <p>Une expérience utilisateur fluide et agréable, accessible à tous, sans formation nécessaire.</p>
            </div>
          </div>

          <div className="benefit-item animate-on-scroll">
            <div className="benefit-number">02</div>
            <div className="benefit-details">
              <h3>Gain de temps considérable</h3>
              <p>Réduisez de 80% le temps consacré à la gestion de vos rendez-vous et concentrez-vous sur votre cœur de métier.</p>
            </div>
          </div>

          <div className="benefit-item animate-on-scroll">
            <div className="benefit-number">03</div>
            <div className="benefit-details">
              <h3>Réduction des rendez-vous manqués</h3>
              <p>Grâce aux rappels automatiques, diminuez drastiquement le taux d'absentéisme et optimisez votre planning.</p>
            </div>
          </div>

          <div className="benefit-item animate-on-scroll">
            <div className="benefit-number">04</div>
            <div className="benefit-details">
              <h3>Support client réactif</h3>
              <p>Une équipe dédiée pour répondre à toutes vos questions et vous accompagner dans l'utilisation de la plateforme.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="benefits-image animate-on-scroll">
        <img src="/assets/images/benefits-illustration.svg" alt="Avantages de la plateforme" />
        <div className="benefits-decoration">
          <div className="decoration-circle circle-1"></div>
          <div className="decoration-circle circle-2"></div>
          <div className="decoration-circle circle-3"></div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;