const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connecté à MongoDB');

    const adminData = {
      nom: 'Admin',
      email: 'admin04@gmail.com',
      motDePasse: await bcrypt.hash('141604admin', 10)
    };

    // Création de l'admin
    const result = await mongoose.connection.collection('administrateurs')
      .insertOne(adminData);

    if (result.insertedId) {
      console.log('Admin créé avec succès');
      console.log('ID de l\'admin:', result.insertedId);
      console.log('Email: admin04@gmail.com');
      console.log('Mot de passe: 141604admin');
    } else {
      console.log('Erreur lors de la création de l\'admin');
    }

  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Connexion à MongoDB fermée');
  }
}

createAdmin();