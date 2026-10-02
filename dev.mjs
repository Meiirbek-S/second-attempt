import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=import.meta.dirname;
const allowed=new Set(['index.html','style.css','soft.css','preview.js','script.js','model.js','config.js','ticket.html','ticket.css','ticket.js','ticket-data.js','favicon.svg']);
const port=Number(process.env.PORT||4173);http.createServer(async(req,res)=>{const pathname=new URL(req.url,'http://localhost').pathname;const file=pathname==='/'?'index.html':pathname.slice(1);if(pathname==='/api/confirm'){if(req.method!=='POST'){res.writeHead(405);return res.end(JSON.stringify({ok:false}));}res.writeHead(200,{'content-type':'application/json','cache-control':'no-store'});return res.end(JSON.stringify({ok:true,preview:true}));}if(!allowed.has(file)){res.writeHead(404);return res.end('Not found');}try{const data=await fs.readFile(path.join(root,file));res.writeHead(200,{'content-type':file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':'text/html','cache-control':'no-store'});res.end(data)}catch{res.writeHead(404);res.end('Not found')}}).listen(port,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:'+port));
