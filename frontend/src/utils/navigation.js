// Fonction utilitaire pour naviguer de manière fiable
export const navigateToUrl = (url) => {
  console.log('Navigation vers:', url);
  
  // Méthode 1: window.location.href (la plus fiable)
  window.location.href = url;
};

export default navigateToUrl;