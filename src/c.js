// ---------- 3D helpers for gameplay ----------
const ringGeo=new THREE.RingGeometry(.55,.72,32);ringGeo.rotateX(-Math.PI/2);
function mkRing(col,op=.95){const m=new THREE.Mesh(ringGeo,new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:op,depthWrite:false}));m.renderOrder=2;scene.add(m);return m;}
const SHOTS_MAX=160;const shotMesh=new THREE.InstancedMesh(new THREE.SphereGeometry(.13,8,6),new THREE.MeshBasicMaterial({color:'#fff'}),SHOTS_MAX);shotMesh.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(SHOTS_MAX*3),3);shotMesh.frustumCulled=false;shotMesh.count=0;scene.add(shotMesh);
const fxPool=[];for(let i=0;i<10;i++){const m=new THREE.Mesh(new THREE.RingGeometry(.85,1,48).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:'#fff',transparent:true,depthWrite:false}));m.visible=false;m.renderOrder=3;scene.add(m);fxPool.push(m);}
const sightMesh=new THREE.InstancedMesh(new THREE.RingGeometry(.94,1,48).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:'#ff3c3c',transparent:true,opacity:.7,depthWrite:false}),16);sightMesh.frustumCulled=false;sightMesh.count=0;scene.add(sightMesh);
const BLOB_MAX=40;const blobMesh=new THREE.InstancedMesh(new THREE.CircleGeometry(.5,20).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:'#000',transparent:true,opacity:.28,depthWrite:false}),BLOB_MAX);blobMesh.frustumCulled=false;blobMesh.count=0;blobMesh.renderOrder=1;scene.add(blobMesh);
const selRing=mkRing('#ffffff');selRing.scale.setScalar(1.25);selRing.visible=false;
const droneMeshes=[];for(let i=0;i<4;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(.22,10,8),new THREE.MeshStandardMaterial({color:C.violet,emissive:C.violet,emissiveIntensity:.8}));m.visible=false;scene.add(m);droneMeshes.push(m);}
// highlight tiles in setup (deploy zone)
const zoneMesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:C.teal,transparent:true,opacity:.08,depthWrite:false}));scene.add(zoneMesh);zoneMesh.visible=false;
// ---------- input ----------
const keys={};addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=1;if(e.key===' ')useAbility(G&&G.hero);});addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=0;});
const sticks={L:null,R:null};const taps=[];
function ptr(e){const r=cv.getBoundingClientRect();const rx=(e.clientX-r.left)*RW/(r.width||RW),ry=(e.clientY-r.top)*RH/(r.height||RH);return{x:rx/U,y:(ry-TOP)/U,id:e.pointerId};}
cv.addEventListener('pointerdown',e=>{e.preventDefault();try{cv.setPointerCapture(e.pointerId);}catch(_){}unlockAudio();const p=ptr(e);
 if(scene_==='mission'&&G&&!G.paused&&(G.phase==='battle'||G.phase==='travel')){
  if(hitBtn(p,abilityBtn())){useAbility(G.hero);return;}
  if(hitBtn(p,pauseBtn())){G.paused=true;return;}
  if(p.x<W/2&&!sticks.L){sticks.L={id:p.id,ox:p.x,oy:p.y,x:p.x,y:p.y};return;}
  if(p.x>=W/2&&!sticks.R){sticks.R={id:p.id,ox:p.x,oy:p.y,x:p.x,y:p.y};return;}}
 taps.push({x:p.x,y:p.y,id:p.id,sx:p.x,sy:p.y,moved:false});});
cv.addEventListener('pointermove',e=>{const p=ptr(e);for(const s of['L','R'])if(sticks[s]&&sticks[s].id===p.id){sticks[s].x=p.x;sticks[s].y=p.y;}
 const t=taps.find(t=>t.id===p.id);if(t){if(Math.hypot(p.x-t.sx,p.y-t.sy)>10)t.moved=true;if(t.moved&&scene_==='mission'&&G.phase==='setup'){const a=s2w(t.x,t.y),b=s2w(p.x,p.y);G.cam.x-=b.x-a.x;G.cam.y-=b.y-a.y;}t.x=p.x;t.y=p.y;}});
