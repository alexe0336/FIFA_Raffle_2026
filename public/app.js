const COUNTRIES=[
  {name:'United States',code:'us',confederation:'CONCACAF'},
  {name:'Canada',code:'ca',confederation:'CONCACAF'},
  {name:'Mexico',code:'mx',confederation:'CONCACAF'},
  {name:'Panama',code:'pa',confederation:'CONCACAF'},
  {name:'Honduras',code:'hn',confederation:'CONCACAF'},
  {name:'Jamaica',code:'jm',confederation:'CONCACAF'},
  {name:'Argentina',code:'ar',confederation:'CONMEBOL'},
  {name:'Brazil',code:'br',confederation:'CONMEBOL'},
  {name:'Colombia',code:'co',confederation:'CONMEBOL'},
  {name:'Uruguay',code:'uy',confederation:'CONMEBOL'},
  {name:'Ecuador',code:'ec',confederation:'CONMEBOL'},
  {name:'Paraguay',code:'py',confederation:'CONMEBOL'},
  {name:'France',code:'fr',confederation:'UEFA'},
  {name:'England',code:'gb-eng',confederation:'UEFA'},
  {name:'Germany',code:'de',confederation:'UEFA'},
  {name:'Spain',code:'es',confederation:'UEFA'},
  {name:'Portugal',code:'pt',confederation:'UEFA'},
  {name:'Netherlands',code:'nl',confederation:'UEFA'},
  {name:'Belgium',code:'be',confederation:'UEFA'},
  {name:'Italy',code:'it',confederation:'UEFA'},
  {name:'Croatia',code:'hr',confederation:'UEFA'},
  {name:'Switzerland',code:'ch',confederation:'UEFA'},
  {name:'Denmark',code:'dk',confederation:'UEFA'},
  {name:'Austria',code:'at',confederation:'UEFA'},
  {name:'Scotland',code:'gb-sct',confederation:'UEFA'},
  {name:'Serbia',code:'rs',confederation:'UEFA'},
  {name:'Turkey',code:'tr',confederation:'UEFA'},
  {name:'Hungary',code:'hu',confederation:'UEFA'},
  {name:'Romania',code:'ro',confederation:'UEFA'},
  {name:'Slovenia',code:'si',confederation:'UEFA'},
  {name:'Slovakia',code:'sk',confederation:'UEFA'},
  {name:'Albania',code:'al',confederation:'UEFA'},
  {name:'Morocco',code:'ma',confederation:'CAF'},
  {name:'Nigeria',code:'ng',confederation:'CAF'},
  {name:'Senegal',code:'sn',confederation:'CAF'},
  {name:"Côte d'Ivoire",code:'ci',confederation:'CAF'},
  {name:'Egypt',code:'eg',confederation:'CAF'},
  {name:'Cameroon',code:'cm',confederation:'CAF'},
  {name:'Ghana',code:'gh',confederation:'CAF'},
  {name:'Tunisia',code:'tn',confederation:'CAF'},
  {name:'DR Congo',code:'cd',confederation:'CAF'},
  {name:'Japan',code:'jp',confederation:'AFC'},
  {name:'South Korea',code:'kr',confederation:'AFC'},
  {name:'Iran',code:'ir',confederation:'AFC'},
  {name:'Australia',code:'au',confederation:'AFC'},
  {name:'Saudi Arabia',code:'sa',confederation:'AFC'},
  {name:'Jordan',code:'jo',confederation:'AFC'},
  {name:'Iraq',code:'iq',confederation:'AFC'},
  {name:'New Zealand',code:'nz',confederation:'OFC'},
];

function el(tag,cls,text){
  const e=document.createElement(tag);
  if(cls) e.className=cls;
  if(text!=null) e.textContent=text;
  return e;
}

function renderCountries(conf){
  const grid=document.getElementById('cgrid');
  const list=conf==='ALL'?COUNTRIES:COUNTRIES.filter(c=>c.confederation===conf);
  grid.innerHTML='';
  list.forEach((c,i)=>{
    const card=el('div','ccard');
    card.style.animationDelay=i*20+'ms';
    const img=document.createElement('img');
    img.className='cflag';
    img.src='https://flagcdn.com/w80/'+c.code+'.png';
    img.srcset='https://flagcdn.com/w160/'+c.code+'.png 2x';
    img.alt=c.name+' flag';
    img.loading='lazy';
    img.onerror=function(){this.style.opacity='.3'};
    card.appendChild(img);
    card.appendChild(el('span','cname',c.name));
    card.appendChild(el('span','cconf',c.confederation));
    grid.appendChild(card);
  });
}

document.querySelectorAll('.tab').forEach(function(t){
  t.addEventListener('click',function(){
    document.querySelectorAll('.tab').forEach(function(x){x.classList.remove('active');});
    t.classList.add('active');
    renderCountries(t.dataset.conf);
  });
});

