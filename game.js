// SQUAD 2033 v4 — real 3D (three.js) squad action RPG
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
const VERSION='squad2033 v4';
const cv=document.getElementById('c'),ctx=cv.getContext('2d'),glc=document.getElementById('gl');
var W=0,H=0,DPR=1;let RW=0,RH=0,U=1,TOP=0,BOT=60;
const probe=document.createElement('div');probe.style.cssText='position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)';document.body.appendChild(probe);
const ren=new THREE.WebGLRenderer({canvas:glc,antialias:true,powerPreference:'high-performance'});
ren.outputColorSpace=THREE.SRGBColorSpace;ren.shadowMap.enabled=true;ren.shadowMap.type=THREE.PCFShadowMap;ren.setClearColor('#1d2430');
function resize(){DPR=Math.min(window.devicePixelRatio||1,2);const vv=window.visualViewport;RW=Math.round(vv?vv.width:innerWidth);RH=Math.round(vv?vv.height:innerHeight);
 cv.style.width=RW+'px';cv.style.height=RH+'px';cv.width=RW*DPR;cv.height=RH*DPR;ren.setPixelRatio(DPR);ren.setSize(RW,RH,true);
 const cs=getComputedStyle(probe);TOP=parseFloat(cs.paddingTop)||0;BOT=60+(parseFloat(cs.paddingBottom)||0);
 U=Math.max(.6,Math.min(1,RW/420,(RH-TOP-BOT)/800));W=RW/U;H=(RH-TOP-BOT)/U;ctx.setTransform(DPR*U,0,0,DPR*U,0,TOP*DPR);if(typeof fitCam==='function')fitCam();}
addEventListener('resize',resize);if(window.visualViewport)visualViewport.addEventListener('resize',resize);addEventListener('orientationchange',()=>setTimeout(resize,200));
const C={slate:'#2A313B',dark:'#161A20',concrete:'#6E7480',teal:'#2FE0D6',amber:'#FF9A2E',lime:'#9BD43A',violet:'#8A5CFF',red:'#B3202E',gold:'#D9A93A',pearl:'#EFE8DA',loot:'#F5C542',dusk:'#FF6A4A'};
const RACES=['human','robot','grey'],RACE_NAME={human:'Human',robot:'Robot',grey:'Grey'};
const CLASSES=['assault','heavy','recon','tech'];
const CLS={
 assault:{name:'Assault',col:C.teal,hp:100,dmg:9,rate:.16,range:250,spd:150,ab:'Adrenaline Dash',icon:'dash',ring:'squad-teal'},
 heavy:{name:'Heavy',col:C.amber,hp:165,dmg:15,rate:.42,range:220,spd:120,ab:'Ground Slam',icon:'grenade',ring:'squad-amber'},
 recon:{name:'Recon',col:C.lime,hp:85,dmg:30,rate:.8,range:380,spd:145,ab:'Scan & Mark',icon:'ultimate',ring:'squad-lime'},
 tech:{name:'Tech',col:C.violet,hp:95,dmg:10,rate:.28,range:280,spd:135,ab:'Support Drone',icon:'drone',ring:'squad-violet'}};
const RACE_MOD={human:{hp:1,spd:1,cd:1},robot:{hp:1.2,spd:.92,cd:1},grey:{hp:.95,spd:1,cd:.8}};
const EN={
 'nordic-sentinel':{name:'Nordic Sentinel',model:'enemies/enemy_nordic_guard',hp:70,dmg:10,rate:.9,range:300,spd:90,melee:false},
 'nordic-commander':{name:'Nordic Commander',model:'enemies/enemy_nordic_mage',hp:130,dmg:12,rate:1,range:300,spd:85,melee:false,pulse:true},
 'reptile-brute':{name:'Reptile Brute',model:'enemies/enemy_reptile_brute',hp:170,dmg:18,rate:1.1,range:42,spd:95,melee:true},
 'reptile-skirmisher':{name:'Reptile Trooper',model:'enemies/enemy_reptile_trooper',hp:55,dmg:8,rate:.55,range:36,spd:165,melee:true},
 'collab-trooper':{name:'Collaborator',model:'enemies/enemy_collab_officer',hp:75,dmg:8,rate:.7,range:270,spd:100,melee:false},
 'collab-medic':{name:'Collab Tech',model:'enemies/enemy_collab_tech',hp:60,dmg:5,rate:1,range:240,spd:100,melee:false,heal:true},
 'reptile-guard':{name:'Throne Guard',model:'boss/boss_guard',hp:220,dmg:20,rate:1,range:44,spd:100,melee:true,lift:.4}};
