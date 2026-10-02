import {mkdir,copyFile,writeFile,rm} from 'node:fs/promises';
const root=new URL('./',import.meta.url);
await rm(new URL('dist/',root),{recursive:true,force:true});
await mkdir(new URL('dist/',root),{recursive:true});
// Owner-only ticket files and every server/secret file are deliberately excluded.
for(const file of ['index.html','style.css','soft.css','preview.js','script.js','model.js','config.js'])await copyFile(new URL(file,root),new URL('dist/'+file,root));
await writeFile(new URL('dist/robots.txt',root),'User-agent: *\nDisallow: /\n');
await writeFile(new URL('dist/_headers',root),`/*
  X-Robots-Tag: noindex, nofollow, noarchive
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  X-Frame-Options: DENY
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'
`);
console.log('Built frontend in dist/; no credentials or ticket template included.');
