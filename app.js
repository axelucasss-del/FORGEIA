const KEY='forgeai_static_v3';

const EXERCISES={
  'Hipertrofia':[
    ['Supino reto','Peito',4,'8-12'],['Puxada alta','Costas',4,'8-12'],['Agachamento livre','Pernas',4,'6-10'],
    ['Desenvolvimento com halteres','Ombros',3,'8-12'],['Remada baixa','Costas',3,'10-12'],['Cadeira extensora','Quadríceps',3,'10-15'],
    ['Mesa flexora','Posterior',3,'10-15'],['Rosca direta','Bíceps',3,'10-12'],['Tríceps na polia','Tríceps',3,'10-15']
  ],
  'Força':[
    ['Agachamento livre','Pernas',5,'3-6'],['Supino reto','Peito',5,'3-6'],['Levantamento terra','Posterior',4,'3-5'],
    ['Desenvolvimento militar','Ombros',4,'4-6'],['Remada curvada','Costas',4,'5-8']
  ],
  'Emagrecimento':[
    ['Agachamento goblet','Pernas',3,'10-15'],['Supino com halteres','Peito',3,'10-15'],['Remada baixa','Costas',3,'10-15'],
    ['Avanço','Pernas',3,'10-12'],['Desenvolvimento com halteres','Ombros',3,'10-15'],['Prancha','Core',3,'30-60s']
  ],
  'Recomposição corporal':[
    ['Agachamento livre','Pernas',4,'6-10'],['Supino reto','Peito',4,'8-12'],['Puxada alta','Costas',4,'8-12'],
    ['Levantamento romeno','Posterior',3,'8-12'],['Desenvolvimento com halteres','Ombros',3,'8-12'],['Rosca direta','Bíceps',3,'10-12']
  ]
};

let db=load();
let modalExercise=null;

function load(){
  try{
    const x=JSON.parse(localStorage.getItem(KEY));
    return Object.assign({profile:null,program:null,logs:[],weights:[]},x||{});
  }catch(e){return {profile:null,program:null,logs:[],weights:[]};}
}
function save(){localStorage.setItem(KEY,JSON.stringify(db));}

function $(id){return document.getElementById(id)}
function esc(v){return String(v??'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s]));}
function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2600);}

function showPage(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id===id));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.page===id));
  window.scrollTo({top:0,behavior:'smooth'});
  if(id==='dashboard')renderDashboard();
  if(id==='progresso')renderProgress();
  if(id==='historico')renderHistory();
}

document.addEventListener('click',e=>{
  const b=e.target.closest('[data-page]');
  if(b)showPage(b.dataset.page);
});

