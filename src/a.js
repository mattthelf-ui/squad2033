// SQUAD 2033 v4 — real 3D (three.js) squad action RPG
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
const VERSION='squad2033 v5';
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
