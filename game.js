'use strict';
// SQUAD 2033 v6 — 2D isometric tactics (JA2 x Ghost Recon). Plain canvas 2D.
const VERSION='squad2033 v6.3';
const cv=document.getElementById('c'),ctx=cv.getContext('2d');
let W=384,H=854,DPR=1,TOP=0,BOT=60,US=1,DW=384,DH=854;
const probe=document.createElement('div');probe.style.cssText='position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)';document.body.appendChild(probe);
function resize(){DPR=Math.min(window.devicePixelRatio||1,2);const vv=window.visualViewport;W=Math.round(vv?vv.width:innerWidth);H=Math.round(vv?vv.height:innerHeight);
 cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);cv.style.width=W+'px';cv.style.height=H+'px';
 const cs=getComputedStyle(probe);TOP=parseFloat(cs.paddingTop)||0;BOT=60+(parseFloat(cs.paddingBottom)||0);
 US=Math.max(.8,Math.min(1.5,W/384,(H-TOP-BOT)/700));DW=W/US;DH=H/US;}
addEventListener('resize',resize);if(window.visualViewport)visualViewport.addEventListener('resize',resize);addEventListener('orientationchange',()=>setTimeout(resize,200));
resize();
let SPD=1;const FORCE={};const sleep=ms=>new Promise(r=>setTimeout(r,ms*SPD));
let seed=(Date.now()&0xffffff)>>>0;function rnd(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}
const ri=(a,b)=>a+Math.floor(rnd()*(b-a+1));
const clamp=(v,a,b)=>v<a?a:v>b?b:v;const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

// ---------- assets ----------
const A={};let loadDone=0,loadTotal=0,loadErr=null;
function loadImg(src){return new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error('image failed: '+src));i.src=src+'?v=6.3';});}
async function loadAtlas(key,path,mask){loadTotal++;const [j,img]=await Promise.all([fetch(path+'.json?v=6.3').then(r=>{if(!r.ok)throw new Error('json failed: '+path);return r.json();}),loadImg(path+'.png')]);
 const a={fr:j.frames,meta:j.meta,img};if(mask)a.mask=await loadImg(path+'_mask.png');A[key]=a;loadDone++;}
const RACES=['human','robot','grey'];
const CLS_KEYS=['assault','heavy','sniper','scout','tech','leader','radio'];
const ENEMY_KEYS=['nordic_commander','nordic_sentinel','reptile_slave','collab_trooper','collab_medic'];
async function loadAll(){const L=[];
 for(const r of RACES)for(const c of CLS_KEYS){const s=CL[c].spr;L.push(loadAtlas(r+'_'+c,`assets/players/${r}_${s}/${r}_${s}`,true));}
 for(const e of ENEMY_KEYS)L.push(loadAtlas(e,`assets/enemies/${e}/${e}`));
 L.push(loadAtlas('sovereign','assets/boss/sovereign/sovereign'),loadAtlas('sovereign_guard','assets/boss/sovereign_guard/sovereign_guard'));
 L.push(loadAtlas('floors','assets/tiles/floors/floors'),loadAtlas('walls','assets/tiles/walls/walls'),loadAtlas('props','assets/tiles/props/props'));
 L.push(loadAtlas('hud','assets/hud/kit/hud'),loadAtlas('fx','assets/fx/effects/fx'));
 L.push(loadAtlas('f11','assets/hud/font11/barlow_cb_11'),loadAtlas('f14','assets/hud/font14/barlow_cb_14'),loadAtlas('f18','assets/hud/font18/barlow_cb_18'));
 await Promise.all(L);}
function mkCanvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
const tintCache=new Map();
function tintedImage(img,col){const k=img.src+col;let c=tintCache.get(k);if(c)return c;c=mkCanvas(img.width,img.height);const g=c.getContext('2d');g.drawImage(img,0,0);g.globalCompositeOperation='source-in';g.fillStyle=col;g.fillRect(0,0,c.width,c.height);tintCache.set(k,c);return c;}
function teamAtlasImg(a,col){const k='team'+a.img.src+col;let c=tintCache.get(k);if(c)return c;const w=a.img.width,h=a.img.height;c=mkCanvas(w,h);const g=c.getContext('2d');g.drawImage(a.img,0,0);
 const m=mkCanvas(w,h),mg=m.getContext('2d');mg.drawImage(a.mask,0,0);mg.globalCompositeOperation='multiply';mg.fillStyle=col;mg.fillRect(0,0,w,h);mg.globalCompositeOperation='destination-in';mg.drawImage(a.mask,0,0);g.drawImage(m,0,0);tintCache.set(k,c);return c;}
// draw frame with pivot at (x,y). flip mirrors around pivot.
function drawFrame(a,name,x,y,flip,img,scale){const f=a.fr[name];if(!f)return false;const s=scale||1;const fr=f.frame,ss=f.spriteSourceSize;const px=f.sourceSize.w*f.pivot.x,py=f.sourceSize.h*f.pivot.y;
 const im=img||a.img;if(!flip)ctx.drawImage(im,fr.x,fr.y,fr.w,fr.h,x+(ss.x-px)*s,y+(ss.y-py)*s,fr.w*s,fr.h*s);
 else{ctx.save();ctx.translate(x,y);ctx.scale(-1,1);ctx.drawImage(im,fr.x,fr.y,fr.w,fr.h,(ss.x-px)*s,(ss.y-py)*s,fr.w*s,fr.h*s);ctx.restore();}return true;}
function frameSize(a,name){const f=a.fr[name];return f?f.sourceSize:{w:0,h:0};}
// bitmap text
const FONTS={11:'f11',14:'f14',18:'f18'};
function textW(s,sz){const a=A[FONTS[sz||14]];const adv=a.meta.font.advance;let w=0;for(const ch of s){w+=adv['U+'+ch.codePointAt(0).toString(16).toUpperCase().padStart(4,'0')]||4;}return w;}
function text(s,x,y,col,sz,align){s=String(s).toUpperCase();sz=sz||14;const a=A[FONTS[sz]];if(!a){ctx.fillStyle=col;ctx.font=sz+'px sans-serif';ctx.fillText(s,x,y+sz);return;}const adv=a.meta.font.advance;
 if(align==='c')x-=textW(s,sz)/2;else if(align==='r')x-=textW(s,sz);const img=tintedImage(a.img,col||'#e6e2d4');
 for(const ch of s){const k='U+'+ch.codePointAt(0).toString(16).toUpperCase().padStart(4,'0');const f=a.fr[k];if(f){const fr=f.frame,ss=f.spriteSourceSize;ctx.drawImage(img,fr.x,fr.y,fr.w,fr.h,Math.round(x+ss.x),Math.round(y+ss.y),fr.w,fr.h);}x+=adv[k]||4;}}
function panel(x,y,w,h,gold,fillA){const a=A.hud;const f=a.fr[gold?'panel_9slice_gold':'panel_9slice'];const r=f.frame,i=3;const im=a.img;x=Math.round(x);y=Math.round(y);w=Math.round(w);h=Math.round(h);
 const sx=[r.x,r.x+i,r.x+r.w-i],sw=[i,r.w-2*i,i],dx=[x,x+i,x+w-i],dw=[i,w-2*i,i];const sy=[r.y,r.y+i,r.y+r.h-i],sh=[i,r.h-2*i,i],dy=[y,y+i,y+h-i],dh=[i,h-2*i,i];
 if(fillA!==undefined){ctx.globalAlpha=fillA;}for(let a1=0;a1<3;a1++)for(let b=0;b<3;b++)ctx.drawImage(im,sx[b],sy[a1],sw[b],sh[a1],dx[b],dy[a1],dw[b],dh[a1]);ctx.globalAlpha=1;}

// ---------- data ----------
const WEP={
 ar:{n:'AR-24 RIFLE',acc:75,rng:9,dmg:[2,2],mag:8,mags:4,noise:12},
 lmg:{n:'M60X LMG',acc:64,rng:10,dmg:[2,3],mag:10,mags:3,noise:16},
 dmr:{n:'DMR-7 SNIPER',acc:80,rng:16,dmg:[3,4],mag:5,mags:4,noise:12},
 ssmg:{n:'SD-9 SMG (SIL)',acc:66,rng:6,dmg:[1,2],mag:10,mags:4,noise:3},
 carb:{n:'K-4 CARBINE',acc:70,rng:8,dmg:[1,2],mag:10,mags:4,noise:10},
 smg:{n:'V-9 SMG',acc:66,rng:6,dmg:[1,2],mag:12,mags:4,noise:10},
 pis:{n:'P-9 PISTOL',acc:58,rng:5,dmg:[1,1],mag:8,mags:3,noise:8},
 spis:{n:'P-9SD PISTOL',acc:60,rng:5,dmg:[1,2],mag:8,mags:3,noise:2},
 erifle:{n:'RIFLE',acc:55,rng:8,dmg:[1,2],noise:12},
 orb:{n:'PSI STAFF',acc:62,rng:9,dmg:[2,2],noise:6},
 claw:{n:'CLAWS',acc:78,rng:1.5,dmg:[2,2],melee:1},
 strike:{n:'STRIKE',acc:75,rng:1.5,dmg:[2,3],melee:1},
 halb:{n:'HALBERD',acc:80,rng:1.5,dmg:[2,3],melee:1},
 psi:{n:'PSI BOLT',acc:70,rng:11,dmg:[2,3],noise:8},
};
const CL={
 assault:{n:'ASSAULT',spr:'assault',col:'#3fc8e0',hp:0,wep:['ar','pis'],move:[2,3,4],snap:3,aimed:6,reload:2,swap:1,ab:['breach','frag','flash','ub','swap'],items:{frag:2,flash:1},role:'Breacher. Cheap move+shoot, fast swap. Weak at range.'},
 heavy:{n:'HEAVY',spr:'heavy',col:'#f0a030',hp:1,wep:['lmg','pis'],move:[3,4,5],snap:4,aimed:7,reload:3,swap:2,ab:['suppress','bipod','sandbag','ammo','swap'],items:{sandbag:1,ammo:2},loud:2,role:'Suppression. Tanky, slow and loud.'},
 sniper:{n:'SNIPER',spr:'recon',col:'#8be04a',hp:-1,wep:['dmr','spis'],move:[2,3,4],snap:5,aimed:8,reload:3,swap:2,ab:['owlane','swap'],items:{},sight:11,role:'Long-range killer. Ghillie. Fragile up close.'},
 scout:{n:'SCOUT/DEMO',spr:'demolitions',col:'#e0703a',hp:-1,wep:['ssmg','pis'],move:[1,2,3],snap:4,aimed:6,reload:3,swap:2,ab:['mark','breachwall','claymore','rocket','swap'],items:{charge:2,claymore:2,rocket:1},sight:12,stealth:.8,quiet:1,role:'Saboteur. Quietest, best vision. Marks and blows walls.'},
 tech:{n:'TECH',spr:'tech',col:'#b070f0',hp:0,acc:-10,wep:['carb','pis'],move:[2,3,4],snap:4,aimed:7,reload:3,swap:2,ab:['stabilize','hack','drone','swap'],items:{medkit:3,drone:2},role:'Medic + hacker. Stabilize, hack collars, drone.'},
 leader:{n:'LEADER',spr:'leader',col:'#e8c040',hp:0,wep:['carb','pis'],move:[2,3,4],snap:4,aimed:7,reload:3,swap:2,ab:['rally','smoke','swap'],items:{smoke:2},role:'Commander. Aim buff nearby, cheap orders.'},
 radio:{n:'RADIO OP',spr:'radio_op',col:'#60a0f0',hp:0,wep:['smg','pis'],move:[2,3,4],snap:4,aimed:7,reload:3,swap:2,ab:['strike','supply','flyover','swap'],items:{strike:2,supply:1,flyover:1},loud:1,role:'Calls strikes, supply, flyover. Enemies target first.'},
};
const RACE={human:{n:'HUMAN',hp:4,acc:8,note:'+8 aim'},robot:{n:'ROBOT',hp:5,acc:0,loud:2,note:'+1 hit, loud'},grey:{n:'GREY',hp:4,acc:0,psi:8,note:'psionic sense'}};
const ENEMY={
 collab_trooper:{n:'COLLABORATOR',hp:3,ap:10,wep:'erifle',atk:'fire',sight:9},
 collab_medic:{n:'COLLAB MEDIC',hp:3,ap:10,wep:'erifle',atk:'fire',sight:9,medic:1},
 reptile_slave:{n:'REPTILE SLAVE',hp:3,ap:12,wep:'claw',atk:'attack',sight:8,collar:1,move:1},
 nordic_sentinel:{n:'NORDIC SENTINEL',hp:5,ap:10,wep:'strike',atk:'attack',sight:9,shield:3,nordic:1},
 nordic_commander:{n:'NORDIC COMMANDER',hp:4,ap:10,wep:'orb',atk:'cast',sight:10,shield:2,nordic:1},
 sovereign_guard:{n:'SOVEREIGN GUARD',hp:5,ap:10,wep:'halb',atk:'attack_slam',sight:9,armour:1,collar:1,nordic:1},
 sovereign:{n:'THE SOVEREIGN',hp:14,ap:12,wep:'psi',atk:'psi_bolt',sight:11,boss:1,idle:'idle'},
};
const TEAM=['#3fc8e0','#f0a030','#8be04a','#c070f0'];
const NAMES=['KESTREL','VOSS','HALE','REYES','OKAFOR','BRANDT','MAKO','SILVA','NAKAMURA','IVERS','DRAKE','QUINN','TALLIS','OREN','BECK','STROM','KADE','LUNA','PIKE','RIOS'];

