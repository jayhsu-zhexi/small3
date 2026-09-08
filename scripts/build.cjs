const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const files = ['index.html', 'assets/backup.js'];
function build(output = path.resolve(__dirname, '../dist')) {
  const root = path.resolve(__dirname, '..');
  for (const file of files) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    if (file.endsWith('.js')) new vm.Script(source, { filename: file });
    else for (const script of source.matchAll(/<script>([\s\S]*?)<\/script>/g)) new vm.Script(script[1]);
    fs.mkdirSync(path.dirname(path.join(output, file)), { recursive: true });
    fs.writeFileSync(path.join(output, file), source);
  }
  fs.writeFileSync(path.join(output, '.nojekyll'), '');
  console.log('Static game built in ' + output);
}
if (require.main === module) build();
module.exports = { build, files };
