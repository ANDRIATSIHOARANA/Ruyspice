const fs = require('fs');
const path = require('path');

// Fonction pour copier récursivement un dossier
function copyFolderSync(from, to) {
  if (!fs.existsSync(to)) {
    fs.mkdirSync(to, { recursive: true });
  }
  
  fs.readdirSync(from).forEach(element => {
    const fromPath = path.join(from, element);
    const toPath = path.join(to, element);
    
    if (fs.lstatSync(fromPath).isFile()) {
      fs.copyFileSync(fromPath, toPath);
    } else {
      copyFolderSync(fromPath, toPath);
    }
  });
}

// Fonction pour copier les fichiers du build
function copyBuildFiles() {
  const buildDir = path.join(__dirname, 'frontend', 'build');
  const rootDir = __dirname;
  
  if (!fs.existsSync(buildDir)) {
    console.error('❌ Build directory not found:', buildDir);
    return false;
  }
  
  console.log('📁 Copying build files...');
  
  // Copier tous les fichiers du build vers la racine
  fs.readdirSync(buildDir).forEach(item => {
    const sourcePath = path.join(buildDir, item);
    const destPath = path.join(rootDir, item);
    
    if (fs.lstatSync(sourcePath).isDirectory()) {
      // Supprimer le dossier de destination s'il existe
      if (fs.existsSync(destPath)) {
        fs.rmSync(destPath, { recursive: true, force: true });
      }
      copyFolderSync(sourcePath, destPath);
      console.log(`✅ Copied directory: ${item}`);
    } else {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✅ Copied file: ${item}`);
    }
  });
  
  return true;
}

// Fonction pour corriger les chemins dans index.html
function fixIndexHtml() {
  const indexPath = path.join(__dirname, 'index.html');
  
  if (fs.existsSync(indexPath)) {
    let content = fs.readFileSync(indexPath, 'utf8');
    
    // Corriger les chemins absolus en chemins relatifs
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

// Exécuter le processus de build
console.log('🔧 Starting Windows build process...');

if (copyBuildFiles()) {
  fixIndexHtml();
  checkFiles();
  console.log('✅ Build process completed successfully');
} else {
  console.error('❌ Build process failed');
  process.exit(1);
}