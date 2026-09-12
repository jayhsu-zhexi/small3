const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const files = ['kart.html', 'assets/kart-engine.js', 'assets/kart-render.js', 'assets/kart-audio.js', 'assets/kart-ui.js', 'assets/kart.css', 'assets/kart-home.png', 'assets/kart-asphalt.png', 'assets/kart-rock.png', 'assets/kart-carbon.png', 'assets/kart-sky.png', 'assets/kart-sky-lagoon.png', 'assets/kart-sky-cliff.png', 'assets/kart-sky-serpent.png', 'assets/kart-player-rear.png', 'assets/kart-player-left.png', 'assets/kart-player-right.png', 'assets/vendor/three-0.160.1.min.js', 'assets/vendor/three-LICENSE.txt', 'survival.html', 'assets/survival-engine.js', 'assets/survival-audio.js', 'assets/survival-render.js', 'assets/survival-ui.js', 'assets/survival.css', 'assets/survival-atlas.png', 'vault.html', 'assets/vault.css', 'assets/vault-engine.js', 'assets/vault-audio.js', 'assets/vault-ui.js', 'index.html', 'board.html', 'detective.html', 'parcels.html', 'crossing.html', 'memory.html', 'assets/memory-engine.js', 'assets/memory-records.js', 'assets/memory-ui.js', 'assets/memory-audio.js', 'assets/memory.css', 'assets/memory-home.css', 'assets/memory-cards.css', 'assets/memory-cinematics.css', 'assets/memory-control-discs.webp', 'assets/memory-result-win.webp', 'assets/memory-result-loss.webp', 'assets/memory-card-shells.webp', 'assets/memory-equipment-1.webp', 'assets/memory-equipment-2.webp', 'assets/memory-equipment-3.webp', 'assets/memory-home-v2.webp', 'assets/memory-controls.webp', 'assets/memory-title.webp', 'assets/memory-home-icons.webp', 'assets/memory-icons.svg', 'assets/memory-background.webp', 'assets/attention-ui.js', 'assets/attention.css', 'assets/detective-ui.js', 'assets/detective.css', 'assets/backup.js', 'assets/board-engine.js', 'assets/board-bank.js', 'assets/board-ui.js', 'assets/board-audio.js', 'assets/board-records.js', 'assets/board.css', 'assets/board-island.png'];
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
