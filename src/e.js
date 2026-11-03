// ---------- menu showroom (3D portraits) ----------
const show=new THREE.Scene();show.add(new THREE.HemisphereLight('#8FB0FF','#9A8466',1.9));{const k=new THREE.DirectionalLight('#FFE2BC',3);k.position.set(3,6,8);show.add(k);const r=new THREE.DirectionalLight('#9FC4FF',1.6);r.position.set(-6,4,-6);show.add(r);}show.add(new THREE.AmbientLight('#fff',1.1));
const showCam=new THREE.PerspectiveCamera(28,1,.1,50);const showMd=[];let showRects=[];
function ensureShow(){squad.forEach((m,i)=>{const p=heroPath(m);if(showMd[i]&&showMd[i].path===p)return;if(!GLB[p]||!GLB[p].g){loadGLB(p).catch(()=>{});return;}
 if(showMd[i]){show.remove(showMd[i].md.obj);}const md=makeModel(p,CLS[m.cls].col);scene.remove(md.obj);show.add(md.obj);md.obj.position.set(i*4,0,0);playAnim(md,'idle');showMd[i]={path:p,md};});}
function renderShow(dt){ensureShow();ren.setScissorTest(false);ren.setClearColor('#232b36');ren.clear();ren.setScissorTest(true);
 for(const r of showRects){const s=showMd[r.i];if(!s)continue;s.md.mixer.update(dt/ Math.max(1,showRects.length));const x=r.x*U,y=r.y*U+TOP,w=r.w*U,h=r.h*U;ren.setViewport(x,RH-y-h,w,h);ren.setScissor(x,RH-y-h,w,h);
  showCam.aspect=w/h;showCam.position.set(r.i*4,1.25,5.6);showCam.lookAt(r.i*4,.95,0);showCam.updateProjectionMatrix();ren.render(show,showCam);}
 ren.setScissorTest(false);ren.setViewport(0,0,RW,RH);ren.setClearColor('#1d2430');}
