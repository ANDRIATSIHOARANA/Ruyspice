import React, { useEffect } from 'react';
import '../styles/StatisticsSection.css';

const StatisticsSection = () => {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        const animationContainer = document.querySelector('.animation-container');
        if (animationContainer) {
          animationContainer.classList.add('animate');
        }
      }
    }, { threshold: 0.2 });
    
    const section = document.querySelector('.animation-section');
    if (section) observer.observe(section);
    
    return () => {
      if (section) observer.unobserve(section);
    };
  }, []);

  return (
    <section className="animation-section">
      <div className="section-header">
        <h2 className="section-title">Expérience visuelle</h2>
        <p className="section-subtitle">
          Une nouvelle expériences visuelle pour une gestion de rendez-vous simplifiée
        </p>
      </div>
      
      <div className="animation-container">
        <div className="animation-element circle"></div>
        <div className="animation-element square"></div>
        <div className="animation-element triangle"></div>
        <div className="animation-element wave"></div>
        <div className="animation-element dots">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
      </div>
    </section>
  );
};

export default StatisticsSection;
