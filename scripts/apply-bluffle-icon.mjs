import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const platform=process.env.CAPACITOR_PLATFORM_NAME?.toLowerCase();
if(platform&&platform!=='ios'){
 console.log(`BLUFFLE icon: skipping ${platform}; iOS assets only.`);
 process.exit(0);
}

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=path.join(root,'resources','bluffle','AppIcon.appiconset');
const assets=path.join(root,'ios','App','App','Assets.xcassets');
const target=path.join(assets,'AppIcon.appiconset');
try{
 const realRoot=await fs.realpath(root);
 const realAssets=await fs.realpath(assets);
 const relative=path.relative(realRoot,realAssets);
 if(relative.startsWith('..')||path.isAbsolute(relative))throw Error('Generated iOS assets resolve outside the project.');
 const project=await fs.readFile(path.join(root,'ios','App','App.xcodeproj','project.pbxproj'),'utf8');
 if(!/ASSETCATALOG_COMPILER_APPICON_NAME\s*=\s*"?AppIcon"?\s*;/.test(project))throw Error('The generated app does not select the AppIcon catalog. Check the Xcode app-icon setting.');
 const raw=await fs.readFile(path.join(source,'Contents.json'));
 const catalog=JSON.parse(raw);
 if(!Array.isArray(catalog.images)||!catalog.images.length)throw Error('Missing prepared icon entries.');
 const files=new Set();
 for(const image of catalog.images){
  if(typeof image.filename!=='string'||path.basename(image.filename)!==image.filename||image.filename.includes('..')||/[\\/]/.test(image.filename))throw Error('Invalid icon filename.');
  const png=await fs.readFile(path.join(source,image.filename));
  if(png.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('Icon is not a PNG: '+image.filename);
  const width=png.readUInt32BE(16),height=png.readUInt32BE(20);
  const points=Number(image.size.split('x')[0]),scale=Number(image.scale.replace('x',''));
  if(width!==height||width!==points*scale)throw Error('Icon dimension mismatch: '+image.filename);
  if(png[25]!==2)throw Error('Expected opaque RGB icon: '+image.filename);
  files.add(image.filename);
 }
 if(!catalog.images.some(i=>i.idiom==='ios-marketing'&&i.size==='1024x1024'))throw Error('Missing 1024px marketing icon.');
 const stat=await fs.lstat(target).catch(e=>e.code==='ENOENT'?null:Promise.reject(e));
 if(stat?.isSymbolicLink())throw Error('Refusing to overwrite a linked icon catalog.');
 await fs.mkdir(target,{recursive:true});
 // Replace only the prepared icon files and catalog. Keep unrelated assets intact.
 for(const filename of files)await fs.copyFile(path.join(source,filename),path.join(target,filename));
 await fs.writeFile(path.join(target,'Contents.json'),raw);
 console.log(`BLUFFLE icon installed: ${files.size} opaque PNG sizes, ${catalog.images.length} iPhone/iPad/App Store entries.`);
}catch(error){
 console.error('BLUFFLE icon setup failed: '+error.message);
 console.error('Run this after generating/syncing the iOS project. Expected ios/App/App/Assets.xcassets and the prepared resources/bluffle catalog.');
 process.exitCode=1;
}