function generateProgram(p){
  const source=EXERCISES[p.goal]||EXERCISES.Hipertrofia;
  const days=Number(p.days)||3;
  const dayNames=['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];

  // Prioridade solicitada:
  // Homem -> membros superiores como foco principal.
  // Mulher -> posterior de coxa/glúteos como foco principal.
  // O objetivo do aluno continua sendo respeitado; a prioridade só altera
  // a ordem de distribuição dos exercícios.
  const priority=(p.sex==='Mulher')
    ? ['Posterior','Glúteos','Pernas','Costas','Peito','Ombros','Bíceps','Tríceps','Core','Quadríceps']
    : ['Peito','Costas','Ombros','Bíceps','Tríceps','Posterior','Pernas','Quadríceps','Glúteos','Core'];

  const ranked=[...source].sort((a,b)=>{
    const ai=priority.indexOf(a[1]); const bi=priority.indexOf(b[1]);
    return (ai<0?999:ai)-(bi<0?999:bi);
  });

  const workouts=[];
  for(let d=0;d<days;d++){
    let xs=ranked.filter((_,i)=>i%days===d);
    if(xs.length<4) xs=ranked.filter((_,i)=>i%days===d||i%days===(d+1)%days);
    xs=xs.slice(0,6);

    workouts.push({
      id:d+1,
      dayIndex:d,
      name:`Treino ${String.fromCharCode(65+d)}`,
      dayName:dayNames[d],
      focus:[...new Set(xs.map(x=>x[1]))].slice(0,3).join(' + '),
      priority:p.sex==='Mulher'?'Posterior / Glúteos':'Membros superiores',
      exercises:xs.map(x=>({
        name:x[0],muscle:x[1],sets:x[2],reps:x[3],
        rir:p.level==='Iniciante'?3:p.level==='Intermediário'?2:1,
        rest:p.goal==='Força'?150:90
      }))
    });
  }

  return {
    durationWeeks:12,
    createdAt:new Date().toISOString(),
    sex:p.sex,
    priority:p.sex==='Mulher'?'Posterior / Glúteos':'Membros superiores',
    personalization:p.sex==='Mulher'
      ? 'Prioridade de programação: posterior de coxa e glúteos.'
      : 'Prioridade de programação: membros superiores.',
    phases:[
      {weeks:'1–4',name:'Adaptação',note:'Técnica, consistência e escolha conservadora de cargas.'},
      {weeks:'5–8',name:'Progressão',note:'Aumento gradual de repetições e carga quando o topo da faixa for atingido.'},
      {weeks:'9–12',name:'Intensificação',note:'Manutenção de técnica e progressão controlada.'}
    ],
    workouts
  };
}

function profileFromForm(){
  return {
    name:$('name').value.trim(),age:+$('age').value,sex:$('sex').value,
    height:+$('height').value,weight:+$('weight').value,
    level:$('level').value,goal:$('goal').value,days:+$('days').value,
    duration:$('duration').value,limitations:$('limitations').value.trim()
  };
}

$('profileForm').addEventListener('submit',e=>{
  e.preventDefault();
  const p=profileFromForm();
  if(!p.name||!p.age||!p.height||!p.weight){toast('Preencha os campos obrigatórios.');return;}
  const oldWeight=db.weights.at(-1)?.weight;
  db.profile=p;db.program=generateProgram(p);
  if(!oldWeight)db.weights.push({date:new Date().toISOString(),weight:p.weight});
  save();
  renderAll();showPage('dashboard');
  toast('Ficha de 12 semanas criada com sucesso!');
});

function renderDashboard(){
  if(!db.profile){
    $('dashWeight').textContent='—';$('dashWorkout').textContent='—';$('dashAdherence').textContent='0%';$('dashPRs').textContent='0';
    $('todayTitle').textContent='Seu treino aparecerá aqui';$('todayContent').innerHTML='<div class="empty">Gere uma ficha para começar.</div>';
    $('weekSchedule').innerHTML='<div class="empty">Sua ficha semanal aparecerá aqui.</div>';return;
  }
  $('dashWeight').textContent=db.weights.at(-1)?.weight?.toFixed(1)+' kg';
  $('dashWeightMeta').textContent=db.profile.name;
  const todayIndex=(new Date().getDay()+6)%7;
  const w=db.program?.workouts?.find(x=>x.dayIndex===todayIndex) || db.program?.workouts?.[0];
  $('dashWorkout').textContent=w?.name||'—';$('dashWorkoutMeta').textContent=w?.focus||'';
  const total=(db.program?.workouts?.length||1)*12*4, done=db.logs.length;
  $('dashAdherence').textContent=Math.min(100,Math.round(done/Math.max(total,1)*100))+'%';
  $('dashPRs').textContent=Object.keys(prMap()).length;
  if(w){$('todayTitle').textContent=w.name+' — '+w.focus;$('todayContent').innerHTML=workoutHTML(w);}
  renderWeekSchedule();
}
function renderWeekSchedule(){
  const names=['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
  const mapped=new Map((db.program?.workouts||[]).map(w=>[w.dayIndex,w]));
  $('weekSchedule').innerHTML=names.map((name,i)=>{
    const w=mapped.get(i);
    if(!w){
      return `<div class="week-day rest-day"><div><strong>${name}</strong><span>Descanso / recuperação</span></div><b>DESCANSO</b></div>`;
    }
    return `<div class="week-day"><div><strong>${name} · ${w.name}</strong><span>${esc(w.focus)}</span></div><b>${w.exercises.length} exercícios</b></div>`;
  }).join('');
}
function workoutHTML(w){
  return `<div class="workout-grid">${w.exercises.map(x=>{
    const rec=recommendation(x.name);
    return `<div class="exercise">
      <strong>${esc(x.name)}</strong>
      <small>${x.sets} séries · ${esc(x.reps)} reps · RIR ${x.rir} · ${x.rest}s de descanso<br>${rec.text}</small>
      <button class="mini-btn" data-register="${encodeURIComponent(JSON.stringify(x))}">Registrar série</button>
    </div>`;
  }).join('')}</div>`;
}
function recommendation(name){
  const logs=db.logs.filter(l=>l.exercise===name).sort((a,b)=>b.date.localeCompare(a.date));
  if(!logs.length)return {text:'Comece com uma carga confortável e técnica consistente.'};
  const last=logs[0], max=Math.max(...logs.map(l=>+l.weight||0));
  return {text:+last.reps>=12?`Próxima sugestão: ${max+2.5} kg, mantendo controle.`:`Sugestão: mantenha ${max} kg e busque mais repetições.`};
}

document.addEventListener('click',e=>{
  const b=e.target.closest('[data-register]');
  if(!b)return;
  modalExercise=JSON.parse(decodeURIComponent(b.dataset.register));
  $('modalExercise').textContent=modalExercise.name;
  const rec=db.logs.filter(l=>l.exercise===modalExercise.name).sort((a,b)=>b.date.localeCompare(a.date))[0];
  $('logWeight').value=rec?.weight||'';
  $('logReps').value=rec?.reps||'';
  $('logRir').value=rec?.rir ?? modalExercise.rir ?? 2;
  $('modal').classList.remove('hidden');
});

$('modalClose').addEventListener('click',()=>$('modal').classList.add('hidden'));
$('modal').addEventListener('click',e=>{if(e.target.id==='modal')$('modal').classList.add('hidden')});
$('saveLogBtn').addEventListener('click',()=>{
  const weight=+$('logWeight').value,reps=+$('logReps').value,rir=+$('logRir').value;
  if(!weight||!reps){toast('Informe carga e repetições.');return;}
  db.logs.push({id:Date.now(),date:new Date().toISOString(),exercise:modalExercise.name,weight,reps,rir});
  save();$('modal').classList.add('hidden');renderAll();toast('Série registrada!');
});

function prMap(){
  const m={};db.logs.forEach(l=>m[l.exercise]=Math.max(m[l.exercise]||0,+l.weight||0));return m;
}
function renderProgress(){
  const ws=db.weights||[], initial=ws[0]?.weight, current=ws.at(-1)?.weight;
  $('initialWeight').textContent=initial?initial.toFixed(1)+' kg':'—';
  $('currentWeight').textContent=current?current.toFixed(1)+' kg':'—';
  const delta=initial&&current?current-initial:0;
  $('weightChange').textContent=initial&&current?`${delta>=0?'+':''}${delta.toFixed(1)} kg desde o início`:'—';
  const prs=prMap();$('trackedExercises').textContent=Object.keys(prs).length;$('progressPRs').textContent=Object.keys(prs).length;
  const values=Object.entries(prs).sort((a,b)=>a[0].localeCompare(b[0]));
  $('exerciseProgress').innerHTML=values.length?values.map(([n,v])=>{
    const logs=db.logs.filter(x=>x.exercise===n);const first=Math.min(...logs.map(x=>+x.weight||0));const growth=first?Math.max(0,((v-first)/first)*100):0;
    return `<div class="progress-row"><div class="row-top"><strong>${esc(n)}</strong><strong>${v} kg</strong></div><div class="muted" style="font-size:10px;margin-top:5px">Primeira carga: ${first} kg · melhor: ${v} kg</div><div class="bar"><i style="width:${Math.min(100,12+growth)}%"></i></div></div>`;
  }).join(''):'<div class="empty">Registre séries para visualizar sua evolução.</div>';

  const max=Math.max(...ws.map(x=>+x.weight||0),1);
  $('weightChart').innerHTML=ws.slice(-12).map(x=>{
    const h=Math.max(14,(+x.weight/max)*130);
    const label=new Date(x.date).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'});
    return `<div class="weight-bar"><i style="height:${h}px"></i>${(+x.weight).toFixed(1)}<br>${label}</div>`;
  }).join('') || '<div class="empty">Nenhum peso registrado.</div>';
}
$('addWeightBtn').addEventListener('click',()=>{
  const w=prompt('Informe seu peso atual em kg:');
  if(w===null||!w||+w<=0)return;
  db.weights.push({date:new Date().toISOString(),weight:+w});save();renderAll();toast('Peso registrado.');
});

function renderHistory(){
  const arr=[...db.logs].sort((a,b)=>b.date.localeCompare(a.date));
  $('history').innerHTML=arr.length?arr.map(l=>`<div class="history-row"><div><strong>${esc(l.exercise)}</strong><div class="muted">${new Date(l.date).toLocaleString('pt-BR')}</div></div><div class="right"><strong>${l.weight} kg × ${l.reps}</strong><div class="muted">RIR ${l.rir}</div></div></div>`).join(''):'<div class="empty">Nenhuma série registrada ainda.</div>';
}
$('clearLogsBtn').addEventListener('click',()=>{
  if(!db.logs.length)return;
  if(confirm('Excluir todos os registros de treino?')){db.logs=[];save();renderAll();toast('Registros apagados.');}
});

$('exportBtn').addEventListener('click',()=>{
  const blob=new Blob([JSON.stringify(db,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='forgeai-dados.json';a.click();URL.revokeObjectURL(a.href);
});
$('importInput').addEventListener('change',e=>{
  const f=e.target.files[0];if(!f)return;
  const r=new FileReader();r.onload=()=>{
    try{const x=JSON.parse(r.result);db=Object.assign({profile:null,program:null,logs:[],weights:[]},x);save();renderAll();toast('Dados importados.');}
    catch{toast('Arquivo inválido.');}
  };r.readAsText(f);
});
$('resetBtn').addEventListener('click',()=>{
  if(confirm('Isso apagará seu perfil, ficha, peso e histórico. Continuar?')){
    localStorage.removeItem(KEY);location.reload();
  }
});

function fillForm(){
  const p=db.profile;if(!p)return;
  ['name','age','sex','height','weight','level','goal','days','duration','limitations'].forEach(k=>{if($(k))$(k).value=p[k]??''});
}
function renderPreview(){
  if(!db.program||!db.profile){$('programPreview').classList.add('hidden');return;}
  $('programPreview').classList.remove('hidden');
  const names=['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
  const mapped=new Map(db.program.workouts.map(w=>[w.dayIndex,w]));
  $('programPreview').innerHTML=`<div class="panel-header"><div><div class="eyebrow">FICHA ATIVA</div><h2>Semana completa · ${esc(db.profile.goal)}</h2></div><span class="badge">12 SEMANAS</span></div>
  <div class="profile-chip-row"><span class="profile-chip">Perfil: ${esc(db.profile.sex)}</span><span class="profile-chip">Foco: ${esc(db.program.priority)}</span><span class="profile-chip">${esc(db.profile.level)}</span><span class="profile-chip">${db.profile.days} dias/semana</span></div>
  <p class="muted">Semanas 1–4: Adaptação · 5–8: Progressão · 9–12: Intensificação. ${esc(db.program.personalization)}</p>
  <div class="full-week">${names.map((name,i)=>{
    const w=mapped.get(i);
    return w
      ? `<div class="full-week-day"><div class="day-head"><div><span>${name}</span><strong>${w.name}</strong><small>${esc(w.focus)}</small></div><em>${w.exercises.length} exercícios</em></div>${w.exercises.map(x=>`<div class="exercise"><strong>${esc(x.name)}</strong><small>${x.sets} séries · ${esc(x.reps)} reps · RIR ${x.rir} · ${x.rest}s · ${esc(x.muscle)}</small><button class="mini-btn" data-register="${encodeURIComponent(JSON.stringify(x))}">Registrar série</button></div>`).join('')}</div>`
      : `<div class="full-week-day rest-box"><div class="day-head"><div><span>${name}</span><strong>Descanso</strong><small>Recuperação</small></div><em>REST DAY</em></div></div>`;
  }).join('')}</div>`;
}
function renderAll(){renderDashboard();renderProgress();renderHistory();renderPreview();fillForm();}
renderAll();