// ---------- roster / save ----------
const SAVE_KEY='sq2033_v6';
let R=null;
function newRoster(){let n=0;const pick=()=>NAMES[(n++*7+3)%NAMES.length];return{mission:1,wins:0,losses:0,nextId:8,fallen:[],pendingRecruits:[],
 roster:CLS_KEYS.map((c,i)=>({id:i+1,name:pick(),cls:c,race:['human','robot','grey'][i%3],status:'ok',sitOut:0,kills:0,missions:0}))};}
function loadRoster(){try{const s=JSON.parse(localStorage.getItem(SAVE_KEY));if(s&&s.roster)return s;}catch(e){}return newRoster();}
function saveRoster(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(R));}catch(e){}}

// ---------- map ----------
const N=40,FL=['grass','dirt','sand','cobble','mud','jungle_cobble'];
const ix=(x,y)=>y*N+x;const inb=(x,y)=>x>=0&&y>=0&&x<N&&y<N;
let M;
const PROPS={sandbags_a:{c:1},sandbags_b:{c:1},crate:{c:1},crate_stack:{c:2,los:1},barrel:{c:1},barrier_a:{c:1},barrier_b:{c:1},rubble_pile:{c:1},rocks:{c:1}};
function buildMap(){M={floor:new Uint8Array(N*N),prop:new Array(N*N).fill(null),wNW:new Array(N*N).fill(null),wNE:new Array(N*N).fill(null),smoke:new Int8Array(N*N),seen:new Uint8Array(N*N),vis:new Uint8Array(N*N),clay:new Map(),reserved:new Set()};
 const setF=(x0,y0,x1,y1,f)=>{for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++)if(inb(x,y))M.floor[ix(x,y)]=f;};
 // patches
 for(let k=0;k<14;k++){const cx=ri(2,37),cy=ri(2,37),r=ri(1,3),f=rnd()<.5?4:2;for(let x=cx-r;x<=cx+r;x++)for(let y=cy-r;y<=cy+r;y++)if(inb(x,y)&&Math.hypot(x-cx,y-cy)<=r+.3)M.floor[ix(x,y)]=f;}
 setF(19,0,20,39,1);setF(0,19,39,20,1);setF(30,30,39,39,1);
 const wall=(arr,x,y,st)=>{if(inb(x,y))arr[ix(x,y)]={st:st||'intact'};};
 const bld=(x0,y0,x1,y1,doors,fl)=>{setF(x0,y0,x1,y1,fl);for(let x=x0;x<=x1;x++){wall(M.wNE,x,y0);wall(M.wNE,x,y1+1);}for(let y=y0;y<=y1;y++){wall(M.wNW,x0,y);wall(M.wNW,x1+1,y);}
  for(const d of doors){const arr=d[0]==='ne'?M.wNE:M.wNW;arr[ix(d[1],d[2])]={st:'door_closed',door:1};}};
 // Building A (west) — collaborators
 bld(6,24,13,31,[['ne',9,24],['nw',14,27],['nw',6,29]],3);for(let x=6;x<=13;x++)if(x!==10)wall(M.wNE,x,28);M.wNE[ix(10,28)]={st:'door_open',door:1};
 // Building B (east) — Nordic outpost
 bld(24,8,31,14,[['nw',32,11],['ne',27,15],['ne',25,8]],3);for(let y=8;y<=14;y++)if(y!==12)wall(M.wNW,28,y);M.wNW[ix(28,12)]={st:'door_open',door:1};
 // Boss compound (north)
 bld(2,2,11,11,[['ne',6,12],['nw',12,7]],5);
 // ruined walls
 for(let x=15;x<=18;x++)wall(M.wNE,x,31,'cracked');for(let y=25;y<=27;y++)wall(M.wNW,31,y,'cracked');wall(M.wNW,31,28,'breached');
 for(let x=13;x<=16;x++)wall(M.wNE,x,16,'cracked');wall(M.wNE,17,16,'rubble');
 const P=(x,y,k)=>{if(inb(x,y))M.prop[ix(x,y)]={k};};
 P(26,17,'sandbags_a');P(28,17,'sandbags_a');P(29,17,'sandbags_a');P(33,12,'sandbags_b');P(33,10,'sandbags_b');
 P(15,24,'sandbags_b');P(15,29,'sandbags_b');P(9,22,'sandbags_a');P(11,22,'crate');
 P(5,14,'barrier_a');P(8,14,'barrier_b');P(13,8,'barrier_b');P(13,5,'crate_stack');P(7,13,'rocks');
 P(4,4,'crate');P(9,4,'crate');P(3,9,'barrel');
 const keep=(x,y)=>{if(!inb(x,y)||M.prop[ix(x,y)])return false;const f=M.floor[ix(x,y)];if(f===1||f===3||f===5)return false;if(x>=30&&y>=30)return false;if(x>=1&&x<=12&&y>=1&&y<=12)return false;
  for(const [a,b] of [[0,0],[1,0],[0,1],[-1,0],[0,-1]]){const t=inb(x+a,y+b)&&(M.wNW[ix(x+a,y+b)]||M.wNE[ix(x+a,y+b)]);if(t&&t.door)return false;}return true;};
 const pool=['crate','crate','crate_stack','rocks','rocks','barrel','rubble_pile','sandbags_a','sandbags_b','barrier_a','crate_stack'];
 let placed=0,guard=0;while(placed<70&&guard++<2000){const x=ri(0,39),y=ri(0,39);if(keep(x,y)){P(x,y,pool[ri(0,pool.length-1)]);placed++;}}
 for(let x=0;x<N;x++)for(let y=0;y<N;y++){const w1=M.wNW[ix(x,y)],w2=M.wNE[ix(x,y)];if(w1||w2){}}
 buildFloorCanvas();}
const edge=(x,y,nx,ny)=>{if(nx===x+1)return M.wNW[ix(nx,y)];if(nx===x-1)return M.wNW[ix(x,y)];if(ny===y+1)return M.wNE[ix(x,ny)];if(ny===y-1)return M.wNE[ix(x,y)];return null;};
const BLOCK_MOVE={intact:1,cracked:1},BLOCK_LOS={intact:1,cracked:1,door_closed:1};
const blocksLOS=w=>w&&BLOCK_LOS[w.st];const blocksMove=w=>w&&BLOCK_MOVE[w.st];
function passable(x,y){return inb(x,y)&&!M.prop[ix(x,y)];}
function occupied(x,y,except){for(const u of G.units)if(u!==except&&u.alive&&Math.round(u.tx)===x&&Math.round(u.ty)===y)return u;return null;}
function canStep(x,y,nx,ny){if(!passable(nx,ny))return false;if(nx===x||ny===y)return !blocksMove(edge(x,y,nx,ny));
 const o=(ax,ay,bx,by)=>passable(ax,ay)&&!blocksMove(edge(x,y,ax,ay))&&!blocksMove(edge(ax,ay,bx,by))&&!(edge(x,y,ax,ay)||{}).door&&!(edge(ax,ay,bx,by)||{}).door;
 return o(nx,y,nx,ny)&&o(x,ny,nx,ny);}
function findPath(u,gx,gy,maxN){const sx=Math.round(u.tx),sy=Math.round(u.ty);if(!passable(gx,gy)||(sx===gx&&sy===gy))return null;
 const g=new Float32Array(N*N).fill(1e9),from=new Int32Array(N*N).fill(-1),open=[[0,sx,sy]];g[ix(sx,sy)]=0;const occ=new Set();for(const o of G.units)if(o!==u&&o.alive)occ.add(ix(Math.round(o.tx),Math.round(o.ty)));
 let it=0;while(open.length&&it++<6000){let bi=0;for(let i=1;i<open.length;i++)if(open[i][0]<open[bi][0])bi=i;const [,x,y]=open.splice(bi,1)[0];if(x===gx&&y===gy)break;
  for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;if(!canStep(x,y,nx,ny))continue;const k=ix(nx,ny);if(occ.has(k)&&!(nx===gx&&ny===gy))continue;
   const e=edge(x,y,nx,ny);const c=g[ix(x,y)]+(dx&&dy?1.41:1)+(e&&e.st==='door_closed'?1:0);if(c<g[k]){g[k]=c;from[k]=ix(x,y);open.push([c+Math.hypot(gx-nx,gy-ny),nx,ny]);}}}
 if(g[ix(gx,gy)]>=1e9)return null;if(occ.has(ix(gx,gy)))return null;const p=[];let k=ix(gx,gy);while(k!==ix(sx,sy)){p.unshift({x:k%N,y:(k/N)|0});k=from[k];}if(maxN&&p.length>maxN)p.length=maxN;return p;}
function los(x0,y0,x1,y1,ignoreSmoke){x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);const d=Math.hypot(x1-x0,y1-y0);if(d<.1)return true;const n=Math.ceil(d*4);let cx=x0,cy=y0;
 for(let i=1;i<=n;i++){const px=Math.round(x0+(x1-x0)*i/n),py=Math.round(y0+(y1-y0)*i/n);if(px===cx&&py===cy)continue;
  if(px!==cx&&py!==cy){const a=blocksLOS(edge(cx,cy,px,cy))||blocksLOS(edge(px,cy,px,py))||(M.prop[ix(px,cy)]&&PROPS[M.prop[ix(px,cy)].k].los),b=blocksLOS(edge(cx,cy,cx,py))||blocksLOS(edge(cx,py,px,py))||(M.prop[ix(cx,py)]&&PROPS[M.prop[ix(cx,py)].k].los);if(a&&b)return false;}
  else if(blocksLOS(edge(cx,cy,px,py)))return false;
  cx=px;cy=py;if(cx===x1&&cy===y1)break;const pr=M.prop[ix(cx,cy)];if(pr&&PROPS[pr.k].los)return false;if(!ignoreSmoke&&M.smoke[ix(cx,cy)]>0)return false;}
 return true;}
function coverAt(t,s){if(dist(t,s)<1.6)return 0;const tx=Math.round(t.tx),ty=Math.round(t.ty);const dx=s.tx-tx,dy=s.ty-ty;let best=0;const cand=[];
 if(Math.abs(dx)>=Math.abs(dy)*.4)cand.push([tx+Math.sign(dx),ty]);if(Math.abs(dy)>=Math.abs(dx)*.4)cand.push([tx,ty+Math.sign(dy)]);
 for(const [nx,ny] of cand){if(!inb(nx,ny))continue;const w=edge(tx,ty,nx,ny);if(w){if(BLOCK_LOS[w.st])best=Math.max(best,2);else if(w.st==='breached'||w.st==='rubble')best=Math.max(best,1);}
  const p=M.prop[ix(nx,ny)];if(p)best=Math.max(best,PROPS[p.k].c);}return best;}

// ---------- game state ----------
let G={screen:'load',units:[],fx:[],floats:[],msgs:[]};
let floorCanvas=null;
function buildFloorCanvas(){floorCanvas=mkCanvas(N*64+64,N*32+64);const g=floorCanvas.getContext('2d');const a=A.floors;
 for(let x=0;x<N;x++)for(let y=0;y<N;y++){const f=a.fr['floor/'+FL[M.floor[ix(x,y)]]];const fr=f.frame,ss=f.spriteSourceSize;const wx=(x-y)*32+N*32,wy=(x+y)*16+16;g.drawImage(a.img,fr.x,fr.y,fr.w,fr.h,wx-32+ss.x,wy-16+ss.y,fr.w,fr.h);}}
const wpx=(x,y)=>(x-y)*32,wpy=(x,y)=>(x+y)*16;
const DIRS=['E','SE','S','SW','W','NW','N','NE'];
function dirFromTile(dx,dy){const sx=(dx-dy)*32,sy=(dx+dy)*16;const a=Math.atan2(sy,sx);return DIRS[(Math.round(a/(Math.PI/4))+8)%8];}
function mkPlayer(rs,slot){const c=CL[rs.cls],r=RACE[rs.race];const u={side:'p',slot,rid:rs.id,name:rs.name,cls:rs.cls,race:rs.race,atlas:rs.race+'_'+rs.cls,col:TEAM[slot],
 hp:r.hp+c.hp,maxhp:r.hp+c.hp,ap:0,maxap:12,stance:'stand',weps:c.wep.map(k=>({k,ammo:WEP[k].mag,mags:WEP[k].mags})),w:0,items:Object.assign({},c.items),cd:{},ub:rs.ub||'gl',ubAmmo:3,
 follow:true,wps:[],alive:true,down:false,bleed:0,stab:false,dead:false,marked:0,supp:0,stun:0,ow:false,bipod:false,moved:false,kills:0,face:Math.atan2(-1,-1)};return u;}
function mkEnemy(type,x,y,grp,extra){const d=ENEMY[type];return Object.assign({side:'e',type,atlas:type,name:d.n,hp:d.hp,maxhp:d.hp,ap:0,maxap:d.ap,wk:d.wep,shield:d.shield||0,stance:'stand',x,y,tx:x,ty:y,post:{x,y},grp,aware:false,alive:true,down:false,
 marked:0,supp:0,stun:0,face:Math.atan2(1,1),freed:0,hostile:true,boss:!!d.boss},extra||{});}