// ---------- icons (Inky's HUD v2 icons) ----------
const ICON_NAMES=['health','shield','squad-teal','squad-amber','squad-lime','squad-violet','dash','grenade','drone','ultimate','loot','minimap','pause'];
const iconImg=new Image();iconImg.src='icons/hud-icons.png';
function icon(n,x,y,s){if(!iconImg.complete||!iconImg.naturalWidth)return;const i=ICON_NAMES.indexOf(n);if(i<0)return;ctx.drawImage(iconImg,i*128,0,128,128,x-s/2,y-s/2,s,s);}
// ---------- save ----------
const NAMES=['Vega','Okafor','Brick','Nyx','Mbeki','Hale','Rook','Sato','Kestrel','Diaz','Unit-7','Zeta'];
function defaultSquad(){return[{race:'human',cls:'assault',name:'Vega'},{race:'robot',cls:'heavy',name:'Unit-7'},{race:'grey',cls:'recon',name:'Zeta'},{race:'human',cls:'tech',name:'Okafor'}];}
let squad;try{squad=JSON.parse(localStorage.getItem('squad2033.squad'));if(!Array.isArray(squad)||squad.length!==4||!squad.every(m=>RACES.includes(m.race)&&CLASSES.includes(m.cls)))throw 0;}catch(e){squad=defaultSquad();}
let stats;try{stats=JSON.parse(localStorage.getItem('squad2033.stats'))||{};if(typeof stats!=='object')throw 0;}catch(e){stats={};}
stats.wins=stats.wins|0;stats.runs=stats.runs|0;
function save(){try{localStorage.setItem('squad2033.squad',JSON.stringify(squad));localStorage.setItem('squad2033.stats',JSON.stringify(stats));}catch(e){}}
// ---------- map: 40x40 tiles, 2 m per tile, 64 game units per tile ----------
const TILE=64,N=40,M2U=32;const MAP={w:N*TILE,h:N*TILE};
const TC=(i,j)=>({x:(i+.5)*TILE,y:(j+.5)*TILE});
// tile rects [i,j,w,h]
const COVER_T=[
 // battle 1 (south band, rows 27-37), camp at tile 22.5,30.5
 [18,33,2,1,'cover_wall_half'],[25,33,2,1,'sandbags'],[21,35,2,1,'cover_wall_half'],[17,29,1,2,'barricade'],[28,29,1,2,'barricade'],[21,31,1,1,'crate_brown'],[24,29,1,1,'crate_green'],[20,27,2,1,'sandbags'],[24,27,2,1,'cover_wall_half'],
 // battle 2 (middle band, rows 14-25), camp at 18.5,19
 [14,22,2,1,'sandbags'],[21,22,2,1,'cover_wall_half'],[18,21,1,1,'crate_blue'],[12,18,1,2,'barricade'],[25,18,1,2,'barricade'],[16,16,2,1,'cover_wall_half'],[20,16,2,1,'sandbags'],[9,23,2,1,'crate_brown'],
 // boss band (rows 2-12): a few pillars of cover at the arena edge
 [17,9,1,1,'crate_green'],[31,9,1,1,'crate_blue'],[19,3,1,1,'cover_wall_half'],[29,3,1,1,'cover_wall_half']];