function endPtr(e){const p=ptr(e);for(const s of['L','R'])if(sticks[s]&&sticks[s].id===p.id)sticks[s]=null;const i=taps.findIndex(t=>t.id===p.id);if(i>=0){const t=taps[i];taps.splice(i,1);if(!t.moved)onTap(t.x,t.y);}}
cv.addEventListener('pointerup',endPtr);cv.addEventListener('pointercancel',endPtr);
for(const ev of['touchstart','touchmove','touchend'])cv.addEventListener(ev,e=>e.preventDefault(),{passive:false});document.addEventListener('gesturestart',e=>e.preventDefault());
function hitBtn(p,b){return b&&p.x>=b.x&&p.x<=b.x+b.w&&p.y>=b.y&&p.y<=b.y+b.h;}
let buttons=[];function btn(x,y,w,h,label,fn,opt={}){buttons.push({x,y,w,h,fn});ctx.save();ctx.fillStyle=opt.bg||'rgba(42,49,59,.92)';ctx.strokeStyle=opt.stroke||'#6E7480';ctx.lineWidth=2;rr(x,y,w,h,10);ctx.fill();ctx.stroke();
 ctx.fillStyle=opt.fg||'#fff';ctx.font=`800 ${opt.size||16}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,x+w/2,y+h/2+1);ctx.restore();}
function rr(x,y,w,h,r){ctx.beginPath();ctx.roundRect?ctx.roundRect(x,y,w,h,r):ctx.rect(x,y,w,h);}
function onTap(x,y){for(let i=buttons.length-1;i>=0;i--){const b=buttons[i];if(x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h){b.fn();return;}}if(scene_==='mission'&&G.phase==='setup')setupTap(x,y);}
let AC=null;function unlockAudio(){if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)();}catch(e){}}if(AC&&AC.state==='suspended')AC.resume();}
function sfx(f,d=.06,type='square',v=.04){if(!AC)return;const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.value=f;g.gain.value=v;g.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+d);o.connect(g);g.connect(AC.destination);o.start();o.stop(AC.currentTime+d);}
// projection: world units <-> HUD virtual coords
const _v=new THREE.Vector3(),_rc=new THREE.Raycaster(),_pl=new THREE.Plane(new THREE.Vector3(0,1,0),0),_n=new THREE.Vector2();
function w2s(x,y,h=0){_v.set(u2X(x),h,u2Z(y)).project(cam);return{x:((_v.x+1)/2*RW)/U,y:((1-_v.y)/2*RH-TOP)/U};}
function s2w(sx,sy){_n.set((sx*U)/RW*2-1,-((sy*U+TOP)/RH*2-1));_rc.setFromCamera(_n,cam);const p=new THREE.Vector3();_rc.ray.intersectPlane(_pl,p);return{x:(p.x+40)*M2U,y:(p.z+40)*M2U};}
// ---------- scenes ----------
let scene_='title',G=null,loadErr=null,loadN=0,loadT=0;
function heroPaths(){return squad.map(heroPath);}
function allPaths(){return[...new Set([...heroPaths(),...Object.values(EN).map(e=>e.model),'boss/boss_sovereign',...ENV_IDS.map(i=>'env/'+i)])];}
let worldBuilt=false;
function preload(){loadErr=null;const ps=allPaths();loadT=ps.length;loadN=0;return Promise.all(ps.map(p=>loadGLB(p).then(()=>loadN++))).then(()=>{if(!worldBuilt){worldBuilt=true;
  const rb=new THREE.Box3().setFromObject(GLB['env/ridge_1x1'].g.scene);RIDGE_H=rb.max.y||1.16;buildGround();layoutEnv();buildEnv();}}).catch(e=>{console.error(e);loadErr='Failed to load 3D models';});}
// ---------- units ----------
let UID=1;
function mkAlly(m,i,x,y){const c=CLS[m.cls],rm=RACE_MOD[m.race];const hp=Math.round(c.hp*rm.hp*(i===0?1.4:1));
 const u={id:UID++,team:'ally',idx:i,hero:i===0,m,cls:m.cls,x,y,hp,maxHp:hp,spd:c.spd*rm.spd,dmg:c.dmg,rate:c.rate,range:c.range,
  cd:0,cdMax:9*rm.cd,fireT:0,face:Math.PI,anim:'idle',lock:0,down:false,tx:x,ty:y,buff:0,dash:0,revive:0,col:c.col,name:m.name,h:0};
 u.md=makeModel(heroPath(m),c.col);u.ring=mkRing(c.col);if(u.hero)u.ring.scale.setScalar(1.15);return u;}
function mkEnemy(type,x,y,aware){const e=EN[type];
 const u={id:UID++,team:'enemy',type,x,y,hp:e.hp,maxHp:e.hp,spd:e.spd,dmg:e.dmg,rate:e.rate,range:e.range,melee:e.melee,fireT:Math.random(),face:0,anim:'idle',lock:0,down:false,
  aware,stun:0,mark:0,abT:3+Math.random()*4,shield:0,name:e.name,h:0,lift:e.lift||0};u.md=makeModel(e.model);return u;}
function mkBoss(x,y){const u={id:UID++,team:'enemy',boss:true,type:'sovereign',x,y,hp:2400,maxHp:2400,spd:55,dmg:16,range:420,fireT:2,face:0,anim:'idle',lock:0,down:false,aware:false,stun:0,mark:0,abT:2,shield:0,name:'Nordic Sovereign',h:0,lift:0};
 u.md=makeModel('boss/boss_sovereign');u.md.obj.scale.setScalar(1.15);return u;}
function clearMission(){if(!G)return;for(const u of[...G.allies,...G.enemies]){if(u.md){scene.remove(u.md.obj);u.md.mixer.stopAllAction();}if(u.ring)scene.remove(u.ring);}G.drones=[];droneMeshes.forEach(d=>d.visible=false);}
const E1=[['nordic-commander',0,-.5],['nordic-sentinel',-1.2,-1],['nordic-sentinel',1.5,-1.1],['reptile-brute',-.6,1.9],['reptile-brute',.8,1.7],['reptile-skirmisher',-2.6,.9],['reptile-skirmisher',2.8,.9],['collab-trooper',-2,-.5],['collab-trooper',2.2,0],['collab-medic',.2,-1.6]];
const E2=[['nordic-sentinel',-1.2,-1.4],['nordic-sentinel',1.6,-1.4],['nordic-commander',.2,-2.1],['reptile-brute',-1,1.9],['reptile-brute',1.2,1.9],['reptile-skirmisher',-3.4,.6],['reptile-skirmisher',3.4,.6],['reptile-skirmisher',0,2.5],['collab-trooper',-3.9,-1.5],['collab-trooper',4,-1.5],['collab-medic',0,-1]];
function startMission(){clearMission();UID=1;
 const allies=squad.map((m,i)=>mkAlly(m,i,TC(7+i*1.3,36).x,TC(7,36).y));
 const e1=E1.map(a=>Object.assign(mkEnemy(a[0],CAMP1.x+a[1]*TILE,CAMP1.y+a[2]*TILE,false),{wave:1}));
 const e2=E2.map(a=>Object.assign(mkEnemy(a[0],CAMP2.x+a[1]*TILE,CAMP2.y+a[2]*TILE,false),{wave:2}));
 G={allies,hero:allies[0],enemies:[...e1,...e2],shots:[],fx:[],texts:[],phase:'setup',t:0,cam:{x:CAMP1.x,y:CAMP1.y+TILE*3},sel:0,adv:null,banner:null,paused:false,kills:0,battle:1,drones:[]};
 allies.forEach((a,i)=>{const p=TC(19+i*1.4,37);a.x=a.tx=p.x;a.y=a.ty=p.y;});
 scene_='mission';stats.runs++;save();
 G.banner={t:5,big:'SETUP',small:'Tap a soldier, then tap the map to position them. Use HIGH GROUND, COVER and FLANKS. Stay out of the red sight rings.'};}
// ---------- setup ----------
const SIGHT=160;
function evalSetup(){const al=G.allies,en=G.enemies.filter(e=>e.wave===1);let spotted=al.some(a=>en.some(e=>Math.hypot(a.tx-e.x,a.ty-e.y)<SIGHT));
 const high=al.filter(a=>onHigh(a.tx,a.ty)),cover=al.filter(a=>nearWall(a.tx,a.ty)&&!onHigh(a.tx,a.ty));
 const ang=al.map(a=>Math.atan2(a.ty-CAMP1.y,a.tx-CAMP1.x)).sort((a,b)=>a-b);let maxGap=0;for(let i=0;i<ang.length;i++){const g=(i+1<ang.length?ang[i+1]:ang[0]+Math.PI*2)-ang[i];maxGap=Math.max(maxGap,g);}
 const spread=Math.PI*2-maxGap;const flank=spread>=Math.PI*0.6&&al.every(a=>Math.hypot(a.tx-CAMP1.x,a.ty-CAMP1.y)<560);
 const score=high.length+cover.length+(flank?2:0);const first=!spotted&&score>=4;
 return{spotted,high,cover,flank:flank&&!spotted,first,score:spotted?0:score};}
function setupTap(sx,sy){const p=s2w(sx,sy);let hit=null,bd=1e9;for(const a of G.allies){const s=w2s(a.x,a.y,a.h+.9);const d=Math.hypot(s.x-sx,s.y-sy);if(d<34&&d<bd){bd=d;hit=a;}}
 if(hit){G.sel=hit.idx;sfx(660,.05);return;}
 const a=G.allies[G.sel];if(bandOf(p.y)!==2||blocked(p.x,p.y,14))return;a.tx=p.x;a.ty=p.y;sfx(440,.05);G.sel=(G.sel+1)%4;}
function engage(){const ev=evalSetup();G.adv=ev;G.phase='battle';G.battle=1;
 for(const a of G.allies){a.x=a.tx;a.y=a.ty;a.post={x:a.tx,y:a.ty};}
 const en=G.enemies.filter(e=>e.wave===1);en.forEach(e=>e.aware=true);
 let lines=[];
 if(ev.spotted){lines.push('SPOTTED — no advantage');en.forEach(e=>e.fireT=0);}
 else{if(ev.high.length)lines.push(`HIGH GROUND x${ev.high.length}: +35% damage`);if(ev.cover.length)lines.push(`COVER x${ev.cover.length}: -40% damage taken`);
  if(ev.flank){lines.push('FLANKED: enemies caught off guard (3s)');en.forEach(e=>e.stun=3);}
  if(ev.first){lines.push('FIRST STRIKE: opening volley');for(const a of G.allies){const t=nearest(a,en);if(t)hurt(t,40,a);}}
  if(!lines.length)lines.push('No advantage — try high ground, cover or flanking');}
 G.banner={t:4,big:'BATTLE 1',small:lines.join(' · ')};sfx(220,.3,'sawtooth',.06);}
function autoSetup(){const spots=[TC(16,29),TC(16,30),TC(19,34),TC(30,32)];G.allies.forEach((a,i)=>{a.tx=spots[i].x;a.ty=spots[i].y;});}
// ---------- combat helpers ----------
function nearest(u,list,maxD=1e9){let b=null,bd=maxD;for(const o of list){if(o.down)continue;const d=Math.hypot(o.x-u.x,o.y-u.y);if(d<bd){bd=d;b=o;}}return b;}
function liveEnemies(){return G.enemies.filter(e=>!e.down&&e.aware);}
function setAnim(u,a,lock){if(u.anim!==a){u.anim=a;}if(lock)u.lock=lock;}
function lineBlocked(x1,y1,x2,y2,shooter){const n=Math.ceil(Math.hypot(x2-x1,y2-y1)/12);for(let i=1;i<n;i++){const x=x1+(x2-x1)*i/n,y=y1+(y2-y1)*i/n;const w=WALLS.find(r=>inRect(x,y,r,2));if(w&&!(shooter&&inRect(shooter.x,shooter.y,w,40)))return true;}return false;}
function dmgMult(src){let m=1;if(!src)return m;if(src.team==='ally'){if(onHigh(src.x,src.y))m*=G.adv&&!G.adv.spotted&&G.battle===1?1.35:1.15;if(src.buff>0)m*=1.3;}return m;}
function hurt(t,d,src){if(t.down)return;if(t.team==='ally'){if(nearWall(t.x,t.y,30)&&src&&!src.boss)d*=.6;if(t.hero&&t.dash>0)return;}
 if(t.team==='enemy'){if(t.mark>0)d*=1.5;if(t.shield>0)d*=.4;t.aware=true;}
 d=Math.round(d);t.hp-=d;G.texts.push({x:t.x+(Math.random()-.5)*16,y:t.y,h:2.4,s:String(d),t:.8,c:t.team==='ally'?'#ff8080':'#fff'});
 if(t.hp<=0){t.hp=0;t.down=true;t.downT=0;setAnim(t,'down');t.lock=0;if(t.team==='enemy'){G.kills++;sfx(120,.2,'triangle',.08);}else sfx(90,.4,'sawtooth',.06);}
 else if(!t.boss&&t.lock<=0&&Math.random()<.35)setAnim(t,'hit',.25);}
function fire(u,tx,ty){const a=Math.atan2(ty-u.y,tx-u.x);u.face=a;setAnim(u,'attack',.25);
 const sp=u.team==='ally'?620:360;const col=u.team==='ally'?u.col:(u.type&&u.type.startsWith('nordic')?'#F6D766':'#ff4b4b');
 G.shots.push({x:u.x+Math.cos(a)*18,y:u.y+Math.sin(a)*18,h:(u.h||0)+1.15,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,team:u.team,dmg:u.dmg*dmgMult(u),life:(u.range+40)/sp,src:u,col});
 if(u.team==='ally')sfx(u.cls==='recon'?900:u.cls==='heavy'?200:600,.04,'square',.02);}
function useAbility(u){if(!u||u.down||u.cd>0||scene_!=='mission'||!(G.phase==='battle'||G.phase==='travel'))return;u.cd=u.cdMax;setAnim(u,'ability',.35);sfx(330,.25,'triangle',.08);
 const en=G.enemies.filter(e=>!e.down);
 if(u.cls==='assault'){u.dash=.35;u.buff=4;u.vx=Math.cos(u.face)*600;u.vy=Math.sin(u.face)*600;fxRing(u.x,u.y,60,u.col);}
 else if(u.cls==='heavy'){fxRing(u.x,u.y,110,C.amber);for(const e of en){const d=Math.hypot(e.x-u.x,e.y-u.y);if(d<110){hurt(e,45*dmgMult(u),u);if(!e.boss){e.stun=Math.max(e.stun,1.2);const k=(110-d)/(d||1)*0.6;tryMove(e,(e.x-u.x)*k,(e.y-u.y)*k);}}}}
 else if(u.cls==='recon'){fxRing(u.x,u.y,320,C.lime);for(const e of en)if(Math.hypot(e.x-u.x,e.y-u.y)<320){e.mark=6;e.aware=true;}}
 else if(u.cls==='tech'){G.drones.push({x:u.x,y:u.y,t:9,owner:u,fireT:0});for(const a of G.allies)if(!a.down&&Math.hypot(a.x-u.x,a.y-u.y)<220){a.hp=Math.min(a.maxHp,a.hp+30);G.texts.push({x:a.x,y:a.y,h:2.6,s:'+30',t:.8,c:C.lime});}fxRing(u.x,u.y,220,C.violet);}}
function fxRing(x,y,r,c){G.fx.push({x,y,r,c,t:.5,T:.5});}
function tryMove(u,dx,dy){const r=u.boss?30:12;if(!blocked(u.x+dx,u.y,r))u.x+=dx;if(!blocked(u.x,u.y+dy,r))u.y+=dy;}
function steer(u,gx,gy,sp,dt){const w=waypoint(u,gx,gy);const dx=w.x-u.x,dy=w.y-u.y,d=Math.hypot(dx,dy);if(d<4)return false;let mx=dx/d,my=dy/d;
 if(blocked(u.x+mx*16,u.y+my*16,12)){const s=u.id%2?1:-1;const ax=-my*s,ay=mx*s;if(!blocked(u.x+ax*16,u.y+ay*16,12)){mx=ax;my=ay;}else{mx=-ax;my=-ay;}}
 tryMove(u,mx*sp*dt,my*sp*dt);u.face=Math.atan2(my,mx);return true;}
