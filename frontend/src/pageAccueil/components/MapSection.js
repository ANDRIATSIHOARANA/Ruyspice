import React from 'react';
import '../styles/MapSection.css';

const MapSection = () => {
  return (
    <section className="map-section">
      <div className="section-header animate-on-scroll">
        <h2 className="section-title">Nous trouver</h2>
        <p className="section-subtitle">
          Rendez-nous visite au Ministère de l'Éducation à Atsimbazaza, Antananarivo, Madagascar
        </p>
      </div>

      <div className="map-container animate-on-scroll">
        <iframe 
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3774.8896160235384!2d47.52148491489868!3d-18.91391998717629!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x21f07de34f1f8abf%3A0xb3d758c585be93c8!2sMinist%C3%A8re%20de%20l&#39;%C3%89ducation%20Nationale!5e0!3m2!1sfr!2sfr!4v1652345678901!5m2!1sfr!2sfr" 
          width="100%" 
          height="450" 
          style={{ border: 0 }} 
          allowFullScreen="" 
          loading="lazy" 
          referrerPolicy="no-referrer-when-downgrade"
          title="Ministère de l'Éducation Nationale à Atsimbazaza, Antananarivo, Madagascar"
        ></iframe>
      </div>

      <div className="contact-info">
        <div className="contact-card animate-on-scroll">
          <div className="contact-icon">
            <span role="img" aria-label="Adresse">📍</span>
          </div>
          <div className="contact-details">
            <h3>Adresse</h3>
            <p>Ministère de l'Éducation Nationale, Atsimbazaza, Antananarivo, Madagascar</p>
          </div>
        </div>

        <div className="contact-card animate-on-scroll">
          <div className="contact-icon">
            <span role="img" aria-label="Téléphone">📞</span>
          </div>
          <div className="contact-details">
            <h3>Téléphone</h3>
            <p>+261 34 22 550 00</p>
          </div>
        </div>

        <div className="contact-card animate-on-scroll">
          <div className="contact-icon">
            <span role="img" aria-label="Email">✉️</span>
          </div>
          <div className="contact-details">
            <h3>Email</h3>
            <p>mesupresst@gmail.com</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MapSection;