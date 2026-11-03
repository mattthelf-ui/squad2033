'use strict';
// SQUAD 2033 v1 — phone-first real-time squad action RPG
const VERSION='squad2033 v1';
const cv=document.getElementById('c'),ctx=cv.getContext('2d');
let W=0,H=0,DPR=1;
function resize(){DPR=Math.min(window.devicePixelRatio||1,2);W=innerWidth;H=innerHeight;cv.width=W*DPR;cv.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0);}
addEventListener('resize',resize);resize();
const C={slate:'#2A313B',dark:'#161A20',concrete:'#6E7480',teal:'#2FE0D6',amber:'#FF9A2E',lime:'#9BD43A',violet:'#8A5CFF',red:'#B3202E',gold:'#D9A93A',pearl:'#EFE8DA',loot:'#F5C542',dusk:'#FF6A4A'};
const RACES=['human','robot','grey'],RACE_NAME={human:'Human',robot:'Robot',grey:'Grey'};
const CLASSES=['assault','heavy','recon','tech'];
const CLS={
 assault:{name:'Assault',col:C.teal,hp:100,dmg:9,rate:.16,range:250,spd:150,ab:'Adrenaline Dash'},
 heavy:{name:'Heavy',col:C.amber,hp:165,dmg:15,rate:.42,range:220,spd:120,ab:'Ground Slam'},
 recon:{name:'Recon',col:C.lime,hp:85,dmg:30,rate:.8,range:380,spd:145,ab:'Scan & Mark'},
 tech:{name:'Tech',col:C.violet,hp:95,dmg:10,rate:.28,range:280,spd:135,ab:'Support Drone'}};
const RACE_MOD={human:{hp:1,spd:1,cd:1},robot:{hp:1.2,spd:.92,cd:1},grey:{hp:.95,spd:1,cd:.8}};
const EN={
 'nordic-sentinel':{name:'Nordic Sentinel',hp:70,dmg:10,rate:.9,range:300,spd:90,melee:false},
 'nordic-commander':{name:'Nordic Commander',hp:130,dmg:12,rate:1,range:300,spd:85,melee:false,pulse:true},
 'reptile-brute':{name:'Reptile Brute',hp:170,dmg:18,rate:1.1,range:42,spd:95,melee:true},
 'reptile-skirmisher':{name:'Reptile Skirmisher',hp:55,dmg:8,rate:.55,range:36,spd:165,melee:true},
 'collab-trooper':{name:'Collaborator',hp:75,dmg:8,rate:.7,range:270,spd:100,melee:false},
 'collab-medic':{name:'Collab Medic',hp:60,dmg:5,rate:1,range:240,spd:100,melee:false,heal:true},
 'reptile-guard':{name:'Throne Guard',hp:220,dmg:20,rate:1,range:44,spd:100,melee:true}};
const FPS={idle:3,run:12,attack:14,ability:10,hit:10,down:8,move:8,windup:8,sweep:12,slam:10,barrage:12};
const LOOP={idle:1,run:1,move:1,barrage:1};
// ---------- assets ----------
const SHEETS={};
function loadSheet(path){if(SHEETS[path])return SHEETS[path].p;const s={img:new Image(),frames:null,counts:{}};SHEETS[path]=s;
 s.p=fetch('sprites/'+path+'/sheet@2x.json').then(r=>r.json()).then(j=>{s.frames=j.frames;for(const k in j.frames){const m=k.match(/\/(\w+)_([NSEW]+)_(\d+)$/);if(m){const key=m[1]+'_'+m[2];s.counts[key]=Math.max(s.counts[key]||0,+m[3]+1);}}
  return new Promise((res,rej)=>{s.img.onload=res;s.img.onerror=rej;s.img.src='sprites/'+path+'/sheet@2x.png';});}).then(()=>{s.ok=true;});return s.p;}
const DIRS=['E','SE','S','SW','W','NW','N','NE'],FLIP={SW:'SE',W:'E',NW:'NE'};
function dirOf(a){return DIRS[((Math.round(a/(Math.PI/4))%8)+8)%8];}
function drawUnit(path,unit,anim,dirName,t,x,y,k,alpha){const s=SHEETS[path];if(!s||!s.ok)return false;let d=dirName,flip=false;if(FLIP[d]){d=FLIP[d];flip=true;}
 const n=s.counts[anim+'_'+d]||1;let f=Math.floor(t*(FPS[anim]||8));f=LOOP[anim]?f%n:Math.min(f,n-1);
 const fr=s.frames[unit+'/'+anim+'_'+d+'_'+String(f).padStart(2,'0')];if(!fr)return false;const z=k/2;
 ctx.save();ctx.translate(x,y);if(flip)ctx.scale(-1,1);if(alpha!=null)ctx.globalAlpha=alpha;
 ctx.drawImage(s.img,fr.frame.x,fr.frame.y,fr.frame.w,fr.frame.h,(fr.spriteSourceSize.x-fr.sourceSize.w*fr.pivot.x)*z,(fr.spriteSourceSize.y-fr.sourceSize.h*fr.pivot.y)*z,fr.frame.w*z,fr.frame.h*z);
 ctx.restore();return true;}
function animLen(anim,path,d){const s=SHEETS[path];d=FLIP[d]||d;return ((s&&s.counts[anim+'_'+d])||3)/(FPS[anim]||8);}
// ---------- save ----------
const NAMES=['Vega','Okafor','Brick','Nyx','Mbeki','Hale','Rook','Sato','Kestrel','Diaz','Unit-7','Zeta'];
function defaultSquad(){return[{race:'human',cls:'assault',name:'Vega'},{race:'robot',cls:'heavy',name:'Unit-7'},{race:'grey',cls:'recon',name:'Zeta'},{race:'human',cls:'tech',name:'Okafor'}];}
let squad;try{squad=JSON.parse(localStorage.getItem('squad2033.squad'));if(!Array.isArray(squad)||squad.length!==4||!squad.every(m=>RACES.includes(m.race)&&CLASSES.includes(m.cls)))throw 0;}catch(e){squad=defaultSquad();}
let stats;try{stats=JSON.parse(localStorage.getItem('squad2033.stats'))||{};if(typeof stats!=='object')throw 0;}catch(e){stats={};}
stats.wins=stats.wins|0;stats.runs=stats.runs|0;
function save(){try{localStorage.setItem('squad2033.squad',JSON.stringify(squad));localStorage.setItem('squad2033.stats',JSON.stringify(stats));}catch(e){}}
// ---------- map ----------
const MAP={w:1200,h:3700};
// walls = low cover barricades (block movement + bullets, except for the shooter hugging them)
const WALLS=[
 // battle 1 camp ring
 {x:330,y:2700,w:120,h:26},{x:740,y:2720,w:130,h:26},{x:540,y:2790,w:120,h:26},{x:220,y:2480,w:26,h:110},{x:950,y:2440,w:26,h:120},
 {x:500,y:2560,w:60,h:40},{x:680,y:2470,w:50,h:40},{x:420,y:2330,w:130,h:26},
 // battle 2
 {x:300,y:1660,w:140,h:26},{x:760,y:1650,w:140,h:26},{x:560,y:1560,w:80,h:40},{x:200,y:1420,w:26,h:120},{x:980,y:1400,w:26,h:120},{x:450,y:1330,w:110,h:26},{x:660,y:1300,w:110,h:26},
 // choke between areas
 {x:0,y:2050,w:420,h:40},{x:780,y:2050,w:420,h:40},{x:0,y:1040,w:440,h:40},{x:760,y:1040,w:440,h:40}];
