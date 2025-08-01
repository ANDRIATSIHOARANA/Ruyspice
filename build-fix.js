const fs = require('fs');
const path = require('path');

// Fonction pour corriger les chemins dans index.html
function fixIndexHtml() {
  const indexPath = path.join(__dirname, 'index.html');
  
  if (fs.existsSync(indexPath)) {
    let content = fs.readFileSync(indexPath, 'utf8');
    
    // Corriger les chemins absolus en chemins relatifs si nécessaire
    content = content.replace(/href="\/static\//g, 'href="./static/');
    content = content.replace(/src="\/static\//g, 'src="./static/');
    content = content.replace(/href="\/manifest\.json"/g, 'href="./manifest.json"');
    content = content.replace(/href="\/favicon\.ico"/g, 'href="./favicon.ico"');
    content = content.replace(/href="\/logo192\.png"/g, 'href="./logo192.png"');
    
    fs.writeFileSync(indexPath, content);
    console.log('✅ Index.html paths fixed');
  }
}

// Fonction pour vérifier que tous les fichiers référencés existent
function checkFiles() {
  const indexPath = path.join(__dirname, 'index.html');
  
  if (fs.existsSync(indexPath)) {
    const content = fs.readFileSync(indexPath, 'utf8');
    
    // Extraire les références aux fichiers JS et CSS
    const jsMatches = content.match(/src="[^"]*\.js"/g) || [];
    const cssMatches = content.match(/href="[^"]*\.css"/g) || [];
    
    console.log('📁 Checking referenced files:');
    
    [...jsMatches, ...cssMatches].forEach(match => {
      const filePath = match.match(/"([^"]*)"/)[1].replace('./', '');
      const fullPath = path.join(__dirname, filePath);
      
      if (fs.existsSync(fullPath)) {
        console.log(`✅ ${filePath} - Found`);
      } else {
        console.log(`❌ ${filePath} - Missing`);
      }
    });
  }
}

// Exécuter les corrections
console.log('🔧 Starting build fixes...');
fixIndexHtml();
checkFiles();
console.log('✅ Build fixes completed');