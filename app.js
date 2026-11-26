const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const helsinki = 'https://programming-26.mooc.fi/part-1/';
const voltaic = 'https://voltaic.gg/resources/quick-start';
const routine = 'https://voltaic.gg/resources/fundamental-routine-kovaaks';
const iconNames = {python:'Scroll', amang:'Aim', professions:'Professions', tailoring:'Thread', alchemy:'Potion', cooking:'Cooking'};
const tracks = ['Tracking','Clicking','Switching'];
const task = (name,group,goal,proof,reward,source) => ({name,group,goal,proof,reward,source});
const pyTasks = [
 task('Emoticon','Getting started','Write a Python program that displays a smiley face. When you run it, you should see exactly these three characters: :-)','Attach your .py file and paste the line it prints.',1,helsinki+'1-getting-started/'),
 task('Minutes in a year','Getting started','Calculate how many minutes there are in 365 days. Have Python multiply the days, hours per day, and minutes per hour, then print the result.','Attach your .py file. Check that it prints 525600.',1,helsinki+'1-getting-started/'),
 task('Name twice','Information from the user','Ask for a name once. Display that name on two separate lines. If you enter Mia, both lines should say Mia.','Attach your .py file and paste one run with a name of your choice.',1,helsinki+'2-information-from-the-user/'),
 task('Times five','Arithmetic operations','Ask for a whole number and multiply it by five. For example, entering 8 should produce the line “8 times 5 is 40”.','Attach your .py file and show what it prints for 8.',3,helsinki+'4-arithmetic-operations/'),
 task('Sum and product','Arithmetic operations','Ask for two numbers. Print the result of adding them and the result of multiplying them. For 4 and 6 the two results are 10 and 24.','Attach your .py file and paste both lines of output.',3,helsinki+'4-arithmetic-operations/'),
 {...task('Calculator','Conditional statements','Ask for two numbers and an operation: add, multiply, or subtract. Print the matching equation. For 8, 3, and subtract, display “8 - 3 = 5”. For any other operation, end without printing a result.','Attach your .py file and show a run for each supported operation and one unrecognized operation.',50,helsinki+'5-conditional-statements/'),checkpoint:true}
];
const formerPythonNames=['Greet an adventurer','Count your provisions','Split the party loot','Check the guild discount','Build a supply calculator','Apprentice trial'];
function updateCatalog(journal){
 let changed=false;
 const aiming=journal.find(s=>s.id==='amang');
 if(aiming && /^amang$/i.test(aiming.name)){aiming.name='Aiming';changed=true}
 if(aiming){
  const old=['Follow a smooth strafe','Read a direction change','Confirm each click','Switch between targets'];
  old.forEach((name,i)=>{
   if(aiming.recipes[i]?.name===name && aiming.recipes[i].source===routine){
    aiming.recipes[i]=aimTasks[i];
    delete aiming.tiers[i];
    for(const entry of aiming.entries){if(entry.recipe===i)entry.recipe=null}
    changed=true;
   }
  });
  for(const drill of aimTasks){
   if(!aiming.recipes.some(r=>r.name===drill.name)){aiming.recipes.push(drill);changed=true}
  }
 }
 const python=journal.find(s=>s.id==='python');
 formerPythonNames.forEach((oldName,i)=>{
  if(python?.recipes[i]?.name!==oldName || python.recipes[i].source!==helsinki)return;
  python.recipes[i]=pyTasks[i];
  delete python.tiers[i];
  for(const entry of python.entries){if(entry.recipe===i)entry.recipe=null}
  changed=true;
 });
 return changed;
}
function aimDrill(name,group,trainer,focus,reward){
 return {...task(name,group,'Open '+trainer+' and play '+name+'. '+focus,
  'Attach a result screenshot or score export from this scenario and record your score.',reward,null),trainer};
}
const aimTasks = [
 aimDrill('Smoothness Training 60','Tracking','KovaaK’s','Follow the target and notice when your crosshair starts to shake.',1),
 aimDrill('Kindaclose Fast Strafes','Tracking','KovaaK’s','Focus on catching the target again after it changes direction.',3),
 aimDrill('Jumbo 1wall6targets TE','Clicking','KovaaK’s','Aim at each target before clicking. Compare accuracy and score over three runs.',3),
 aimDrill('voxTS Viscose Varied','Switching','KovaaK’s','Move directly to the next target and notice whether you overshoot it.',3),
 aimDrill('VT Suavetrack Intermediate','Tracking','KovaaK’s','Complete three runs with the same settings and record the middle score.',3),
 aimDrill('Revolving Tracking Slow','Tracking','KovaaK’s','Keep contact as the target moves. Record where you lose it.',1),
 aimDrill('SixshotUltimate','Clicking','Aimlabs','Click each small target deliberately. Record your accuracy alongside your score.',3),
 aimDrill('GridshotUltimate','Clicking','Aimlabs','Record score and accuracy at a pace you can repeat.',1),
 aimDrill('SpheretrackStandard','Tracking','Aimlabs','Follow the target through changes of direction and record your result.',3),
 aimDrill('SwitchtrackUltimate','Switching','Aimlabs','Move to each new target and settle your crosshair before the next switch.',3),
 aimDrill('Swirltrack S2 Precision','Tracking','Aimlabs','Follow the moving target through its turns.',1),
 aimDrill('VT Steadytrack Intermediate S3','Tracking','Aimlabs','Keep your crosshair steady as the target moves.',1),
 aimDrill('VT Angleshot Novice S3','Clicking','Aimlabs','Place each click on the moving target.',1),
 aimDrill('VT Verttrack Novice S3','Tracking','Aimlabs','Follow changes in vertical movement.',1),
 aimDrill('VT Pasu Dodge Novice','Clicking','Aimlabs','Time your clicks while dodging.',1)
];
const makeSkill = (id,name,icon,recipes) => ({id,name,icon,recipes,level:1,entries:[],baselines:[],draft:null,tiers:{}});
const initial = () => [makeSkill('python','Python Programming','python',pyTasks),makeSkill('amang','Aiming','amang',aimTasks)];
let db, skills, current=null, selected=0;
const active = () => skills.find(s=>s.id===current);
const uid = () => crypto.randomUUID();
function openDB(){
 return new Promise((resolve,reject)=>{
  const r=indexedDB.open('LifeQuestJournal',1);
  r.onupgradeneeded=()=>{r.result.createObjectStore('journal');r.result.createObjectStore('files')};
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
 });
}
async function load(){
 const tx=db.transaction('journal','readwrite'), store=tx.objectStore('journal'), r=store.get('skills');
 r.onsuccess=()=>{skills=r.result||initial();if(updateCatalog(skills))store.put(skills,'skills')};
 await new Promise((res,rej)=>{tx.oncomplete=res;tx.onabort=()=>rej(tx.error)});
 render();
}
async function save(change,file){
 const tx=db.transaction(['journal','files'],'readwrite'), journal=tx.objectStore('journal'), read=journal.get('skills');
 const fileId=file?uid():null;
 let problem;
 read.onsuccess=()=>{
  try{const latest=read.result||initial();change(latest,fileId);if(file)tx.objectStore('files').put(file,fileId);journal.put(latest,'skills')}
  catch(e){problem=e;tx.abort()}
 };
 await new Promise((res,rej)=>{tx.oncomplete=res;tx.onabort=()=>rej(problem||tx.error||Error('Save failed'))});
 await load();$('dialog').close();
}
const icon = s=>'<span class="icon"><img alt="" src="assets/'+esc(s.icon)+'.jpg"></span>';