const HIGH_T=[[15,28,3,3],[29,31,3,3],[20,36,4,2],[8,18,3,3],[27,18,3,3]];
const SEP=[{row:26,gap:[29,33]},{row:13,gap:[4,8]}];
const CAMP1=TC(22,30),CAMP2=TC(18,19),ARENA=TC(24,6);
const WALLS=[],HIGH=[];
for(const c of COVER_T)WALLS.push({x:c[0]*TILE,y:c[1]*TILE,w:c[2]*TILE,h:c[3]*TILE,model:c[4]});
for(const s of SEP){for(let i=2;i<38;){if(i>=s.gap[0]&&i<=s.gap[1]){i++;continue;}let j=i;while(j<38&&!(j>=s.gap[0]&&j<=s.gap[1]))j++;WALLS.push({x:i*TILE,y:s.row*TILE,w:(j-i)*TILE,h:TILE,model:'cover_wall_full',sep:true});i=j;}}
for(const h of HIGH_T)HIGH.push({x:h[0]*TILE,y:h[1]*TILE,w:h[2]*TILE,h:h[3]*TILE});
const BOUND=2*TILE;
function inRect(x,y,r,p=0){return x>r.x-p&&x<r.x+r.w+p&&y>r.y-p&&y<r.y+r.h+p;}
function onHigh(x,y){return HIGH.some(r=>inRect(x,y,r));}
function nearWall(x,y,p=34){return WALLS.find(r=>!r.sep&&inRect(x,y,r,p));}
function blocked(x,y,rad=12){if(x<BOUND+rad||y<BOUND+rad||x>MAP.w-BOUND-rad||y>MAP.h-BOUND-rad)return true;return WALLS.some(r=>inRect(x,y,r,rad));}
function bandOf(y){return y<14*TILE?0:y<27*TILE?1:2;}
const GAPS=[null,TC(6,13),TC(31,26)];// gap between band b-1 and b, index b
function waypoint(u,gx,gy){const bu=bandOf(u.y),bg=bandOf(gy);if(bu===bg)return{x:gx,y:gy};const b=bu>bg?bu:bg;const g=GAPS[b];// go to the gap, approach from own side
 const side=bu>bg?1:-1;const ax=g.x,ay=g.y+side*TILE*1.2;if(Math.abs(u.x-g.x)<TILE*1.6&&Math.abs(u.y-g.y)<TILE*1.6)return{x:g.x,y:g.y-side*TILE*2};return{x:ax,y:ay};}
