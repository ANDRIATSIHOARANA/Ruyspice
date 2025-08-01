const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Servir les fichiers statiques
app.use(express.static(__dirname));

// Route pour servir index.html pour toutes les routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`🚀 Test server running at http://localhost:${port}`);
  console.log('📁 Serving files from:', __dirname);
});