const bar = s=>`<span class="bar ${s.id==='amang'?'red':''}"><i style="width:${s.level/7}%"></i><span>${esc(s.name)} ${s.level}/700</span></span>`;
const btn=(act,label,arg='')=>'<button type="button" data-do="'+act+'" data-arg="'+esc(arg)+'">'+label+'</button>';
const link=(url,label)=>'<a target="_blank" rel="noreferrer" href="'+esc(url)+'">'+esc(label)+'</a>';
const tierNames=['Routine','Minor practice','Useful practice','Stretch'];
const rank=s=>s.level>=500?'Artisan':s.level>=350?'Expert':s.level>=100?'Journeyman':'Apprentice';
let query='',filter='all';
const closedGroups=new Set();
function openSkill(id){
 current=id;selected=0;query='';filter='all';closedGroups.clear();render();
}
function tile(action,title,description,button,art){
 const tileIcon=['professions','python','alchemy'][art-1];
 return `<section class="utility u${art}"><h2>${title}</h2><p>${description}</p><button class="utility-action" data-do="${action}">${icon({icon:tileIcon})}<span>${button}</span></button></section>`;
}
function overview(){
 const rows=skills.map((s,i)=>`<section class="profession wide${i%2+1}"><h2>${esc(s.name)}</h2>
 <button class="profession-row" data-do="open" data-arg="${esc(s.id)}">${icon(s)}<span class="skill-name">${esc(s.name)}<small>${rank(s)}</small></span>${bar(s)}</button></section>`).join('');
 return `<div class="overview"><div class="professions">${rows}</div><div class="utilities">
 ${tile('add','New profession','Choose a skill to train and add it to your profession book.','Add skill',1)}
 ${tile('journal','Craft journal','Revisit completed crafts and their evidence.','View journal',2)}
 ${tile('backup','Journal backup','Save your professions, progress, and evidence together.','Export journal',3)}
 </div></div>`;
}
function record(entry){
 return `<div class="entry"><strong>${esc(entry.name)}</strong> <small>${esc(entry.date.slice(0,10))}</small><p>${esc(entry.note)}</p>${entry.code?'<pre>'+esc(entry.code)+'</pre>':''}${entry.fileId?btn('file','Open evidence',entry.fileId):''}</div>`;
}
function journal(s){
 const levels=[50,100,350,500,700].filter(n=>s.level>=n);
 const baseline=s.id==='amang'?'<h3>Practical placement</h3>'+tracks.map(t=>{
  const b=s.baselines.filter(v=>v.family===t).at(-1);
  return `<p>${t} · ${b?esc(b.scenario)+' · '+esc(b.metric)+' · median '+b.median:'Awaiting a practical sample'}</p>`;
 }).join('')+s.baselines.slice().reverse().map(record).join(''):'';
 return `<h3>${esc(s.name)}</h3>${s.entries.slice().reverse().map(record).join('')||'<p>No crafts yet.</p>'}
 <h3>Achievements</h3><p>${levels.map(n=>esc(s.name)+' '+n).join(' · ')||'First milestone at 50 points.'}</p>${baseline}`;
}
function recipeList(s){
 const groups=new Map();
 s.recipes.forEach((r,i)=>{
  const tier=s.tiers[i]??3;
  if(!r.name.toLowerCase().includes(query.toLowerCase())||(filter!=='all'&&tier!==Number(filter)))return;
  if(!groups.has(r.group))groups.set(r.group,[]);
  groups.get(r.group).push(`<button class="recipe ${selected===i?'chosen':''}" data-do="select" data-arg="${i}" aria-pressed="${selected===i}"><span class="arrows tier${tier}" aria-label="${tierNames[tier]}">${'<i></i>'.repeat(tier)}</span>${esc(r.name)}</button>`);
 });
 return Array.from(groups,([group,rows])=>`<section><button class="category" data-do="group" data-arg="${esc(group)}" aria-expanded="${!closedGroups.has(group)}">${esc(group)}<b>${closedGroups.has(group)?'+':'−'}</b></button>${closedGroups.has(group)?'':rows.join('')}</section>`).join('')||'<p class="empty">No matching recipes.</p>';
}
function detail(s){
 const r=s.recipes[selected];
 const placement=s.id==='python'?btn('pyplace','Check my placement'):s.id==='amang'?btn('baseline',s.draft?'Resume placement':'Start practical placement'):'';
 return `<div class="skillbar">${bar(s)}</div><div class="workbench"><div class="left-pane">
 <div class="searchbar"><input type="search" id="search" aria-label="Search recipes" placeholder="Search" value="${esc(query)}"><select id="filter" aria-label="Filter recipes by difficulty"><option value="all">Filter</option>${tierNames.map((v,i)=>'<option value="'+i+'" '+(filter===String(i)?'selected':'')+'>'+v+'</option>').join('')}</select></div>
 <div id="recipes">${recipeList(s)}</div></div>
 <article class="paper">${r?`<div class="item-head">${icon(s)}<h2>${esc(r.name)}</h2></div><p>${esc(r.goal)}</p>
 ${s.id==='amang'?'<p>Runs logged: '+s.entries.filter(e=>e.recipe===selected).length+'</p>':s.id==='python'&&Object.hasOwn(pythonChecks,r.name)?'':`<h3>Evidence required</h3><div class="reagent">${icon({icon:'python'})}<p>${esc(r.proof)}</p></div>`}${r.source&&s.id!=='python'?'<p>'+link(r.source,'Curriculum reference')+'</p>':''}
 <div class="paper-tools">${btn('difficulty','Set difficulty')}</div>`:'<h2>Create your first recipe</h2>'}</article></div>
 <footer>${btn('recipe','Add recipe')}${btn('journal','Journal')}${placement}${r?btn('craft',s.id==='python'&&Object.hasOwn(pythonChecks,r.name)?'Write solution':s.id==='amang'?'Log one run':'Submit craft'):''}</footer>`;
}
function render(){
 const s=active();
 $('caption').textContent=s?s.name:'Professions';
 $('library').title=s?'Change profession icon':'Professions';
 $('library').setAttribute('aria-label',$('library').title);
 $('portrait').src='assets/'+(s?s.icon:'professions')+'.jpg';
 $('tabs').innerHTML=[{id:'',name:'Professions',icon:'professions'},...skills].map(t=>`<button class="tab ${(current||'')===t.id?'active':''}" data-do="open" data-arg="${esc(t.id)}" title="${esc(t.name)}" aria-label="${esc(t.name)}" aria-current="${(current||'')===t.id?'page':'false'}">${icon(t)}</button>`).join('');
 $('window').classList.toggle('detail',Boolean(s));
 $('app').innerHTML=s?detail(s):overview();
}

