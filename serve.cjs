const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.ttf':'font/ttf','.woff2':'font/woff2','.ogg':'audio/ogg'};
const files = new Set(['index.html','style.css','app.js','python-runtime.js','python-editor.js']);
const server = http.createServer((req,res)=>{
  const file = req.url==='/' ? 'index.html' : req.url.slice(1);
  if(!files.has(file)&&!/^assets\/[\w.-]+\.(png|jpg|woff2|ttf|ogg)$/i.test(file)){res.writeHead(404).end();return;}
  fs.readFile(path.join(__dirname,file),(err,content)=>{
    if(err){res.writeHead(err.code==='ENOENT'?404:500).end();return;}
    res.writeHead(200,{'Content-Type':types[path.extname(file)]}).end(content);
  });
});
server.listen(4731,'127.0.0.1',()=>console.log('LifeQuest is ready at http://127.0.0.1:4731'));