function setupMission(sel){seed=(Date.now()&0xffff)^0x5a5a;G={screen:'play',mode:'rt',side:'p',round:0,units:[],fx:[],floats:[],msgs:[],strikes:[],drones:[],sel:null,target:null,preview:null,pending:null,menu:null,busy:false,calm:0,camX:0,camY:0,Z:1,panT:0,map:false,mapSel:0,result:null,t:0,ringT:0,owFired:new Set()};
 const s0=seed;seed=20330601;buildMap();seed=s0;
 const spawn=[[35,36],[36,35],[34,37],[37,34]];
 sel.forEach((rs,i)=>{const u=mkPlayer(rs,i);u.x=u.tx=spawn[i][0];u.y=u.ty=spawn[i][1];G.units.push(u);});
 const E=(t,x,y,g,ex)=>G.units.push(mkEnemy(t,x,y,g,ex));
 E('collab_trooper',10,25,1);E('collab_trooper',12,30,1);E('collab_medic',8,29,1);
 E('reptile_slave',15,22,1,{patrol:[{x:15,y:22},{x:16,y:30}]});E('reptile_slave',4,22,1,{patrol:[{x:4,y:22},{x:13,y:21}]});
 E('nordic_sentinel',27,16,2,{face:Math.atan2(1,1)});E('nordic_commander',29,11,2);E('collab_trooper',25,10,2);
 E('reptile_slave',22,10,2,{patrol:[{x:22,y:9},{x:23,y:18}]});E('reptile_slave',33,15,2,{patrol:[{x:34,y:15},{x:30,y:18}]});
 E('collab_trooper',26,22,3,{patrol:[{x:26,y:22},{x:21,y:27}]});
 E('sovereign',5,5,4);E('sovereign_guard',6,9,4);E('sovereign_guard',9,6,4);
 G.sel=G.units[0];G.camX=wpx(G.sel.x,G.sel.y);G.camY=wpy(G.sel.x,G.sel.y)-30;computeVis();
 msg('INSERTION. SCOUT THE AO — KILL THE SOVEREIGN (NORTH COMPOUND).','#8be04a');}
const players=()=>G.units.filter(u=>u.side==='p');
const liveP=()=>G.units.filter(u=>u.side==='p'&&u.alive&&!u.down);
const hostiles=()=>G.units.filter(u=>u.side==='e'&&u.alive&&u.hostile);
function msg(s,c){G.msgs.push({s,c:c||'#e6e2d4',t:0});if(G.msgs.length>3)G.msgs.shift();}
function float(u,s,c){G.floats.push({x:u.x,y:u.y,s,c,t:0});}
// ---------- vision ----------
function sightOf(u){if(u.side==='p')return(CL[u.cls].sight||10);return ENEMY[u.type].sight;}
function stealthOf(u){let s={stand:1,crouch:.72,prone:.5}[u.stance]||1;if(u.side==='p'){if(u.cls==='scout')s*=.8;if(u.cls==='sniper')s*=u.stance==='prone'?.7:.9;}if(u.down)s*=.6;return s;}
function angDiff(a,b){let d=a-b;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return Math.abs(d);}
function sees(a,b){if(!a.alive||a.down||!b.alive)return false;const d=dist(a,b);const r=sightOf(a)*stealthOf(b);if(d>r)return false;
 const wide=(a.side==='p'&&G.mode==='tb')||(a.side==='e'&&a.aware)||d<2.2;if(!wide){const cone=a.side==='p'?1.4:1.05;if(angDiff(Math.atan2(b.y-a.y,b.x-a.x),a.face)>cone)return false;}
 return los(a.tx,a.ty,b.tx,b.ty);}
function computeVis(){M.vis.fill(0);const src=[];for(const u of liveP())src.push({x:u.tx,y:u.ty,r:sightOf(u),f:u.face,wide:G.mode==='tb'});for(const d of G.drones)src.push({x:d.x,y:d.y,r:5,wide:1,air:1});
 for(const s of src){const r=Math.ceil(s.r);for(let x=s.x-r;x<=s.x+r;x++)for(let y=s.y-r;y<=s.y+r;y++){if(!inb(x,y))continue;const d=Math.hypot(x-s.x,y-s.y);if(d>s.r)continue;
  if(!s.wide&&d>2.2&&angDiff(Math.atan2(y-s.y,x-s.x),s.f)>1.4)continue;if(s.air||los(s.x,s.y,x,y)){M.vis[ix(x,y)]=1;M.seen[ix(x,y)]=1;}}}}
function enemyVisible(e){if(e.side!=='e')return true;if(e.marked>0||G.flyover>0)return true;const k=ix(Math.round(e.tx),Math.round(e.ty));if(!M.vis[k])return false;
 if(!e.alive)return true;for(const d of G.drones)if(Math.hypot(d.x-e.x,d.y-e.y)<=5)return true;return liveP().some(p=>sees(p,e)||dist(p,e)<1.6);}
function groupAlert(g,pos){for(const e of hostiles())if(e.grp===g&&!e.aware){e.aware=true;if(pos)e.lk={x:pos.x,y:pos.y};}}
function noise(x,y,r,src){for(const e of hostiles()){const d=Math.hypot(e.x-x,e.y-y);if(d>r)continue;e.face=Math.atan2(y-e.y,x-e.x);
  if(G.mode==='tb'){if(!e.aware){e.aware=true;e.lk={x:Math.round(x),y:Math.round(y)};}}else{e.sus={x:Math.round(x),y:Math.round(y),t:5};}}}

// ---------- movement ----------
const STI={stand:0,crouch:1,prone:2};
function speedOf(u){let s={stand:2.6,crouch:1.6,prone:.9}[u.stance]||2.6;if(u.side==='e')s=u.aware||u.sus?2.4:1.2;if(G.mode==='tb')s*=1.7;return s;}
function stepCost(u,n){let c=u.side==='p'?CL[u.cls].move[STI[u.stance]]:(ENEMY[u.type].move||2);const e=edge(u.tx,u.ty,n.x,n.y);if(e&&e.st==='door_closed')c+=2;return c;}
function stepNoise(u){if(u.side!=='p')return 0;let r=[4,2,.5][STI[u.stance]];if(CL[u.cls].quiet)r*=.5;r+=(RACE[u.race].loud||0)+(CL[u.cls].loud||0)*.5;if(u.stance==='prone')r=Math.min(r,1);return r;}
function stepTo(u,n){return new Promise(res=>{const e=edge(u.tx,u.ty,n.x,n.y);if(e&&e.st==='door_closed')e.st='door_open';u.face=Math.atan2(n.y-u.ty,n.x-u.tx);u.mv={x0:u.x,y0:u.y,x1:n.x,y1:n.y,t:0,d:Math.max(.01,Math.hypot(n.x-u.x,n.y-u.y)),res};u.tx=n.x;u.ty=n.y;});}
const visibleHostiles=()=>hostiles().filter(e=>liveP().some(p=>sees(p,e)));
async function moveAlong(u,path){if(!path||!path.length)return;const tok=u.tok=(u.tok||0)+1;const mode=G.mode;let seen0=mode==='tb'&&u.side==='p'?visibleHostiles().length:0;u.moving=true;
 try{for(const n of path){if(u.tok!==tok||!u.alive||u.down||G.mode!==mode||G.screen!=='play')break;if(occupied(n.x,n.y,u)||!canStep(u.tx,u.ty,n.x,n.y))break;
  if(mode==='tb'){const c=stepCost(u,n);if(u.ap<c)break;u.ap-=c;u.moved=true;u.bipod=false;}else u.bipod=false;
  await stepTo(u,n);
  if(u.side==='p'){const r=stepNoise(u);if(r>0)noise(u.x,u.y,r,u);computeVis();
   if(mode==='rt'){checkContact();if(G.mode!=='rt')break;}
   else{for(const e of hostiles())if(!e.aware&&sees(e,u))groupAlert(e.grp,{x:u.tx,y:u.ty});const s=visibleHostiles().length;if(s>seen0){msg('NEW CONTACT — MOVE HALTED','#f0a030');break;}}}
  else{await claymoreCheck(u);if(!u.alive)break;if(mode==='tb'){await overwatchCheck(u);if(!u.alive)break;}else{checkContact();if(G.mode!=='rt')break;}}}}
 finally{u.moving=false;}}
async function waitIdle(){let k=0;while(G.units.some(u=>u.mv)&&k++<200)await sleep(20);}
function pathAdj(u,t,maxN){let best=null;const tx=Math.round(t.tx!==undefined?t.tx:t.x),ty=Math.round(t.ty!==undefined?t.ty:t.y);
 for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){if(!dx&&!dy)continue;const x=tx+dx,y=ty+dy;if(Math.round(u.tx)===x&&Math.round(u.ty)===y)return[];if(!passable(x,y)||!canStep(x,y,tx,ty))continue;const p=findPath(u,x,y);if(p&&(!best||p.length<best.length))best=p;}
 if(best&&maxN)best=best.slice(0,maxN);return best;}

// ---------- combat ----------
const curWep=u=>u.side==='p'?WEP[u.weps[u.w].k]:WEP[u.wk];
const snapCost=u=>u.side==='p'?(u.w===1?3:CL[u.cls].snap):(ENEMY[u.type].boss?5:4);
const aimCost=u=>u.side==='p'?(u.w===1?5:CL[u.cls].aimed):6;
function leaderMod(a){const L=G.units.find(u=>u.side==='p'&&u.cls==='leader');if(!L)return 0;if(!L.alive||L.down)return -10;return(L!==a&&dist(L,a)<=4)?10:0;}
function canShoot(a,t){return los(a.tx,a.ty,t.tx,t.ty,true);}
function hitChance(a,t,aimed,o){o=o||{};const w=curWep(a);const d=dist(a,t);let c=w.acc;
 if(a.side==='p'){c+=RACE[a.race].acc+(CL[a.cls].acc||0)+leaderMod(a);if(a.bipod)c+=20;if(a.cls==='sniper'&&d>10&&a.w===0)c+=10;if(a.cls==='assault'&&d>7)c-=(d-7)*4;if(a.moved&&!aimed)c-=a.cls==='assault'?3:10;c+=[0,5,10][STI[a.stance]];}
 if(!w.melee){if(d>w.rng)c-=(d-w.rng)*8;if(d<=2)c+=10;if(aimed)c+=a.side==='p'&&a.cls==='sniper'?30:20;if(d>3)c-=[0,8,15][STI[t.stance]||0];const cv=coverAt(t,a);c-=cv===2?40:cv===1?20:0;
  if(!los(a.tx,a.ty,t.tx,t.ty,true))return 0;if(!los(a.tx,a.ty,t.tx,t.ty,false))c-=30;}
 else if(d>1.6)return 0;
 if(t.marked>0&&a.side==='p')c+=15;if(a.supp)c-=25;if(o.bonus)c+=o.bonus;return clamp(Math.round(c),5,95);}
function atkAnim(u){if(u.side==='p')return'fire';return ENEMY[u.type].atk;}
function setAnim(u,n){u.anim={n,t:0};}
async function attack(a,t,aimed,o){o=o||{};if(!a.alive||a.down||!t.alive)return false;const w=o.wep||curWep(a);const cost=o.free?0:(o.cost!==undefined?o.cost:(aimed?aimCost(a):snapCost(a)));if(G.mode==='tb'&&a.ap<cost)return false;
 if(a.side==='p'&&!o.wep){const wi=a.weps[a.w];if(wi.ammo<=0){msg('OUT OF AMMO — RELOAD','#f0a030');return false;}wi.ammo--;}
 a.ap-=cost;a.face=Math.atan2(t.y-a.y,t.x-a.x);setAnim(a,atkAnim(a));if(w.noise)noise(a.x,a.y,w.noise,a);if(a.side==='p'&&t.side==='e')groupAlert(t.grp,{x:a.tx,y:a.ty});
 const ch=o.chance!==undefined?o.chance:hitChance(a,t,aimed,o);let hit=rnd()*100<ch;if(a.side==="p"&&FORCE.p!==undefined)hit=FORCE.p;if(a.side==="e"&&FORCE.e!==undefined)hit=FORCE.e;
 if(!w.melee)G.fx.push({k:'tracer',x0:a.x,y0:a.y,x1:t.x,y1:t.y,t:0,T:.18,c:a.side==='p'?'#fff3b0':(a.type==='sovereign'||ENEMY[a.type].nordic?'#9ff0ff':'#ff8a6a'),boss:a.boss});
 await sleep(200);
 if(hit){let dm=ri(w.dmg[0],w.dmg[1]);if(a.side==='p'&&a.cls==='sniper'&&aimed&&a.w===0)dm+=1;if(o.dmg)dm=o.dmg;damage(t,dm,a,false);}else float(t,'MISS','#c8c8c8');
 if(a.side==='p'&&t.side==='e'&&!t.alive)a.kills++;
 await sleep(300);checkEnd();return true;}
function damage(t,dm,src,expl){if(!t.alive)return;
 if(t.side==='e'){if(t.shield>0&&!expl){const ab=Math.min(t.shield,dm);t.shield-=ab;dm-=ab;float(t,t.shield>0?'SHIELD':'SHIELD DOWN','#7fd8ff');if(A[t.atlas].meta.animation_info.block)setAnim(t,'block');}
  if(ENEMY[t.type].armour&&!expl&&dm>0)dm=Math.max(1,dm-1);if(t.hostile){t.aware=true;groupAlert(t.grp,src?{x:src.tx,y:src.ty}:null);}}
 if(dm<=0)return;
 if(t.side==='p'&&t.down){kill(t);return;}
 t.hp-=dm;float(t,'-'+dm,'#ff5a4a');setAnim(t,'hit');
 if(t.hp<=0){t.hp=0;if(t.side==='p'){t.down=true;t.bleed=3;t.stab=false;t.ow=false;t.mv&&0;msg(t.name+' DOWN — BLEEDING OUT','#ff5a4a');if(t.cls==='leader')msg('LEADER DOWN — SQUAD AIM -10','#ff5a4a');if(G.sel===t)selectNext();}
  else{t.alive=false;t.down=true;msg(t.name+' KILLED','#8be04a');if(t.boss)msg('THE SOVEREIGN HAS FALLEN','#e8c040');}}}
function kill(u){u.alive=false;u.dead=true;u.down=true;msg(u.name+' KIA','#ff3030');}
function checkEnd(){if(G.screen!=='play')return true;const sov=G.units.find(u=>u.boss);if(sov&&!sov.alive){setTimeout(()=>endMission(true),900*SPD);G.screen='ending';return true;}
 if(!liveP().length){setTimeout(()=>endMission(false),900*SPD);G.screen='ending';return true;}return false;}