const HIGH=[{x:60,y:2380,w:220,h:240,name:'west ridge'},{x:900,y:2600,w:240,h:200,name:'east ridge'},{x:470,y:2860,w:260,h:120,name:'south rise'},
 {x:60,y:1500,w:200,h:200,name:'ridge'},{x:940,y:1480,w:200,h:220,name:'ridge'}];
const CAMP1={x:600,y:2500},CAMP2={x:600,y:1480},ARENA={x:600,y:520};
function inRect(x,y,r,p=0){return x>r.x-p&&x<r.x+r.w+p&&y>r.y-p&&y<r.y+r.h+p;}
function onHigh(x,y){return HIGH.some(r=>inRect(x,y,r));}
function nearWall(x,y,p=34){return WALLS.find(r=>inRect(x,y,r,p));}
function blocked(x,y,rad=12){if(x<rad||y<rad||x>MAP.w-rad||y>MAP.h-rad)return true;return WALLS.some(r=>inRect(x,y,r,rad));}
// ---------- input ----------
const keys={};addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=1;if(e.key===' ')useAbility(G&&G.hero);});addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=0;});
const sticks={L:null,R:null};let mouse={x:0,y:0,down:false};const taps=[];
function ptr(e){return{x:e.clientX,y:e.clientY,id:e.pointerId};}
cv.addEventListener('pointerdown',e=>{e.preventDefault();unlockAudio();const p=ptr(e);
 if(scene==='mission'&&G&&G.phase.startsWith('battle')||scene==='mission'&&G&&G.phase==='travel'){
  if(hitBtn(p,abilityBtn())){useAbility(G.hero);return;}
  if(hitBtn(p,pauseBtn())){G.paused=!G.paused;return;}
  if(p.x<W/2&&!sticks.L){sticks.L={id:p.id,ox:p.x,oy:p.y,x:p.x,y:p.y};return;}
  if(p.x>=W/2&&!sticks.R){sticks.R={id:p.id,ox:p.x,oy:p.y,x:p.x,y:p.y};return;}}
 taps.push({x:p.x,y:p.y,id:p.id,sx:p.x,sy:p.y,t:performance.now(),moved:false});});
cv.addEventListener('pointermove',e=>{const p=ptr(e);mouse.x=p.x;mouse.y=p.y;for(const s of['L','R'])if(sticks[s]&&sticks[s].id===p.id){sticks[s].x=p.x;sticks[s].y=p.y;}
 const t=taps.find(t=>t.id===p.id);if(t){if(Math.hypot(p.x-t.sx,p.y-t.sy)>10)t.moved=true;if(t.moved&&scene==='mission'&&G.phase==='setup'){G.cam.x-=(p.x-t.x)/G.zoom;G.cam.y-=(p.y-t.y)/G.zoom;}t.x=p.x;t.y=p.y;}});
