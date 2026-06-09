const NAMES = ["Alex","Althea","Felipe","Jeremiah","Justin","Sean"];
const GROUPS = {
  A:["Mexico","South Africa","South Korea","Czechia"],
  B:["Canada","Bosnia-Herzegovina","Qatar","Switzerland"],
  C:["Brazil","Morocco","Haiti","Scotland"],
  D:["United States","Paraguay","Australia","Türkiye"],
  E:["Germany","Curacao","Ivory Coast","Ecuador"],
  F:["Netherlands","Japan","Sweden","Tunisia"],
  G:["Belgium","Egypt","Iran","New Zealand"],
  H:["Spain","Cape Verde","Saudi Arabia","Uruguay"],
  I:["France","Senegal","Iraq","Norway"],
  J:["Argentina","Algeria","Austria","Jordan"],
  K:["Portugal","Congo DR","Uzbekistan","Colombia"],
  L:["England","Croatia","Ghana","Panama"]
};
const LETTERS = Object.keys(GROUPS);
const PICKS_PER_PERSON = 8;

const SEED = 20260608;
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
let rng=mulberry32(SEED);
const rint=n=>Math.floor(rng()*n);
const choice=arr=>arr[rint(arr.length)];

let slotOf={},order=[],plan=[],idx=0,timer=null,playing=false;
const cssId=s=>s.replace(/[^a-zA-Z]/g,"");
const DS="#draw-section";

function buildPlan(){
  rng=mulberry32(SEED);
  slotOf={};order=[];plan=[];idx=0;
  const rem={};LETTERS.forEach(g=>rem[g]=[...GROUPS[g]]);

  const taken=new Set();
  NAMES.forEach(name=>{
    const rolls=[];let r;
    do{r=1+rint(6);rolls.push(r);}while(taken.has(r));
    taken.add(r);slotOf[name]=r;
    plan.push({type:"roll",name,rolls:[...rolls],slot:r});
  });
  order=[...NAMES].sort((a,b)=>slotOf[a]-slotOf[b]);
  plan.push({type:"order"});

  for(let round=1;round<=PICKS_PER_PERSON;round++){
    order.forEach(name=>{
      const live=LETTERS.filter(g=>rem[g].length>0);
      const top=Math.max(...live.map(g=>rem[g].length));
      const tied=live.filter(g=>rem[g].length===top);
      const g=choice(tied);
      const team=rem[g][0];
      rem[g]=rem[g].slice(1);
      plan.push({type:"pick",name,slot:slotOf[name],group:g,team,top,round});
    });
  }
}

function renderShell(){
  const rs=document.getElementById("rollstrip");
  rs.innerHTML="";
  NAMES.forEach(name=>{
    rs.insertAdjacentHTML("beforeend",
      `<div class="rc" id="rc-${name}"><div class="rname">${name}</div><div class="rdie" id="die-${name}">·</div><div class="rrolls" id="rl-${name}"></div></div>`);
  });
  const pots=document.getElementById("pots");
  pots.innerHTML="";
  LETTERS.forEach(g=>{
    const teams=GROUPS[g].map(t=>`<div class="d-team" id="t-${g}-${cssId(t)}">${t}</div>`).join("");
    pots.insertAdjacentHTML("beforeend",
      `<div class="pot" id="pot-${g}"><div class="ph">Group ${g}<span class="ct" id="ct-${g}">4</span></div>${teams}</div>`);
  });
  const ros=document.getElementById("rosters");
  ros.innerHTML="";
  NAMES.forEach(name=>{
    ros.insertAdjacentHTML("beforeend",
      `<div class="ros" id="ros-${name}"><div class="rh"><div class="d-slot" id="slot-${name}">–</div><div class="nm">${name}</div><div class="cnt" id="cnt-${name}">0 / 8</div></div><div class="chips" id="chips-${name}"></div></div>`);
  });
  document.getElementById("potsleft").textContent="48 teams left";
  document.getElementById("picksdone").textContent="0 / 48 picks";
}

function setTicker(html){
  document.getElementById("msg").innerHTML=html;
}