// ---------- HUD ----------
function txt(s,x,y,size,col='#fff',align='center',weight=800){ctx.font=`${weight} ${size}px system-ui`;ctx.fillStyle=col;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(s,x,y);}
function txtO(s,x,y,size,col){ctx.font=`800 ${size}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=3;ctx.strokeStyle='rgba(0,0,0,.7)';ctx.strokeText(s,x,y);ctx.fillStyle=col;ctx.fillText(s,x,y);}
function draw(){buttons=[];showRects=[];ctx.clearRect(0,-TOP/U,W,RH/U+1);
 if(scene_==='title')drawTitle();else if(scene_==='create')drawCreate();else if(scene_==='base')drawBase();else if(scene_==='mission')drawHUD();else if(scene_==='loading')drawLoading();
 ctx.fillStyle='rgba(255,255,255,.45)';ctx.font='10px system-ui';ctx.textAlign='right';ctx.textBaseline='bottom';ctx.fillText(VERSION,W-6,H-4);}
function drawTitle(){txt('SQUAD',W/2,H*.16,58,C.teal);txt('2033',W/2,H*.16+54,58,C.dusk);txt('Real-time squad action',W/2,H*.16+98,15,'#ccd');
 const sw=W/4;squad.forEach((m,i)=>showRects.push({i,x:i*sw+4,y:H*.36,w:sw-8,h:H*.27}));
 const bw=Math.min(280,W*.7);btn(W/2-bw/2,H*.68,bw,52,'DEPLOY',()=>{unlockAudio();scene_='loading';preload().then(()=>{if(!loadErr)startMission();});},{bg:C.teal,fg:C.dark,size:20});
 btn(W/2-bw/2,H*.68+62,bw,44,'SQUAD',()=>{scene_='create';});btn(W/2-bw/2,H*.68+114,bw,44,'BASE',()=>scene_='base');
 txt(`Missions won: ${stats.wins}`,W/2,H-24,12,'#aab');}
function drawCreate(){txt('CREATE YOUR SQUAD',W/2,30,20,'#fff');txt('Slot 1 is your hero. Tap to change race / class / name.',W/2,54,12,'#aab');
 const top=74,rowH=Math.min(140,(H-top-80)/4);
 squad.forEach((m,i)=>{const y=top+i*rowH;const c=CLS[m.cls];ctx.fillStyle=i===0?'rgba(34,50,58,.55)':'rgba(35,42,51,.55)';rr(8,y+4,W-16,rowH-8,12);ctx.fill();ctx.strokeStyle=c.col;ctx.lineWidth=2;ctx.stroke();
  showRects.push({i,x:12,y:y+8,w:100,h:rowH-16});
  const bx=118,bw=(W-bx-16)/2-6;icon(c.ring,bx+9,y+22,20);txt((i===0?'★ ':'')+m.name,bx+24,y+22,16,'#fff','left');
  btn(bx,y+38,bw,34,c.name,()=>{m.cls=CLASSES[(CLASSES.indexOf(m.cls)+1)%4];loadGLB(heroPath(m)).catch(()=>{});save();},{stroke:c.col});
  btn(bx+bw+8,y+38,bw,34,RACE_NAME[m.race],()=>{m.race=RACES[(RACES.indexOf(m.race)+1)%3];loadGLB(heroPath(m)).catch(()=>{});save();});
  if(rowH>100){icon(c.icon,bx+9,y+90,20);txt(`HP ${Math.round(c.hp*RACE_MOD[m.race].hp)} · ${c.ab}`,bx+24,y+90,11,'#bbc','left',600);}
  buttons.push({x:bx,y:y+8,w:bw*2,h:28,fn:()=>{m.name=NAMES[(NAMES.indexOf(m.name)+1)%NAMES.length];save();}});});
 btn(W/2-110,H-62,220,48,'DONE',()=>scene_='title',{bg:C.teal,fg:C.dark,size:18});}
function drawBase(){txt('BASE',W/2,40,24,'#fff');txt('(stub — base building comes later)',W/2,66,12,'#aab');
 squad.forEach((m,i)=>{const y=100+i*64;icon(CLS[m.cls].ring,34,y,26);txt(`${m.name} — ${RACE_NAME[m.race]} ${CLS[m.cls].name}`,54,y,15,CLS[m.cls].col,'left');});
 txt(`Missions: ${stats.runs} · Won: ${stats.wins}`,W/2,100+4*64+10,14,'#ccd');btn(W/2-110,H-62,220,48,'BACK',()=>scene_='title');}
function drawLoading(){ctx.fillStyle=C.dark;ctx.fillRect(0,-TOP/U,W,RH/U+1);txt(loadErr||`LOADING 3D MODELS ${loadN}/${loadT}`,W/2,H/2,18,loadErr?'#f66':'#fff');
 if(loadErr)btn(W/2-90,H/2+30,180,44,'RETRY',()=>preload().then(()=>{if(!loadErr)startMission();}));}
function abilityBtn(){return{x:W-96,y:H-210,w:80,h:80};}
function pauseBtn(){return{x:W-52,y:10,w:42,h:42};}
let mini=null;function buildMini(){mini=document.createElement('canvas');mini.width=mini.height=160;const m=mini.getContext('2d');m.fillStyle='#5E9A3A';m.fillRect(0,0,160,160);
 m.fillStyle='#2f4f22';for(let i=0;i<N;i++)for(let j=0;j<N;j++)if(Math.min(i,j,N-1-i,N-1-j)<2)m.fillRect(i*4,j*4,4,4);
 m.fillStyle='#C9C2B4';m.beginPath();m.arc(ARENA.x/TILE*4,ARENA.y/TILE*4,11*4/2,0,7);m.fill();
 m.fillStyle='#9fb07a';for(const h of HIGH)m.fillRect(h.x/TILE*4,h.y/TILE*4,h.w/TILE*4,h.h/TILE*4);
 m.fillStyle='#4a4f57';for(const w of WALLS)m.fillRect(w.x/TILE*4,w.y/TILE*4,w.w/TILE*4,w.h/TILE*4);}
function drawMini(){if(!mini)buildMini();const s=104,x=W-s-10,y=60,k=s/MAP.w;ctx.save();ctx.globalAlpha=.9;ctx.drawImage(mini,x,y,s,s);ctx.globalAlpha=1;ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=2;ctx.strokeRect(x,y,s,s);
 const dot=(u,c,r)=>{ctx.fillStyle=c;ctx.beginPath();ctx.arc(x+u.x*k,y+u.y*k,r,0,7);ctx.fill();};
 for(const e of G.enemies)if(!e.down&&(e.aware||G.phase==='setup'&&e.wave===1))dot(e,e.boss?C.gold:'#ff4b4b',e.boss?4:2);
 for(const a of G.allies)if(!a.down)dot(a,a.col,a.hero?3.5:2.5);
 // camera view box
 const tl=s2w(0,0),br=s2w(W,H);ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=1;ctx.strokeRect(x+Math.max(0,tl.x*k),y+Math.max(0,tl.y*k),Math.min(s,(br.x-tl.x)*k),Math.min(s,(br.y-tl.y)*k));
 icon('minimap',x+8,y+s+10,20);ctx.restore();}
function drawHUD(){const h=G.hero;
 // world-anchored labels
 for(const u of[...G.allies,...G.enemies]){if(!u.md.obj.visible)continue;const top=u.boss?4.6:2.35;
  if(!u.down&&(u.hp<u.maxHp||u.team==='ally')&&!u.boss){const s=w2s(u.x,u.y,u.h+top);const bw=34;ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(s.x-bw/2,s.y,bw,5);ctx.fillStyle=u.team==='ally'?u.col:'#e0303e';ctx.fillRect(s.x-bw/2,s.y,bw*u.hp/u.maxHp,5);
   if(u.mark>0)txtO('◎',s.x+bw/2+7,s.y+2,12,C.lime);if(u.shield>0)icon('shield',s.x-bw/2-9,s.y+2,14);}
  if(u.stun>0&&!u.down){const s=w2s(u.x,u.y,u.h+top+.6);txtO('!?',s.x,s.y,16,C.loot);}
  if(u.down&&u.team==='ally'&&!u.hero){const s=w2s(u.x,u.y,u.h+1.2);txtO(u.revive>0?'REVIVING':'DOWN — stand close',s.x,s.y,11,'#fff');if(u.revive>0){ctx.fillStyle=C.lime;ctx.fillRect(s.x-20,s.y+8,40*u.revive/2,4);}}
  if(G.phase==='setup'&&u.team==='ally'){const s=w2s(u.x,u.y,u.h);const tags=[];if(onHigh(u.tx,u.ty))tags.push('▲');if(nearWall(u.tx,u.ty)&&!onHigh(u.tx,u.ty))tags.push('🛡');if(G.enemies.some(e=>e.wave===1&&Math.hypot(u.tx-e.x,u.ty-e.y)<SIGHT))tags.push('⚠');
   txtO((u.hero?'★':'')+u.name+' '+tags.join(''),s.x,s.y+14,12,u.col);}}
 for(const t of G.texts){const s=w2s(t.x,t.y,t.h);ctx.globalAlpha=Math.min(1,t.t*2);txtO(t.s,s.x,s.y,15,t.c);ctx.globalAlpha=1;}
 // squad panel
 G.allies.forEach((a,i)=>{const x=8,y=10+i*28;ctx.fillStyle='rgba(18,22,30,.7)';rr(x,y,160,24,6);ctx.fill();icon(CLS[a.cls].ring,x+12,y+12,20);
  txt((a.hero?'★':'')+a.name,x+25,y+12,11,a.down?'#777':'#fff','left');ctx.fillStyle='#333';ctx.fillRect(x+88,y+9,64,6);ctx.fillStyle=a.down?'#555':a.col;ctx.fillRect(x+88,y+9,64*a.hp/a.maxHp,6);});
 {const y=10+4*28;ctx.fillStyle='rgba(18,22,30,.7)';rr(8,y,160,24,6);ctx.fill();icon('health',20,y+12,20);txt(`${Math.ceil(h.hp)} / ${h.maxHp}`,33,y+12,11,'#fff','left');if(!h.down&&nearWall(h.x,h.y,30)){icon('shield',150,y+12,20);}}
 if(G.phase!=='setup'||true)drawMini();
 if(G.phase==='setup'){const ev=evalSetup();ctx.fillStyle='rgba(22,26,32,.85)';ctx.fillRect(0,H-150,W,150);
  const l=[];if(ev.spotted)l.push(['⚠ Someone is inside a sight ring — you will be SPOTTED','#ff6b6b']);else{l.push([`▲ High ground: ${ev.high.length}   🛡 Cover: ${ev.cover.length}   ${ev.flank?'✔':'✖'} Flank`,'#fff']);l.push([ev.first?'✔ FIRST STRIKE ready (opening volley)':'First strike needs a stronger setup (score 4+)',ev.first?C.loot:'#99a']);}
  l.forEach((s,i)=>txt(s[0],W/2,H-132+i*20,13,s[1]));
  txt('Tap soldier → tap map. Drag to pan.',W/2,H-90,12,'#99a',undefined,600);
  btn(W/2-100,H-68,200,52,'ENGAGE',engage,{bg:C.dusk,fg:C.dark,size:20});
  btn(W-100,H-200,90,36,'AUTO',autoSetup,{size:13});}
 else if(G.phase==='win'||G.phase==='lose'){ctx.fillStyle='rgba(0,0,0,.7)';ctx.fillRect(0,-TOP/U,W,RH/U+1);txt(G.phase==='win'?'MISSION COMPLETE':'HERO DOWN',W/2,H*.38,28,G.phase==='win'?C.loot:'#ff6b6b');
  if(G.phase==='win')icon('loot',W/2,H*.38-50,56);
  txt(`Kills: ${G.kills}`,W/2,H*.38+40,16,'#ddd');const wd=G.allies.filter(a=>!a.hero&&(a.wounded||a.down)).map(a=>a.name);if(wd.length)txt('Wounded: '+wd.join(', '),W/2,H*.38+64,13,'#f99');
  btn(W/2-110,H*.55,220,50,'RETRY',startMission,{bg:C.teal,fg:C.dark});btn(W/2-110,H*.55+60,220,44,'MENU',()=>{clearMission();G=null;scene_='title';});}
 else{for(const[s,side]of[[sticks.L,0],[sticks.R,1]]){if(s){ctx.strokeStyle='rgba(255,255,255,.4)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(s.ox,s.oy,50,0,7);ctx.stroke();ctx.fillStyle='rgba(255,255,255,.45)';const dx=s.x-s.ox,dy=s.y-s.oy,d=Math.hypot(dx,dy),k=Math.min(1,50/(d||1));ctx.beginPath();ctx.arc(s.ox+dx*k,s.oy+dy*k,22,0,7);ctx.fill();}
   else{ctx.fillStyle='rgba(18,22,30,.35)';ctx.beginPath();ctx.arc(side?W-90:90,H-90,50,0,7);ctx.fill();txtO(side?'AIM/FIRE':'MOVE',side?W-90:90,H-90,11,'rgba(255,255,255,.75)');}}
  const b=abilityBtn();const r=h.cd/h.cdMax;icon(CLS[h.cls].icon,b.x+40,b.y+40,80);if(r>0){ctx.fillStyle='rgba(0,0,0,.55)';ctx.beginPath();ctx.moveTo(b.x+40,b.y+40);ctx.arc(b.x+40,b.y+40,38,-Math.PI/2+Math.PI*2*(1-r),-Math.PI/2+Math.PI*2);ctx.fill();txtO(Math.ceil(h.cd)+'s',b.x+40,b.y+40,16,'#fff');}
  txtO(CLS[h.cls].ab.split(' ').pop(),b.x+40,b.y+88,10,'#fff');
  const p=pauseBtn();icon('pause',p.x+21,p.y+21,42);
  if(G.boss&&!G.boss.down){const bw=W-200;ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(176,14,bw-60,14);ctx.fillStyle=C.red;ctx.fillRect(176,14,(bw-60)*G.boss.hp/G.boss.maxHp,14);txt('NORDIC SOVEREIGN',176+(bw-60)/2,38,11,C.gold);}
  else txtO(G.phase==='travel'?(G.battle===1?'▲ Head north-east to the gap':'▲ Head north-west to the gate'):`BATTLE ${G.battle} · enemies ${G.enemies.filter(e=>e.wave===G.battle&&!e.down).length}`,W/2,H-180,13,'#fff');
  if(G.paused){ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(0,-TOP/U,W,RH/U+1);txt('PAUSED',W/2,H/2-40,28,'#fff');btn(W/2-100,H/2,200,46,'RESUME',()=>G.paused=false);btn(W/2-100,H/2+56,200,44,'QUIT',()=>{G.paused=false;clearMission();G=null;scene_='title';});}}
 if(G&&G.banner){const a=Math.min(1,G.banner.t);ctx.globalAlpha=a;ctx.fillStyle='rgba(0,0,0,.65)';ctx.fillRect(0,H*.22,W,90);txt(G.banner.big,W/2,H*.22+28,24,C.loot);wrap(G.banner.small,W/2,H*.22+60,W-30,12);ctx.globalAlpha=1;}}
function wrap(s,x,y,maxW,size){ctx.font=`600 ${size}px system-ui`;const words=s.split(' ');let line='',lines=[];for(const w of words){const t=line?line+' '+w:w;if(ctx.measureText(t).width>maxW&&line){lines.push(line);line=w;}else line=t;}lines.push(line);lines.forEach((l,i)=>txt(l,x,y+i*(size+3)-(lines.length-1)*(size+3)/2,size,'#fff',undefined,600));}
// ---------- loop ----------
const perf={frames:0,t0:performance.now(),fps:0,calls:0};
let last=performance.now();
function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;
 try{update(dt);if(scene_==='mission'&&G){sync3D(dt);ren.render(scene,cam);perf.calls=ren.info.render.calls;}else if(scene_==='loading'){ren.clear();}else renderShow(dt);draw();}catch(e){console.error(e);window.__err=String(e&&e.stack||e);}
 perf.frames++;if(now-perf.t0>1000){perf.fps=perf.frames*1000/(now-perf.t0);perf.frames=0;perf.t0=now;}
 requestAnimationFrame(frame);}
resize();fitCam();requestAnimationFrame(frame);
squad.forEach(m=>loadGLB(heroPath(m)).catch(()=>{}));
window.__squad={sticks,perf,w2s,TILE,get dims(){return{W,H,U,TOP}},get G(){return G},get scene(){return scene_},setScene:s=>{scene_=s;},startMission,engage,autoSetup,preload,ren};
