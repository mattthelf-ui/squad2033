// ---------- update ----------
function update(dt){if(scene_!=='mission'||G.paused)return;G.t+=dt;if(G.banner){G.banner.t-=dt;if(G.banner.t<=0)G.banner=null;}
 for(const u of[...G.allies,...G.enemies]){if(u.lock>0)u.lock-=dt;if(u.down)u.downT+=dt;}
 if(G.phase==='setup'){for(const a of G.allies){const dx=a.tx-a.x,dy=a.ty-a.y,d=Math.hypot(dx,dy);if(d>3){const s=Math.min(d,300*dt);a.x+=dx/d*s;a.y+=dy/d*s;a.face=Math.atan2(dy,dx);setAnim(a,'run');}else{a.x=a.tx;a.y=a.ty;a.face=-Math.PI/2;setAnim(a,'idle');}}
  G.cam.x=Math.max(BOUND,Math.min(MAP.w-BOUND,G.cam.x));G.cam.y=Math.max(27*TILE,Math.min(MAP.h-BOUND,G.cam.y));return;}
 if(G.phase==='win'||G.phase==='lose')return;
 const h=G.hero;let mx=0,my=0,ax=0,ay=0,aiming=false;
 if(keys.a||keys.arrowleft)mx--;if(keys.d||keys.arrowright)mx++;if(keys.w||keys.arrowup)my--;if(keys.s||keys.arrowdown)my++;
 // camera looks north with no yaw, so screen directions map straight onto the ground plane (screen y is foreshortened by the pitch)
 if(sticks.L){const dx=sticks.L.x-sticks.L.ox,dy=sticks.L.y-sticks.L.oy,d=Math.hypot(dx,dy);if(d>8){mx=dx/Math.max(d,50);my=dy/Math.max(d,50);}}
 if(sticks.R){const dx=sticks.R.x-sticks.R.ox,dy=sticks.R.y-sticks.R.oy;if(Math.hypot(dx,dy)>12){ax=dx;ay=dy/Math.sin(PITCH);aiming=true;}else{const t=nearest(h,liveEnemies(),h.range+60);if(t){ax=t.x-h.x;ay=t.y-h.y;aiming=true;}}}
 const ml=Math.hypot(mx,my);if(ml>1){mx/=ml;my/=ml;}
 for(const a of G.allies){a.cd=Math.max(0,a.cd-dt);a.buff=Math.max(0,a.buff-dt);a.fireT-=dt;}
 if(!h.down){if(h.dash>0){h.dash-=dt;tryMove(h,h.vx*dt,h.vy*dt);}
  else if(ml>.05){tryMove(h,mx*h.spd*dt,my*h.spd*dt);if(!aiming)h.face=Math.atan2(my,mx);if(h.lock<=0)setAnim(h,'run');}else if(h.lock<=0)setAnim(h,'idle');
  if(aiming){h.face=Math.atan2(ay,ax);if(h.fireT<=0){h.fireT=h.rate*(h.buff>0?.6:1);fire(h,h.x+ax*100,h.y+ay*100);}}
  for(const a of G.allies)if(a.down&&!a.hero){if(Math.hypot(a.x-h.x,a.y-h.y)<56){a.revive+=dt;if(a.revive>2){a.down=false;a.hp=Math.round(a.maxHp*.4);a.revive=0;a.wounded=true;a.anim='idle';a.md.cur=null;G.texts.push({x:a.x,y:a.y,h:2.6,s:'REVIVED',t:1,c:C.lime});}}else a.revive=Math.max(0,a.revive-dt);}}
 const live=liveEnemies();
 G.allies.forEach((a,i)=>{if(a.hero||a.down)return;let t=nearest(a,live,a.range+40);if(t&&bandOf(t.y)!==bandOf(a.y))t=null;
  if(live.length&&a.cd<=0&&nearest(a,live,a.cls==='recon'?300:a.cls==='tech'?400:110)&&(a.cls!=='tech'||G.allies.some(o=>!o.down&&o.hp<o.maxHp*.7)))useAbility(a);
  let gx,gy;if(G.phase==='battle'&&a.post&&live.length&&G.battle===1){gx=a.post.x;gy=a.post.y;if(!t){const n=nearest(a,live);if(n){gx=a.x+(n.x-a.x)*.5;gy=a.y+(n.y-a.y)*.5;}}}
  else{const off=[[-50,50],[50,50],[0,85]][i-1];gx=h.x+off[0];gy=h.y+off[1];if(t&&Math.hypot(gx-a.x,gy-a.y)<160){gx=a.x;gy=a.y;}}
  if(a.dash>0){a.dash-=dt;tryMove(a,a.vx*dt,a.vy*dt);}else if(Math.hypot(gx-a.x,gy-a.y)>14&&steer(a,gx,gy,a.spd*(Math.hypot(gx-a.x,gy-a.y)>300?1.3:1),dt)){if(a.lock<=0)setAnim(a,'run');}else if(a.lock<=0)setAnim(a,'idle');
  if(t){if(a.lock<=0||a.anim==='attack')a.face=Math.atan2(t.y-a.y,t.x-a.x);if(a.fireT<=0&&!lineBlocked(a.x,a.y,t.x,t.y,a)){a.fireT=a.rate*(a.buff>0?.6:1)*(1+Math.random()*.3);fire(a,t.x,t.y);}}});
 for(const d of G.drones){d.t-=dt;d.fireT-=dt;const o=d.owner;d.x+=((o.x+30)-d.x)*dt*3;d.y+=((o.y-20)-d.y)*dt*3;const t=nearest(d,live,260);if(t&&d.fireT<=0){d.fireT=.35;const a=Math.atan2(t.y-d.y,t.x-d.x);G.shots.push({x:d.x,y:d.y,h:2,vx:Math.cos(a)*600,vy:Math.sin(a)*600,team:'ally',dmg:6,life:.6,col:C.violet,src:null});}}
 G.drones=G.drones.filter(d=>d.t>0);
 const alive=G.allies.filter(a=>!a.down);
 for(const e of G.enemies){if(e.down)continue;e.mark=Math.max(0,e.mark-dt);e.shield=Math.max(0,e.shield-dt);
  if(!e.aware){if(alive.some(a=>Math.hypot(a.x-e.x,a.y-e.y)<SIGHT+40))wake(e.wave);if(e.lock<=0)setAnim(e,'idle');continue;}
  if(e.boss){bossAI(e,dt,alive);continue;}
  if(e.stun>0){e.stun-=dt;if(e.lock<=0)setAnim(e,'idle');continue;}
  e.fireT-=dt;e.abT-=dt;if(!e.tgt||e.tgt.down||Math.random()<dt*.3){const n=nearest(e,alive);const c=n&&alive.filter(a=>Math.hypot(a.x-e.x,a.y-e.y)<Math.hypot(n.x-e.x,n.y-e.y)+120);e.tgt=c&&c[(Math.random()*c.length)|0];}const t=e.tgt;if(!t)continue;
  const d=Math.hypot(t.x-e.x,t.y-e.y);const ET=EN[e.type];
  if(e.abT<=0){e.abT=6+Math.random()*4;
   if(ET.heal){const hurtE=G.enemies.filter(o=>!o.down&&o.aware&&o.hp<o.maxHp&&Math.hypot(o.x-e.x,o.y-e.y)<200);if(hurtE.length){setAnim(e,'ability',.35);fxRing(e.x,e.y,200,C.gold);hurtE.forEach(o=>{o.hp=Math.min(o.maxHp,o.hp+25);});}}
   else if(e.type==='collab-trooper'){setAnim(e,'ability',.35);e.shield=3;}
   else if(ET.pulse&&d<180){setAnim(e,'ability',.35);fxRing(e.x,e.y,180,C.gold);for(const a of alive)if(Math.hypot(a.x-e.x,a.y-e.y)<180)hurt(a,14,e);}
   else if(e.type.startsWith('reptile')&&d<260){setAnim(e,'ability',.35);e.surge=2.5;}}
  if(e.surge>0)e.surge-=dt;
  const want=e.melee?e.range*.8:e.range*.75;const sp=e.spd*(e.surge>0?1.6:1);
  if(e.lock>0&&e.anim==='attack'){}
  else if(d>want||(!e.melee&&lineBlocked(e.x,e.y,t.x,t.y,e))){steer(e,t.x,t.y,sp,dt);if(e.lock<=0)setAnim(e,'run');}
  else if(e.lock<=0)setAnim(e,'idle');
  if(d<=e.range&&e.fireT<=0){e.fireT=e.rate*(1+Math.random()*.4);if(e.melee){e.face=Math.atan2(t.y-e.y,t.x-e.x);setAnim(e,'attack',.3);hurt(t,e.dmg*(e.surge>0?1.3:1),e);}else if(!lineBlocked(e.x,e.y,t.x,t.y,e))fire(e,t.x,t.y);}}
 const bodies=[...G.allies,...G.enemies].filter(u=>!u.down&&(u.team==='ally'||u.aware));for(let i=0;i<bodies.length;i++)for(let j=i+1;j<bodies.length;j++){const a=bodies[i],b=bodies[j];const r=(a.boss||b.boss)?60:24;const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||.01;if(d<r){const p=(r-d)/2;if(!a.boss)tryMove(a,-dx/d*p,-dy/d*p);if(!b.boss)tryMove(b,dx/d*p,dy/d*p);}}
 for(const s of G.shots){s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;const w=WALLS.find(r=>inRect(s.x,s.y,r));if(w&&!(s.src&&inRect(s.src.x,s.src.y,w,40))){s.life=0;continue;}
  const targets=s.team==='ally'?G.enemies:G.allies;for(const t of targets){if(t.down||(t.team==='enemy'&&!t.aware))continue;const rad=t.boss?50:20;if(Math.hypot(t.x-s.x,t.y-s.y)<rad){hurt(t,s.dmg,s.src);s.life=0;break;}}}
 G.shots=G.shots.filter(s=>s.life>0);
 for(const f of G.fx)f.t-=dt;G.fx=G.fx.filter(f=>f.t>0);for(const t of G.texts){t.t-=dt;t.h+=1.2*dt;}G.texts=G.texts.filter(t=>t.t>0);
 if(h.down){G.phase='lose';G.banner=null;sfx(70,1,'sawtooth',.08);return;}
 if(G.phase==='battle'&&!G.enemies.some(e=>e.wave===G.battle&&!e.down)){
  if(G.battle===1){G.phase='travel';G.banner={t:4,big:'AREA CLEAR',small:'Head north-east through the gap. Battle 2 ahead — enemies are alert.'};G.allies.forEach(a=>a.post=null);}
  else if(G.battle===2){G.phase='travel';G.banner={t:4,big:'AREA CLEAR',small:'The Sovereign waits beyond the north-west gate.'};}
  else{G.phase='win';stats.wins++;save();}}
 if(G.phase==='travel'){if(G.battle===1&&h.y<26*TILE){G.battle=2;G.phase='battle';wake(2);G.banner={t:3,big:'BATTLE 2',small:'Contact! Use cover (-40% damage taken) and ridges (+15% damage).'};}
  else if(G.battle===2&&h.y<13*TILE){G.battle=3;G.phase='battle';spawnBoss();}}
 // camera follows the hero, hero sits a little below centre so you see ahead (north)
 G.cam.x+=(h.x-G.cam.x)*Math.min(1,dt*6);G.cam.y+=(h.y-TILE*2.2-G.cam.y)*Math.min(1,dt*6);}