// ---------- 3D scene ----------
const scene=new THREE.Scene();scene.background=new THREE.Color('#9FB4C8');scene.fog=new THREE.Fog('#9FB4C8',70,140);
scene.add(new THREE.HemisphereLight('#8FB0FF','#9A8466',1.9));
const rim=new THREE.DirectionalLight('#9FC4FF',1.6);scene.add(rim,rim.target);
const key=new THREE.DirectionalLight('#FFE2BC',3.2);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.bias=-.0005;key.shadow.normalBias=.03;scene.add(key,key.target);
{const s=key.shadow.camera;s.left=-46;s.right=46;s.top=46;s.bottom=-46;s.near=1;s.far=160;s.updateProjectionMatrix();}
// static env shadows: the shadow map covers the whole 80x80 m map and is rendered once (characters use blob shadows)
ren.shadowMap.autoUpdate=false;key.position.set(-6*1.5,60,45);key.target.position.set(0,0,0);rim.position.set(-30,18,-30);rim.target.position.set(0,0,0);
scene.add(new THREE.AmbientLight('#ffffff',1.1));
const rimDone=new WeakSet();function addRim(m){if(!m||rimDone.has(m))return;rimDone.add(m);m.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <dithering_fragment>','#include <dithering_fragment>\n float fr=pow(1.0-clamp(dot(normalize(vViewPosition),normal),0.0,1.0),3.0); gl_FragColor.rgb+=vec3(0.75,0.85,1.0)*fr*0.3;');};m.customProgramCacheKey=()=>'rim';}
const cam=new THREE.OrthographicCamera(-12,12,12,-12,.1,300);const PITCH=55*Math.PI/180;let VIEW_W=24;// 12 tiles across
const camT=new THREE.Vector3();
function fitCam(){const asp=RW/Math.max(1,RH);VIEW_W=asp<1?24:Math.min(32,24*asp);const hw=VIEW_W/2,hh=hw/asp;cam.left=-hw;cam.right=hw;cam.top=hh;cam.bottom=-hh;cam.updateProjectionMatrix();}
function placeCam(tx,tz){camT.set(tx,0,tz);const D=60;cam.position.set(tx,D*Math.sin(PITCH),tz+D*Math.cos(PITCH));cam.lookAt(camT);}
const u2X=x=>x/M2U-40,u2Z=y=>y/M2U-40;
// ground: 40x40 tiles, vertex coloured, one draw call
function buildGround(){const T=2,S2=2,pos=[],col=[];const c=new THREE.Color(),c2=new THREE.Color();
 const nz=(x,z)=>{let v=0,a=1,f=.06;for(let k=0;k<4;k++){v+=a*(Math.sin(x*f*1.7+z*f*.6+k*3.1)*Math.cos(z*f*1.3-x*f*.4+k*1.7));a*=.5;f*=2.1;}return v;};
 const pathD=(X,Z)=>{const x=(X+40)*M2U,y=(Z+40)*M2U;// distance to the main route (start -> camp1 -> gap -> camp2 -> gap -> arena)
  const P=[TC(6,36),CAMP1,TC(31,26),CAMP2,TC(6,13),ARENA];let d=1e9;for(let i=0;i<P.length-1;i++){const a=P[i],b=P[i+1];const dx=b.x-a.x,dy=b.y-a.y;const t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy)));d=Math.min(d,Math.hypot(a.x+dx*t-x,a.y+dy*t-y));}return d/M2U;};
 const tileCol=(x,z)=>{const n=nz(x,z);const h=Math.sin(Math.floor(x/2)*12.9+Math.floor(z/2)*78.2)*43758.5,r=h-Math.floor(h);const pd=pathD(x,z)+nz(x*.5,z*.5)*1.5;
  const ax=(x+40)*M2U,ay=(z+40)*M2U;const arena=Math.hypot(ax-ARENA.x,ay-ARENA.y)/M2U;
  if(arena<12)c.set('#C9C2B4').lerp(c2.set('#A99F8E'),.5+.4*n);else if(pd<2.6)c.set('#B48E5E').lerp(c2.set('#9C7A4E'),.5+.5*n);else c.set('#8CC84E').lerp(c2.set('#5E9A3A'),Math.min(1,Math.max(0,.45+.5*n)));
  c.offsetHSL(0,0,(r-.5)*.04);return c;};
 const d=T/S2;for(let i=0;i<N*S2;i++)for(let j=0;j<N*S2;j++){const x=-40+i*d,z=-40+j*d;
  for(const[a,b]of[[0,0],[0,d],[d,0],[d,0],[0,d],[d,d]]){const X=x+a,Z=z+b;pos.push(X,0,Z);const k=tileCol(x+d/2,z+d/2);const edge=(Math.abs(X%2)<.02||Math.abs(Z%2)<.02)?.93:1;col.push(k.r*edge,k.g*edge,k.b*edge);}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.computeVertexNormals();
 const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({vertexColors:true}));m.receiveShadow=true;m.matrixAutoUpdate=false;m.updateMatrix();scene.add(m);
 // far skirt so the edges never show the sky
 const sk=new THREE.Mesh(new THREE.PlaneGeometry(400,400),new THREE.MeshLambertMaterial({color:'#5E8A3A'}));sk.rotation.x=-Math.PI/2;sk.position.y=-.02;scene.add(sk);}
