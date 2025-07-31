// backend/middlewares/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Erreur de validation',
      details: Object.values(err.errors).map(error => error.message)
    });
  }

  if (err.code === 11000) {
    return res.status(400).json({
      message: 'Cette adresse email est déjà utilisée'
    });
  }

  res.status(err.status || 500).json({
    message: err.message || 'Une erreur est survenue sur le serveur'
  });
};

module.exports = errorHandler;