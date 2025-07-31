import React, { useState, useEffect, useRef } from 'react';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import BenefitsSection from './components/BenefitsSection';
import UserTypesSection from './components/UserTypesSection';
import MapSection from './components/MapSection';
import CtaSection from './components/CtaSection';
import StatisticsSection from './components/StatisticsSection';
import './styles/Home.css';
// Bootstrap should be imported in the main index.js file instead of here

const Home = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const scrollTimeout = useRef(null);
  const sectionRefs = useRef({});

  // Effet pour initialiser les écouteurs d'événements
  useEffect(() => {
    // Simuler un temps de chargement pour l'animation d'entrée
    setTimeout(() => {
      setIsLoaded(true);
    }, 300);
    
    const handleScroll = () => {
      // Réinitialiser le timeout précédent
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
      
      // Animation des éléments au défilement - optimisée avec IntersectionObserver
      const elements = document.querySelectorAll('.animate-on-scroll:not(.observed)');
      elements.forEach(el => {
        el.classList.add('observed');
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('animated');
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.2 });
        
        observer.observe(el);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Déclencher une fois au chargement
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, []);

  return (
    <div className={`home-container ${isLoaded ? 'loaded' : ''}`}>
      <HeroSection />
      <StatisticsSection />
      <FeaturesSection />
      <BenefitsSection />
      <UserTypesSection />
      <MapSection />
      <CtaSection />
    </div>
  );
};

export default Home;