// ---------- assets ----------
const loader=new GLTFLoader();const GLB={};
function loadGLB(path){if(GLB[path])return GLB[path].p;const e={};GLB[path]=e;e.p=new Promise((res,rej)=>loader.load('models/'+path+'.glb',g=>{e.g=g;g.scene.traverse(o=>{if(o.isMesh){o.castShadow=path.startsWith('env');addRim(o.material);}});res(g);},undefined,err=>{delete GLB[path];rej(err);}));return e.p;}
const heroPath=m=>'heroes/hero_'+m.race+'_'+m.cls;
const ENV_IDS=['barricade','chest_gold','cover_wall_full','cover_wall_half','crate_blue','crate_brown','crate_green','crystal_cluster','lamp_post','ridge_1x1','ridge_2x1','ridge_ramp','rock_brown_l','rock_brown_s','rock_grey_l','rock_grey_m','sandbags','tree_pine','tree_round','tree_small'];
let RIDGE_H=1.16;
// character instance: clone + own team material + mixer
const mergedCache={};
function makeModel(path,teamCol){const g=GLB[path].g;const root=g.scene.clone(true);const tc=new THREE.Color(teamCol||'#2FE0D6');const ck=path+'|'+(teamCol||'');
 // per bone: merge 'team' + 'body' parts into one mesh (team colour baked into vertex colours) -> fewer draw calls; glow parts stay separate
 const bones=[];root.traverse(o=>{if(!o.isMesh&&o.children.some(c=>c.isMesh))bones.push(o);});
 let bodyMat=null;root.traverse(o=>{if(o.isMesh&&o.material.name==='body')bodyMat=o.material;});
 if(bodyMat){const cache=mergedCache[ck]=mergedCache[ck]||{};for(const bn of bones){const parts=bn.children.filter(c=>c.isMesh&&(c.material.name==='team'||c.material.name==='body'));if(!parts.length)continue;
   let geo=cache[bn.name];if(!geo){const gs=parts.map(p=>{const gg=p.geometry.clone();p.updateMatrix();gg.applyMatrix4(p.matrix);if(p.material.name==='team'){const ca=gg.getAttribute('color');const it=ca.itemSize;for(let i=0;i<ca.count;i++){ca.setX(i,ca.getX(i)*tc.r);ca.setY(i,ca.getY(i)*tc.g);ca.setZ(i,ca.getZ(i)*tc.b);}}
     for(const k of Object.keys(gg.attributes))if(!['position','normal','color'].includes(k))gg.deleteAttribute(k);if(gg.getAttribute('color').itemSize===4){}return gg;});
    try{geo=mergeGeometries(gs,false);}catch(e){geo=null;}cache[bn.name]=geo||'x';}
   if(geo&&geo!=='x'){parts.forEach(p=>bn.remove(p));const m=new THREE.Mesh(geo,bodyMat);bn.add(m);}}}
 root.traverse(o=>{if(o.isMesh){o.castShadow=false;o.frustumCulled=true;}});
 const mixer=new THREE.AnimationMixer(root);const acts={};for(const c of g.animations)acts[c.name]=mixer.clipAction(c);
 const wrap=new THREE.Group();wrap.add(root);scene.add(wrap);return{obj:wrap,root,mixer,acts,cur:null};}
const ONCE={attack:1,ability:1,hit:1,down:1};
function playAnim(md,name){if(!md||md.cur===name)return;const a=md.acts[name]||md.acts.idle;if(!a)return;const prev=md.cur&&md.acts[md.cur];
 a.reset();a.setLoop(ONCE[name]?THREE.LoopOnce:THREE.LoopRepeat,Infinity);a.clampWhenFinished=!!ONCE[name];a.play();if(prev&&prev!==a)a.crossFadeFrom(prev,.12,false);md.cur=name;}
