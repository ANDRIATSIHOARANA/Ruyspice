const RendezVous = require('../models/RendezVous');

exports.creerRendezVous = async (req, res) => {
  try {
    const utilisateur = await Utilisateur.findById(req.utilisateur.id);
    const rendezVous = await utilisateur.reserverRendezVous(req.body);
    res.status(201).json(rendezVous);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.annulerRendezVous = async (req, res) => {
  try {
    const utilisateur = await Utilisateur.findById(req.utilisateur.id);
    const rendezVous = await utilisateur.annulerRendezVous(req.params.id);
    res.json(rendezVous);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};