function applyStep(s){
  if(s.type==="roll"){
    document.getElementById("die-"+s.name).textContent=s.slot;
    document.getElementById("rl-"+s.name).textContent=s.rolls.length>1?"rolled "+s.rolls.join(","):"clean";
    document.getElementById("rc-"+s.name).classList.add("done");
    document.getElementById("slot-"+s.name).textContent=s.slot;
    setTicker(`<b>${s.name}</b> rolled ${s.rolls.join(", ")} → slot <b>${s.slot}</b>.`);
  } else if(s.type==="order"){
    const ord=[...NAMES].sort((a,b)=>slotOf[a]-slotOf[b]).map(n=>slotOf[n]+". "+n).join("  ·  ");
    setTicker(`Pick order locked → ${ord}. Now the draw begins.`);
    const ros=document.getElementById("rosters");
    [...NAMES].sort((a,b)=>slotOf[a]-slotOf[b]).forEach(n=>ros.appendChild(document.getElementById("ros-"+n)));
  } else if(s.type==="pick"){
    document.querySelectorAll(`${DS} .pot.active`).forEach(e=>e.classList.remove("active"));
    document.querySelectorAll(`${DS} .ros.turn`).forEach(e=>e.classList.remove("turn"));
    const pot=document.getElementById("pot-"+s.group);
    pot.classList.add("active");
    document.getElementById("ros-"+s.name).classList.add("turn");
    const teamEl=document.getElementById("t-"+s.group+"-"+cssId(s.team));
    if(teamEl){
      teamEl.classList.add("flash");
      if(document.getElementById("draw-section").classList.contains("instant")){
        teamEl.classList.add("gone");
      } else {
        setTimeout(()=>teamEl.classList.add("gone"),220);
      }
    }
    const ctEl=document.getElementById("ct-"+s.group);
    const left=(+ctEl.textContent)-1;ctEl.textContent=left;
    if(left===0) pot.classList.add("empty");
    const chips=document.getElementById("chips-"+s.name);
    document.querySelectorAll(`${DS} .chip.new`).forEach(c=>c.classList.remove("new"));
    chips.insertAdjacentHTML("beforeend",`<span class="chip new">${s.group} · ${s.team}</span>`);
    document.getElementById("cnt-"+s.name).textContent=chips.children.length+" / 8";
    const totalLeft=LETTERS.reduce((a,g)=>a+(+document.getElementById("ct-"+g).textContent),0);
    document.getElementById("potsleft").textContent=totalLeft+" teams left";
    const done=plan.slice(0,idx+1).filter(p=>p.type==="pick").length;
    document.getElementById("picksdone").textContent=done+" / 48 picks";
    setTicker(`Round ${s.round} · <b>${s.name}</b> (slot ${s.slot}) draws from Group <b>${s.group}</b> [${s.top} left] → <b>${s.team}</b>.`);
  }
}

function stepOnce(){
  if(idx>=plan.length){finish();return false;}
  applyStep(plan[idx]);idx++;
  if(idx>=plan.length) finish();
  return true;
}
function finish(){
  stop();
  document.querySelectorAll(`${DS} .pot.active`).forEach(e=>e.classList.remove("active"));
  document.querySelectorAll(`${DS} .ros.turn`).forEach(e=>e.classList.remove("turn"));
  document.querySelectorAll(`${DS} .chip.new`).forEach(c=>c.classList.remove("new"));
  setTicker("Draw complete — all 48 teams assigned, 8 per manager.");
  document.getElementById("play").disabled=false;
  document.getElementById("play").textContent="▶ Watch the draw";
  document.getElementById("step").disabled=true;
}
function delay(){return 920-(+document.getElementById("spd").value-1)*180;}
function loop(){if(!playing)return;if(stepOnce()) timer=setTimeout(loop,delay());}
function play(){if(playing)return;playing=true;document.getElementById("play").textContent="❚❚ Pause";loop();}
function stop(){playing=false;clearTimeout(timer);document.getElementById("play").textContent="▶ Watch the draw";}

function jumpToEnd(){
  stop();
  const ds=document.getElementById("draw-section");
  ds.classList.add("instant");
  while(idx<plan.length) stepOnce();
  void ds.offsetHeight;
  requestAnimationFrame(()=>ds.classList.remove("instant"));
}
function rebuild(){
  stop();buildPlan();renderShell();
  document.getElementById("play").disabled=false;
  document.getElementById("step").disabled=false;
  document.getElementById("play").textContent="▶ Watch the draw";
}

document.getElementById("play").addEventListener("click",()=>{
  if(playing){stop();return;}
  if(idx>=plan.length) rebuild();
  play();
});
document.getElementById("step").addEventListener("click",()=>{
  stop();
  if(idx>=plan.length) rebuild();
  stepOnce();
});
document.getElementById("reset").addEventListener("click",()=>{rebuild();jumpToEnd();});

buildPlan();
renderShell();
jumpToEnd();
