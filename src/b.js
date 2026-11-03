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
let camWide=false;// setup uses the wider v4 view (12 tiles) so you can see where to place soldiers; battle is zoomed to 8 tiles
function fitCam(){const asp=RW/Math.max(1,RH);const base=camWide?24:16;VIEW_W=asp<1?base:Math.min(base*4/3,base*asp);const hw=VIEW_W/2,hh=hw/asp;cam.left=-hw;cam.right=hw;cam.top=hh;cam.bottom=-hh;cam.updateProjectionMatrix();}
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
