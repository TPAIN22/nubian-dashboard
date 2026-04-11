const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(srcDir);

// Define regex patterns indicating animation-related classes
const animationClassesRegex = /\b(transition(-[a-z]+)*|duration-\d+|ease(-[a-z]+)*|animate(-[a-z]+)*|delay-\d+)\b/g;

// Other motion related props
const framerMotionPropsRegex = /\b(initial|animate|exit|transition|whileHover|whileTap|variants)=\{[^}]+\}/g;

let modifiedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // 1. Remove animation Tailwind classes
  content = content.replace(animationClassesRegex, '');

  // 2. Remove extra spaces inside classNames caused by replacements
  content = content.replace(/className\s*=\s*(["'])(.*?)\1/g, (match, quote, classes) => {
    return `className=${quote}${classes.replace(/\s+/g, ' ').trim()}${quote}`;
  });

  // 3. Clean up generic string template classes `...`
  content = content.replace(/className\s*=\s*\{`([^`]+)`\}/g, (match, classes) => {
     return `className={\`${classes.replace(/\s+/g, ' ').trim()}\`}`;
  });

  // 4. Specifically remove <motion.div> and </motion.div> wrapper tags if any remain,
  // replacing them with <div>. 
  content = content.replace(/<motion\.([a-zA-Z0-9]+)/g, '<$1');
  content = content.replace(/<\/motion\.([a-zA-Z0-9]+)>/g, '</$1>');

  // 5. Remove motion specific props
  content = content.replace(framerMotionPropsRegex, '');

  // 6. Remove any imports of framer-motion if they remain
  content = content.replace(/import\s+.*?from\s+['"]framer-motion['"];?\s*\n?/g, '');

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    modifiedCount++;
  }
});

// Also check app/globals.css and globals.css to remove tw-animate utilities if manually added
const cssFiles = [
  path.join(srcDir, 'globals.css'),
  path.join(srcDir, 'app', 'globals.css')
];

cssFiles.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    
    // Remove @plugin "tw-animate-css" if it exists
    content = content.replace(/@plugin "tw-animate-css";?\n?/g, '');
    
    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      modifiedCount++;
    }
  }
});

console.log(`Successfully removed animations from ${modifiedCount} files.`);