async function explode(x,y,r,dm,src){G.fx.push({k:'boom',x,y,t:0,T:.6});noise(x,y,20,src);await sleep(150);
 for(const u of G.units){if(!u.alive)continue;const d=Math.hypot(u.x-x,u.y-y);if(d<=r)damage(u,d<.8?dm:Math.max(1,dm-1),src,true);}
 for(let i=Math.floor(x-r);i<=Math.ceil(x+r)+1;i++)for(let j=Math.floor(y-r);j<=Math.ceil(y+r)+1;j++){if(!inb(i,j))continue;for(const arr of [M.wNW,M.wNE]){const w=arr[ix(i,j)];if(!w)continue;const ex=arr===M.wNW?i-.5:i,ey=arr===M.wNW?j:j-.5;if(Math.hypot(ex-x,ey-y)>r*.8)continue;
  if(w.door)w.st='door_blown';else w.st={intact:'cracked',cracked:'breached',breached:'rubble',rubble:'rubble'}[w.st];}}
 M.clay.delete(ix(Math.round(x),Math.round(y)));computeVis();await sleep(250);checkEnd();}
async function claymoreCheck(e){if(!e.hostile)return;for(const [k,c] of [...M.clay]){if(Math.hypot(c.x-e.tx,c.y-e.ty)<=1.5){M.clay.delete(k);msg('CLAYMORE!','#f0a030');await explode(c.x,c.y,1.5,3,c.owner);}}}
async function overwatchCheck(e){if(!e.hostile)return;for(const p of liveP()){if(!e.alive)return;if(!p.ow||p.ap<snapCost(p)||!sees(p,e))continue;
 if(p.owLane){const L=p.owLane,ax=L.x-p.tx,ay=L.y-p.ty,len=Math.hypot(ax,ay)||1;const px=e.x-p.tx,py=e.y-p.ty;const along=(px*ax+py*ay)/len;const off=Math.abs(px*ay-py*ax)/len;if(along<0||off>1.6)continue;}
 msg(p.name+(p.owLane?' — LANE SHOT':' — OVERWATCH'),'#e8c040');await attack(p,e,false,{bonus:p.owLane?20:0});}}
function selectNext(){const l=liveP();G.sel=l.find(u=>u.ap>0)||l[0]||null;G.target=null;G.preview=null;}

// ---------- abilities ----------
const val=(v,u)=>typeof v==='function'?v(u):v;
async function throwAt(u,t){u.face=Math.atan2(t.y-u.y,t.x-u.x);setAnim(u,'throw');await sleep(200);G.fx.push({k:'nade',x0:u.x,y0:u.y,x1:t.x,y1:t.y,t:0,T:.45});await sleep(450);}
const AB={
 swap:{n:'SWAP WEAPON',ap:u=>CL[u.cls].swap,tgt:'self',run:async u=>{u.w=1-u.w;msg('SWAPPED TO '+WEP[u.weps[u.w].k].n);}},
 breach:{n:'BREACH & CLEAR',ap:5,tgt:'door',run:async(u,t)=>{t.w.st='door_open';setAnim(u,'fire');noise(u.x,u.y,8,u);msg('BREACH!','#3fc8e0');computeVis();await sleep(250);
  const e=visibleHostiles().filter(e=>canShoot(u,e)).sort((a,b)=>dist(a,u)-dist(b,u))[0];if(e)await attack(u,e,false,{free:1,bonus:10});}},
 frag:{n:'FRAG GRENADE',ap:5,tgt:'tile',rng:7,item:'frag',run:async(u,t)=>{await throwAt(u,t);await explode(t.x,t.y,1.6,3,u);}},
 flash:{n:'FLASHBANG',ap:4,tgt:'tile',rng:7,item:'flash',run:async(u,t)=>{await throwAt(u,t);G.fx.push({k:'flash',x:t.x,y:t.y,t:0,T:.5});noise(t.x,t.y,14,u);for(const e of hostiles())if(Math.hypot(e.x-t.x,e.y-t.y)<=2.3){e.stun=1;float(e,'STUNNED','#fff');}}},
 ub:{n:u=>u.ub==='sg'?'UB SHOTGUN':'UB GRENADE',ap:u=>u.ub==='sg'?4:6,tgt:u=>u.ub==='sg'?'enemy':'tile',rng:u=>u.ub==='sg'?3:11,can:u=>u.ubAmmo>0,uses:u=>u.ubAmmo,
  run:async(u,t)=>{u.ubAmmo--;if(u.ub==='sg')await attack(u,t,false,{free:1,wep:{n:'SHOTGUN',acc:80,rng:3,dmg:[3,3],noise:12}});else{setAnim(u,'fire');G.fx.push({k:'nade',x0:u.x,y0:u.y,x1:t.x,y1:t.y,t:0,T:.35});await sleep(350);await explode(t.x,t.y,1.4,3,u);}}},
 suppress:{n:'SUPPRESSING FIRE',ap:6,tgt:'tile',rng:10,can:u=>u.w===0&&u.weps[0].ammo>=3,run:async(u,t)=>{u.weps[0].ammo-=3;u.face=Math.atan2(t.y-u.y,t.x-u.x);noise(u.x,u.y,16,u);
  for(let k=0;k<3;k++){setAnim(u,'fire');G.fx.push({k:'tracer',x0:u.x,y0:u.y,x1:t.x+rnd()*2-1,y1:t.y+rnd()*2-1,t:0,T:.15,c:'#fff3b0'});await sleep(140);}
  for(const e of hostiles())if(Math.hypot(e.x-t.x,e.y-t.y)<=1.9){e.supp=1;e.aware=true;float(e,'SUPPRESSED','#f0a030');if(rnd()<.3)damage(e,1,u,false);}}},
 bipod:{n:'DEPLOY BIPOD',ap:3,tgt:'self',can:u=>!u.bipod,run:async u=>{u.bipod=true;float(u,'BIPOD +20','#f0a030');}},
 sandbag:{n:'SANDBAG COVER',ap:5,tgt:'adj',item:'sandbag',run:async(u,t)=>{M.prop[ix(t.x,t.y)]={k:'sandbags_a'};}},
 ammo:{n:'AMMO PACK',ap:3,tgt:'ally',rng:1.6,item:'ammo',run:async(u,t)=>{t.weps.forEach(w=>w.mags+=2);float(t,'+AMMO','#8be04a');}},
 owlane:{n:'OVERWATCH LANE',ap:u=>snapCost(u),tgt:'tile',rng:16,run:async(u,t)=>{u.ow=true;u.owLane={x:t.x,y:t.y};u.face=Math.atan2(t.y-u.y,t.x-u.x);u.ap+=snapCost(u);float(u,'LANE SET','#e8c040');}},
 mark:{n:'MARK TARGET',ap:2,tgt:'enemy',rng:14,run:async(u,t)=>{t.marked=3;float(t,'MARKED','#e0703a');}},
 breachwall:{n:'BREACH WALL (C4)',ap:6,tgt:'wall',item:'charge',run:async(u,t)=>{msg('CHARGE SET','#e0703a');await sleep(300);t.w.st=t.w.door?'door_blown':'breached';await explode((u.tx+t.x)/2,(u.ty+t.y)/2,1.1,2,u);}},
 claymore:{n:'CLAYMORE',ap:4,tgt:'adj',item:'claymore',run:async(u,t)=>{M.clay.set(ix(t.x,t.y),{x:t.x,y:t.y,owner:u});}},
 rocket:{n:'ROCKET',ap:7,tgt:'any',rng:12,item:'rocket',run:async(u,t)=>{setAnim(u,'fire');G.fx.push({k:'tracer',x0:u.x,y0:u.y,x1:t.x,y1:t.y,t:0,T:.3,c:'#ffb040',w:3});await sleep(300);await explode(t.x,t.y,1.3,4,u);}},
 stabilize:{n:'STABILIZE',ap:5,tgt:'downed',rng:1.6,item:'medkit',run:async(u,t)=>{t.stab=true;float(t,'STABILIZED','#8be04a');msg(t.name+' STABILIZED (WOUNDED)','#8be04a');}},
 hack:{n:'HACK',ap:6,tgt:'enemy',rng:4,run:async(u,t)=>{const d=ENEMY[t.type];if(t.shield>0){t.shield=0;float(t,'SHIELD HACKED','#b070f0');return;}
  if(d.collar){if(t.type==='sovereign_guard'&&rnd()<.4){float(t,'HACK FAILED','#ff5a4a');return;}t.hostile=false;t.aware=false;t.freed=rnd()<.5?2:1;float(t,t.freed===2?'FREED — TURNS ON NORDICS':'FREED — STOPS FIGHTING','#8be04a');msg('COLLAR HACKED','#8be04a');return;}
  float(t,'NOTHING TO HACK','#aaa');u.ap+=6;}},
 drone:{n:'SCOUT DRONE',ap:4,tgt:'tile',rng:12,item:'drone',run:async(u,t)=>{G.drones.push({x:t.x,y:t.y,ttl:2});computeVis();float(u,'DRONE UP','#b070f0');}},
 rally:{n:'RALLY ORDER',ap:2,tgt:'self',can:u=>!u.rallied,run:async u=>{u.rallied=true;for(const p of liveP())if(p!==u&&dist(p,u)<=5){if(G.mode==='tb')p.ap+=3;float(p,'+3 AP','#e8c040');}}},
 smoke:{n:'SMOKE GRENADE',ap:4,tgt:'tile',rng:7,item:'smoke',run:async(u,t)=>{await throwAt(u,t);for(let i=-2;i<=2;i++)for(let j=-2;j<=2;j++)if(inb(t.x+i,t.y+j)&&Math.hypot(i,j)<=1.6)M.smoke[ix(t.x+i,t.y+j)]=3;computeVis();}},
 strike:{n:'AIRSTRIKE',ap:6,tgt:'tile',rng:40,item:'strike',cd:3,run:async(u,t)=>{G.strikes.push({x:t.x,y:t.y,t:G.mode==='tb'?1:5});noise(u.x,u.y,14,u);msg('STRIKE INBOUND — LANDS AFTER ENEMY TURN','#ff5a4a');}},
 supply:{n:'SUPPLY DROP',ap:5,tgt:'self',item:'supply',run:async u=>{noise(u.x,u.y,14,u);for(const p of liveP()){p.weps.forEach(w=>w.mags+=2);if(p.items.frag!==undefined)p.items.frag++;float(p,'+SUPPLY','#8be04a');}}},
 flyover:{n:'RECON FLYOVER',ap:4,tgt:'self',item:'flyover',run:async u=>{noise(u.x,u.y,14,u);G.flyover=2;for(const e of hostiles())e.marked=Math.max(e.marked,2);msg('FLYOVER — ALL ENEMIES MARKED','#60a0f0');}},
};
function abState(u,id){const a=AB[id];const ap=val(a.ap,u);let ok=true,why='';if(a.item&&!(u.items[a.item]>0)){ok=false;why='NONE LEFT';}if(a.can&&!a.can(u)){ok=false;why=why||'N/A';}
 if(u.cd[id]>0){ok=false;why='CD '+u.cd[id];}if(G.mode==='tb'&&u.ap<ap){ok=false;why=why||'NO AP';}if(G.mode==='tb'&&G.side!=='p')ok=false;
 const uses=a.uses?a.uses(u):(a.item?u.items[a.item]:null);return{ok,why,ap,uses,n:val(a.n,u),tgt:val(a.tgt,u),rng:val(a.rng,u)};}
async function useAbility(u,id,t){const a=AB[id];const s=abState(u,id);if(!s.ok)return false;G.busy=true;try{if(G.mode==='tb')u.ap-=s.ap;if(a.item)u.items[a.item]--;if(a.cd)u.cd[id]=a.cd;if(!['owlane'].includes(id))u.ow=false;await a.run(u,t);}finally{G.busy=false;}
 computeVis();if(G.mode==='rt')checkContact();return true;}
// validate target for pending ability given tapped tile (x,y)
function abTarget(u,id,x,y){const s=abState(u,id);const unitAt=G.units.find(o=>o.alive&&Math.round(o.tx)===x&&Math.round(o.ty)===y);const d=Math.hypot(x-u.tx,y-u.ty);
 if(s.rng&&d>s.rng+.01)return{err:'OUT OF RANGE'};
 switch(s.tgt){case'tile':return{x,y};case'any':return unitAt&&unitAt.side==='e'?{x:unitAt.x,y:unitAt.y}:{x,y};
  case'enemy':if(unitAt&&unitAt.side==='e'&&enemyVisible(unitAt))return unitAt;return{err:'TAP A VISIBLE ENEMY'};
  case'ally':if(unitAt&&unitAt.side==='p'&&unitAt!==u&&d<=1.6)return unitAt;return{err:'TAP AN ADJACENT ALLY'};
  case'downed':{const t=G.units.find(o=>o.side==='p'&&o.alive&&o.down&&!o.stab&&Math.round(o.tx)===x&&Math.round(o.ty)===y);if(t&&d<=1.6)return t;return{err:'TAP AN ADJACENT DOWNED ALLY'};}
  case'adj':if(d<=1.6&&passable(x,y)&&!unitAt&&(x===u.tx||y===u.ty||canStep(u.tx,u.ty,x,y)))return{x,y};return{err:'TAP AN ADJACENT EMPTY TILE'};
  case'door':case'wall':{if(Math.abs(x-u.tx)+Math.abs(y-u.ty)!==1)return{err:'TAP THE TILE ACROSS AN ADJACENT '+(s.tgt==='door'?'DOOR':'WALL')};const w=edge(u.tx,u.ty,x,y);
   if(!w)return{err:'NO WALL THERE'};if(s.tgt==='door'&&!(w.door&&w.st==='door_closed'))return{err:'NO CLOSED DOOR THERE'};if(s.tgt==='wall'&&!BLOCK_LOS[w.st])return{err:'WALL ALREADY OPEN'};return{w,x,y};}}
 return{err:'?'};}

