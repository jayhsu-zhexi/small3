const fs = require('node:fs');
const path = require('node:path');
// Evaluate the existing game in its DOM-free sandbox, so additions to its banks
// automatically become available to the board without a second hand-edited bank.
const { boot } = require('./game-harness.cjs');
function exportBank() {
  const bank = JSON.parse(boot().run('JSON.stringify({chinese:[...chinese,...chineseAdvanced],english:[...englishWords[4],...englishWords[5]]})'));
  const output = '/* Generated from the existing learning game. */\nwindow.PlanetBoardBank = ' + JSON.stringify(bank) + ';\n';
  fs.writeFileSync(path.resolve(__dirname, '../assets/board-bank.js'), output);
  return bank;
}
if (require.main === module) exportBank();
module.exports = { exportBank };
