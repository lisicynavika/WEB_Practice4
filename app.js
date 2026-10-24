'use strict';
const $=id=>document.getElementById(id), types=['Теннис','Футбол','Баскетбол','Волейбол'], icons=['🎾','⚽','🏀','🏐'];
const names=['Лайм-корт','Зелёная лига','Три очка','Высота','Сет-пойнт','Парк Арена','Квартал 23','На волне','Ракетка','Полевой клуб','Кольцо','Подача','Матч-пойнт','Стадион Сад','Овертайм','Песчаный берег','Тихий корт','Первый тайм','Уличная лига','Солнечный сет','Аквамарин','Футбольный парк','Дабл','Прибой','Ривьера','Городской стадион','Квартал игры','Пляжный клуб','Топ-спин','Новая арена','Стритбол','Песок и солнце'];
const locations=[[26,26],[34,34],[42,26],[26,42],[18,34],[50,34],[34,18],[42,42],[10,26],[58,26],[18,50],[50,50],[34,58],[26,58],[58,42],[10,50],[66,18],[18,10],[50,10],[66,58],[2,18],[2,66],[34,74],[74,34],[58,66],[42,66],[66,2],[10,2],[74,66],[2,42],[58,2],[74,10]];
const venues=names.map((name,i)=>({id:i,name,sport:types[i%4],x:locations[i][0]+(i%3)*.23,y:locations[i][1]+(i%2)*.37,w:i%4===1?4.4:i%4===0?2.5:3.2,d:i%4===1?3.3:i%4===0?4.2:3.8,stadium:i%4===1&&i%3===1,price:600+(i%7)*300,capacity:[4,22,10,12][i%4],light:i%3!==0,roof:i%5===0&&i%4!==1,address:['Парковая','Спортивная','Садовая','Олимпийская'][i%4]+' улица, '+(i+3),surface:['Хард','Искусственный газон','Резиновое покрытие','Песок'][i%4],busy:[3,9,14].includes(i)}));
let saved;try{saved=JSON.parse(localStorage.getItem('citysport-v1'))||{}}catch{saved={}}
let orders=Array.isArray(saved.orders)?saved.orders.filter(o=>Number.isInteger(o.id)&&venues[o.id]&&Number.isInteger(o.hours)&&o.hours>0&&o.hours<=12&&!venues[o.id].busy).filter((o,i,a)=>a.findIndex(q=>q.id===o.id)===i):[], fav=new Set(Array.isArray(saved.fav)?saved.fav:[]), selected=null,night=false,coachOff=!!saved.coachOff;
function persist(){try{localStorage.setItem('citysport-v1',JSON.stringify({orders,fav:[...fav],coachOff}));return true}catch{toast('Не удалось сохранить: проверьте доступ к хранилищу браузера.');return false}}
function occupied(v){return v.busy||orders.some(o=>o.id===v.id)}
function money(n){return n.toLocaleString('ru-RU')+' ₽'}
function filtered(){return venues.filter(v=>(!$('sport').value||v.sport===$('sport').value)&&v.price<=Number($('price').value)&&v.capacity>=Number($('capacity').value)&&(!$('light').checked||v.light)&&(!$('favorites').checked||fav.has(v.id))&&(!$('roof').value||v.roof===($('roof').value==='yes')))}
function status(v){return occupied(v)?'🔒 Занята':selected===v.id?'◎ Выбрана':'✓ Свободна'}
let toastTimer;function toast(t){$('toast').textContent=t;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').textContent='',4500)}
function render(){const visible=filtered();if(selected!==null&&!visible.some(v=>v.id===selected)){selected=null;$('detail').hidden=true}$('results').textContent=visible.length+' из 32';$('count').textContent=orders.length;$('list').innerHTML=visible.length?visible.map(v=>`<article class="venue ${selected===v.id?'selected':''}"><div class="row"><span class="tag">${v.sport}</span><button data-fav="${v.id}" aria-label="${fav.has(v.id)?'Убрать из':'Добавить в'} избранное: ${v.name}" aria-pressed="${fav.has(v.id)}">${fav.has(v.id)?'♥':'♡'}</button></div><h3>${v.name}</h3><p>${v.address} · до ${v.capacity} участников</p><div class="row"><b>${money(v.price)}<small>/ч</small></b><span class="tag">${status(v)}</span></div><div class="row" style="margin-top:10px"><button data-select="${v.id}" ${occupied(v)?'disabled':''}>Выбрать</button><button data-show="${v.id}">Показать на карте ↗</button></div></article>`).join(''):'<p>Подходящих площадок нет. Попробуйте сбросить фильтры.</p>';draw();}
$('list').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.fav!==undefined){const id=+b.dataset.fav;fav.has(id)?fav.delete(id):fav.add(id);persist();render()}if(b.dataset.select!==undefined)choose(+b.dataset.select);if(b.dataset.show!==undefined)focusVenue(+b.dataset.show)});
function choose(id){const v=venues[id];if(!v||occupied(v)||!filtered().includes(v)){toast('Эта площадка недоступна для выбора.');return}selected=id;render();$('hint').textContent=`${v.name}: ${v.surface.toLowerCase()}, до ${v.capacity} участников. ${v.light?'Есть освещение — удобно играть вечером.':'Освещения нет — планируй игру в светлое время.'}`;$('detail').hidden=false;$('detail').innerHTML=`<div class="row"><span class="eyebrow">ТВОЯ СЛЕДУЮЩАЯ ИГРА</span><button id="closedetail" aria-label="Закрыть карточку">×</button></div><div class="art" role="img" aria-label="Иллюстрация: ${v.sport}"><img src="court-${id%4}.svg" alt="Иллюстрация площадки: ${v.sport}"></div><h2>${v.name}</h2><p>${v.sport} · ${v.address}<br>${v.surface} · до ${v.capacity} участников<br>${v.light?'☀ Есть освещение':'Без освещения'} · ${v.roof?'Крытая':'Открытая'}</p><form id="bookingform" novalidate><label>Срок аренды, часов (от 1 до 12)<input id="hours" type="number" min="1" max="12" step="1" value="1" required></label><div class="total" id="total">${money(v.price)}</div><p id="formula">${money(v.price)} × 1 ч</p><p class="error" id="error" role="alert"></p><button class="primary" type="submit">Забронировать площадку ↗</button></form><p class="muted">Учебная аренда: площадка занята до отмены брони. Оплата не требуется.</p>`;$('closedetail').onclick=()=>{$('detail').hidden=true;document.querySelector(`[data-select="${id}"]`)?.focus()};$('hours').oninput=()=>{const h=Number($('hours').value),ok=Number.isInteger(h)&&h>=1&&h<=12;$('total').textContent=ok?money(h*v.price):'—';$('formula').textContent=ok?`${money(v.price)} × ${h} ч`:'Укажите целое число часов от 1 до 12'};$('bookingform').onsubmit=e=>{e.preventDefault();const h=Number($('hours').value);if(selected===null){$('error').textContent='Сначала выберите площадку.';return}if(!Number.isInteger(h)||h<1||h>12){$('error').textContent='Введите целое число часов от 1 до 12.';return}if(occupied(v)){toast('Эта площадка уже занята.');return}const record={id,hours:h,number:'GI-'+Date.now().toString(36).toUpperCase(),created:new Date().toISOString()};orders.push(record);if(!persist()){orders.pop();return}selected=null;$('detail').hidden=true;render();showOrders();toast('Готово! Учебный пропуск уже в «Моих бронях».')};$('hours').focus()}
function showOrders(){$('orderlist').innerHTML=orders.length?orders.map(o=>{const v=venues[o.id];return `<article class="ticket"><small>ГОРОД В ИГРЕ · УЧЕБНЫЙ ПРОПУСК</small><h3>${v.name}</h3><p>${v.sport} · ${v.address}</p><p>Длительность: ${o.hours} ч · <b>${money(v.price*o.hours)}</b></p><p>№ ${o.number}<br>Создан: ${new Date(o.created).toLocaleString('ru-RU')}</p><button data-cancel="${o.id}">Отменить бронь</button></article>`}).join(''):'<p>Броней пока нет. Выберите свободную площадку на карте или в списке.</p>';if(!$('orders').open)$('orders').showModal()}
$('orderlist').onclick=e=>{const b=e.target.closest('[data-cancel]');if(!b)return;const previous=orders;orders=orders.filter(o=>o.id!==+b.dataset.cancel);if(!persist()){orders=previous;return}render();showOrders();toast('Бронь отменена. Площадка снова свободна.')};$('bookings').onclick=showOrders;$('closeorders').onclick=()=>$('orders').close();$('explore').onclick=()=>{$('orders').close();$('city').focus()};
for(const id of ['sport','price','capacity','roof','light','favorites'])$(id).addEventListener('input',render);
$('reset').onclick=()=>{$('sport').value='';$('price').value=3000;$('capacity').value=1;$('roof').value='';$('light').checked=false;$('favorites').checked=false;render()};
$('evening').onclick=()=>{night=!night;document.body.classList.toggle('night',night);$('evening').setAttribute('aria-pressed',night);$('evening').textContent=night?'☀ День':'☾ Вечер';draw()};
function coachState(){$('coach').hidden=coachOff;$('showcoach').hidden=!coachOff}coachState();$('hidecoach').onclick=()=>{coachOff=true;persist();coachState()};$('showcoach').onclick=()=>{coachOff=false;persist();coachState()};$('recommend').onclick=()=>{const dialog=$('sportpicker');$('sportchoices').innerHTML=types.map((sport,i)=>'<button type="button" class="sportchoice" data-sport="'+i+'"><span>'+icons[i]+'</span><b>'+sport+'</b><small>'+venues.filter(v=>v.sport===sport&&!occupied(v)).length+' свободных площадок в городе</small></button>').join('');dialog.showModal()};
$('closesportpicker').onclick=()=>$('sportpicker').close();
$('sportchoices').onclick=e=>{const button=e.target.closest('[data-sport]');if(!button)return;const sport=types[Number(button.dataset.sport)];$('sport').value=sport;selected=null;$('detail').hidden=true;$('sportpicker').close();render();const options=filtered(),available=options.filter(v=>!occupied(v));$('hint').textContent=options.length?'Показываю только '+sport.toLowerCase()+': '+options.length+' площадок, свободных — '+available.length+'. Выбирай метку на карте или площадку в списке.':'По этим фильтрам площадок для '+sport.toLowerCase()+' нет. Увеличь бюджет или сбрось дополнительные фильтры.';const target=available[0]||options[0];if(target)focusVenue(target.id);toast('На карте и в списке: '+sport)};
// Genuine WebGL city, local Three.js dependency; no server or external assets.
const canvas=$('city'),mini=$('mini'),mc=mini.getContext('2d');let width=1,height=1,cityReady=false;
let scene,camera,renderer,sun,hemi;let viewSize=24,azimuth=Math.PI/4;const center={x:34,z:34};const venueModels=new Map(),markers=new Map(),lamps=[];const batches=new Map(),materialCache=new Map();
const overlay=document.createElement('div');overlay.id='citymarkers';canvas.parentElement.append(overlay);
function rand(n){const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x)}
function mat(color,emissive=false){const key=color+emissive;if(!materialCache.has(key))materialCache.set(key,new THREE.MeshStandardMaterial({color,roughness:.72,metalness:.02,emissive:emissive?color:0,emissiveIntensity:emissive?.45:0}));return materialCache.get(key)}
let roundGeo,boxGeo,sphereGeo,cylinderGeo;const temp=new THREE.Object3D();let staticBuilding=true;
function shape(geo,color,x,y,z,sx,sy,sz,parent=scene,glow=false){const m=mat(color,glow);if(staticBuilding&&parent===scene){const key=geo.uuid+m.uuid;if(!batches.has(key))batches.set(key,{geo,mat:m,transforms:[]});temp.position.set(x,y,z);temp.rotation.set(0,0,0);temp.scale.set(sx,sy,sz);temp.updateMatrix();batches.get(key).transforms.push(temp.matrix.clone());return null}const mesh=new THREE.Mesh(geo,m);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh}
function box(x,y,z,w,h,d,color,parent=scene){return shape(roundGeo,color,x,y,z,w,h,d,parent)}
function ball(x,y,z,r,color,parent=scene,squash=1){return shape(sphereGeo,color,x,y,z,r,r*squash,r,parent)}
function bar(a,b,r,color,parent=scene){const dir=new THREE.Vector3().subVectors(b,a),mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,dir.length(),6),mat(color));mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());mesh.castShadow=true;parent.add(mesh);return mesh}
function stripe(x,z,w,d,color,parent=scene,y=.115){shape(boxGeo,color,x,y,z,w,.018,d,parent)}
function ring(x,y,z,r,color,parent=scene){const m=new THREE.Mesh(new THREE.TorusGeometry(r,.025,5,44),mat(color));m.rotation.x=-Math.PI/2;m.position.set(x,y,z);parent.add(m)}
function makeTree(x,z,seed){shape(cylinderGeo,'#b68a60',x,.65,z,.12,1.3,.12);ball(x,1.5,z,.63,'#7fb957');ball(x-.28,1.8,z-.08,.44,'#a6d66b');ball(x+.25,1.55,z+.18,.42,'#81bb57')}
function makeLamp(x,z){shape(cylinderGeo,'#7f9c9b',x,1.05,z,.045,2.1,.045);box(x+.16,2.08,z,.42,.1,.2,'#e9d6a0');const bulb=shape(sphereGeo,'#fff0b3',x+.2,2.04,z,.12,.05,.1,scene,true);lamps.push({x,z})}
const colors=['#ffe0b2','#f5b5a6','#b2deeb','#d8c6ed','#c5e5d4','#f6dba4'];
function makeBuilding(x,z,w,d,h,kind,seed){const wall=colors[seed%colors.length],roof=['#618c9a','#ce877e','#739b91','#9d94b6'][seed%4];box(x,.11,z,w+.3,.22,d+.3,'#f4e6cd');box(x,h/2+.2,z,w,h,d,wall);box(x,.35,z,w+.08,.18,d+.08,'#f9edd8');
const floors=Math.floor(h/.7);for(let k=0;k<floors;k++){const y=.65+k*.7;for(let i=0;i<3;i++){const xx=x-w*.32+i*w*.32;box(xx,y,z+d/2+.025,.31,.43,.08,'#fff4df');box(xx,y+.015,z+d/2+.074,.22,.32,.025,'#78b2c1');box(x+w/2+.025,y,z-d*.3+i*d*.3,.08,.43,.31,'#fff4df');box(x+w/2+.074,y+.015,z-d*.3+i*d*.3,.025,.32,.22,'#81b7c3')}}
if(kind==='house'){const ridge=new THREE.Shape();ridge.moveTo(-w*.58,0);ridge.lineTo(0,.9);ridge.lineTo(w*.58,0);ridge.closePath();const geo=new THREE.ExtrudeGeometry(ridge,{steps:1,depth:d+.25,bevelEnabled:true,bevelSegments:2,bevelSize:.055,bevelThickness:.055});const m=new THREE.Mesh(geo,mat(roof));m.position.set(x,h+.2,z-d/2-.125);m.castShadow=true;scene.add(m);box(x+w*.28,h+.7,z-.2,.22,.8,.25,'#f9e6ce');}
else{box(x,h+.27,z,w+.15,.18,d+.15,roof);box(x-.2,h+.45,z-.12,.5,.3,.5,'#e7e7da');if(kind==='tower'){box(x,h+.5,z,w*.65,.5,d*.65,'#b6d9dc');box(x,h+.85,z,w*.4,.25,d*.4,'#fff2d8')}}
if(['cafe','shop','mall','kiosk'].includes(kind)){const c=kind==='cafe'?'#ef8d78':kind==='shop'?'#6eb9a8':kind==='mall'?'#b29bc9':'#f3c969';box(x,.85,z+d/2+.09,w*.8,1.1,.08,'#65a1b0');for(let j=0;j<8;j++)box(x-w*.48+w*(j+.5)/8,1.6,z+d/2+.28,w/8,.16,.65,j%2?'#fff1d7':c);box(x,1.98,z+d/2+.08,w*.8,.3,.08,c);if(kind==='mall'){box(x,1.15,z+d/2+.15,w*.45,1.6,.15,'#9ad3d7');box(x,h+.35,z,w*.7,.25,d*.7,'#b8d8cd')}if(kind==='cafe'){for(let i=0;i<2;i++){const xx=x-w*.3+i*w*.65,zz=z+d/2+.9;shape(cylinderGeo,'#d4a479',xx,.45,zz,.32,.1,.32);shape(cylinderGeo,'#9c8268',xx,.23,zz,.04,.45,.04);const shade=new THREE.Mesh(new THREE.ConeGeometry(.55,.28,16),mat(i?'#ffd68b':'#f5a294'));shade.position.set(xx,1.35,zz);shade.castShadow=true;scene.add(shade);shape(cylinderGeo,'#b98d65',xx,.85,zz,.025,1,.025)}}}
}
function makeCar(x,z,seed){const c=['#ee8f7d','#f4cb67','#91c3d3','#b49dce','#eae5d1'][seed%5];box(x,.22,z,.75,.3,.4,c);box(x-.06,.43,z,.4,.24,.35,'#aacfd3');for(const dx of [-.24,.24])for(const dz of [-.22,.22])ball(x+dx,.14,z+dz,.11,'#52616b',scene,.9)}
function courtModel(v){const g=new THREE.Group();g.userData.venue=v.id;scene.add(g);const x=v.x+v.w/2,z=v.y+v.d/2,w=v.w,d=v.d;box(x,.045,z,w+.5,.1,d+.5,'#e6e6ca',g);box(x,.11,z,w,.08,d,['#82afd4','#82be6b','#e6a47e','#eddaa7'][v.id%4],g);const c='#fff7df',y=.163;const sl=(xx,zz,ww,dd,col=c)=>stripe(xx,zz,ww,dd,col,g,y);for(const f of [-1,1]){sl(x+f*w*.45,z,.035,d*.9);sl(x,z+f*d*.45,w*.9,.035)}
if(v.id%4===0){box(x,.16,z,w*.74,.025,d*.88,'#a5c789',g);sl(x,z,w*.9,.035);for(const f of [-1,1]){sl(x+f*w*.32,z,.03,d*.9);sl(x,z+f*d*.23,w*.9,.03)}for(const f of [-1,1])box(x+f*w*.5,.5,z,.045,.72,.045,'#f3f0df',g);for(let i=0;i<10;i++)bar(new THREE.Vector3(x-w*.5,.3+i*.035,z),new THREE.Vector3(x+w*.5,.3+i*.035,z),.008,'#e8f1dc',g);}
if(v.id%4===1){for(let i=0;i<8;i++)stripe(x-w*.5+(i+.5)*w/8,z,w/8,d,i%2?'#91c573':'#9bd17c',g,.158);for(const f of [-1,1]){sl(x+f*w*.45,z,.035,d*.9);sl(x,z+f*d*.45,w*.9,.035);const xx=x+f*w*.44;sl(xx-f*w*.09,z,w*.18,.03);sl(xx-f*w*.18,z,.03,d*.5);for(const q of [-1,1])sl(xx-f*w*.09,z+q*d*.25,w*.18,.03);for(const q of [-1,1])box(xx,.42,z+q*d*.14,.04,.52,.04,'#fff3dd',g);box(xx,.68,z,.04,.04,d*.3,'#fff3dd',g)}sl(x,z,.03,d*.9);ring(x,.19,z,.55,c,g);if(v.stadium){for(const f of [-1,1])for(let t=0;t<4;t++)box(x,.2+t*.18,z+f*(d*.5+.25+t*.19),w+.8,.18,.21,['#a3bedc','#8caed1','#7099c4','#5e88b5'][t],g);for(const f of [-1,1])box(x,1.1,z+f*(d*.5+.75),w+1,.12,.8,'#85aac6',g)}}
if(v.id%4===2){stripe(x,z,w*.5,d,'#85bdb5',g,.16);sl(x,z,.025,d*.9);ring(x,.19,z,.4,c,g);for(const f of [-1,1]){const xx=x+f*w*.42;box(xx,.72,z,.045,1.1,.045,'#9baeb0',g);box(xx,1.3,z,.07,.38,.6,'#fff5df',g);const hoop=new THREE.Mesh(new THREE.TorusGeometry(.12,.018,5,16),mat('#dc855e'));hoop.rotation.x=Math.PI/2;hoop.position.set(xx-f*.14,1.1,z);g.add(hoop);for(const q of [-1,1])sl(x+f*w*.32,z+q*d*.22,w*.2,.03);sl(x+f*w*.22,z,.03,d*.44)}}
if(v.id%4===3){sl(x,z,.03,d*.9);for(const f of [-1,1])sl(x+f*w*.18,z,.03,d*.9);for(const f of [-1,1])box(x, .7,z+f*d*.48,.045,1.1,.045,'#76aebe',g);for(let i=0;i<9;i++)bar(new THREE.Vector3(x,.6+i*.045,z-d*.48),new THREE.Vector3(x,.6+i*.045,z+d*.48),.008,'#faf6df',g);for(let i=0;i<14;i++)box(x,.77,z-d*.48+i*d*.96/13,.015,.36,.012,'#fff9e7',g)}
if(!v.stadium){for(let i=0;i<=Math.ceil(w);i++)box(v.x+i,.5,v.y,.025,.8,.025,'#a0b5ad',g);for(let i=0;i<=Math.ceil(d);i++)box(v.x,.5,v.y+i,.025,.8,.025,'#a0b5ad',g)}if(v.roof){const m=new THREE.Mesh(new THREE.BoxGeometry(w+.2,.08,d+.2),new THREE.MeshStandardMaterial({color:'#d3e5dc',transparent:true,opacity:.28,roughness:.5}));m.position.set(x,1.8,z);g.add(m);for(const a of [-1,1])for(const b of [-1,1])box(x+a*w*.5,.95,z+b*d*.5,.045,1.8,.045,'#f0eedb',g)}
venueModels.set(v.id,g);const b=document.createElement('button');b.className='citypin';b.dataset.id=v.id;b.onclick=()=>choose(v.id);overlay.append(b);markers.set(v.id,b)}
function initializeCity(){try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true});}catch(e){canvas.hidden=true;const p=document.createElement('p');p.className='webglerror';p.textContent='Для объёмной карты включите аппаратное ускорение браузера. Выбор и бронирование доступны через список.';canvas.parentElement.append(p);return}
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
scene=new THREE.Scene();scene.background=new THREE.Color('#c2e4e4');camera=new THREE.OrthographicCamera(-15,15,15,-15,.1,350);hemi=new THREE.HemisphereLight('#fff7e4','#b9c6b6',2);scene.add(hemi);sun=new THREE.DirectionalLight('#fff1d9',3.2);sun.position.set(15,45,20);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-24,right:24,top:24,bottom:-24,near:1,far:100});sun.shadow.bias=-.0006;sun.shadow.normalBias=.04;sun.shadow.radius=4;scene.add(sun,sun.target);
roundGeo=new THREE.BoxGeometry(1,1,1,4,4,4);const pos=roundGeo.attributes.position;for(let i=0;i<pos.count;i++){const p=new THREE.Vector3().fromBufferAttribute(pos,i),q=p.clone().clampScalar(-.43,.43),n=p.clone().sub(q).normalize().multiplyScalar(.07);p.copy(q).add(n);pos.setXYZ(i,p.x,p.y,p.z)}roundGeo.computeVertexNormals();boxGeo=new THREE.BoxGeometry(1,1,1);sphereGeo=new THREE.SphereGeometry(1,16,12);cylinderGeo=new THREE.CylinderGeometry(1,1,1,10);
box(40,-.2,40,85,.4,85,'#9ecb7c');for(let k=0;k<=80;k+=8){box(k,0,40,1.65,.08,82,'#f7edd7');box(40,0,k,82,.08,1.65,'#f7edd7');box(k,.045,40,1.1,.04,82,'#a4a7b3');box(40,.045,k,82,.04,1.1,'#a4a7b3');for(let j=1.8;j<80;j+=2){stripe(k,j,.035,.6,'#f9f0d6',scene,.075);stripe(j,k,.6,.035,'#f9f0d6',scene,.075)}for(let j=0;j<=80;j+=8)for(let n=0;n<5;n++){stripe(k-.42+n*.2,j+1.05,.1,.6,'#fff5dd',scene,.075);stripe(k+1.05,j-.42+n*.2,.6,.1,'#fff5dd',scene,.075)}}
for(let bx=0;bx<10;bx++)for(let bz=0;bz<10;bz++){const x=bx*8+2,z=bz*8+2,seed=bx*31+bz*17;for(let i=0;i<4;i++){const xx=x+(i%2)*2.6+rand(seed+i)*.4,zz=z+Math.floor(i/2)*2.6+rand(seed+i+80)*.4,w=1.4+rand(seed+i+2)*.6,d=1.5+rand(seed+i+22)*.5;if(venues.some(v=>xx-w/2<v.x+v.w+.8&&xx+w/2>v.x-.8&&zz-d/2<v.y+v.d+.8&&zz+d/2>v.y-.8))continue;const kind=['house','cafe','shop','tower','house','mall','kiosk'][(seed+i)%7];makeBuilding(xx,zz,w,d,kind==='tower'?4+rand(seed)*2:kind==='house'?1.7+rand(seed+i)*.7:1.7+rand(seed+i)*.8,kind,seed+i)}for(let i=0;i<3;i++){const xx=x+i*1.7,zz=z+4.6;if(!venues.some(v=>xx>v.x-.5&&xx<v.x+v.w+.5&&zz>v.y-.5&&zz<v.y+v.d+.5))makeTree(xx,zz,seed+i)}makeCar(bx*8,bz*8+2.5+rand(seed)*2,seed);makeLamp(bx*8+.8,bz*8+2)}
for(const [x,z] of [[12,12],[60,20],[12,60]]){box(x,.08,z,3,.14,3,'#e8d8bc');shape(cylinderGeo,'#f4ead7',x,.23,z,.9,.25,.9);shape(cylinderGeo,'#8ad2d7',x,.38,z,.75,.07,.75);shape(cylinderGeo,'#f2e6ce',x,.57,z,.32,.45,.32);shape(cylinderGeo,'#a4e5e8',x,.81,z,.4,.06,.4);ball(x,1.1,z,.09,'#d7fbf6');}
for(const {geo,mat,transforms} of batches.values()){const mesh=new THREE.InstancedMesh(geo,mat,transforms.length);transforms.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh)}staticBuilding=false;venues.forEach(courtModel);cityReady=true;resize();overview()}
function positionCamera(){camera.position.set(center.x+Math.cos(azimuth)*40,38,center.z+Math.sin(azimuth)*40);camera.lookAt(center.x,0,center.z);camera.updateMatrixWorld();sun.position.set(center.x-12,35,center.z-8);sun.target.position.set(center.x,0,center.z);sun.target.updateMatrixWorld()}
// Подсветка окон и спортивных площадок.
let nightLightingCreated = false;
const courtGlows = [];