function endPtr(e){const p=ptr(e);for(const s of['L','R'])if(sticks[s]&&sticks[s].id===p.id)sticks[s]=null;const i=taps.findIndex(t=>t.id===p.id);if(i>=0){const t=taps[i];taps.splice(i,1);if(!t.moved)onTap(t.x,t.y);}}
cv.addEventListener('pointerup',endPtr);cv.addEventListener('pointercancel',endPtr);
function hitBtn(p,b){return b&&p.x>=b.x&&p.x<=b.x+b.w&&p.y>=b.y&&p.y<=b.y+b.h;}
let buttons=[];function btn(x,y,w,h,label,fn,opt={}){buttons.push({x,y,w,h,fn});ctx.save();ctx.fillStyle=opt.bg||'#2A313B';ctx.strokeStyle=opt.stroke||'#6E7480';ctx.lineWidth=2;rr(x,y,w,h,10);ctx.fill();ctx.stroke();
 ctx.fillStyle=opt.fg||'#fff';ctx.font=`800 ${opt.size||16}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,x+w/2,y+h/2+1);ctx.restore();}
function rr(x,y,w,h,r){ctx.beginPath();ctx.roundRect?ctx.roundRect(x,y,w,h,r):ctx.rect(x,y,w,h);}
function onTap(x,y){for(let i=buttons.length-1;i>=0;i--){const b=buttons[i];if(x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h){b.fn();return;}}if(scene==='mission'&&G.phase==='setup')setupTap(x,y);}
// ---------- audio (tiny synth sfx) ----------
let AC=null;function unlockAudio(){if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)();}catch(e){}}if(AC&&AC.state==='suspended')AC.resume();}
function sfx(f,d=.06,type='square',v=.04){if(!AC)return;const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.value=f;g.gain.value=v;g.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+d);o.connect(g);g.connect(AC.destination);o.start();o.stop(AC.currentTime+d);}
// ---------- scenes ----------
let scene='title',G=null,loadP=null,loadErr=null;
function allPaths(){return[...new Set([...squad.map(m=>'players/'+m.cls+'-'+m.race),...Object.keys(EN).map(k=>k==='reptile-guard'?'boss/reptile-guard':'enemies/'+k),'boss/sovereign'])];}
function preload(){loadErr=null;loadP=Promise.all(allPaths().map(loadSheet)).catch(e=>{loadErr='Failed to load sprites';});return loadP;}
// preload player previews for create screen
function previewPaths(){const a=[];for(const c of CLASSES)for(const r of RACES)a.push('players/'+c+'-'+r);return a;}
// ---------- units ----------
let UID=1;
function mkAlly(m,i,x,y){const c=CLS[m.cls],rm=RACE_MOD[m.race];const hp=Math.round(c.hp*rm.hp*(i===0?1.4:1));
 return{id:UID++,team:'ally',idx:i,hero:i===0,m,cls:m.cls,path:'players/'+m.cls+'-'+m.race,unit:m.cls+'-'+m.race,x,y,hp,maxHp:hp,spd:c.spd*rm.spd,dmg:c.dmg,rate:c.rate,range:c.range,
  cd:0,cdMax:9*rm.cd,fireT:0,dir:'N',anim:'idle',at:Math.random(),lock:0,down:false,tx:x,ty:y,buff:0,dash:0,revive:0,col:c.col,name:m.name};}
function mkEnemy(type,x,y,aware){const e=EN[type];const path=type==='reptile-guard'?'boss/reptile-guard':'enemies/'+type;
 return{id:UID++,team:'enemy',type,path,unit:type,x,y,hx:x,hy:y,hp:e.hp,maxHp:e.hp,spd:e.spd,dmg:e.dmg,rate:e.rate,range:e.range,melee:e.melee,fireT:Math.random(),dir:'S',anim:'idle',at:Math.random(),lock:0,down:false,
  aware,stun:0,mark:0,abT:3+Math.random()*4,shield:0,name:e.name};}
function mkBoss(x,y){return{id:UID++,team:'enemy',boss:true,type:'sovereign',path:'boss/sovereign',unit:'sovereign',x,y,hp:2400,maxHp:2400,spd:55,dmg:16,range:420,fireT:2,dir:'S',anim:'idle',at:0,lock:0,down:false,aware:false,stun:0,mark:0,abT:2,shield:0,name:'Nordic Sovereign'};}
function startMission(){UID=1;const sx=600,sy=3450;
 const allies=squad.map((m,i)=>mkAlly(m,i,sx+(i-1.5)*50,sy));
 const e1=[['nordic-commander',600,2470],['nordic-sentinel',520,2440],['nordic-sentinel',700,2430],['reptile-brute',560,2620],['reptile-brute',650,2610],['reptile-skirmisher',430,2560],['reptile-skirmisher',780,2560],['collab-trooper',470,2470],['collab-trooper',740,2500],['collab-medic',610,2400]]
  .map(a=>Object.assign(mkEnemy(a[0],a[1],a[2],false),{wave:1}));
 const e2=[['nordic-sentinel',520,1400],['nordic-sentinel',700,1400],['nordic-commander',610,1350],['reptile-brute',540,1600],['reptile-brute',680,1600],['reptile-skirmisher',380,1520],['reptile-skirmisher',820,1520],['reptile-skirmisher',600,1640],['collab-trooper',350,1380],['collab-trooper',860,1380],['collab-medic',600,1440]]
  .map(a=>Object.assign(mkEnemy(a[0],a[1],a[2],false),{wave:2}));
 G={allies,hero:allies[0],enemies:[...e1,...e2],shots:[],fx:[],texts:[],phase:'setup',t:0,cam:{x:CAMP1.x,y:2800},zoom:1,sel:0,adv:null,banner:null,paused:false,kills:0,bossSpawned:false,battle:1,drones:[],slowmo:0};
 // setup: squad starts in deploy zone south of camp
 allies.forEach((a,i)=>{a.x=a.tx=480+i*80;a.y=a.ty=3000;});
 scene='mission';stats.runs++;save();
 G.banner={t:5,big:'SETUP',small:'Tap a soldier, then tap the map to position them. Use HIGH GROUND, COVER and FLANKS. Don\'t get within the red sight rings.'};}
// ---------- setup ----------
const SIGHT=150;
function evalSetup(){const al=G.allies,en=G.enemies.filter(e=>e.wave===1);let spotted=al.some(a=>en.some(e=>Math.hypot(a.tx-e.x,a.ty-e.y)<SIGHT));
 const high=al.filter(a=>onHigh(a.tx,a.ty)),cover=al.filter(a=>nearWall(a.tx,a.ty)&&!onHigh(a.tx,a.ty));
 const ang=al.map(a=>Math.atan2(a.ty-CAMP1.y,a.tx-CAMP1.x)).sort((a,b)=>a-b);let maxGap=0;for(let i=0;i<ang.length;i++){const g=(i+1<ang.length?ang[i+1]:ang[0]+Math.PI*2)-ang[i];maxGap=Math.max(maxGap,g);}
 const spread=Math.PI*2-maxGap;const flank=spread>=Math.PI*0.6&&al.every(a=>Math.hypot(a.tx-CAMP1.x,a.ty-CAMP1.y)<520);
 const score=high.length+cover.length+(flank?2:0);const first=!spotted&&score>=4;
 return{spotted,high,cover,flank:flank&&!spotted,first,score:spotted?0:score};}
function setupTap(sx,sy){const p=s2w(sx,sy);const hit=G.allies.find(a=>Math.hypot(a.tx-p.x,a.ty-p.y+20)<30);if(hit){G.sel=hit.idx;sfx(660,.05);return;}
 const a=G.allies[G.sel];if(p.y<2150||p.y>3600||blocked(p.x,p.y,14))return;a.tx=p.x;a.ty=p.y;sfx(440,.05);G.sel=(G.sel+1)%4;}
function engage(){const ev=evalSetup();G.adv=ev;G.phase='battle';G.battle=1;
 for(const a of G.allies){a.x=a.tx;a.y=a.ty;a.post={x:a.tx,y:a.ty};a.hg=onHigh(a.x,a.y);}
 const en=G.enemies.filter(e=>e.wave===1);en.forEach(e=>e.aware=true);
 let lines=[];
 if(ev.spotted){lines.push('SPOTTED — no advantage');en.forEach(e=>e.fireT=0);}
 else{if(ev.high.length)lines.push(`HIGH GROUND x${ev.high.length}: +35% damage`);if(ev.cover.length)lines.push(`COVER x${ev.cover.length}: -40% damage taken`);
  if(ev.flank){lines.push('FLANKED: enemies caught off guard (3s)');en.forEach(e=>e.stun=3);}
  if(ev.first){lines.push('FIRST STRIKE: opening volley');for(const a of G.allies){const t=nearest(a,en);if(t)hurt(t,40,a);}}
  if(!lines.length)lines.push('No advantage — try high ground, cover or flanking');}
 G.banner={t:4,big:'BATTLE 1',small:lines.join(' · ')};sfx(220,.3,'sawtooth',.06);}
// ---------- helpers ----------
function nearest(u,list,maxD=1e9){let b=null,bd=maxD;for(const o of list){if(o.down)continue;const d=Math.hypot(o.x-u.x,o.y-u.y);if(d<bd){bd=d;b=o;}}return b;}
function liveEnemies(){return G.enemies.filter(e=>!e.down&&e.aware);}
function s2w(x,y){return{x:(x-W/2)/G.zoom+G.cam.x,y:(y-H/2)/G.zoom+G.cam.y};}
function w2s(x,y){return{x:(x-G.cam.x)*G.zoom+W/2,y:(y-G.cam.y)*G.zoom+H/2};}
function setAnim(u,a,lock){if(u.anim!==a){u.anim=a;u.at=0;}if(lock)u.lock=lock;}
function lineBlocked(x1,y1,x2,y2,shooter){const n=Math.ceil(Math.hypot(x2-x1,y2-y1)/12);for(let i=1;i<n;i++){const x=x1+(x2-x1)*i/n,y=y1+(y2-y1)*i/n;const w=WALLS.find(r=>inRect(x,y,r,2));if(w&&!(shooter&&inRect(shooter.x,shooter.y,w,40)))return true;}return false;}
function dmgMult(src){let m=1;if(!src)return m;if(src.team==='ally'){if(onHigh(src.x,src.y))m*=G.adv&&!G.adv.spotted?1.35:1.15;if(src.buff>0)m*=1.3;}return m;}
function hurt(t,d,src){if(t.down)return;if(t.team==='ally'){if(nearWall(t.x,t.y,30)&&src&&!src.boss)d*=.6;if(t.hero&&t.dash>0)return;}
 if(t.team==='enemy'){if(t.mark>0)d*=1.5;if(t.shield>0)d*=.4;t.aware=true;}
 d=Math.round(d);t.hp-=d;G.texts.push({x:t.x+(Math.random()-.5)*16,y:t.y-60,s:String(d),t:.8,c:t.team==='ally'?'#ff8080':'#fff'});
 if(t.hp<=0){t.hp=0;t.down=true;setAnim(t,'down');t.lock=0;if(t.team==='enemy'){G.kills++;sfx(120,.2,'triangle',.08);}else sfx(90,.4,'sawtooth',.06);}
 else if(!t.boss&&t.lock<=0&&Math.random()<.35)setAnim(t,'hit',.2);}
function fire(u,tx,ty){const a=Math.atan2(ty-u.y,tx-u.x);u.dir=dirOf(a);setAnim(u,'attack',.22);
 const sp=u.team==='ally'?620:360;const col=u.team==='ally'?u.col:(u.type&&u.type.startsWith('nordic')?C.gold:'#ff4b4b');
 G.shots.push({x:u.x+Math.cos(a)*18,y:u.y-30+Math.sin(a)*18,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,team:u.team,dmg:u.dmg*dmgMult(u),life:(u.range+40)/sp,src:u,col,r:u.cls==='heavy'?5:u.cls==='recon'?3:4,sx:u.x,sy:u.y});
 if(u.team==='ally')sfx(u.cls==='recon'?900:u.cls==='heavy'?200:600,.04,'square',.02);}
function useAbility(u){if(!u||u.down||u.cd>0||scene!=='mission'||!G.phase.startsWith('battle')&&G.phase!=='travel')return;u.cd=u.cdMax;setAnim(u,'ability',.3);sfx(330,.25,'triangle',.08);
 const en=G.enemies.filter(e=>!e.down);
 if(u.cls==='assault'){u.dash=.35;u.buff=4;const a=dirAngle(u.dir);u.vx=Math.cos(a)*600;u.vy=Math.sin(a)*600;fxRing(u.x,u.y,60,u.col);}
 else if(u.cls==='heavy'){fxRing(u.x,u.y,110,C.amber);for(const e of en){const d=Math.hypot(e.x-u.x,e.y-u.y);if(d<110){hurt(e,45*dmgMult(u),u);if(!e.boss){e.stun=Math.max(e.stun,1.2);const k=(110-d)/d*0.6||0;tryMove(e,(e.x-u.x)*k,(e.y-u.y)*k);}}}}
 else if(u.cls==='recon'){fxRing(u.x,u.y,320,C.lime);for(const e of en)if(Math.hypot(e.x-u.x,e.y-u.y)<320){e.mark=6;e.aware=true;}}
 else if(u.cls==='tech'){G.drones.push({x:u.x,y:u.y-50,t:9,owner:u,fireT:0});for(const a of G.allies)if(!a.down&&Math.hypot(a.x-u.x,a.y-u.y)<220){a.hp=Math.min(a.maxHp,a.hp+30);G.texts.push({x:a.x,y:a.y-70,s:'+30',t:.8,c:C.lime});}fxRing(u.x,u.y,220,C.violet);}}
function dirAngle(d){return DIRS.indexOf(d)*Math.PI/4;}
function fxRing(x,y,r,c){G.fx.push({x,y,r,c,t:.5,T:.5});}
function tryMove(u,dx,dy){const r=u.boss?30:12;if(!blocked(u.x+dx,u.y,r))u.x+=dx;if(!blocked(u.x,u.y+dy,r))u.y+=dy;}
// ---------- update ----------
function update(dt){if(scene!=='mission'||G.paused)return;G.t+=dt;if(G.banner){G.banner.t-=dt;if(G.banner.t<=0)G.banner=null;}
 const allU=[...G.allies,...G.enemies];for(const u of allU){u.at+=dt;if(u.lock>0)u.lock-=dt;}
 if(G.phase==='setup'){for(const a of G.allies){const dx=a.tx-a.x,dy=a.ty-a.y,d=Math.hypot(dx,dy);if(d>3){const s=Math.min(d,300*dt);a.x+=dx/d*s;a.y+=dy/d*s;a.dir=dirOf(Math.atan2(dy,dx));setAnim(a,'run');}else{a.x=a.tx;a.y=a.ty;a.dir='N';setAnim(a,'idle');}}
  G.cam.x=Math.max(0,Math.min(MAP.w,G.cam.x));G.cam.y=Math.max(2100,Math.min(3500,G.cam.y));return;}
 if(G.phase==='win'||G.phase==='lose')return;
 const h=G.hero;
 // hero input
 let mx=0,my=0,ax=0,ay=0,aiming=false;
 if(keys.a||keys.arrowleft)mx--;if(keys.d||keys.arrowright)mx++;if(keys.w||keys.arrowup)my--;if(keys.s||keys.arrowdown)my++;
 if(sticks.L){const dx=sticks.L.x-sticks.L.ox,dy=sticks.L.y-sticks.L.oy,d=Math.hypot(dx,dy);if(d>8){mx=dx/Math.max(d,50);my=dy/Math.max(d,50);}}
 if(sticks.R){const dx=sticks.R.x-sticks.R.ox,dy=sticks.R.y-sticks.R.oy;if(Math.hypot(dx,dy)>12){ax=dx;ay=dy;aiming=true;}else{const t=nearest(h,liveEnemies(),h.range+60);if(t){ax=t.x-h.x;ay=t.y-h.y;aiming=true;}}}
 if(mouse.down){}
 const ml=Math.hypot(mx,my);if(ml>1){mx/=ml;my/=ml;}
 for(const a of G.allies){a.cd=Math.max(0,a.cd-dt);a.buff=Math.max(0,a.buff-dt);a.fireT-=dt;}
 if(!h.down){if(h.dash>0){h.dash-=dt;tryMove(h,h.vx*dt,h.vy*dt);}
  else if(ml>.05){tryMove(h,mx*h.spd*dt,my*h.spd*dt);if(!aiming)h.dir=dirOf(Math.atan2(my,mx));if(h.lock<=0)setAnim(h,'run');}else if(h.lock<=0)setAnim(h,'idle');
  if(aiming){if(!sticks.R||Math.hypot(ax,ay)>0){h.dir=dirOf(Math.atan2(ay,ax));}if(h.fireT<=0){h.fireT=h.rate*(h.buff>0?.6:1);fire(h,h.x+ax*100,h.y+ay*100);}}
  // revive downed allies by standing near
  for(const a of G.allies)if(a.down&&!a.hero){if(Math.hypot(a.x-h.x,a.y-h.y)<50){a.revive+=dt;if(a.revive>2){a.down=false;a.hp=Math.round(a.maxHp*.4);a.revive=0;a.wounded=true;setAnim(a,'idle');G.texts.push({x:a.x,y:a.y-70,s:'REVIVED',t:1,c:C.lime});}}else a.revive=Math.max(0,a.revive-dt);}}
 // allies AI
 const live=liveEnemies();
 G.allies.forEach((a,i)=>{if(a.hero||a.down)return;let t=nearest(a,live,a.range+40);
  if(live.length&&a.cd<=0&&nearest(a,live,a.cls==='recon'?300:a.cls==='tech'?400:110)&&(a.cls!=='tech'||G.allies.some(o=>!o.down&&o.hp<o.maxHp*.7)))useAbility(a);
  let gx,gy;if(G.phase==='battle'&&a.post&&live.length){gx=a.post.x;gy=a.post.y;if(!t){const n=nearest(a,live);if(n){gx=a.x+(n.x-a.x)*.5;gy=a.y+(n.y-a.y)*.5;if(Math.hypot(n.x-a.x,n.y-a.y)<a.range){gx=a.x;gy=a.y;}}}}
  else{const off=[[-50,50],[50,50],[0,85]][i-1];gx=h.x+off[0];gy=h.y+off[1];if(t&&Math.hypot(gx-a.x,gy-a.y)<160){gx=a.x;gy=a.y;}}
  const dx=gx-a.x,dy=gy-a.y,d=Math.hypot(dx,dy);
  if(a.dash>0){a.dash-=dt;tryMove(a,a.vx*dt,a.vy*dt);}else if(d>14){tryMove(a,dx/d*a.spd*dt,dy/d*a.spd*dt);if(!t)a.dir=dirOf(Math.atan2(dy,dx));if(a.lock<=0)setAnim(a,'run');}else if(a.lock<=0)setAnim(a,'idle');
  if(t&&a.fireT<=0&&!lineBlocked(a.x,a.y-20,t.x,t.y-20,a)){a.fireT=a.rate*(a.buff>0?.6:1)*(1+Math.random()*.3);fire(a,t.x,t.y-10);}});
 // drones
 for(const d of G.drones){d.t-=dt;d.fireT-=dt;const o=d.owner;d.x+=((o.x+30)-d.x)*dt*3;d.y+=((o.y-70)-d.y)*dt*3;const t=nearest(d,live,260);if(t&&d.fireT<=0){d.fireT=.35;const a=Math.atan2(t.y-d.y,t.x-d.x);G.shots.push({x:d.x,y:d.y,vx:Math.cos(a)*600,vy:Math.sin(a)*600,team:'ally',dmg:6,life:.6,col:C.violet,r:3,src:null});}}
 G.drones=G.drones.filter(d=>d.t>0);
 // enemies
 const alive=G.allies.filter(a=>!a.down);
 for(const e of G.enemies){if(e.down)continue;e.mark=Math.max(0,e.mark-dt);e.shield=Math.max(0,e.shield-dt);
  if(!e.aware){if(alive.some(a=>Math.hypot(a.x-e.x,a.y-e.y)<SIGHT+(G.phase==='setup'?0:40)))wake(e.wave);if(e.lock<=0)setAnim(e,'idle');continue;}
  if(e.boss){bossAI(e,dt,alive);continue;}
  if(e.stun>0){e.stun-=dt;if(e.lock<=0)setAnim(e,'idle');continue;}
  e.fireT-=dt;e.abT-=dt;if(!e.tgt||e.tgt.down||Math.random()<dt*.3){const n=nearest(e,alive);const c=n&&alive.filter(a=>Math.hypot(a.x-e.x,a.y-e.y)<Math.hypot(n.x-e.x,n.y-e.y)+120);e.tgt=c&&c[(Math.random()*c.length)|0];}const t=e.tgt;if(!t)continue;const d=Math.hypot(t.x-e.x,t.y-e.y);
  const ET=EN[e.type];
  if(e.abT<=0){e.abT=6+Math.random()*4;
   if(ET.heal){const hurtE=G.enemies.filter(o=>!o.down&&o.aware&&o.hp<o.maxHp&&Math.hypot(o.x-e.x,o.y-e.y)<200);if(hurtE.length){setAnim(e,'ability',.3);fxRing(e.x,e.y,200,C.gold);hurtE.forEach(o=>{o.hp=Math.min(o.maxHp,o.hp+25);});}}
   else if(e.type==='collab-trooper'){setAnim(e,'ability',.3);e.shield=3;}
   else if(ET.pulse&&d<180){setAnim(e,'ability',.3);fxRing(e.x,e.y,180,C.gold);for(const a of alive)if(Math.hypot(a.x-e.x,a.y-e.y)<180)hurt(a,14,e);}
   else if(e.type.startsWith('reptile')&&d<260){setAnim(e,'ability',.3);e.surge=2.5;}}
  if(e.surge>0)e.surge-=dt;
  const want=e.melee?e.range*.8:e.range*.75;const sp=e.spd*(e.surge>0?1.6:1);
  if(e.lock>0&&e.anim==='attack'){}
  else if(d>want||(!e.melee&&lineBlocked(e.x,e.y-20,t.x,t.y-20,e))){const dx=t.x-e.x,dy=t.y-e.y;let mvx=dx/d,mvy=dy/d;
   if(blocked(e.x+mvx*14,e.y+mvy*14,14)){const s=e.id%2?1:-1;mvx=-dy/d*s;mvy=dx/d*s;}
   tryMove(e,mvx*sp*dt,mvy*sp*dt);e.dir=dirOf(Math.atan2(mvy,mvx));if(e.lock<=0)setAnim(e,'run');}
  else if(e.lock<=0)setAnim(e,'idle');
  if(d<=e.range&&e.fireT<=0){e.fireT=e.rate*(1+Math.random()*.4);if(e.melee){e.dir=dirOf(Math.atan2(t.y-e.y,t.x-e.x));setAnim(e,'attack',.25);hurt(t,e.dmg*(e.surge>0?1.3:1),e);}else if(!lineBlocked(e.x,e.y-20,t.x,t.y-20,e))fire(e,t.x,t.y-10);}}
 // separation
 const bodies=[...G.allies,...G.enemies].filter(u=>!u.down);for(let i=0;i<bodies.length;i++)for(let j=i+1;j<bodies.length;j++){const a=bodies[i],b=bodies[j];const r=(a.boss||b.boss)?60:24;const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||.01;if(d<r){const p=(r-d)/2;if(!a.boss)tryMove(a,-dx/d*p,-dy/d*p);if(!b.boss)tryMove(b,dx/d*p,dy/d*p);}}
 // shots
 for(const s of G.shots){s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;const w=WALLS.find(r=>inRect(s.x,s.y+30,r));if(w&&!(s.src&&inRect(s.src.x,s.src.y,w,40))){s.life=0;continue;}
  const targets=s.team==='ally'?G.enemies:G.allies;for(const t of targets){if(t.down||(t.team==='enemy'&&!t.aware&&G.phase!=='battle'))continue;const rad=t.boss?50:18;if(Math.hypot(t.x-s.x,t.y-30-s.y)<rad){hurt(t,s.dmg,s.src);s.life=0;break;}}}
 G.shots=G.shots.filter(s=>s.life>0);
 for(const f of G.fx)f.t-=dt;G.fx=G.fx.filter(f=>f.t>0);for(const t of G.texts){t.t-=dt;t.y-=40*dt;}G.texts=G.texts.filter(t=>t.t>0);
 // phases
 if(h.down){G.phase='lose';G.banner=null;sfx(70,1,'sawtooth',.08);return;}
 if(G.phase==='battle'&&!G.enemies.some(e=>e.wave===G.battle&&!e.down)){
  if(G.battle===1){G.phase='travel';G.banner={t:4,big:'AREA CLEAR',small:'Move north through the gap. Battle 2 ahead — enemies are alert.'};G.allies.forEach(a=>a.post=null);}
  else if(G.battle===2){G.phase='travel';G.banner={t:4,big:'AREA CLEAR',small:'The Sovereign waits beyond the north gate.'};G.allies.forEach(a=>a.post=null);}
  else{G.phase='win';stats.wins++;save();}}
 if(G.phase==='travel'){if(G.battle===1&&h.y<1900){G.battle=2;G.phase='battle';wake(2);G.banner={t:3,big:'BATTLE 2',small:'Contact! Use cover (-40% damage taken) and ridges (+15% damage).'};}
  else if(G.battle===2&&h.y<1000){G.battle=3;G.phase='battle';spawnBoss();}}
 if(G.phase==='battle'&&G.battle!==1)G.enemies.filter(e=>e.wave===G.battle).forEach(e=>e.aware=true);
 // camera
 G.cam.x+=(h.x-G.cam.x)*Math.min(1,dt*6);G.cam.y+=(h.y-40-G.cam.y)*Math.min(1,dt*6);}
function wake(w){for(const e of G.enemies)if(e.wave===w)e.aware=true;}
function spawnBoss(){const b=mkBoss(ARENA.x,ARENA.y);b.wave=3;b.aware=true;G.enemies.push(b,Object.assign(mkEnemy('reptile-guard',ARENA.x-140,ARENA.y+60,true),{wave:3}),Object.assign(mkEnemy('reptile-guard',ARENA.x+140,ARENA.y+60,true),{wave:3}));G.boss=b;
 G.banner={t:4,big:'NORDIC SOVEREIGN',small:'Kill the Sovereign. Phase 2 at 60% adds the slam; phase 3 at 25%.'};sfx(110,.8,'sawtooth',.08);}
function bossAI(b,dt,alive){b.abT-=dt;const t=nearest(b,alive);if(!t)return;const d=Math.hypot(t.x-b.x,t.y-b.y);const hpP=b.hp/b.maxHp;
 if(b.act){b.act.t-=dt;const A=b.act;
  if(A.k==='sweep'&&!A.done&&A.t<A.T-.25){A.done=1;fxRing(b.x,b.y,150,C.red);for(const a of alive){const dd=Math.hypot(a.x-b.x,a.y-b.y);const ang=Math.abs(((Math.atan2(a.y-b.y,a.x-b.x)-A.ang+Math.PI*3)%(Math.PI*2))-Math.PI);if(dd<150&&ang<1.4)hurt(a,28,b);}}
  if(A.k==='barrage'){A.ft=(A.ft||0)-dt;if(A.ft<=0){A.ft=.14;const a=Math.atan2(t.y-b.y,t.x-b.x)+(Math.random()-.5)*.6;G.shots.push({x:b.x,y:b.y-80,vx:Math.cos(a)*300,vy:Math.sin(a)*300,team:'enemy',dmg:7,life:1.6,col:C.gold,r:5,src:b});}}
  if(A.k==='slam'&&!A.done&&A.t<A.T*.5){A.done=1;fxRing(b.x,b.y,220,C.gold);sfx(60,.5,'sawtooth',.1);for(const a of alive)if(Math.hypot(a.x-b.x,a.y-b.y)<220)hurt(a,30,b);}
  if(A.t<=0){b.act=null;if(A.k==='windup'){b.act={k:'slam',t:animLen('slam',b.path,b.dir)+.2,T:animLen('slam',b.path,b.dir)+.2};setAnim(b,'slam');}}
  return;}
 b.dir=dirOf(Math.atan2(t.y-b.y,t.x-b.x));
 if(b.abT<=0){const ph=hpP<.25?3:hpP<.6?2:1;b.abT=ph===3?1.2:ph===2?1.8:2.4;
  let k;if(d<150)k='sweep';else k='barrage';if(ph>=2&&Math.random()<.4)k='windup';
  const T=k==='barrage'?(ph===3?2.4:1.6):animLen(k,b.path,b.dir)+.15;b.act={k,t:T,T,ang:Math.atan2(t.y-b.y,t.x-b.x)};setAnim(b,k);return;}
 if(d>200){tryMove(b,(t.x-b.x)/d*b.spd*dt,(t.y-b.y)/d*b.spd*dt);setAnim(b,'move');}else setAnim(b,'idle');}
// ---------- draw ----------
function draw(){buttons=[];ctx.fillStyle=C.dark;ctx.fillRect(0,0,W,H);
 if(scene==='title')drawTitle();else if(scene==='create')drawCreate();else if(scene==='base')drawBase();else if(scene==='mission')drawMission();
 ctx.fillStyle='rgba(255,255,255,.35)';ctx.font='10px system-ui';ctx.textAlign='right';ctx.textBaseline='bottom';ctx.fillText(VERSION,W-6,H-4);}
function txt(s,x,y,size,col='#fff',align='center',weight=800){ctx.font=`${weight} ${size}px system-ui`;ctx.fillStyle=col;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(s,x,y);}
function drawTitle(){const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#3a2230');g.addColorStop(.5,C.slate);g.addColorStop(1,C.dark);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 txt('SQUAD',W/2,H*.2,Math.min(64,W*.16),C.teal);txt('2033',W/2,H*.2+Math.min(60,W*.15),Math.min(64,W*.16),C.dusk);
 txt('Real-time squad action',W/2,H*.2+Math.min(110,W*.27),15,'#ccd');
 // squad lineup
 const k=Math.min(1.5,W/330);squad.forEach((m,i)=>{drawUnit('players/'+m.cls+'-'+m.race,m.cls+'-'+m.race,'idle','S',performance.now()/1000+i*.3,W/2+(i-1.5)*W*.21,H*.6,k);});
 const bw=Math.min(280,W*.7);btn(W/2-bw/2,H*.68,bw,52,'DEPLOY',()=>{unlockAudio();scene='loading';preload().then(()=>{if(!loadErr)startMission();});},{bg:C.teal,fg:C.dark,size:20});
 btn(W/2-bw/2,H*.68+62,bw,44,'SQUAD',()=>{scene='create';previewPaths().forEach(loadSheet);});btn(W/2-bw/2,H*.68+114,bw,44,'BASE',()=>scene='base');
 txt(`Missions won: ${stats.wins}`,W/2,H-24,12,'#889');}
function drawCreate(){txt('CREATE YOUR SQUAD',W/2,30,20,'#fff');txt('Slot 1 is your hero. Tap to change race / class / name.',W/2,54,12,'#aab');
 const top=74,rowH=Math.min(140,(H-top-80)/4);const k=Math.min(1.1,rowH/100);
 squad.forEach((m,i)=>{const y=top+i*rowH;const c=CLS[m.cls];ctx.fillStyle=i===0?'#22323a':'#232a33';rr(8,y+4,W-16,rowH-8,12);ctx.fill();ctx.strokeStyle=c.col;ctx.lineWidth=2;ctx.stroke();
  drawUnit('players/'+m.cls+'-'+m.race,m.cls+'-'+m.race,'idle','S',performance.now()/1000+i*.4,60,y+rowH*.82,k);
  const bx=118,bw=(W-bx-16)/2-6;txt((i===0?'★ ':'')+m.name,bx,y+22,16,'#fff','left');
  btn(bx,y+38,bw,34,c.name,()=>{m.cls=CLASSES[(CLASSES.indexOf(m.cls)+1)%4];loadSheet('players/'+m.cls+'-'+m.race);save();},{stroke:c.col});
  btn(bx+bw+8,y+38,bw,34,RACE_NAME[m.race],()=>{m.race=RACES[(RACES.indexOf(m.race)+1)%3];loadSheet('players/'+m.cls+'-'+m.race);save();});
  if(rowH>100)txt(`HP ${Math.round(c.hp*RACE_MOD[m.race].hp)} · ${c.ab}`,bx,y+88,11,'#99a','left',600);
  buttons.push({x:bx,y:y+8,w:bw*2,h:28,fn:()=>{m.name=NAMES[(NAMES.indexOf(m.name)+1)%NAMES.length];save();}});});
 btn(W/2-110,H-62,220,48,'DONE',()=>scene='title',{bg:C.teal,fg:C.dark,size:18});}
function drawBase(){txt('BASE',W/2,40,24,'#fff');txt('(stub — base building comes later)',W/2,66,12,'#99a');
 squad.forEach((m,i)=>{const y=100+i*64;txt(`${m.name} — ${RACE_NAME[m.race]} ${CLS[m.cls].name}`,24,y,15,CLS[m.cls].col,'left');});
 txt(`Missions: ${stats.runs} · Won: ${stats.wins}`,W/2,100+4*64+10,14,'#ccd');btn(W/2-110,H-62,220,48,'BACK',()=>scene='title');}
function drawLoading(){txt(loadErr||'LOADING SPRITES…',W/2,H/2,18,loadErr?'#f66':'#fff');if(loadErr)btn(W/2-90,H/2+30,180,44,'RETRY',()=>preload().then(()=>{if(!loadErr)startMission();}));}
function drawMission(){const z=G.zoom=Math.max(.6,Math.min(1.6,Math.min(W/430,H/700)));
 ctx.save();ctx.translate(W/2,H/2);ctx.scale(z,z);ctx.translate(-G.cam.x,-G.cam.y);
 // ground
 ctx.fillStyle='#39414c';ctx.fillRect(0,0,MAP.w,MAP.h);
 ctx.strokeStyle='rgba(255,255,255,.04)';ctx.lineWidth=2;ctx.beginPath();for(let x=0;x<=MAP.w;x+=60){ctx.moveTo(x,0);ctx.lineTo(x,MAP.h);}for(let y=0;y<=MAP.h;y+=60){ctx.moveTo(0,y);ctx.lineTo(MAP.w,y);}ctx.stroke();
 // zones
 ctx.fillStyle='rgba(179,32,46,.08)';for(const c of[CAMP1,CAMP2]){ctx.beginPath();ctx.arc(c.x,c.y,200,0,7);ctx.fill();}
 ctx.fillStyle='rgba(217,169,58,.1)';ctx.beginPath();ctx.arc(ARENA.x,ARENA.y,330,0,7);ctx.fill();ctx.strokeStyle='rgba(217,169,58,.4)';ctx.lineWidth=4;ctx.stroke();
 // high ground
 for(const r of HIGH){ctx.fillStyle='#2a3038';ctx.fillRect(r.x,r.y+r.h,r.w,14);ctx.fillStyle='#5b6573';ctx.fillRect(r.x,r.y,r.w,r.h);ctx.strokeStyle='#8a94a2';ctx.lineWidth=3;ctx.strokeRect(r.x,r.y,r.w,r.h);
  ctx.fillStyle='rgba(255,255,255,.5)';ctx.font='700 14px system-ui';ctx.textAlign='center';ctx.fillText('▲ HIGH GROUND',r.x+r.w/2,r.y+18);}
 if(G.phase==='setup'){ctx.fillStyle='rgba(47,224,214,.06)';ctx.fillRect(0,2150,MAP.w,1450);ctx.strokeStyle='rgba(47,224,214,.35)';ctx.setLineDash([12,10]);ctx.strokeRect(4,2150,MAP.w-8,1450);ctx.setLineDash([]);
  for(const e of G.enemies)if(e.wave===1){ctx.strokeStyle='rgba(255,60,60,.5)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(e.x,e.y,SIGHT,0,7);ctx.stroke();}}
 // draw list
 const list=[...G.allies,...G.enemies].filter(u=>u.wave!==3||G.battle===3);
 const walls=WALLS.map(w=>({wall:w,y:w.y+w.h}));
 const items=[...list.map(u=>({u,y:u.y})),...walls].sort((a,b)=>a.y-b.y);
 for(const it of items){if(it.wall){const w=it.wall;ctx.fillStyle='#4d535c';ctx.fillRect(w.x,w.y-10,w.w,w.h+10);ctx.fillStyle='#8b919b';ctx.fillRect(w.x,w.y-18,w.w,w.h);ctx.strokeStyle=C.dark;ctx.lineWidth=2;ctx.strokeRect(w.x,w.y-18,w.w,w.h+18);continue;}
  const u=it.u;
  if(u.team==='ally'&&!u.down){ctx.strokeStyle=u.col;ctx.lineWidth=u.hero?4:2.5;ctx.beginPath();ctx.ellipse(u.x,u.y,22,11,0,0,7);ctx.stroke();}
  if(u.mark>0){ctx.strokeStyle=C.lime;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(u.x,u.y,26,13,0,0,7);ctx.stroke();}
  if(u.shield>0){ctx.fillStyle='rgba(239,232,218,.25)';ctx.beginPath();ctx.arc(u.x,u.y-35,36,0,7);ctx.fill();}
  const ok=drawUnit(u.path,u.unit,u.anim,u.dir,u.at,u.x,u.y,1,u.down&&u.team==='enemy'?.7:null);
  if(!ok){ctx.fillStyle=u.team==='ally'?u.col:C.red;ctx.fillRect(u.x-10,u.y-40,20,40);}
  if(u.stun>0&&!u.down)txt('!?',u.x,u.y-(u.boss?190:90),18,C.loot);
  if(!u.down&&(u.hp<u.maxHp||u.team==='ally')&&!u.boss){const bw=40;ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(u.x-bw/2,u.y-84,bw,5);ctx.fillStyle=u.team==='ally'?u.col:C.red;ctx.fillRect(u.x-bw/2,u.y-84,bw*u.hp/u.maxHp,5);}
  if(u.down&&u.team==='ally'&&!u.hero){txt(u.revive>0?'REVIVING':'DOWN — stand close',u.x,u.y-40,11,'#fff');if(u.revive>0){ctx.fillStyle=C.lime;ctx.fillRect(u.x-20,u.y-30,40*u.revive/2,4);}}
  if(G.phase==='setup'&&u.team==='ally'){if(G.sel===u.idx){ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(u.x,u.y,30,15,0,0,7);ctx.stroke();}
   const tags=[];if(onHigh(u.tx,u.ty))tags.push('▲');if(nearWall(u.tx,u.ty)&&!onHigh(u.tx,u.ty))tags.push('🛡');if(G.enemies.some(e=>e.wave===1&&Math.hypot(u.tx-e.x,u.ty-e.y)<SIGHT))tags.push('⚠');
   txt((u.hero?'★':'')+u.name+' '+tags.join(''),u.x,u.y+22,13,u.col);}}
 for(const d of G.drones){ctx.fillStyle=C.violet;ctx.beginPath();ctx.arc(d.x,d.y,8,0,7);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();}
 for(const s of G.shots){ctx.fillStyle=s.col;ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,7);ctx.fill();}
 for(const f of G.fx){ctx.strokeStyle=f.c;ctx.globalAlpha=f.t/f.T;ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(f.x,f.y,f.r*(1-f.t/f.T*.5),f.r*.5*(1-f.t/f.T*.5),0,0,7);ctx.stroke();ctx.globalAlpha=1;}
 for(const t of G.texts){ctx.globalAlpha=Math.min(1,t.t*2);txt(t.s,t.x,t.y,16,t.c);ctx.globalAlpha=1;}
 ctx.restore();
 drawHUD();}
function abilityBtn(){return{x:W-96,y:H-210,w:80,h:80};}
function pauseBtn(){return{x:W-52,y:10,w:42,h:42};}
function drawHUD(){const h=G.hero;
 // squad portraits/hp
 G.allies.forEach((a,i)=>{const x=10,y=10+i*30;ctx.fillStyle='rgba(0,0,0,.5)';rr(x,y,150,24,6);ctx.fill();txt((a.hero?'★':'')+a.name,x+6,y+12,11,a.down?'#777':a.col,'left');ctx.fillStyle='#333';ctx.fillRect(x+80,y+9,64,6);ctx.fillStyle=a.down?'#555':a.col;ctx.fillRect(x+80,y+9,64*a.hp/a.maxHp,6);});
 if(G.phase==='setup'){const ev=evalSetup();ctx.fillStyle='rgba(22,26,32,.85)';ctx.fillRect(0,H-150,W,150);
  const l=[];if(ev.spotted)l.push(['⚠ Someone is inside a sight ring — you will be SPOTTED','#ff6b6b']);else{l.push([`▲ High ground: ${ev.high.length}   🛡 Cover: ${ev.cover.length}   ${ev.flank?'✔':'✖'} Flank`,'#fff']);l.push([ev.first?'✔ FIRST STRIKE ready (opening volley)':'First strike needs a stronger setup (score 4+)',ev.first?C.loot:'#99a']);}
  l.forEach((s,i)=>txt(s[0],W/2,H-132+i*20,13,s[1]));
  txt('Tap soldier → tap map. Drag to pan.',W/2,H-90,12,'#99a',undefined,600);
  btn(W/2-100,H-68,200,52,'ENGAGE',engage,{bg:C.dusk,fg:C.dark,size:20});
  btn(W-100,H-200,90,36,'AUTO',autoSetup,{size:13});}
 else if(G.phase==='win'||G.phase==='lose'){ctx.fillStyle='rgba(0,0,0,.7)';ctx.fillRect(0,0,W,H);txt(G.phase==='win'?'MISSION COMPLETE':'HERO DOWN',W/2,H*.38,28,G.phase==='win'?C.loot:'#ff6b6b');
  txt(`Kills: ${G.kills}`,W/2,H*.38+40,16,'#ddd');const wd=G.allies.filter(a=>!a.hero&&(a.wounded||a.down)).map(a=>a.name);if(wd.length)txt('Wounded: '+wd.join(', '),W/2,H*.38+64,13,'#f99');
  btn(W/2-110,H*.55,220,50,'RETRY',startMission,{bg:C.teal,fg:C.dark});btn(W/2-110,H*.55+60,220,44,'MENU',()=>{scene='title';});}
 else{// sticks
  for(const[s,side] of[[sticks.L,0],[sticks.R,1]]){if(s){ctx.strokeStyle='rgba(255,255,255,.3)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(s.ox,s.oy,50,0,7);ctx.stroke();ctx.fillStyle='rgba(255,255,255,.35)';const dx=s.x-s.ox,dy=s.y-s.oy,d=Math.hypot(dx,dy),k=Math.min(1,50/(d||1));ctx.beginPath();ctx.arc(s.ox+dx*k,s.oy+dy*k,22,0,7);ctx.fill();}
   else{ctx.fillStyle='rgba(255,255,255,.07)';ctx.beginPath();ctx.arc(side?W-90:90,H-90,50,0,7);ctx.fill();txt(side?'AIM/FIRE':'MOVE',side?W-90:90,H-90,11,'rgba(255,255,255,.4)');}}
  const b=abilityBtn();const r=h.cd/h.cdMax;ctx.fillStyle=r>0?'#333':h.col;ctx.beginPath();ctx.arc(b.x+40,b.y+40,38,0,7);ctx.fill();if(r>0){ctx.fillStyle='rgba(255,255,255,.2)';ctx.beginPath();ctx.moveTo(b.x+40,b.y+40);ctx.arc(b.x+40,b.y+40,38,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-r));ctx.fill();}
  txt(r>0?Math.ceil(h.cd)+'s':'SKILL',b.x+40,b.y+34,13,r>0?'#fff':C.dark);txt(CLS[h.cls].ab.split(' ').pop(),b.x+40,b.y+52,10,r>0?'#ccc':C.dark,undefined,600);
  const p=pauseBtn();ctx.fillStyle='rgba(0,0,0,.5)';rr(p.x,p.y,p.w,p.h,8);ctx.fill();txt(G.paused?'▶':'II',p.x+21,p.y+21,16,'#fff');
  if(G.boss&&!G.boss.down){const bw=W-200;ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(170,14,bw,14);ctx.fillStyle=C.red;ctx.fillRect(170,14,bw*G.boss.hp/G.boss.maxHp,14);txt('NORDIC SOVEREIGN',170+bw/2,38,11,C.gold);}
  else txt(G.phase==='travel'?'▲ Head north':`BATTLE ${G.battle} · enemies ${G.enemies.filter(e=>e.wave===G.battle&&!e.down).length}`,W/2,H-180,13,'#ddd');
  if(G.paused){ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(0,0,W,H);txt('PAUSED',W/2,H/2-40,28,'#fff');btn(W/2-100,H/2,200,46,'RESUME',()=>G.paused=false);btn(W/2-100,H/2+56,200,44,'QUIT',()=>{G.paused=false;scene='title';});}}
 if(G.banner){const a=Math.min(1,G.banner.t);ctx.globalAlpha=a;ctx.fillStyle='rgba(0,0,0,.65)';ctx.fillRect(0,H*.22,W,90);txt(G.banner.big,W/2,H*.22+28,24,C.loot);wrap(G.banner.small,W/2,H*.22+60,W-30,12);ctx.globalAlpha=1;}}
function wrap(s,x,y,maxW,size){ctx.font=`600 ${size}px system-ui`;const words=s.split(' ');let line='',lines=[];for(const w of words){const t=line?line+' '+w:w;if(ctx.measureText(t).width>maxW&&line){lines.push(line);line=w;}else line=t;}lines.push(line);lines.forEach((l,i)=>txt(l,x,y+i*(size+3)-(lines.length-1)*(size+3)/2,size,'#fff',undefined,600));}
function autoSetup(){// a good default: two on west ridge, one in south cover, one flanking east ridge
 const spots=[[170,2600],[230,2560],[600,2840],[1010,2700]];G.allies.forEach((a,i)=>{a.tx=spots[i][0];a.ty=spots[i][1];});}
// ---------- loop ----------
let last=performance.now();
function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;try{update(dt);if(scene==="loading"){buttons=[];ctx.fillStyle=C.dark;ctx.fillRect(0,0,W,H);drawLoading();}else draw();}catch(e){console.error(e);window.__err=String(e&&e.stack||e);}requestAnimationFrame(frame);}
requestAnimationFrame(frame);
// title preload of current squad
squad.forEach(m=>loadSheet('players/'+m.cls+'-'+m.race));
window.__squad={sticks,get G(){return G},get scene(){return scene},startMission,engage,autoSetup,preload};