// env instancing: one InstancedMesh per (model, mesh) — a handful of draw calls for the whole map
const envPlace={};function envAdd(id,x,z,ry=0,s=1,y=0){(envPlace[id]=envPlace[id]||[]).push([x,y,z,ry,s]);}
let envGroup=null;
function buildEnv(){if(envGroup)return;envGroup=new THREE.Group();scene.add(envGroup);const mtx=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),v=new THREE.Vector3(),sc=new THREE.Vector3();
 for(const id in envPlace){const g=GLB['env/'+id]&&GLB['env/'+id].g;if(!g)continue;const list=envPlace[id];g.scene.updateMatrixWorld(true);
  g.scene.traverse(o=>{if(!o.isMesh)return;const geo=o.geometry.clone();geo.applyMatrix4(o.matrixWorld);const im=new THREE.InstancedMesh(geo,o.material,list.length);
   list.forEach((p,i)=>{e.set(0,p[3],0);q.setFromEuler(e);v.set(p[0],p[1],p[2]);sc.set(p[4],p[4],p[4]);mtx.compose(v,q,sc);im.setMatrixAt(i,mtx);});
   im.castShadow=id!=='ridge_1x1'&&id!=='ridge_ramp'?true:true;im.receiveShadow=true;im.computeBoundingSphere();envGroup.add(im);});}
 ren.shadowMap.needsUpdate=true;}
// NOTE envAdd takes (id, X, Z, ry, scale, Y); stored as [X,Y,Z] via p[0],p[1]=y? keep explicit:
function layoutEnv(){const rnd=mulberry(2033);const X=i=>(i+.5)*2-40;
 for(const h of HIGH_T){for(let i=h[0];i<h[0]+h[2];i++)for(let j=h[1];j<h[1]+h[3];j++)envAdd('ridge_1x1',X(i),X(j));envAdd('ridge_ramp',X(h[0]+Math.floor(h[2]/2)),X(h[1]+h[3]),Math.PI);}
 for(const c of COVER_T){const horiz=c[2]>=c[3];for(let i=c[0];i<c[0]+c[2];i++)for(let j=c[1];j<c[1]+c[3];j++)envAdd(c[4],X(i),X(j),horiz?0:Math.PI/2);}
 for(const w of WALLS)if(w.sep){for(let i=w.x/TILE;i<(w.x+w.w)/TILE;i++){const j=w.y/TILE;envAdd(i%3===1?'rock_grey_l':'cover_wall_full',X(i),X(j),0);if(rnd()<.5)envAdd(rnd()<.5?'tree_pine':'tree_round',X(i)+(rnd()-.5),X(j)-1.6+(rnd()-.5)*.6,rnd()*6);}}
 // border forest + rocks
 for(let i=0;i<N;i++)for(let j=0;j<N;j++){const edge=Math.min(i,j,N-1-i,N-1-j);if(edge>1)continue;const r=rnd();const id=r<.4?'tree_pine':r<.7?'tree_round':r<.8?'tree_small':r<.9?'rock_grey_l':'rock_brown_l';envAdd(id,X(i)+(rnd()-.5)*.6,X(j)+(rnd()-.5)*.6,rnd()*6,.9+rnd()*.4);}
 // camp dressing
 for(const c of[CAMP1,CAMP2]){envAdd('chest_gold',u2X(c.x),u2Z(c.y)+.2,0);envAdd('lamp_post',u2X(c.x)+5,u2Z(c.y)-4);envAdd('lamp_post',u2X(c.x)-5,u2Z(c.y)-4);}
 for(let k=0;k<12;k++){const a=k/12*Math.PI*2;envAdd('crystal_cluster',u2X(ARENA.x)+Math.cos(a)*10.5,u2Z(ARENA.y)+Math.sin(a)*9,a,1+rnd()*.4);}
 // light scatter in open space (no collision): small rocks only, away from the route
 for(let k=0;k<26;k++){const i=3+Math.floor(rnd()*34),j=3+Math.floor(rnd()*34);const x=(i+.5)*TILE,y=(j+.5)*TILE;if(WALLS.some(w=>inRect(x,y,w,TILE*1.5))||HIGH.some(h=>inRect(x,y,h,TILE))||[CAMP1,CAMP2,ARENA,TC(31,26),TC(6,13)].some(c=>Math.hypot(c.x-x,c.y-y)<TILE*5))continue;envAdd(rnd()<.5?'rock_brown_s':'rock_grey_m',X(i),X(j),rnd()*6);}}
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
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