function wake(w){for(const e of G.enemies)if(e.wave===w)e.aware=true;}
function spawnBoss(){const b=mkBoss(ARENA.x,ARENA.y);b.wave=3;b.aware=true;G.enemies.push(b,Object.assign(mkEnemy('reptile-guard',ARENA.x-140,ARENA.y+60,true),{wave:3}),Object.assign(mkEnemy('reptile-guard',ARENA.x+140,ARENA.y+60,true),{wave:3}));G.boss=b;
 G.banner={t:4,big:'NORDIC SOVEREIGN',small:'Kill the Sovereign. Phase 2 at 60% adds the slam; phase 3 at 25%.'};sfx(110,.8,'sawtooth',.08);}
function bossAI(b,dt,alive){b.abT-=dt;const t=nearest(b,alive);if(!t)return;const d=Math.hypot(t.x-b.x,t.y-b.y);const hpP=b.hp/b.maxHp;
 if(b.act){b.act.t-=dt;const A=b.act;
  if(A.k==='sweep'&&!A.done&&A.t<A.T-.25){A.done=1;fxRing(b.x,b.y,150,C.red);for(const a of alive){const dd=Math.hypot(a.x-b.x,a.y-b.y);const ang=Math.abs(((Math.atan2(a.y-b.y,a.x-b.x)-A.ang+Math.PI*3)%(Math.PI*2))-Math.PI);if(dd<150&&ang<1.4)hurt(a,28,b);}}
  if(A.k==='barrage'){A.ft=(A.ft||0)-dt;if(A.ft<=0){A.ft=.14;const a=Math.atan2(t.y-b.y,t.x-b.x)+(Math.random()-.5)*.6;G.shots.push({x:b.x,y:b.y,h:2.4,vx:Math.cos(a)*300,vy:Math.sin(a)*300,team:'enemy',dmg:7,life:1.6,col:'#F6D766',src:b});}}
  if(A.k==='slam'&&!A.done&&A.t<A.T*.5){A.done=1;fxRing(b.x,b.y,220,C.gold);sfx(60,.5,'sawtooth',.1);for(const a of alive)if(Math.hypot(a.x-b.x,a.y-b.y)<220)hurt(a,30,b);}
  if(A.t<=0){b.act=null;if(A.k==='windup'){b.act={k:'slam',t:.9,T:.9};b.anim='ability';b.md.cur=null;}}
  return;}
 b.face=Math.atan2(t.y-b.y,t.x-b.x);
 if(b.abT<=0){const ph=hpP<.25?3:hpP<.6?2:1;b.abT=ph===3?1.2:ph===2?1.8:2.4;
  let k=d<150?'sweep':'barrage';if(ph>=2&&Math.random()<.4)k='windup';
  const T=k==='barrage'?(ph===3?2.4:1.6):.9;b.act={k,t:T,T,ang:b.face};b.anim=(k==='windup'||k==='slam')?'ability':'attack';b.md.cur=null;return;}
 if(d>200){tryMove(b,(t.x-b.x)/d*b.spd*dt,(t.y-b.y)/d*b.spd*dt);setAnim(b,'run');}else setAnim(b,'idle');}