function updateNightLighting() {
  // Оконные материалы, которые используются в моделях домов.
  for (const color of ['#78b2c1', '#81b7c3']) {
    const material = materialCache.get(color + 'false');

    if (material) {
      material.emissive.set('#ffc46b');
      material.emissiveIntensity = night ? 1.8 : 0;
    }
  }

  // Свечение покрытия всех видов спортивных площадок.
  const courtColors = [
    '#82afd4', // Теннис.
    '#82be6b', // Футбол.
    '#e6a47e', // Баскетбол.
    '#eddaa7', // Волейбол.
    '#a5c789', // Покрытие теннисного корта.
    '#91c573', // Полосы футбольного газона.
    '#9bd17c',
    '#85bdb5'  // Центральная зона баскетбольной площадки.
  ];

  for (const color of courtColors) {
    const material = materialCache.get(color + 'false');

    if (material) {
      material.emissive.set(color);
      material.emissiveIntensity = night ? 0.55 : 0;
    }
  }

  // Светящаяся разметка.
  const markings = materialCache.get('#fff7dffalse');

  if (markings) {
    markings.emissive.set('#fff5cb');
    markings.emissiveIntensity = night ? 0.9 : 0;
  }

  // Мягкие ореолы вокруг площадок создаются один раз.
  if (!nightLightingCreated) {
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 128;
    glowCanvas.height = 128;

    const context = glowCanvas.getContext('2d');
    const gradient = context.createRadialGradient(
      64, 64, 10,
      64, 64, 64
    );

    gradient.addColorStop(0, 'rgba(255, 235, 160, 0.65)');
    gradient.addColorStop(0.55, 'rgba(255, 235, 160, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 235, 160, 0)');

    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);

    const texture = new THREE.CanvasTexture(glowCanvas);

    for (const venue of venues) {
      const group = venueModels.get(venue.id);
      if (!group) continue;

      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
        side: THREE.DoubleSide
      });

      const glow = new THREE.Mesh(
        new THREE.PlaneGeometry(
          venue.w + 3,
          venue.d + 3
        ),
        material
      );

      glow.rotation.x = -Math.PI / 2;
      glow.position.set(
        venue.x + venue.w / 2,
        0.103,
        venue.y + venue.d / 2
      );

      // Ореол скрывается вместе с площадкой при фильтрации.
      group.add(glow);
      courtGlows.push(glow);
    }

    nightLightingCreated = true;
  }

  for (const glow of courtGlows) {
    glow.visible = night;
  }
}
function draw(){if(!cityReady)return;const visible=new Set(filtered().map(v=>v.id));positionCamera();scene.background.set(night?'#314d66':'#c2e4e4');hemi.intensity=night?.8:1.4;sun.intensity=night?.6:2.2;sun.color.set(night?'#a4bdff':'#fff1d9');renderer.toneMappingExposure=night?1:1.0;
for(const v of venues){const g=venueModels.get(v.id),b=markers.get(v.id);g.visible=visible.has(v.id);if(!g.visible){b.hidden=true;continue}const p=new THREE.Vector3(v.x+v.w/2,v.stadium?2.3:1.5,v.y+v.d/2).project(camera);b.hidden=Math.abs(p.x)>1.25||Math.abs(p.y)>1.25;b.style.left=(p.x*.5+.5)*width+'px';b.style.top=(-p.y*.5+.5)*height+'px';b.className='citypin'+(selected===v.id?' chosen':'')+(occupied(v)?' busy':'');b.textContent=occupied(v)?'🔒 Занята':selected===v.id?'◎ Выбрана':icons[v.id%4]+' '+v.price+' ₽';b.setAttribute('aria-label',v.name+', '+status(v)+', '+money(v.price)+' в час');b.disabled=occupied(v)}updateNightLighting();
renderer.render(scene, camera);
drawMini();}
function drawMini(){mc.clearRect(0,0,180,110);mc.fillStyle=night?'#44625b':'#9ecb7c';mc.fillRect(0,0,180,110);mc.strokeStyle='#f7eddb';mc.lineWidth=2;for(let k=0;k<=80;k+=8){mc.beginPath();mc.moveTo(k*2.25,0);mc.lineTo(k*2.25,110);mc.moveTo(0,k*1.375);mc.lineTo(180,k*1.375);mc.stroke()}filtered().forEach(v=>{mc.fillStyle=occupied(v)?'#8d929b':'#528f9d';mc.fillRect(v.x*2.25,v.y*1.375,5,4)});mc.strokeStyle='#32575f';mc.lineWidth=1.5;mc.strokeRect((center.x-viewSize*.55)*2.25,(center.z-viewSize*.55)*1.375,viewSize*1.1*2.25,viewSize*1.1*1.375)}
function resize(){if(!cityReady)return;const r=canvas.getBoundingClientRect();width=r.width;height=r.height;renderer.setSize(width,height,false);const a=width/height;camera.left=-viewSize*a/2;camera.right=viewSize*a/2;camera.top=viewSize/2;camera.bottom=-viewSize/2;camera.updateProjectionMatrix();draw()}
function overview(){viewSize=22;center.x=34;center.z=34;azimuth=Math.PI/4;resize()}
function focusVenue(id){const v=venues[id],sx=center.x,sz=center.z,tx=v.x+v.w/2,tz=v.y+v.d/2;let start;function tick(t){start??=t;const f=Math.min(1,(t-start)/350),a=1-Math.pow(1-f,3);center.x=sx+(tx-sx)*a;center.z=sz+(tz-sz)*a;draw();if(f<1)requestAnimationFrame(tick)}requestAnimationFrame(tick)}
function scale(f){viewSize=Math.max(8,Math.min(95,viewSize/f));resize()}
function pan(dx,dz){const c=Math.cos(azimuth),s=Math.sin(azimuth);center.x=Math.max(-2,Math.min(82,center.x+dx*s+dz*c));center.z=Math.max(-2,Math.min(82,center.z-dx*c+dz*s));draw()}
$('rotateleft').onclick=()=>{azimuth-=Math.PI/8;draw()};$('rotateright').onclick=()=>{azimuth+=Math.PI/8;draw()};$('plus').onclick=()=>scale(1.2);$('minus').onclick=()=>scale(1/1.2);$('overview').onclick=overview;for(const [id,x,z] of [['left',-2,0],['right',2,0],['up',0,-2],['down',0,2]])$(id).onclick=()=>pan(x,z);
canvas.addEventListener('wheel',e=>{e.preventDefault();scale(e.deltaY<0?1.1:1/1.1)},{passive:false});const pointers=new Map();let moved=false,drag=null,pinch=0;canvas.onpointerdown=e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});drag={x:e.clientX,y:e.clientY};moved=false};canvas.onpointermove=e=>{if(!pointers.has(e.pointerId))return;const prev=pointers.get(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2){moved=true;const a=[...pointers.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);if(pinch)scale(d/pinch);pinch=d;return}if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>4)moved=true;pan(-(e.clientX-prev.x)*viewSize/height,-(e.clientY-prev.y)*viewSize/height*1.5)};canvas.onpointerup=e=>{if(!moved&&cityReady){const r=canvas.getBoundingClientRect(),ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((e.clientX-r.left)/width*2-1,-(e.clientY-r.top)/height*2+1),camera);const point=new THREE.Vector3();if(ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),0),point)){const v=filtered().find(v=>point.x>=v.x&&point.x<=v.x+v.w&&point.z>=v.y&&point.z<=v.y+v.d);if(v)choose(v.id)}}pointers.delete(e.pointerId);pinch=0};canvas.onpointercancel=()=>{pointers.clear();pinch=0};canvas.onkeydown=e=>{const d={ArrowLeft:[-2,0],ArrowRight:[2,0],ArrowUp:[0,-2],ArrowDown:[0,2]};if(d[e.key]){e.preventDefault();pan(...d[e.key])}if(['+','=','-','Home','q','e'].includes(e.key)){e.preventDefault();if(e.key==='Home')overview();else if(e.key==='q'||e.key==='e'){azimuth+=e.key==='q'?-.15:.15;draw()}else scale(e.key==='-'?1/1.2:1.2)}};
mini.style.cursor='pointer';mini.onclick=e=>{const r=mini.getBoundingClientRect();center.x=(e.clientX-r.left)/r.width*80;center.z=(e.clientY-r.top)/r.height*80;draw()};window.addEventListener('resize',resize);window.addEventListener('storage',e=>{if(e.key==='citysport-v1')location.reload()});
initializeCity();render();
