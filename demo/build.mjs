import {mkdir,cp,readFile,writeFile,stat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
for(const f of ['app.js','domain.mjs','server.mjs'])execFileSync(process.execPath,['--check',f]);
await mkdir('dist',{recursive:true});
for(const f of ['index.html','style.css','app.js','domain.mjs','ASSETS.md'])await cp(f,'dist/'+f);
await cp('assets','dist/assets',{recursive:true});
for(const f of ['tee.jpg','jeans.jpg','sneakers.webp','blue-jeans.jpg'])if((await stat('dist/assets/'+f)).size<1000)throw Error('Invalid image '+f);
const html=await readFile('dist/index.html','utf8');if(!html.includes('lang="zh-CN"'))throw Error('Document language missing');
console.log('Build passed: validated static output in dist/');