function renderKeyMatches(matches){
  const grid=document.getElementById('kmgrid');
  grid.innerHTML='';
  if(!matches||!matches.length){grid.appendChild(el('div','loading','Schedule coming soon…'));return;}
  matches.forEach(function(m){
    const card=el('div','kmcard');
    card.appendChild(el('span','km-label',m.label));
    card.appendChild(el('span','km-matchup',m.matchup));
    card.appendChild(el('span','km-when',m.date+' · '+m.time));
    card.appendChild(el('span','km-venue',m.venue));
    grid.appendChild(card);
  });
}

function renderAssignments(list){
  const grid=document.getElementById('agrid');
  grid.innerHTML='';
  const real=(list||[]).filter(function(a){return a.participant&&a.participant!=='TBD'&&a.teams&&a.teams.length;});
  if(!real.length){
    grid.appendChild(el('div','a-empty','Assignments will appear here once the draw is complete and teams have been assigned to each participant.'));
    return;
  }
  real.forEach(function(a){
    const card=el('div','acard');
    card.appendChild(el('span','a-name',a.participant));
    const teams=el('div','a-teams');
    a.teams.forEach(function(t){teams.appendChild(el('span','a-team',t));});
    card.appendChild(teams);
    grid.appendChild(card);
  });
}

function renderBracket(bracket){
  const wrap=document.getElementById('bracket-wrap');
  wrap.innerHTML='';
  if(!bracket) return;

  const groupsDiv=el('div','bracket-groups');
  bracket.groups.forEach(function(g){
    const box=el('div','bgroup');
    box.appendChild(el('h4',null,'Group '+g.group));
    const ul=document.createElement('ul');
    g.teams.forEach(function(t){ul.appendChild(el('li',null,t));});
    box.appendChild(ul);
    groupsDiv.appendChild(box);
  });
  wrap.appendChild(groupsDiv);

  const roundsDiv=el('div','bracket-rounds');
  ['roundOf32','roundOf16','quarterfinals','semifinals','thirdPlace','final'].forEach(function(key){
    const r=bracket[key];
    if(!r) return;
    const col=el('div','bround');
    col.appendChild(el('h4',null,r.label));
    for(let i=0;i<r.matches;i++) col.appendChild(el('div','bmatch','TBD vs TBD'));
    roundsDiv.appendChild(col);
  });
  wrap.appendChild(roundsDiv);
}

async function loadTournamentData(){
  try{
    const r=await fetch('/api/tournament');
    const data=await r.json();
    if(data.tournament){
      const vs=document.getElementById('viewership-stat');
      const vn=document.getElementById('viewership-note');
      const td=document.getElementById('tournament-dates');
      if(vs&&data.tournament.expectedViewership) vs.textContent=data.tournament.expectedViewership;
      if(vn&&data.tournament.viewershipNote) vn.textContent=data.tournament.viewershipNote;
      if(td&&data.tournament.startDate&&data.tournament.endDate)
        td.textContent=data.tournament.startDate+' – '+data.tournament.endDate;
    }
    renderKeyMatches(data.keyMatches);
    renderAssignments(data.assignments);
    renderBracket(data.bracket);
  }catch(e){
    const km=document.getElementById('kmgrid');
    const ag=document.getElementById('agrid');
    if(km) km.textContent='Unable to load schedule.';
    if(ag) ag.textContent='Unable to load assignments.';
  }
}

async function loadCount(){
  try{
    const r=await fetch('/api/entries/count');
    const data=await r.json();
    const el=document.getElementById('ecnt');
    if(el){
      const c=data.count;
      el.textContent=c===0?'Be the first to enter!':'⚽ '+c+' player'+(c!==1?'s':'')+' already signed up';
    }
  }catch(e){
    const el=document.getElementById('ecnt');
    if(el) el.textContent='';
  }
}

async function submitEntry(){
  const name=document.getElementById('fname').value.trim();
  const contact=document.getElementById('contact').value.trim();
  const btn=document.getElementById('sbtn');
  const btntxt=document.getElementById('btntxt');

  if(!name){showToast('Please enter your full name.','err');document.getElementById('fname').focus();return;}
  if(!contact){showToast('Please enter your email or phone.','err');document.getElementById('contact').focus();return;}

  btn.disabled=true;
  btntxt.textContent='Submitting…';

  try{
    const r=await fetch('/api/register',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({full_name:name,contact:contact})
    });
    const data=await r.json();
    if(r.ok&&data.success){
      showToast("You're in! 🏆",'ok');
      document.getElementById('fname').value='';
      document.getElementById('contact').value='';
      await loadCount();
      btntxt.textContent='✓ Registered!';
      setTimeout(function(){btntxt.textContent='Sign Me Up';btn.disabled=false;},5000);
    }else{
      showToast(data.error||'Something went wrong.','err');
      btn.disabled=false;
      btntxt.textContent='Sign Me Up';
    }
  }catch(e){
    showToast('Network error. Please try again.','err');
    btn.disabled=false;
    btntxt.textContent='Sign Me Up';
  }
}

function showToast(msg,type){
  const t=document.getElementById('toast');
  t.textContent=msg;
  t.className='toast '+type+' show';
  setTimeout(function(){t.className='toast';},6000);
}

renderCountries('ALL');
loadTournamentData();
loadCount();