// ---------- turn flow ----------
function checkContact(){if(G.mode!=='rt'||G.screen!=='play')return;const P=liveP(),E=hostiles();const pS=new Set(),eS=new Set();
 for(const e of E)for(const p of P){if(sees(p,e))pS.add(e);if(sees(e,p))eS.add(e);}
 if(!pS.size&&!eS.size)return;const enemyFirst=eS.size>0&&pS.size===0;
 for(const e of [...pS,...eS]){const p=P.slice().sort((a,b)=>dist(a,e)-dist(b,e))[0];groupAlert(e.grp,{x:p.tx,y:p.ty});}startTB(!enemyFirst);}
async function startTB(playerFirst){G.mode='tb';G.busy=true;for(const u of G.units)u.tok=(u.tok||0)+1;await waitIdle();G.round=0;G.calm=0;G.preview=null;G.target=null;G.pending=null;G.menu=null;G.map=false;computeVis();
 G.banner={s:playerFirst?'CONTACT — YOU HAVE THE INITIATIVE':'SPOTTED — ENEMY HAS INITIATIVE',c:playerFirst?'#8be04a':'#ff5a4a',t:0};msg(G.banner.s,G.banner.c);
 if(playerFirst)beginPlayerTurn();else{for(const p of players())p.ap=0;await enemyTurn();}}
function tickRound(){for(let k=0;k<N*N;k++)if(M.smoke[k]>0)M.smoke[k]--;for(const u of G.units){if(u.marked>0)u.marked--;}G.drones=G.drones.filter(d=>--d.ttl>0);if(G.flyover>0)G.flyover--;
 for(const p of players()){for(const k in p.cd)if(p.cd[k]>0)p.cd[k]--;if(p.alive&&p.down&&!p.stab){p.bleed--;if(p.bleed<=0)kill(p);else float(p,'BLEEDING '+p.bleed,'#ff5a4a');}}computeVis();}
function beginPlayerTurn(){if(G.screen!=='play')return;G.side='p';G.round++;tickRound();if(checkEnd())return;
 for(const u of players()){if(!u.alive||u.down)continue;u.ap=u.maxap-(u.supp?4:0);if(u.stun){u.ap=Math.max(0,u.ap-8);u.stun=0;}u.supp=0;u.ow=false;u.owLane=null;u.moved=false;u.rallied=false;}
 if(!G.sel||!G.sel.alive||G.sel.down)selectNext();G.busy=false;G.banner={s:'TURN '+G.round+' — YOUR MOVE',c:'#e8c040',t:0};}
async function endPlayerTurn(){if(G.busy||G.mode!=='tb'||G.side!=='p')return;G.busy=true;G.target=null;G.preview=null;G.pending=null;G.menu=null;
 for(const e of G.units.filter(e=>e.side==='e'&&e.alive&&e.freed===2)){e.ap=e.maxap;const t=hostiles().filter(h=>ENEMY[h.type].nordic||h.boss).sort((a,b)=>dist(a,e)-dist(b,e))[0];if(t&&dist(t,e)<12){if(dist(t,e)>1.6)await moveAlong(e,pathAdj(e,t));if(dist(t,e)<1.6&&e.ap>=4)await attack(e,t,false);}}
 await enemyTurn();}
async function enemyTurn(){if(G.screen!=='play')return;G.side='e';G.banner={s:'ENEMY TURN',c:'#ff5a4a',t:0};
 for(const e of hostiles()){e.ap=e.maxap-(e.supp?4:0);if(e.stun){e.ap=0;e.stun=0;}e.supp=0;if(!e.aware&&liveP().some(p=>sees(e,p)))groupAlert(e.grp,null);}
 const act=hostiles().filter(e=>e.aware).sort((a,b)=>Math.min(...liveP().map(p=>dist(p,a)))-Math.min(...liveP().map(p=>dist(p,b))));
 for(const e of act){if(G.screen!=='play')return;if(!e.alive)continue;G.focus=e;await enemyAct(e);}
 G.focus=null;for(const s of G.strikes.slice())if(--s.t<=0){G.strikes.splice(G.strikes.indexOf(s),1);msg('STRIKE IMPACT','#ff5a4a');await explode(s.x,s.y,2.5,4,null);}
 if(G.screen!=='play')return;
 const contact=hostiles().some(e=>liveP().some(p=>sees(e,p)||sees(p,e)))||G.strikes.length;G.calm=contact?0:G.calm+1;
 if(G.calm>=2){G.mode='rt';G.side='p';for(const e of hostiles()){if(e.aware){e.sus=e.lk?{x:e.lk.x,y:e.lk.y,t:6}:null;}e.aware=false;}for(const p of players()){p.ow=false;p.owLane=null;}G.busy=false;G.banner={s:'NO CONTACT — REAL-TIME',c:'#8be04a',t:0};msg('NO CONTACT — BACK TO REAL-TIME','#8be04a');computeVis();return;}
 beginPlayerTurn();}
function pickTarget(e,list){if(!list.length)return null;const r=list.find(p=>p.cls==='radio');if(r)return r;return list.slice().sort((a,b)=>dist(a,e)-dist(b,e))[0];}
async function enemyAct(e){let loops=0;const w=WEP[e.wk];
 while(e.alive&&e.hostile&&e.ap>0&&loops++<10&&G.screen==='play'){const P=liveP();if(!P.length)return;
  if(e.boss){const near=P.filter(p=>dist(p,e)<=2.5);if(near.length&&e.ap>=6){e.ap-=6;setAnim(e,'ring_storm');G.fx.push({k:'ring',x:e.x,y:e.y,t:0,T:.7});await sleep(400);for(const p of near)damage(p,2,e,true);await sleep(300);if(checkEnd())return;continue;}
   const t=pickTarget(e,P.filter(p=>sees(e,p)&&canShoot(e,p)));if(t&&e.ap>=5){await attack(e,t,false);continue;}return;}
  const vis=P.filter(p=>sees(e,p));
  if(w.melee){const t=pickTarget(e,P.filter(p=>dist(p,e)<16));if(!t)return;if(dist(e,t)<1.6){if(e.ap>=4){await attack(e,t,false);continue;}return;}
   const p=pathAdj(e,t);if(!p||!p.length)return;const b=e.ap;await moveAlong(e,p);if(e.ap===b)return;continue;}
  if(ENEMY[e.type].medic){const h=hostiles().find(o=>o!==e&&o.hp<o.maxhp&&dist(o,e)<1.6);if(h&&e.ap>=5){e.ap-=5;setAnim(e,'heal');h.hp=Math.min(h.maxhp,h.hp+2);float(h,'+2','#8be04a');await sleep(400);continue;}}
  const t=pickTarget(e,vis.filter(p=>canShoot(e,p)));if(t){if(dist(e,t)<=w.rng+3&&e.ap>=4){await attack(e,t,false);continue;}}
  if(t&&e.ap<4)return;const goal=t||(e.lk&&dist(e,e.lk)>1.5?e.lk:P.slice().sort((a,b)=>dist(a,e)-dist(b,e))[0]);const p=pathAdj(e,goal,4);if(!p||!p.length)return;const b=e.ap;await moveAlong(e,p);if(e.ap===b)return;}}
async function endMission(win){if(G.screen==='end')return;G.screen='end';G.busy=false;const res={win,dead:[],wounded:[],ok:[]};
 for(const c of R.pendingRecruits){R.roster.push({id:R.nextId++,name:NAMES[(R.nextId*7)%NAMES.length],cls:c,race:'human',status:'ok',sitOut:0,kills:0,missions:0,recruit:1});}R.pendingRecruits=[];
 for(const rs of R.roster)if(rs.status==='wounded'&&!players().some(p=>p.rid===rs.id)){rs.sitOut--;if(rs.sitOut<=0)rs.status='ok';}
 for(const u of players()){const rs=R.roster.find(r=>r.id===u.rid);if(!rs)continue;rs.missions++;rs.kills+=u.kills;
  if(u.dead||(!win&&u.down&&!u.stab)){rs.status='dead';res.dead.push(rs.name);R.fallen.push({name:rs.name,cls:rs.cls,race:rs.race,mission:R.mission});R.pendingRecruits.push(rs.cls);}
  else if(u.down){rs.status='wounded';rs.sitOut=1;res.wounded.push(rs.name);}else res.ok.push(rs.name);}
 R.roster=R.roster.filter(r=>r.status!=='dead');if(win)R.wins++;else R.losses++;R.mission++;saveRoster();G.result=res;}

// ---------- real-time ----------
function rtUpdate(dt){G.ctT=(G.ctT||0)-dt;G.rtT=(G.rtT||0)+dt;G.flT=(G.flT||0)-dt;
 for(const e of hostiles()){if(e.moving)continue;if(e.face0===undefined)e.face0=e.face;e.rt=(e.rt||0)-dt;
  if(!e.sus&&!e.patrol&&Math.hypot(e.tx-e.post.x,e.ty-e.post.y)<.5){e.face=e.face0+Math.sin(G.t*.45+e.post.x)*.8;continue;}
  if(e.rt>0)continue;
  if(e.sus){if(Math.hypot(e.tx-e.sus.x,e.ty-e.sus.y)<1.6){e.sus.t--;e.rt=1;e.face+=1.3;if(e.sus.t<=0)e.sus=null;continue;}const p=findPath(e,e.sus.x,e.sus.y)||pathAdj(e,e.sus);if(p&&p.length)moveAlong(e,p.slice(0,8));else e.sus=null;e.rt=.3;continue;}
  if(e.patrol){e.pi=e.pi||0;const g=e.patrol[e.pi];if(Math.hypot(e.tx-g.x,e.ty-g.y)<1.1){e.pi=1-e.pi;e.rt=2.5;continue;}const p=findPath(e,g.x,g.y)||pathAdj(e,g);if(p&&p.length)moveAlong(e,p.slice(0,6));else{e.pi=1-e.pi;e.rt=1;}continue;}
  const p=findPath(e,e.post.x,e.post.y);if(p)moveAlong(e,p);e.rt=1;}
 const sel=G.sel;
 if(G.flT<=0&&sel){G.flT=.4;for(const p of liveP()){if(p===sel||p.moving)continue;
   if(p.wpGo&&p.wps.length){const g=p.wps[0];if(Math.hypot(p.tx-g.x,p.ty-g.y)<.5){p.wps.shift();if(!p.wps.length)p.wpGo=false;continue;}const path=findPath(p,g.x,g.y)||pathAdj(p,g);if(!path||!path.length){p.wps.shift();continue;}moveAlong(p,path);continue;}
   if(!p.follow)continue;p.stance=sel.stance;const lead=sel.dest&&sel.moving?sel.dest:{x:sel.tx,y:sel.ty};if(Math.hypot(p.tx-lead.x,p.ty-lead.y)<=2.6)continue;
   let best=null;for(let r=1;r<=3&&!best;r++)for(let dx=-r;dx<=r;dx++)for(let dy=-r;dy<=r;dy++){const x=lead.x+dx,y=lead.y+dy;if(!passable(x,y)||occupied(x,y,p)||(sel.dest&&x===sel.dest.x&&y===sel.dest.y))continue;if(liveP().some(o=>o!==p&&o.dest&&o.moving&&o.dest.x===x&&o.dest.y===y))continue;const d=Math.hypot(x-p.tx,y-p.ty);if(!best||d<best.d)best={x,y,d};}
   if(best){const path=findPath(p,best.x,best.y);if(path){p.dest={x:best.x,y:best.y};moveAlong(p,path);}}}
  if(sel.wpGo&&sel.wps.length&&!sel.moving){const g=sel.wps[0];if(Math.hypot(sel.tx-g.x,sel.ty-g.y)<.5){sel.wps.shift();if(!sel.wps.length)sel.wpGo=false;}else{const path=findPath(sel,g.x,g.y)||pathAdj(sel,g);if(!path||!path.length)sel.wps.shift();else{sel.dest=g;moveAlong(sel,path);}}}}
 if(G.ctT<=0){G.ctT=.15;checkContact();}
 for(const s of G.strikes.slice()){s.t-=dt;if(s.t<=0){G.strikes.splice(G.strikes.indexOf(s),1);explode(s.x,s.y,2.5,4,null).then(()=>checkContact());}}
 if(G.rtT>=10){G.rtT=0;tickRound();}}


// reachable tiles for turn-based (same step rules + AP costs as moveAlong)
function reachMap(u){const sx=Math.round(u.tx),sy=Math.round(u.ty);const cost=new Float32Array(N*N).fill(1e9),from=new Int32Array(N*N).fill(-1);const occ=new Set();for(const o of G.units)if(o!==u&&o.alive)occ.add(ix(Math.round(o.tx),Math.round(o.ty)));
 const base=CL[u.cls].move[STI[u.stance]];cost[ix(sx,sy)]=0;const open=[ix(sx,sy)];
 while(open.length){let bi=0;for(let i=1;i<open.length;i++)if(cost[open[i]]<cost[open[bi]])bi=i;const k=open.splice(bi,1)[0];const x=k%N,y=(k/N)|0;
  for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;if(!canStep(x,y,nx,ny))continue;const nk=ix(nx,ny);if(occ.has(nk))continue;const e=edge(x,y,nx,ny);
   const c=cost[k]+base+(e&&e.st==='door_closed'?2:0)+(dx&&dy?.001:0);if(c>u.ap+.01||c>=cost[nk])continue;cost[nk]=c;from[nk]=k;open.push(nk);}}
 return{cost,from,sx,sy};}
function getReach(u){const key=G.units.indexOf(u)+'|'+u.tx+','+u.ty+'|'+u.ap+'|'+u.stance+'|'+G.units.map(o=>o.alive?o.tx+','+o.ty:'x').join(';');const now=performance.now();
 if(!G.reach||G.reach.key!==key||now-G.reach.t>400){G.reach=Object.assign(reachMap(u),{key,t:now});}return G.reach;}
