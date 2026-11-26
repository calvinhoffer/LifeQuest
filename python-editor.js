const pythonChecks = {
  'Emoticon': [[[], ':-)']],
  'Minutes in a year': [[[], '525600']],
  'Name twice': [[['Mia'], 'Mia\nMia'], [['Alex Chen'], 'Alex Chen\nAlex Chen']],
  'Times five': ['8','-3','0'].map(n=>[[n],n+' times 5 is '+(Number(n)*5)]),
  'Sum and product': [[4,6],[-2,5],[0,3]].map(([a,b])=>[[String(a),String(b)], [a+b,a*b].join('\n')]),
  'Calculator': [[['8','3','subtract'],'8 - 3 = 5'],[['2','5','add'],'2 + 5 = 7'],[['-3','4','multiply'],'-3 * 4 = -12'],[['8','2','divide'],'']]
};
function pythonWorker(){
  self.onmessage=async ({data:{code,cases,name}})=>{
    for(const [inputs,expected] of cases){
      let output='',i=0;
      try{
        Sk.configure({read:path=>{const file=Sk.builtinFiles.files[path];if(file===undefined)throw Error("Module unavailable: "+path);return file},__future__:Sk.python3,output:text=>{output+=text;if(output.length>16000)throw Error('Too much output')},inputfun:()=>{if(i>=inputs.length)throw Error('The program requested more input than this exercise provides.');return inputs[i++]},inputfunTakesPrompt:true});
        await Sk.misceval.asyncToPromise(()=>Sk.importMainWithBody('<exercise>',false,code,true));
        let actual=output.trimEnd().replace(/\r/g,'');
        if(name==='Sum and product')actual=actual.split('\n').map(line=>line.match(/-?\d+\s*$/)?.[0]??line).join('\n');
        if(actual!==expected||i!==inputs.length){self.postMessage({error:'Input: '+(inputs.join(', ')||'(none)')+'\nExpected: '+(expected||'(no output)')+'\nYour output: '+(output.trimEnd()||'(no output)')});return}
      }catch(e){self.postMessage({error:String(e)});return}
    }
    self.postMessage({passed:true});
  };
}
function checkPython(code,name){
  const url=URL.createObjectURL(new Blob([pythonRuntime,'\n;(',pythonWorker.toString(),')();'],{type:'application/javascript'}));
  const worker=new Worker(url);URL.revokeObjectURL(url);
  return new Promise(resolve=>{
    function finish(result){clearTimeout(timer);worker.terminate();resolve(result)}
    const timer=setTimeout(()=>finish({error:'Time limit reached. Check whether a loop keeps running.'}),5000);
    worker.onmessage=e=>finish(e.data);worker.onerror=e=>finish({error:e.message||'Unable to start the Python interpreter.'});
    worker.postMessage({code,name,cases:pythonChecks[name]});
  });
}
function openPythonEditor(recipe,complete){
  form(recipe.name,'<p>'+esc(recipe.goal)+'</p><label>Python code<textarea name="code" rows="10" required spellcheck="false" autocapitalize="off"></textarea></label><pre id="check-result" role="status"></pre>','Check solution',async f=>{
    const editor=$('editor'), feedback=$('check-result');
    feedback.textContent='Running checks…';
    const result=await checkPython(f.get('code'),recipe.name);
    if(!editor.isConnected||!$('dialog').open)return;
    if(result.error){feedback.textContent=result.error;return}
    await complete(f);
  });
  const area=$('editor').elements.code;
  area.focus();
  area.onkeydown=e=>{if(e.key==='Tab'&&!e.shiftKey){e.preventDefault();area.setRangeText('    ',area.selectionStart,area.selectionEnd,'end')}};
}