function modal(title,body){$('modal').innerHTML='<h2 id="dialog-title">'+esc(title)+'</h2>'+body;if(!$('dialog').open)$('dialog').showModal()}
const field=(label,name,attrs='required')=>'<label>'+label+'<input name="'+name+'" '+attrs+'></label>';
const select=(label,name,values)=>'<label>'+label+'<select name="'+name+'">'+values.map(v=>'<option>'+esc(v)+'</option>').join('')+'</select></label>';
const note=(label)=>'<label>'+label+'<textarea name="note" required rows="2"></textarea></label>';
const attachment=()=>field('Evidence file (saved on this device)','file','type="file" required');
function form(title,body,submit,fn){modal(title,'<form id="editor" class="form">'+body+'<button>'+submit+'</button></form>');$('editor').onsubmit=async e=>{e.preventDefault();const b=e.submitter;b.disabled=true;try{await fn(new FormData(e.target))}catch(err){alert(err.message)}finally{b.disabled=false}}}
const date=()=>new Date().toISOString();
function baseline(s){
 const d=s.draft;
 if(!d){form('Predict your performance','<p>Choose one exact benchmark and version. After a warm-up, play three scored runs with the same settings. Repeat this assessment for each aim family.</p>'+select('Trainer','trainer',['KovaaK’s','Aimlabs'])+select('Aim family','family',tracks)+field('Scenario name (choose or type)','scenario','list="aim-scenarios" required')+'<datalist id="aim-scenarios"></datalist>'+field('Settings to repeat (sensitivity, duration, speed)','settings')+select('Metric','metric',['Scenario score','Accuracy (%)'])+field('Predicted typical result','prediction','type="number" min="0" step="any" required')+'<p>'+link(voltaic,'Choose a Voltaic benchmark')+'</p>','Lock prediction',async f=>{if(f.get('metric')==='Accuracy (%)'&&Number(f.get('prediction'))>100)throw Error('Accuracy must be between 0 and 100.');await save(all=>{const a=all.find(v=>v.id===s.id);if(a.draft)throw Error('A prediction is already open.');a.draft={...Object.fromEntries(f),id:uid()}});baseline(active())});
  const inputs=$('editor').elements;
  const choices=()=>{const matches=aimTasks.filter(r=>r.trainer===inputs.trainer.value&&r.group===inputs.family.value);$('aim-scenarios').innerHTML=matches.map(r=>'<option value="'+esc(r.name)+'"></option>').join('')};
  inputs.trainer.onchange=choices;inputs.family.onchange=choices;
  const drill=s.recipes[selected];
  if(drill?.trainer){inputs.trainer.value=drill.trainer;inputs.family.value=drill.group;inputs.scenario.value=drill.name}
  choices();return}
 const max=d.metric==='Accuracy (%)'?'max="100"':'';
 form('Record your three runs','<p>'+esc(d.trainer)+' · '+esc(d.family)+' · '+esc(d.scenario)+'</p><p>'+esc(d.settings)+'</p><p>Locked prediction: '+esc(d.prediction)+' ('+esc(d.metric)+')</p><div class="scores">'+[1,2,3].map(i=>field('Run '+i,'r'+i,'type="number" min="0" step="any" required '+max)).join('')+'</div>'+field('Observation (optional)','note','')+btn('discard','Discard prediction'),'Save baseline',async f=>{
 const runs=[1,2,3].map(i=>Number(f.get('r'+i))),median=[...runs].sort((a,b)=>a-b)[1],delta=Number((median-Number(d.prediction)).toFixed(3));
 await save((all,fileId)=>{const a=all.find(v=>v.id===s.id);if(a.draft?.id!==d.id)throw Error('This assessment has already changed.');a.baselines.push({name:d.family+' · '+d.scenario,date:date(),fileId,...d,runs,median,note:d.trainer+' · '+d.settings+' · '+d.metric+' · predicted '+d.prediction+' · runs '+runs.join(', ')+' · median '+median+' · difference '+(delta>0?'+':'')+delta+' — '+f.get('note')});a.draft=null});$('notice').textContent='Baseline saved. Median '+median+'.';});
}
async function craft(s){
 const index=selected,r=s.recipes[index],checkpoint=r.checkpoint,tier=s.tiers[index]??3;
 const token=uid();
 const complete=async f=>{const codeSolution=Boolean(f?.get('code'));
 let gained=0;await save((all,fileId)=>{const a=all.find(v=>v.id===s.id);if(a.entries.some(e=>e.id===token))throw Error('Already saved.');
 const code=f?.get('code');
 let gain=checkpoint?Math.max(0,r.reward-a.level):code?r.reward:r.reward===10?(a.entries.some(e=>e.recipe===index)?0:10):(Math.random()<[0,.15,.60,1][tier]?r.reward:0);
 const limit=s.id==='python'?(checkpoint?50:49):700;
 gained=Math.max(0,Math.min(gain,limit-a.level));a.level+=gained;a.entries.push({id:token,recipe:index,fileId,name:r.name+' · +'+gained,date:date(),code:code||undefined,note:f?.get('note')||''})},f?.get('file'));$('notice').textContent=s.id==='amang'?r.name+' · Run logged.':(codeSolution?'Checks passed · +':'Craft saved · +')+gained+' skill points.';};
 if(s.id==='amang')return complete();
 if(s.id==='python'&&Object.hasOwn(pythonChecks,r.name))return openPythonEditor(r,complete);
 form(r.name,'<p>'+esc(r.proof)+'</p>'+attachment()+note('How does the artifact meet the criteria?')+'<label><span><input type="checkbox" required> I checked my work against the criteria.</span></label>','Save craft',complete);
}
async function action(act,arg){
 const s=active();$('notice').textContent='';
 if(act==='backup'){
  const tx=db.transaction(['journal','files']),files=tx.objectStore('files');
  const read=r=>new Promise((ok,fail)=>{r.onsuccess=()=>ok(r.result);r.onerror=()=>fail(r.error)});
  const [journal,keys,blobs]=await Promise.all([read(tx.objectStore('journal').get('skills')),read(files.getAllKeys()),read(files.getAll())]);
  const evidence=await Promise.all(blobs.map((file,i)=>new Promise((ok,fail)=>{const r=new FileReader();r.onload=()=>ok({id:keys[i],name:file.name,data:r.result});r.onerror=()=>fail(r.error);r.readAsDataURL(file)})));
  const out=new Blob([JSON.stringify({version:1,skills:journal||initial(),evidence})],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(out);a.download='lifequest-journal.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),60000);
 }
 if(act==='open')openSkill(arg||null);
 if(act==='select'){selected=Number(arg);render()}
  if(act==='journal')modal('Craft journal',s?journal(s):skills.map(journal).join(''));
 if(act==='group'){closedGroups.has(arg)?closedGroups.delete(arg):closedGroups.add(arg);$('recipes').innerHTML=recipeList(s)}
 if(act==='baseline')baseline(s);
 if(act==='discard'){await save(all=>{all.find(v=>v.id===s.id).draft=null})}
 if(act==='craft')await craft(s);
 if(act==='pyplace')form('Python placement','<p>Optional knowledge check. What does input() return?</p>'+select('Answer','answer',['Choose an answer','Text','An integer','A printed line'])+'<p>The practical checkpoint is the Calculator exercise.</p>','See practical task',f=>{selected=s.recipes.findIndex(r=>r.checkpoint);render();const r=s.recipes[selected];modal(r.name,'<p>'+(f.get('answer')==='Text'?'Correct. ':f.get('answer')==='Choose an answer'?'':'Python returns text from input(). ')+'</p><p>'+esc(r.goal)+'</p>'+btn('craft','Write solution'))});
 if(act==='add')form('Add a profession',field('Skill name','name'),'Add skill',async f=>{const name=f.get('name').trim();if(!name)throw Error('Enter a skill name.');const id=uid(),icon=/aim|fps/i.test(name)?'amang':/sew|cloth/i.test(name)?'tailoring':/cook/i.test(name)?'cooking':/python|cod/i.test(name)?'python':'professions';await save(all=>all.push(makeSkill(id,name,icon,[])));current=id;selected=0;render()});
 if(act==='recipe')form('Add a recipe',field('Recipe name','name')+field('What will you make or perform?','goal')+field('Evidence and completion criteria','proof')+select('Points','reward',[1,3,10]),'Add recipe',async f=>{
  const recipe=task(f.get('name').trim(),'My recipes',f.get('goal').trim(),f.get('proof').trim(),Number(f.get('reward')),null);
  if(!recipe.name||!recipe.goal||!recipe.proof)throw Error('Complete all recipe fields.');
  await save(all=>{const a=all.find(v=>v.id===s.id);a.recipes.push(recipe);selected=a.recipes.length-1});
 });
 if(act==='icon')modal('Profession icon','<div class="actions">'+Object.entries(iconNames).map(([key,label])=>btn('pickicon',icon({icon:key})+label,key)).join('')+'</div>');
 if(act==='pickicon')await save(all=>{all.find(v=>v.id===s.id).icon=arg});
 if(act==='difficulty')modal('Recipe difficulty','<div class="actions">'+tierNames.map((v,i)=>btn('tier',v,i)).join('')+'</div>');
 if(act==='tier')await save(all=>{all.find(v=>v.id===s.id).tiers[selected]=Number(arg)});
 if(act==='file'){const req=db.transaction('files').objectStore('files').get(arg);req.onsuccess=()=>{if(!req.result)return;const a=document.createElement('a');a.href=URL.createObjectURL(req.result);a.download=req.result.name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),60000)}}
}
const uiSounds=new Map();
function playUI(cue){
 let clip=uiSounds.get(cue);
 if(!clip){clip=new Audio('assets/wow-'+cue+'.ogg');clip.volume=.45;uiSounds.set(cue,clip)}
 clip.currentTime=0;
 clip.play().catch(()=>{});
}
document.addEventListener('click',e=>{
 const b=e.target.closest('button');
 if(!b)return;
 const act=b.dataset.do;
 if(b.id==='closeWindow'||b.matches('.close'))playUI('close');
 else if(b.id==='reopen'||(act==='open'&&!current&&b.dataset.arg))playUI('open');
 else if(act||b.id==='library'||b.matches('#editor button'))playUI('tab');
 if(act)action(act,b.dataset.arg).catch(err=>alert(err.message));
});
$('dialog').addEventListener('cancel',()=>playUI('close'));
$('library').onclick=()=>{if(active())action('icon');else openSkill(null)};
$('closeWindow').onclick=()=>{if(active())openSkill(null);else{$('window').hidden=true;$('reopen').hidden=false;$('reopen').focus()}};
$('reopen').onclick=()=>{$('window').hidden=false;$('reopen').hidden=true;$('library').focus()};
document.addEventListener('input',e=>{if(e.target.id==='search'){query=e.target.value;$('recipes').innerHTML=recipeList(active())}});
document.addEventListener('change',e=>{if(e.target.id==='filter'){filter=e.target.value;$('recipes').innerHTML=recipeList(active())}});
openDB().then(connection=>{db=connection;return load()}).catch(err=>{$('notice').textContent='Local journal unavailable: '+err.message});