function reachPath(r,x,y){let k=ix(x,y);if(r.cost[k]>=1e9||(x===r.sx&&y===r.sy))return null;const p=[];while(k!==ix(r.sx,r.sy)){p.unshift({x:k%N,y:(k/N)|0});k=r.from[k];}return p;}

// ---------- update ----------
function animInfo(u,n){return A[u.atlas].meta.animation_info[n];}
function update(dt){if(G.screen!=='play'&&G.screen!=='ending')return;G.t+=dt;
 for(const u of G.units){if(u.mv){const m=u.mv;m.t+=dt*speedOf(u)/SPD;const f=Math.min(1,m.t/m.d);u.x=m.x0+(m.x1-m.x0)*f;u.y=m.y0+(m.y1-m.y0)*f;if(f>=1){u.mv=null;m.res();}}
  if(u.anim){u.anim.t+=dt;const ai=animInfo(u,u.anim.n);if(!ai||u.anim.t*ai.fps>=ai.frames+.5)u.anim=null;}if(u.down)u.downT=(u.downT||0)+dt;else u.downT=0;}
 G.fx=G.fx.filter(f=>(f.t+=dt)<f.T);G.floats=G.floats.filter(f=>(f.t+=dt)<1.3);for(const m of G.msgs)m.t+=dt;G.msgs=G.msgs.filter(m=>m.t<7);if(G.banner&&(G.banner.t+=dt)>2.2)G.banner=null;
 if(G.mode==='rt'&&G.screen==='play'&&!G.busy)rtUpdate(dt);
 G.panT-=dt;const f=G.focus&&enemyVisible(G.focus)?G.focus:G.sel;if(f&&G.panT<=0){const tx=wpx(f.x,f.y),ty=wpy(f.x,f.y)-30;const k=Math.min(1,dt*4);G.camX+=(tx-G.camX)*k;G.camY+=(ty-G.camY)*k;}}

// ---------- draw ----------
let BTN=[];
const vcx=()=>W/2,vcy=()=>TOP+(H-TOP-BOT)*.42;
function w2s(x,y){return{x:(wpx(x,y)-G.camX)*G.Z+vcx(),y:(wpy(x,y)-G.camY)*G.Z+vcy()};}
function s2tile(px,py){const wx=(px-vcx())/G.Z+G.camX,wy=(py-vcy())/G.Z+G.camY;return{x:Math.round((wx/32+wy/16)/2),y:Math.round((wy/16-wx/32)/2),wx,wy};}
function diamond(cx,cy,s){ctx.beginPath();ctx.moveTo(cx,cy-16*s);ctx.lineTo(cx+32*s,cy);ctx.lineTo(cx,cy+16*s);ctx.lineTo(cx-32*s,cy);ctx.closePath();}
function unitFrame(u){const a=A[u.atlas];const ai=a.meta.animation_info;const st=u.stance;let n,t=G.t,loop=true;
 if(u.down){n='down';t=u.downT;loop=false;}else if(u.anim){n=u.anim.n;t=u.anim.t;loop=false;}
 else if(u.mv)n=u.side==='p'?(st==='prone'?'crawl':st==='crouch'?'crouch_move':'walk'):'walk';else n=u.side==='p'?'idle_'+st:(ENEMY[u.type].idle||'idle_stand');
 if(!ai[n])n=ai.idle_stand?'idle_stand':'idle';const dir=dirFromTile(Math.cos(u.face),Math.sin(u.face));const list=a.meta.animations[n+'_'+dir];const inf=ai[n];
 let fi=Math.floor(t*inf.fps);fi=loop?fi%inf.frames:Math.min(inf.frames-1,fi);const flip=!!(a.meta.directions.flipped&&a.meta.directions.flipped[dir]);return{a,name:list[fi],flip};}
function drawUnit(u){const p={x:wpx(u.x,u.y),y:wpy(u.x,u.y)};const hud=A.hud;
 if(u.side==='p'||u.freed){const sel=u===G.sel;const rn=sel?'team_ring_selected':'team_ring';drawFrame(hud,rn,p.x,p.y,false,tintedImage(hud.img,u.freed?'#8be04a':u.col));}
 if(u.side==='p'&&u.cls==='leader'&&u.alive&&!u.down){ctx.globalAlpha=.6;drawFrame(A.fx,'leader_aura/0'+(Math.floor(G.t*6)%4),p.x,p.y);ctx.globalAlpha=1;}
 const f=unitFrame(u);const img=u.side==='p'?teamAtlasImg(f.a,u.col):null;if(u.side==='e'&&!u.alive)ctx.globalAlpha=.85;drawFrame(f.a,f.name,p.x,p.y,f.flip,img);ctx.globalAlpha=1;
 if(u.alive&&u.side==='e'&&u.hostile){const anc=(f.a.meta.anchors[f.name]||{}).head||[0,-60];const hx=p.x+(f.flip?-anc[0]:anc[0]),hy=p.y+anc[1]-14;
  for(let i=0;i<u.maxhp;i++){ctx.fillStyle=i<u.hp?'#ff5a4a':'#3a2a2a';ctx.fillRect(hx-u.maxhp*2+i*4,hy,3,3);}for(let i=0;i<u.shield;i++){ctx.fillStyle='#7fd8ff';ctx.fillRect(hx-u.shield*2+i*4,hy-5,3,3);}
  if(u.marked>0){ctx.fillStyle='#e0703a';ctx.fillRect(hx-2,hy-12,5,5);}if(!u.aware&&!u.sus){}else if(G.mode==='rt'&&u.sus){text('?',hx,hy-24,'#f0a030',14,'c');}}
 if(u.side==='p'&&u.down&&u.alive){text(u.stab?'STAB':'BLEED '+u.bleed,p.x,p.y-30,u.stab?'#8be04a':'#ff5a4a',11,'c');}
 if(u.side==='p'&&u.ow&&!u.down)text('OW',p.x,p.y-82,'#e8c040',11,'c');}
function drawWorld(){const Z=G.Z;ctx.setTransform(DPR*Z,0,0,DPR*Z,DPR*(vcx()-G.camX*Z),DPR*(vcy()-G.camY*Z));ctx.imageSmoothingEnabled=false;
 ctx.drawImage(floorCanvas,-N*32,-16);const x0=G.camX-vcx()/Z-80,x1=G.camX+(W-vcx())/Z+80,y0=G.camY-vcy()/Z-120,y1=G.camY+(H-vcy())/Z+60;
 const on=(x,y)=>{const a=wpx(x,y),b=wpy(x,y);return a>x0&&a<x1&&b>y0&&b<y1;};
 for(let x=0;x<N;x++)for(let y=0;y<N;y++){if(!on(x,y))continue;const k=ix(x,y);if(!M.vis[k]){ctx.fillStyle=M.seen[k]?'rgba(10,12,16,.42)':'rgba(10,12,16,.72)';diamond(wpx(x,y),wpy(x,y),1);ctx.fill();}}
 for(const [k,c] of M.clay){ctx.fillStyle='#e0703a';ctx.fillRect(wpx(c.x,c.y)-3,wpy(c.x,c.y)-2,6,4);}
 if(G.sel&&G.sel.alive&&!G.sel.down&&G.mode==='tb'&&G.side==='p'&&!G.busy&&!G.pending){const s=G.sel,r=getReach(s),keep=s.ap-snapCost(s);ctx.lineWidth=1;
  for(let x=0;x<N;x++)for(let y=0;y<N;y++){if(!on(x,y))continue;const c=r.cost[ix(x,y)];if(c>=1e9||(x===r.sx&&y===r.sy))continue;const ok=Math.round(c)<=keep;
   diamond(wpx(x,y),wpy(x,y),.92);ctx.fillStyle=ok?'rgba(63,200,224,.30)':'rgba(232,192,64,.20)';ctx.fill();ctx.strokeStyle=ok?'rgba(120,230,255,.55)':'rgba(232,192,64,.35)';ctx.stroke();}}
 if(G.mode==='rt'&&G.sel&&G.sel.moving&&G.sel.dest){const d=G.sel.dest;diamond(wpx(d.x,d.y),wpy(d.x,d.y),.92);ctx.fillStyle='rgba(230,226,212,.22)';ctx.fill();ctx.strokeStyle='rgba(230,226,212,.6)';ctx.lineWidth=1;ctx.stroke();}
 // planned path / preview
 const hud=A.hud;if(G.preview){for(const n of G.preview.path)drawFrame(hud,'move/dot',wpx(n.x,n.y),wpy(n.x,n.y));const l=G.preview.path[G.preview.path.length-1];drawFrame(hud,'move/target_chevron',wpx(l.x,l.y),wpy(l.x,l.y));
  text(G.preview.cost+' AP',wpx(l.x,l.y),wpy(l.x,l.y)-30,G.preview.cost>G.sel.ap?'#ff5a4a':'#e8c040',14,'c');}
 if(G.mode==='rt')for(const p of liveP())if(p.wps.length){p.wps.forEach((w,i)=>drawFrame(hud,'waypoint/'+(i+1),wpx(w.x,w.y),wpy(w.x,w.y),false,tintedImage(hud.img,p.col)));}
 for(const s of G.strikes){ctx.strokeStyle='rgba(255,90,74,'+(.5+.5*Math.sin(G.t*10))+')';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(wpx(s.x,s.y),wpy(s.x,s.y),2.5*45,2.5*22,0,0,7);ctx.stroke();}
 // threat ring under selected
 if(G.sel&&G.sel.alive&&!G.sel.down){const s=G.sel,px=wpx(s.x,s.y),py=wpy(s.x,s.y);drawFrame(hud,'threat_ring',px,py,false,null,1.6);const grey=liveP().some(p=>p.race==='grey');const lit=new Set();
  for(const e of hostiles()){if(enemyVisible(e)||(grey&&liveP().some(p=>p.race==='grey'&&dist(p,e)<=8)))lit.add(dirFromTile(e.x-s.x,e.y-s.y));}
  ctx.globalAlpha=.6+.4*Math.sin(G.t*6);for(const d of lit)drawFrame(hud,'threat_arc/'+d,px,py,false,null,1.6);ctx.globalAlpha=1;}
 // sorted drawables
 const L=[];const P=liveP();
 for(let x=0;x<N;x++)for(let y=0;y<N;y++){if(!on(x,y))continue;const k=ix(x,y);const nw=M.wNW[k],ne=M.wNE[k],pr=M.prop[k];
  if(nw||ne){let fade=false;for(const p of P){const dd=(x+y)-(p.tx+p.ty);if(dd>=1&&dd<=3&&Math.abs((x-y)-(p.tx-p.ty))<=3&&p.tx<=x&&p.ty<=y)fade=true;}L.push({k:x+y-.5,f:()=>{ctx.globalAlpha=fade?.35:1;if(nw)drawFrame(A.walls,'wall/nw/'+nw.st,wpx(x,y),wpy(x,y));if(ne)drawFrame(A.walls,'wall/ne/'+ne.st,wpx(x,y),wpy(x,y));ctx.globalAlpha=1;}});}
  if(pr)L.push({k:x+y,f:()=>drawFrame(A.props,'prop/'+pr.k,wpx(x,y),wpy(x,y))});}
 for(const u of G.units){if(u.side==='e'&&!enemyVisible(u)&&!u.freed)continue;if(!on(u.x,u.y))continue;L.push({k:u.x+u.y+.1+(u.down?-.05:0),f:()=>drawUnit(u)});}
 L.sort((a,b)=>a.k-b.k);for(const d of L)d.f();
 for(let x=0;x<N;x++)for(let y=0;y<N;y++){if(M.smoke[ix(x,y)]>0&&on(x,y)){ctx.fillStyle='rgba(200,200,190,.45)';ctx.beginPath();ctx.ellipse(wpx(x,y)+Math.sin(G.t+x)*4,wpy(x,y)-14,30,20,0,0,7);ctx.fill();}}
 for(const d of G.drones){ctx.strokeStyle='rgba(176,112,240,.8)';ctx.setLineDash([4,4]);ctx.beginPath();ctx.ellipse(wpx(d.x,d.y),wpy(d.x,d.y),5*45,5*22,0,0,7);ctx.stroke();ctx.setLineDash([]);}
 // target box
 if(G.target&&G.target.alive&&G.sel){const t=G.target,f=unitFrame(t);const anc=(f.a.meta.anchors[f.name]||{}).body||[0,-30];const bx=wpx(t.x,t.y)+(f.flip?-anc[0]:anc[0]),by=wpy(t.y*0+t.y,t.x)*0+wpy(t.x,t.y)+anc[1];
  drawFrame(hud,'target_box/stand/aimed',bx,by);const hc=hitChance(G.sel,t,false),ha=hitChance(G.sel,t,true);drawFrame(hud,ha>=50?'reticle_tight':'reticle_loose',bx+26,by-26);text('HIT '+hc+'% / '+ha+'%',bx,by-50,'#ff5a4a',14,'c');}
 // fx
 for(const f of G.fx){const k=f.t/f.T;if(f.k==='tracer'){const a=f.boss?-60:-34;ctx.strokeStyle=f.c;ctx.lineWidth=f.w||1.5;ctx.globalAlpha=1-k;ctx.beginPath();ctx.moveTo(wpx(f.x0,f.y0),wpy(f.x0,f.y0)-34);ctx.lineTo(wpx(f.x1,f.y1),wpy(f.x1,f.y1)-30);ctx.stroke();ctx.globalAlpha=1;}
  else if(f.k==='boom'){drawFrame(A.fx,'explosion/0'+Math.min(4,Math.floor(k*5)),wpx(f.x,f.y),wpy(f.x,f.y),false,null,2);}
  else if(f.k==='nade'){const x=f.x0+(f.x1-f.x0)*k,y=f.y0+(f.y1-f.y0)*k;drawFrame(A.fx,'grenade',wpx(x,y),wpy(x,y)-40-Math.sin(k*Math.PI)*50);}
  else if(f.k==='flash'){ctx.fillStyle='rgba(255,255,240,'+(1-k)+')';ctx.beginPath();ctx.ellipse(wpx(f.x,f.y),wpy(f.x,f.y),100,50,0,0,7);ctx.fill();}
  else if(f.k==='ring'){ctx.strokeStyle='rgba(232,192,64,'+(1-k)+')';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(wpx(f.x,f.y),wpy(f.x,f.y),k*120,k*60,0,0,7);ctx.stroke();}}
 for(const f of G.floats)text(f.s,wpx(f.x,f.y),wpy(f.x,f.y)-80-f.t*24,f.c,11,'c');}

