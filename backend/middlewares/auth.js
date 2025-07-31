const jwt = require('jsonwebtoken');
const Utilisateur = require('../models/Utilisateur');
const Administrateur = require('../models/Administrateur');

const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: "Token manquant" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Vérifier si l'utilisateur existe et son statut
    let user;
    if (decoded.role === 'ADMIN') {
        user = Administrateur.findById(decoded.id);
    } else {
        user = Utilisateur.findById(decoded.id);
    }

    if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    if (user.statut === 'SUSPENDU') {
        return res.status(403).json({ message: "Compte suspendu" });
    }

    if (user.statut === 'INACTIF') {
        return res.status(403).json({ message: "Compte inactif" });
    }

    req.utilisateur = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Token invalide" });
  }
};

const auth = async (req, res, next) => {
  try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      if (!token) throw new Error();

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Récupérer l'utilisateur/admin selon le rôle dans le token
      let user;
      if (decoded.role === 'ADMIN') {
          user = await Administrateur.findById(decoded.id);
      } else {
          user = await Utilisateur.findById(decoded.id).select('-motDePasse -__v');
      }

      if (!user) throw new Error();

      // Vérifier si le compte est suspendu
      if (user.statut === 'SUSPENDU') {
          return res.status(403).json({ message: "Compte suspendu" });
      }

      // Si l'utilisateur est INACTIF, ne pas autoriser la connexion
      if (user.statut === 'INACTIF') {
          return res.status(403).json({ message: "Compte inactif" });
      }

      // Ajouter le rôle du token à l'objet utilisateur
      req.utilisateur = { ...user.toObject(), role: decoded.role };
      next();
  } catch (error) {
      res.status(401).json({ message: 'Authentification requise' });
  }
};

module.exports = { auth, authenticateToken };