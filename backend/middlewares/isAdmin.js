const Administrateur = require('../models/Administrateur'); 

const isAdmin = (req, res, next) => {
    if (req.utilisateur?.role === 'ADMIN') {
        next();
    } else {
        res.status(403).json({ message: 'Accès refusé' });
    }
};

module.exports = isAdmin;