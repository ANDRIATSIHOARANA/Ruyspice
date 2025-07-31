import React from 'react';
import { Calendar, Clock, User, Bell, BarChart2, Shield } from 'lucide-react';
import '../styles/FeaturesSection.css';

const FeaturesSection = () => {
  const features = [
    {
      icon: <Calendar size={32} />,
      title: 'Gestion intelligente des rendez-vous',
      description: 'Planifiez, modifiez et annulez vos rendez-vous en quelques clics avec synchronisation automatique sur tous vos appareils.'
    },
    {
      icon: <Clock size={32} />,
      title: 'Disponibilité en temps réel',
      description: 'Consultez les disponibilités des professionnels en temps réel et réservez instantanément sans attente ni appel téléphonique.'
    },
    {
      icon: <User size={32} />,
      title: 'Profils personnalisés',
      description: 'Créez votre profil détaillé, que vous soyez utilisateur ou professionnel, avec toutes vos informations importantes.'
    },
    {
      icon: <Bell size={32} />,
      title: 'Notifications automatiques',
      description: 'Recevez des rappels automatiques par email ou SMS pour ne jamais manquer un rendez-vous important.'
    },
    {
      icon: <BarChart2 size={32} />,
      title: 'Tableaux de bord analytiques',
      description: 'Accédez à des statistiques détaillées sur vos rendez-vous, votre taux d\'occupation et vos performances.'
    },
    {
      icon: <Shield size={32} />,
      title: 'Sécurité garantie',
      description: 'Vos données personnelles sont protégées par des systèmes de sécurité avancés et conformes au RGPD.'
    }
  ];

  return (
    <section className="features-section">
      <div className="section-header animate-on-scroll">
        <h2 className="section-title">Solutions innovantes</h2>
        <p className="section-subtitle">
          Notre plateforme propose des fonctionnalités avancées pour optimiser votre gestion de rendez-vous
        </p>
      </div>

      <div className="features-grid">
        {features.map((feature, index) => (
          <div className="feature-card animate-on-scroll" key={index} style={{animationDelay: `${index * 0.1}s`}}>
            <div className="feature-icon-container">
              {feature.icon}
            </div>
            <h3 className="feature-title">{feature.title}</h3>
            <p className="feature-description">{feature.description}</p>
            <div className="feature-hover-effect"></div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturesSection;
