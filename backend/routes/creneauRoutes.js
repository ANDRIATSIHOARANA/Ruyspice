const express = require('express');
const router = express.Router();
const Creneau = require('../models/Creneau');

router.post('/', async (req, res) => {
    try {
        const creneau = new Creneau(req.body);
        await creneau.save();
        res.status(201).json(creneau);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const creneaux = await Creneau.find().populate('professionnel');
        res.json(creneaux);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;