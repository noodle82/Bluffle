import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const root = process.cwd();
const source = path.join(root, '_bluffle-native');
const app = path.join(root, 'ios/App/App');
const bank = JSON.parse(fs.readFileSync(path.join(source, 'bluffle-premium-questions.json'), 'utf8'));
if (bank.productId !== 'com.bluffle.premium_lifetime' || bank.uniqueCount !== 360 ||
    bank.kids.length !== 125 || bank.classic.length !== 254) throw Error('Unexpected Premium bank.');
for (const mode of ['kids', 'classic']) {
  if (bank[mode].some(q => !Array.isArray(q) || q.length !== 6 || q.some(v => typeof v !== 'string')) ||
      new Set(bank[mode].map(q => q[5])).size !== bank[mode].length) throw Error('Invalid '+mode+' Premium records.');
}
if (new Set([...bank.kids, ...bank.classic].map(q => q[5])).size !== 360) throw Error('Premium union count differs.');
for (const file of ['BlufflePremium.swift', 'bluffle-premium-questions.json']) {
  fs.copyFileSync(path.join(source, file), path.join(app, file));
}
const storyboard = path.join(app, 'Base.lproj/Main.storyboard');
let xml = fs.readFileSync(storyboard, 'utf8');
if (!/customClass="(?:CAPBridgeViewController|BluffleViewController)"/.test(xml)) throw Error('Unexpected iOS view controller; refusing to overwrite it.');
xml = xml.replace(/customClass="(?:CAPBridgeViewController|BluffleViewController)"(?: customModule="[^"]*")?(?: customModuleProvider="[^"]*")?/,
  'customClass="BluffleViewController" customModule="App" customModuleProvider="target"');
fs.writeFileSync(storyboard, xml);
// The app uses Apple's OS services, with no non-exempt encryption implementation.
const plistPath = path.join(app, 'Info.plist');
let plist = fs.readFileSync(plistPath, 'utf8');
if (!plist.includes('<plist') || !plist.includes('</dict>')) throw Error('Unexpected Info.plist format.');
if (plist.includes('<key>ITSAppUsesNonExemptEncryption</key>')) {
  const setting = /(<key>ITSAppUsesNonExemptEncryption<\/key>\s*)<(?:true|false)\s*\/>/;
  if (!setting.test(plist)) throw Error('Unexpected encryption declaration format.');
  plist = plist.replace(setting, '$1<false/>');
} else {
  const lastDict = plist.lastIndexOf('</dict>');
  plist = plist.slice(0, lastDict) + '  <key>ITSAppUsesNonExemptEncryption</key>\n  <false/>\n' + plist.slice(lastDict);
}
fs.writeFileSync(plistPath, plist);
execFileSync('ruby', [path.join(root, 'scripts/register-bluffle-premium.rb')], {cwd: root, stdio: 'inherit'});
console.log('BLUFFLE native Premium purchase bridge and 360 questions installed.');
