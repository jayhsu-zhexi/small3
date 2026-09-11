const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const files = ['index.html', 'board.html', 'detective.html', 'assets/detective-ui.js', 'assets/detective.css', 'assets/backup.js', 'assets/board-engine.js', 'assets/board-bank.js', 'assets/board-ui.js', 'assets/board-audio.js', 'assets/board-records.js', 'assets/board.css', 'assets/board-island.png'];
function build(output = path.resolve(__dirname, '../dist')) {
  const root = path.resolve(__dirname, '..');
  for (const file of files) {
    const source = fs.readFileSync(path.join(root, file));
    if (file.endsWith('.js')) new vm.Script(source.toString('utf8'), { filename: file });
    else if(file.endsWith('.html')) for (const script of source.toString('utf8').matchAll(/<script>([\s\S]*?)<\/script>/g)) new vm.Script(script[1]);
    fs.mkdirSync(path.dirname(path.join(output, file)), { recursive: true });
    fs.writeFileSync(path.join(output, file), source);
  }
  fs.writeFileSync(path.join(output, '.nojekyll'), '');
  console.log('Static game built in ' + output);
}
if (require.main === module) build();
module.exports = { build, files };