// ---------- HUD ----------
function btn(x,y,w,h,label,fn,o){o=o||{};panel(x,y,w,h,o.gold);if(o.on){ctx.fillStyle='rgba(232,192,64,.22)';ctx.fillRect(x+3,y+3,w-6,h-6);}if(o.dis)ctx.globalAlpha=.38;
 text(label,x+w/2,y+(h-18)/2,o.col||'#e6e2d4',14,'c');ctx.globalAlpha=1;if(!o.dis&&fn)BTN.push({x,y,w,h,fn,id:o.id||label});}
const STATUS=u=>u.dead?['KIA','#ff3030']:u.down?(u.stab?['STABILIZED','#8be04a']:['DOWN','#ff5a4a']):u.supp?['SUPPRESSED','#f0a030']:u.moving?['MOVING','#3fc8e0']:u.ow?['OVERWATCH','#e8c040']:['READY','#8be04a'];
function drawHUD(){const top=TOP/US+4,bot=DH-BOT/US;const tb=G.mode==='tb';
 // top bar
 const bannerS=tb?(G.side==='p'?'TURN '+G.round+' · YOUR MOVE':'ENEMY TURN'):'REAL-TIME · EXPLORE';panel(4,top,DW-120,26);text(bannerS,12,top+4,tb?(G.side==='p'?'#e8c040':'#ff5a4a'):'#8be04a',14);
 btn(DW-112,top,52,26,'MAP',()=>{G.map=!G.map;G.mapSel=Math.max(0,players().indexOf(G.sel));},{on:G.map,id:'MAP'});btn(DW-56,top,52,26,G.Z===1?'ZOOM-':'ZOOM+',()=>{G.Z=G.Z===1?.5:1;},{id:'ZOOM'});
 if(G.map){drawMap(top+30,bot);return;}
 // squad panel
 const P=players();const sy=top+30;panel(4,sy,200,10+P.length*16,false);
 P.forEach((u,i)=>{const y=sy+5+i*16;if(u===G.sel){ctx.fillStyle='rgba(232,192,64,.2)';ctx.fillRect(6,y,196,16);}ctx.fillStyle=u.col;ctx.fillRect(9,y+2,3,12);text(CL[u.cls].n,15,y+1,'#e6e2d4',11);const st=STATUS(u);text(st[0],82,y+1,st[1],11);
  drawFrame(A.hud,'hp_track',146,y+8);ctx.fillStyle=u.hp/u.maxhp>.5?'#8be04a':'#ff5a4a';ctx.fillRect(127,y+6,Math.round(36*u.hp/u.maxhp),3);text(tb?u.ap+'AP':'',200,y+1,'#e6e2d4',11,'r');
  BTN.push({x:4,y,w:200,h:16,id:'row'+i,fn:()=>{if(u.alive&&!u.down){G.sel=u;G.target=null;G.preview=null;G.panT=0;}}});});
 // messages
 G.msgs.forEach((m,i)=>{ctx.globalAlpha=Math.min(1,(7-m.t));const my=sy+14+P.length*16+i*13;ctx.fillStyle='rgba(10,12,16,.55)';ctx.fillRect(4,my-1,textW(m.s,11)+8,13);text(m.s,8,my,m.c,11);ctx.globalAlpha=1;});
 if(G.banner){const b=G.banner;ctx.globalAlpha=Math.min(1,(2.2-b.t)*2);panel(DW/2-150,DH*.3,300,32,true);text(b.s,DW/2,DH*.3+7,b.c,14,'c');ctx.globalAlpha=1;}
 // bottom card
 const u=G.sel;const cy=bot-38-66;panel(4,cy,DW-8,64);
 if(u){const c=CL[u.cls];text(c.n+' · '+u.name,12,cy+4,c.col,14);text(RACE[u.race].n+(u.bipod?' · BIPOD':''),DW-12,cy+5,'#8a8a7a',11,'r');
  if(tb){text('AP',12,cy+19,'#e6e2d4',11);for(let i=0;i<u.maxap;i++)drawFrame(A.hud,i<u.ap?(G.preview&&i>=u.ap-G.preview.cost?'ap_pip/preview':'ap_pip/gold'):'ap_pip/empty',32+i*7,cy+25);text(u.ap+'/'+u.maxap,DW-12,cy+19,'#e6e2d4',11,'r');}
  else text('STANCE '+u.stance.toUpperCase()+' · '+(u.follow?'FOLLOWING':'HOLDING')+(u.wps.length?' · '+u.wps.length+' WAYPOINTS':''),12,cy+19,'#8a8a7a',11);
  const wi=u.weps[u.w];text(WEP[wi.k].n,12,cy+33,'#e6e2d4',11);text(wi.ammo+'/'+WEP[wi.k].mag+'  x'+wi.mags,DW-12,cy+33,'#e6e2d4',11,'r');
  let line='',lc='#f0a030';
  if(G.pending){const s=abState(u,G.pending);line='TARGET: '+s.n+(G.pendErr?' — '+G.pendErr:'');lc='#b070f0';}
  else if(G.target&&G.target.alive){const t=G.target;const cvr=['NONE','HALF','FULL'][coverAt(t,u)];line='HIT '+hitChance(u,t,false)+'% SNAP · '+hitChance(u,t,true)+'% AIMED · COVER '+cvr;lc='#ff5a4a';}
  else if(G.preview)line='MOVE '+G.preview.path.length+' TILES · '+G.preview.cost+' AP — TAP AGAIN TO GO';
  else line='SNAP '+snapCost(u)+' AP · AIMED '+aimCost(u)+' AP · MOVE '+CL[u.cls].move[STI[u.stance]]+' AP/TILE';
  text(line,12,cy+47,lc,11);}
 // buttons
 const by=bot-34,bh=30;const row=(items)=>{const n=items.length,g=4,w=(DW-8-g*(n-1))/n;items.forEach((it,i)=>{if(it)btn(4+i*(w+g),by,w,bh,it[0],it[1],it[2]);});};
 if(G.menu&&u){const ids=CL[u.cls].ab;const mh=ids.length*28+8;const my=cy-mh-4;panel(4,my,DW-8,mh,true);ids.forEach((id,i)=>{const s=abState(u,id);const lbl=s.n+(tb?' · '+s.ap+' AP':'')+(s.uses!=null?' · x'+s.uses:'')+(s.ok?'':' ('+s.why+')');
   btn(8,my+4+i*28,DW-16,26,lbl,()=>{G.menu=false;if(s.tgt==='self')doAsync(()=>useAbility(u,id,u));else{G.pending=id;G.pendErr='';G.target=null;G.preview=null;}},{dis:!s.ok,id:'ab_'+id});});}
 if(G.screen!=='play'){return;}
 if(G.pending)row([['CANCEL',()=>{G.pending=null;},{id:'CANCEL'}]]);
 else if(tb&&G.side!=='p')row([['ENEMY TURN…',null,{dis:1}]]);
 else if(tb){const busy=G.busy||!u;if(G.target&&G.target.alive&&u)row([['SNAP '+snapCost(u),()=>shootCmd(false),{dis:busy||u.ap<snapCost(u),col:'#ff5a4a',id:'SNAP'}],['AIMED '+aimCost(u),()=>shootCmd(true),{dis:busy||u.ap<aimCost(u),col:'#ff5a4a',id:'AIMED'}],['ABILITY',()=>{G.menu=!G.menu;},{col:'#b070f0',id:'ABILITY'}],['CANCEL',()=>{G.target=null;},{id:'CANCEL'}],['END TURN',endTurnCmd,{gold:1,col:'#e8c040',dis:G.busy,id:'END TURN'}]]);
  else row([['STANCE',stanceCmd,{dis:busy,id:'STANCE'}],['RELOAD '+(u?CL[u.cls].reload:''),reloadCmd,{dis:busy,id:'RELOAD'}],['ABILITY',()=>{G.menu=!G.menu;},{col:'#b070f0',dis:busy,id:'ABILITY'}],['OVERWATCH',owCmd,{dis:busy,on:u&&u.ow,id:'OVERWATCH'}],['END TURN',endTurnCmd,{gold:1,col:'#e8c040',dis:G.busy,id:'END TURN'}]]);}
 else row([['STANCE',stanceCmd,{id:'STANCE'}],[u&&u.follow?'FOLLOW':'HOLD',()=>{if(u)u.follow=!u.follow;},{on:u&&!u.follow,id:'FOLLOW'}],['ABILITY',()=>{G.menu=!G.menu;},{col:'#b070f0',id:'ABILITY'}],['RELOAD',reloadCmd,{id:'RELOAD'}]]);}
function doAsync(f){Promise.resolve().then(f).catch(e=>console.error(e));}
function stanceCmd(){const u=G.sel;if(!u||G.busy)return;const nx={stand:'crouch',crouch:'prone',prone:'stand'}[u.stance];if(G.mode==='tb'){if(u.ap<2){msg('NO AP');return;}u.ap-=2;}u.stance=nx;u.bipod=false;computeVis();if(G.mode==='tb'&&G.preview)G.preview=null;}
function reloadCmd(){const u=G.sel;if(!u||G.busy)return;const wi=u.weps[u.w];const c=CL[u.cls].reload;if(wi.mags<=0){msg('NO MAGS LEFT','#ff5a4a');return;}if(wi.ammo>=WEP[wi.k].mag){msg('MAG FULL');return;}if(G.mode==='tb'){if(u.ap<c){msg('NO AP');return;}u.ap-=c;}wi.mags--;wi.ammo=WEP[wi.k].mag;float(u,'RELOADED','#e6e2d4');}
function owCmd(){const u=G.sel;if(!u||G.busy)return;if(u.ap<snapCost(u)){msg('NEED '+snapCost(u)+' AP FOR OVERWATCH');return;}u.ow=!u.ow;u.owLane=null;float(u,u.ow?'OVERWATCH':'OW OFF','#e8c040');}
function endTurnCmd(){doAsync(endPlayerTurn);}
function shootCmd(aimed){const u=G.sel,t=G.target;if(!u||!t||G.busy)return;doAsync(async()=>{G.busy=true;u.ow=false;try{await attack(u,t,aimed);}finally{G.busy=false;}if(!t.alive)G.target=null;});}
function drawMap(y0,bot){const avail=bot-y0-44;const c=Math.floor(Math.min(DW-12,avail-34)/N);const ox=Math.round((DW-c*N)/2),oy=y0+30;panel(ox-4,y0,c*N+8,c*N+38,true);
 const P=players();P.forEach((u,i)=>btn(ox+i*((c*N)/4),y0+3,c*N/4-2,24,CL[u.cls].n.slice(0,8),()=>{G.mapSel=i;},{on:G.mapSel===i,col:u.col,id:'tab'+i}));
 const FC=['#3d5a2a','#6a5434','#a08a5a','#5a5a58','#4a4030','#3a4a38'];
 for(let x=0;x<N;x++)for(let y=0;y<N;y++){const k=ix(x,y);ctx.fillStyle=FC[M.floor[k]];ctx.fillRect(ox+x*c,oy+y*c,c,c);if(!M.seen[k]){ctx.fillStyle='rgba(0,0,0,.45)';ctx.fillRect(ox+x*c,oy+y*c,c,c);}
  if(M.prop[k]){ctx.fillStyle=PROPS[M.prop[k].k].los?'#222':'#8a7a5a';ctx.fillRect(ox+x*c+1,oy+y*c+1,c-2,c-2);}
  const a=M.wNW[k],b=M.wNE[k];const wc=w=>w.door?(w.st==='door_closed'?'#e8c040':'#806a20'):BLOCK_LOS[w.st]?'#e6e2d4':'#6a6a6a';
  if(a){ctx.fillStyle=wc(a);ctx.fillRect(ox+x*c-1,oy+y*c,2,c);}if(b){ctx.fillStyle=wc(b);ctx.fillRect(ox+x*c,oy+y*c-1,c,2);}}
 for(const u of G.units){if(!u.alive&&u.side==='e')continue;if(u.side==='e'&&!enemyVisible(u)&&!u.freed)continue;ctx.fillStyle=u.side==='p'?(u.down?'#555':u.col):u.freed?'#8be04a':u.boss?'#e8c040':'#ff3030';ctx.beginPath();ctx.arc(ox+u.x*c+c/2,oy+u.y*c+c/2,u.boss?c*.8:c*.55,0,7);ctx.fill();}
 P.forEach((u,i)=>{if(!u.wps.length)return;ctx.strokeStyle=u.col;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(ox+u.x*c+c/2,oy+u.y*c+c/2);for(const w of u.wps)ctx.lineTo(ox+w.x*c+c/2,oy+w.y*c+c/2);ctx.stroke();
  u.wps.forEach((w,j)=>drawFrame(A.hud,'waypoint/'+(j+1),ox+w.x*c+c/2,oy+w.y*c+c/2,false,tintedImage(A.hud.img,u.col)));});
 BTN.push({x:ox,y:oy,w:c*N,h:c*N,id:'MAPGRID',fn:(px,py)=>{const x=Math.floor((px-ox)/c),y=Math.floor((py-oy)/c);const u=P[G.mapSel];if(!u||!u.alive||u.down||!passable(x,y))return;if(u.wps.length<9)u.wps.push({x,y});}});
 const u=P[G.mapSel];const by=bot-34,w=(DW-8-12)/4;
 btn(4,by,w,30,'CLEAR',()=>{if(u){u.wps=[];u.wpGo=false;}},{id:'CLEAR'});btn(8+w,by,w,30,u&&u.follow?'FOLLOW':'HOLD',()=>{if(u)u.follow=!u.follow;},{id:'MFOLLOW',on:u&&!u.follow});
 btn(12+2*w,by,w,30,'GO',()=>{if(G.mode==='tb'){msg('WAYPOINTS RUN IN REAL-TIME');}for(const p of P)if(p.wps.length)p.wpGo=true;G.map=false;},{gold:1,col:'#8be04a',id:'GO'});btn(16+3*w,by,w,30,'CLOSE',()=>{G.map=false;},{id:'CLOSE'});
 text('TAP GRID: WAYPOINTS FOR '+(u?CL[u.cls].n:''),DW/2,oy+c*N+2,'#e6e2d4',11,'c');}