// ---------- 3D sync ----------
const _col=new THREE.Color(),_m4=new THREE.Matrix4();
function sync3D(dt){const show=scene_==='mission'&&G;
 if(!show)return;
 const vis=u=>!(u.wave===3&&G.battle!==3)&&!(u.wave===2&&G.battle<2&&G.phase!=='travel')&&!(u.down&&u.team==='enemy'&&u.downT>4);
 for(const u of[...G.allies,...G.enemies]){const md=u.md;const v=vis(u);md.obj.visible=v;if(u.ring)u.ring.visible=v&&!u.down;if(!v)continue;
  const th=(onHigh(u.x,u.y)?RIDGE_H:0);u.h+=(th-u.h)*Math.min(1,dt*10);
  md.obj.position.set(u2X(u.x),u.h+(u.lift||0)+(u.boss?.2:0),u2Z(u.y));
  // models face +Z; game angle a is atan2(dy,dx) with +y = south = +Z
  const ry=Math.atan2(Math.cos(u.face),Math.sin(u.face));let cur=md.obj.rotation.y;let dr=((ry-cur+Math.PI*3)%(Math.PI*2))-Math.PI;md.obj.rotation.y=cur+dr*Math.min(1,dt*14);
  let an=u.anim;if(u.down)an='down';else if(an==='attack'||an==='ability'||an==='hit'){if(u.lock<=0&&!u.boss)an=u.anim='idle';}
  if(u.boss&&!u.act&&(an==='attack'||an==='ability'))an=u.anim='idle';
  playAnim(md,an);md.mixer.update(dt*(G.paused?0:1));
  if(u.ring){u.ring.position.set(u2X(u.x),u.h+.03,u2Z(u.y));}}
 // blob shadows
 let nb=0;for(const u of[...G.allies,...G.enemies]){if(!u.md.obj.visible||nb>=BLOB_MAX)continue;const s=u.boss?2.6:1.1;_m4.makeScale(s,1,s).setPosition(u2X(u.x),u.h+.02,u2Z(u.y));blobMesh.setMatrixAt(nb++,_m4);}blobMesh.count=nb;blobMesh.instanceMatrix.needsUpdate=true;
 // shots
 let n=0;for(const s of G.shots){if(n>=SHOTS_MAX)break;_m4.makeTranslation(u2X(s.x),s.h,u2Z(s.y));shotMesh.setMatrixAt(n,_m4);_col.set(s.col);shotMesh.setColorAt(n,_col);n++;}
 shotMesh.count=n;shotMesh.instanceMatrix.needsUpdate=true;if(shotMesh.instanceColor)shotMesh.instanceColor.needsUpdate=true;
 fxPool.forEach((m,i)=>{const f=G.fx[i];if(!f){m.visible=false;return;}m.visible=true;const k=f.r/M2U*(1-f.t/f.T*.5);m.scale.set(k,1,k);m.position.set(u2X(f.x),.08,u2Z(f.y));m.material.color.set(f.c);m.material.opacity=f.t/f.T;});
 droneMeshes.forEach((m,i)=>{const d=G.drones[i];m.visible=!!d;if(d)m.position.set(u2X(d.x),2.2+Math.sin(G.t*5+i)*.15,u2Z(d.y));});
 // setup visuals
 const setup=G.phase==='setup';let k=0;if(setup){for(const e of G.enemies)if(e.wave===1&&k<16){const s=SIGHT/M2U;_m4.makeScale(s,1,s).setPosition(u2X(e.x),.06,u2Z(e.y));sightMesh.setMatrixAt(k++,_m4);}}
 sightMesh.count=k;sightMesh.instanceMatrix.needsUpdate=true;
 selRing.visible=setup;if(setup){const a=G.allies[G.sel];selRing.position.set(u2X(a.x),a.h+.04,u2Z(a.y));}
 zoneMesh.visible=setup;if(setup){zoneMesh.scale.set(72,1,22);zoneMesh.position.set(0,.05,u2Z(32.5*TILE));}
 placeCam(u2X(G.cam.x),u2Z(G.cam.y));}
