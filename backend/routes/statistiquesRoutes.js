const express = require('express');
const router = express.Router();
const Statistiques = require('../models/Statistiques');

router.get('/:professionnelId', async (req, res) => {
  try {
    const stats = await Statistiques.findOne({ professionnel: req.params.professionnelId });
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;