// ---------- squad select / end ----------
let PICK=[],resetArm=0;
function drawSelect(){const top=TOP/US+6,bot=DH-BOT/US;text('SQUAD 2033',DW/2,top,'#e8c040',18,'c');text('MISSION '+R.mission+' · PICK 4 OF 7 · W'+R.wins+' L'+R.losses+' · FALLEN '+R.fallen.length,DW/2,top+22,'#8a8a7a',11,'c');
 const list=R.roster;const y0=top+40,y1=bot-38-40;const ch=Math.min(92,Math.floor((y1-y0)/Math.max(1,list.length))-3);
 list.forEach((rs,i)=>{const y=y0+i*(ch+3),c=CL[rs.cls];const picked=PICK.includes(rs.id);const avail=rs.status==='ok';panel(4,y,DW-8,ch,picked);if(picked){ctx.fillStyle='rgba(232,192,64,.12)';ctx.fillRect(7,y+3,DW-14,ch-6);}
  const a=A[rs.race+'_'+rs.cls];if(!avail)ctx.globalAlpha=.4;const s=ch>=80?1:ch/84;drawFrame(a,'idle_stand/S/00',34,y+ch-6,false,teamAtlasImg(a,picked?TEAM[PICK.indexOf(rs.id)]:'#9a9a9a'),s);ctx.globalAlpha=1;
  text(c.n,64,y+5,c.col,14);text(rs.name+(rs.recruit?' (RECRUIT)':''),64,y+21,'#e6e2d4',11);const rl=wrap(c.role,DW-180,11);rl.slice(0,2).forEach((l,k)=>text(l,64,y+35+k*12,'#8a8a7a',11));
  text(avail?(rs.missions?rs.missions+' OPS · '+rs.kills+' KILLS':'FRESH'):'WOUNDED — SITS OUT',64,y+61,avail?'#8a8a7a':'#ff5a4a',11);
  BTN.push({x:4,y,w:DW-110,h:ch,id:'card_'+rs.cls,fn:()=>{if(!avail)return;const k=PICK.indexOf(rs.id);if(k>=0)PICK.splice(k,1);else if(PICK.length<4)PICK.push(rs.id);}});
  btn(DW-102,y+4,94,22,RACE[rs.race].n,()=>{rs.race=RACE_NEXT[rs.race];saveRoster();},{id:'race_'+rs.cls,col:'#3fc8e0'});text(RACE[rs.race].note,DW-55,y+28,'#8a8a7a',11,'c');
  if(rs.cls==='assault')btn(DW-102,y+ch-26,94,22,'UB: '+(rs.ub==='sg'?'SHOTGUN':'GRENADE'),()=>{rs.ub=rs.ub==='sg'?'gl':'sg';saveRoster();},{id:'ub',col:'#e8c040'});});
 panel(4,y1+2,DW-8,34);text('INTEL: NORDIC SHIELDS (TECH HACK / ROCKET) · COLLARED SLAVES',DW/2,y1+6,'#e8c040',11,'c');text('OPEN GROUND (SNIPER) · LOCKED BUILDINGS (DEMO) · BOSS N.',DW/2,y1+19,'#e8c040',11,'c');
 const by=bot-34;btn(4,by,110,30,resetArm>0?'CONFIRM?':'NEW CAMPAIGN',()=>{if(resetArm>0){R=newRoster();saveRoster();PICK=[];resetArm=0;}else resetArm=3;},{id:'RESET',col:'#ff5a4a'});
 btn(118,by,DW-122,30,'DEPLOY '+PICK.length+'/4',()=>{const sel=PICK.map(id=>R.roster.find(r=>r.id===id)).filter(Boolean);if(!sel.length)return;setupMission(sel);},{gold:1,col:'#8be04a',dis:!PICK.length,id:'DEPLOY'});}
function wrap(s,w,sz){const out=[];let cur='';for(const word of s.split(' ')){const t=cur?cur+' '+word:word;if(textW(t.toUpperCase(),sz)>w&&cur){out.push(cur);cur=word;}else cur=t;}if(cur)out.push(cur);return out;}
const RACE_NEXT={human:'robot',robot:'grey',grey:'human'};
function drawEnd(){const r=G.result;if(!r)return;const top=TOP/US;const y=top+DH*.18;panel(16,y,DW-32,300,true);text(r.win?'MISSION SUCCESS':'MISSION FAILED',DW/2,y+14,r.win?'#8be04a':'#ff5a4a',18,'c');
 text(r.win?'THE SOVEREIGN IS DEAD.':'THE SQUAD WAS WIPED OUT.',DW/2,y+44,'#e6e2d4',14,'c');let yy=y+80;
 const L=(h,arr,c)=>{text(h,32,yy,c,14);yy+=18;text(arr.length?arr.join(', '):'—',40,yy,'#e6e2d4',11);yy+=26;};L('RETURNED',r.ok,'#8be04a');L('WOUNDED (SIT OUT NEXT MISSION)',r.wounded,'#f0a030');L('KIA — GONE FOR GOOD',r.dead,'#ff3030');
 if(r.dead.length)text('REPLACEMENT RECRUITS ARRIVE AFTER NEXT MISSION',DW/2,yy,'#8a8a7a',11,'c');
 btn(32,y+250,DW-64,34,'CONTINUE',()=>{G={screen:'select',units:[],fx:[],floats:[],msgs:[]};PICK=R.roster.filter(r=>r.status==='ok').slice(0,4).map(r=>r.id);},{gold:1,col:'#e8c040',id:'CONTINUE'});}
function draw(){ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#161A20';ctx.fillRect(0,0,cv.width,cv.height);ctx.imageSmoothingEnabled=false;BTN=[];
 if(G.screen==='load'){ctx.setTransform(DPR,0,0,DPR,0,0);ctx.fillStyle='#e6e2d4';ctx.font='14px sans-serif';ctx.textAlign='center';ctx.fillText(loadErr?('LOAD FAILED — TAP TO RETRY: '+loadErr):'SQUAD 2033 · LOADING '+loadDone+'/'+Math.max(loadTotal,40),W/2,H/2);ctx.textAlign='left';return;}
 if(G.screen==='play'||G.screen==='ending'||G.screen==='end')drawWorld();
 ctx.setTransform(DPR*US,0,0,DPR*US,0,0);ctx.imageSmoothingEnabled=false;
 if(G.screen==='select')drawSelect();else if(G.screen==='play'||G.screen==='ending')drawHUD();else if(G.screen==='end'){ctx.fillStyle='rgba(10,12,16,.6)';ctx.fillRect(0,0,DW,DH);drawEnd();}
 text(VERSION,DW-4,DH-BOT/US+4,'rgba(255,255,255,.5)',11,'r');}

// ---------- input ----------
const ptrs=new Map();let drag=null;
cv.addEventListener('pointerdown',e=>{e.preventDefault();try{cv.setPointerCapture(e.pointerId);}catch(_){}const r=cv.getBoundingClientRect();ptrs.set(e.pointerId,{x:e.clientX-r.left,y:e.clientY-r.top});drag={x0:e.clientX-r.left,y0:e.clientY-r.top,lx:e.clientX-r.left,ly:e.clientY-r.top,moved:false,id:e.pointerId};},{passive:false});
cv.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const r=cv.getBoundingClientRect();const x=e.clientX-r.left,y=e.clientY-r.top;if(Math.hypot(x-drag.x0,y-drag.y0)>12)drag.moved=true;
 if(drag.moved&&(G.screen==='play')&&!G.map){G.camX-=(x-drag.lx)/G.Z;G.camY-=(y-drag.ly)/G.Z;G.panT=3;}drag.lx=x;drag.ly=y;});
cv.addEventListener('pointerup',e=>{if(!drag||drag.id!==e.pointerId)return;const d=drag;drag=null;ptrs.delete(e.pointerId);if(!d.moved)tap(d.x0,d.y0);});
cv.addEventListener('pointercancel',e=>{drag=null;ptrs.delete(e.pointerId);});
document.addEventListener('contextmenu',e=>e.preventDefault());
function tap(px,py){if(G.screen==='load'){if(loadErr){loadErr=null;boot();}return;}if(resetArm>0)resetArm--;const dx=px/US,dy=py/US;
 for(let i=BTN.length-1;i>=0;i--){const b=BTN[i];if(dx>=b.x&&dx<=b.x+b.w&&dy>=b.y&&dy<=b.y+b.h){b.fn(dx,dy);return;}}
 if(G.screen!=='play'||G.map)return;if(G.menu){G.menu=false;return;}worldTap(px,py);}
function unitAtScreen(px,py){let best=null;for(const u of G.units){if(!u.alive)continue;if(u.side==='e'&&!enemyVisible(u)&&!u.freed)continue;const s=w2s(u.x,u.y);const h=(u.boss?110:50)*G.Z,w=(u.boss?40:14)*G.Z;
 if(px>=s.x-w&&px<=s.x+w&&py>=s.y-h&&py<=s.y+6*G.Z){if(!best||s.y>best.s.y)best={u,s};}}return best&&best.u;}
function worldTap(px,py){const u=G.sel;const t=s2tile(px,py);const hit=unitAtScreen(px,py);if(G.busy)return;
 if(G.mode==='tb'&&G.side!=='p')return;
 if(G.pending&&u){const tx=hit?Math.round(hit.tx):t.x,ty=hit?Math.round(hit.ty):t.y;const id=G.pending;const r=abTarget(u,id,tx,ty);if(r.err){G.pendErr=r.err;msg(r.err,'#b070f0');return;}G.pending=null;doAsync(()=>useAbility(u,id,r));return;}
 if(hit&&hit.side==='p'){if(!hit.down){G.sel=hit;G.target=null;G.preview=null;}else msg(hit.name+(hit.stab?' IS STABILIZED':' IS BLEEDING — TECH: STABILIZE'),'#ff5a4a');return;}
 if(hit&&hit.side==='e'&&hit.hostile&&G.mode==='tb'&&u){if(!canShoot(u,hit)){msg('NO LINE OF FIRE','#f0a030');return;}G.target=hit;G.preview=null;return;}
 if(!u||!u.alive||u.down||!inb(t.x,t.y))return;
 if(G.mode==='rt'){const p=findPath(u,t.x,t.y);if(!p){msg("CAN'T MOVE THERE");return;}u.wps=[];u.wpGo=false;u.dest={x:t.x,y:t.y};moveAlong(u,p);return;}
 G.target=null;if(G.preview&&G.preview.x===t.x&&G.preview.y===t.y){const pv=G.preview;G.preview=null;doAsync(async()=>{G.busy=true;u.ow=false;try{await moveAlong(u,pv.path);}finally{G.busy=false;}});return;}
 const p=reachPath(getReach(u),t.x,t.y)||findPath(u,t.x,t.y);if(!p){msg("CAN'T MOVE THERE");G.preview=null;return;}let cost=0,cx=u.tx,cy=u.ty;for(const n of p){const e=edge(cx,cy,n.x,n.y);cost+=CL[u.cls].move[STI[u.stance]]+(e&&e.st==='door_closed'?2:0);cx=n.x;cy=n.y;}
 G.preview={x:t.x,y:t.y,path:p,cost};}

// ---------- boot / loop ----------
let last=0;function frame(ts){const dt=Math.min(.05,((ts-last)/1000)||0);last=ts;update(dt);draw();requestAnimationFrame(frame);}
async function boot(){G={screen:'load',units:[],fx:[],floats:[],msgs:[]};loadDone=0;loadTotal=0;try{await loadAll();}catch(e){loadErr=e.message;console.warn(e);return;}
 R=loadRoster();PICK=R.roster.filter(r=>r.status==='ok').slice(0,4).map(r=>r.id);G={screen:'select',units:[],fx:[],floats:[],msgs:[]};}
requestAnimationFrame(frame);boot();
// test / automation hooks (read-mostly)
window.SQ={get G(){return G;},get R(){return R;},get BTN(){return BTN;},US:()=>US,
 btn(id){const b=BTN.find(b=>b.id===id||b.id.startsWith(id));return b?{x:(b.x+b.w/2)*US,y:(b.y+b.h/2)*US}:null;},
 tile(x,y){return w2s(x,y);},unit(u){const s=w2s(u.x,u.y);return{x:s.x,y:s.y-26*G.Z};},
 setSpeed(s){SPD=s;},force(p,e){FORCE.p=p;FORCE.e=e;},sleep};
SQ.api={getReach,startTB,abTarget,damage,findPath,pathAdj,moveAlong,attack,endPlayerTurn,liveP,hostiles,setupMission,useAbility,canShoot,sees,enemyVisible,reload:reloadCmd,dist};
