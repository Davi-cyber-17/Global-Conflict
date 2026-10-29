'use strict';
const $=s=>document.querySelector(s), NS='http://www.w3.org/2000/svg';
const COL=['#8e44d6','#6fcf2a','#e0303f','#f4d31c','#34c3e6','#2b2b33','#f58a1f','#ec5aa8'];
const CONT={na:['América do Norte',5,'#f0a81c',50,333],sa:['América do Sul',2,'#6fcf2a',135,423],eu:['Europa',5,'#34c3e6',620,58],af:['África',3,'#e64fa3',470,462],as:['Ásia',7,'#f4d31c',885,58],oc:['Oceania',2,'#e0303f',715,438]};
// nome, x, y, continente
const T=[['Alasca',75,135,'na'],['Mackenzie',185,150,'na'],['Groenlândia',340,80,'na'],['Vancouver',170,190,'na'],['Ottawa',245,185,'na'],['Labrador',315,185,'na'],['Califórnia',190,240,'na'],['Nova York',275,240,'na'],['México',215,290,'na'],
['Venezuela',310,310,'sa'],['Peru',300,375,'sa'],['Brasil',370,365,'sa'],['Argentina',320,430,'sa'],
['Islândia',430,90,'eu'],['Inglaterra',465,155,'eu'],['Suécia',565,125,'eu'],['Alemanha',520,185,'eu'],['França',480,225,'eu'],['Polônia',575,205,'eu'],['Moscou',635,175,'eu'],
['Argélia',495,295,'af'],['Egito',575,265,'af'],['Sudão',615,325,'af'],['Congo',570,350,'af'],['África do Sul',580,400,'af'],['Madagascar',665,355,'af'],
['Oriente Médio',650,245,'as'],['Omsk',690,160,'as'],['Dudinka',745,150,'as'],['Sibéria',820,120,'as'],['Tchita',815,180,'as'],['Mongólia',815,220,'as'],['Vladivostok',940,150,'as'],['China',820,265,'as'],['Aral',715,215,'as'],['Índia',745,275,'as'],['Vietnã',815,315,'as'],['Japão',955,275,'as'],
['Sumatra',830,385,'oc'],['Bornéu',895,345,'oc'],['Nova Guiné',1000,340,'oc'],['Austrália',945,440,'oc']];
const E=`Alasca-Mackenzie,Alasca-Vancouver,Alasca-Vladivostok,Mackenzie-Vancouver,Mackenzie-Ottawa,Mackenzie-Groenlândia,Groenlândia-Ottawa,Groenlândia-Labrador,Groenlândia-Islândia,Vancouver-Ottawa,Vancouver-Califórnia,Ottawa-Labrador,Ottawa-Califórnia,Ottawa-Nova York,Labrador-Nova York,Califórnia-Nova York,Califórnia-México,Nova York-México,México-Venezuela,Venezuela-Peru,Venezuela-Brasil,Peru-Brasil,Peru-Argentina,Brasil-Argentina,Brasil-Argélia,Islândia-Inglaterra,Islândia-Suécia,Inglaterra-Suécia,Inglaterra-Alemanha,Inglaterra-França,Suécia-Alemanha,Suécia-Moscou,Alemanha-França,Alemanha-Polônia,França-Polônia,França-Argélia,França-Egito,Polônia-Moscou,Polônia-Egito,Polônia-Oriente Médio,Moscou-Oriente Médio,Moscou-Omsk,Moscou-Aral,Argélia-Egito,Argélia-Sudão,Argélia-Congo,Egito-Sudão,Egito-Oriente Médio,Sudão-Congo,Sudão-África do Sul,Sudão-Madagascar,Congo-África do Sul,África do Sul-Madagascar,Oriente Médio-Aral,Oriente Médio-Índia,Aral-Omsk,Aral-China,Aral-Índia,Omsk-Dudinka,Omsk-China,Omsk-Mongólia,Dudinka-Sibéria,Dudinka-Tchita,Dudinka-Mongólia,Sibéria-Tchita,Sibéria-Vladivostok,Tchita-Vladivostok,Tchita-Mongólia,Tchita-China,Mongólia-China,Vladivostok-China,Vladivostok-Japão,China-Japão,China-Índia,China-Vietnã,Índia-Vietnã,Vietnã-Sumatra,Vietnã-Bornéu,Sumatra-Austrália,Bornéu-Nova Guiné,Bornéu-Austrália,Nova Guiné-Austrália`.split(',');
const ID={};T.forEach((t,i)=>ID[t[0]]=i);
const ADJ=T.map(()=>[]), EDGES=E.map(e=>{const[a,b]=e.split('-').map(n=>ID[n]);ADJ[a].push(b);ADJ[b].push(a);return[a,b]});

const PCFG={debug:0,config:{iceCandidatePoolSize:4,iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:global.stun.twilio.com:3478'},{urls:['turn:openrelay.metered.ca:80','turn:openrelay.metered.ca:443','turn:openrelay.metered.ca:443?transport=tcp'],username:'openrelayproject',credential:'openrelayproject'}]}};
let amt=1,G=null,mode=null,me=0,sel=null,key='',peer=null,conns=[],hostConn=null,lobby=[],isHost=false;

/* ---------- telas ---------- */
function show(id){document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('on',s.id===id))}
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>show(b.dataset.go));
const nSel=$('#nLocal');for(let i=2;i<=8;i++)nSel.add(new Option(i,i));
function names(){const n=+nSel.value,d=$('#names');const old=[...d.children].map(i=>i.value);d.innerHTML='';for(let i=0;i<n;i++){const x=document.createElement('input');x.maxLength=14;x.placeholder='Jogador '+(i+1);x.value=old[i]||'';d.append(x)}}
nSel.onchange=names;nSel.value=2;names();
$('#startLocal').onclick=()=>{mode='local';newGame([...$('#names').children].map((x,i)=>x.value.trim()||'Jogador '+(i+1)));show('game');render()};

/* ---------- regras ---------- */
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
function bonus(s,p){let c=0;s.owner.forEach(o=>o===p&&c++);let b=Math.max(3,c>>1);for(const k in CONT)if(T.every((t,i)=>t[3]!==k||s.owner[i]===p))b+=CONT[k][1];return b}
function newGame(list){const n=list.length,owner=[];shuffle(T.map((_,i)=>i)).forEach((t,i)=>owner[t]=i%n);
 G={players:list.map((name,i)=>({name,color:COL[i],alive:true})),owner,armies:T.map(()=>1),turn:0,phase:'place',pool:0,last:null,msg:'',winner:null};G.pool=bonus(G,0)}
function reach(p,f){const seen=new Set([f]),q=[f];while(q.length){const c=q.pop();ADJ[c].forEach(n=>{if(!seen.has(n)&&G.owner[n]===p){seen.add(n);q.push(n)}})}seen.delete(f);return seen}
const roll=n=>Array.from({length:n},()=>1+Math.random()*6|0).sort((a,b)=>b-a);
function act(a,p){const s=G;if(!s||s.winner!=null||p!==s.turn)return;const o=s.owner,ar=s.armies;
 if(a.k==='place'&&s.phase==='place'&&o[a.t]===p&&s.pool>0){const n=Math.max(1,Math.min(a.n||1,s.pool));ar[a.t]+=n;s.pool-=n;if(s.pool===0)s.phase='attack'}
 else if(a.k==='attack'&&s.phase==='attack'&&o[a.f]===p&&o[a.t]!==p&&ADJ[a.f].includes(a.t)&&ar[a.f]>1){let n=a.blitz?60:1,la=0,ld=0;while(n--&&ar[a.f]>1&&o[a.t]!==p){
  const ad=roll(Math.min(3,ar[a.f]-1)),dd=roll(Math.min(3,ar[a.t]));
  for(let i=0;i<Math.min(ad.length,dd.length);i++)ad[i]>dd[i]?(ar[a.t]--,ld++):(ar[a.f]--,la++);
  s.last={ad,dd};s.msg='';
  if(ar[a.t]<=0){const def=o[a.t],mv=Math.min(ad.length,ar[a.f]-1);o[a.t]=p;ar[a.t]=mv;ar[a.f]-=mv;s.msg=`${T[a.t][0]} conquistado!`;
   if(!o.includes(def)){s.players[def].alive=false;s.msg+=` ${s.players[def].name} foi eliminado.`}
   const vivos=s.players.filter(x=>x.alive);if(vivos.length===1)s.winner=p}}
  if(a.blitz)s.msg=(s.msg?s.msg+' ':'')+`Perdas: você ${la}, inimigo ${ld}.`}
 else if(a.k==='move'&&s.phase==='move'&&o[a.f]===p&&o[a.t]===p&&ar[a.f]>1&&reach(p,a.f).has(a.t)){const n=Math.max(1,Math.min(a.n||1,ar[a.f]-1));ar[a.f]-=n;ar[a.t]+=n}
 else if(a.k==='end'&&(s.phase==='attack'||s.phase==='move'))endTurn(s);
 else if(a.k==='next'){if(s.phase==='attack'){s.phase='move'}else if(s.phase==='move'){endTurn(s)}}
 else return;
 if(isHost||mode==='local')sync()}
function endTurn(s){const n=s.players.length;do{s.turn=(s.turn+1)%n}while(!s.players[s.turn].alive);s.phase='place';s.pool=bonus(s,s.turn);s.last=null;s.msg=''}
function sync(){if(isHost)conns.forEach((c,i)=>c.open&&c.send({t:'state',G,me:i+1}));render()}
function send(a){if(mode==='local')act(a,G.turn);else if(isHost)act(a,0);else hostConn&&hostConn.send({t:'act',a})}

/* ---------- online (PeerJS / WebRTC, sem servidor próprio) ---------- */
const nick=()=>$('#nick').value.trim()||'Jogador';
const mkCode=()=>Array.from({length:4},()=>'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.random()*24|0]).join('');
function reset(){if(peer)peer.destroy();peer=null;conns=[];hostConn=null;lobby=[];isHost=false;G=null}
function drawLobby(){$('#plist').innerHTML=lobby.map((n,i)=>`<li><i class="dot" style="background:${COL[i]}"></i>${n.replace(/</g,'&lt;')}${i===0?' (anfitrião)':''}</li>`).join('');$('#startOnline').style.display=isHost?'':'none';$('#startOnline').disabled=lobby.length<2}
function bcastLobby(){conns.forEach(c=>c.open&&c.send({t:'lobby',list:lobby}));drawLobby()}
$('#mkRoom').onclick=()=>{reset();const code=mkCode();isHost=true;mode='online';me=0;lobby=[nick()];
 $('#onMsg').textContent='Criando sala…';peer=new Peer('wwar-'+code,PCFG);
 peer.on('error',e=>{if(e.type==='unavailable-id')$('#mkRoom').click();else $('#onMsg').textContent='Erro de conexão. Tente de novo.'});
 peer.on('open',()=>{$('#roomCode').textContent=code;$('#lobMsg').textContent='';drawLobby();show('lobby')});
 peer.on('connection',c=>{c.on('data',m=>{
   if(m.t==='join'){if(G||lobby.length>=8){c.send({t:'full'});setTimeout(()=>c.close(),300);return}c._seat=lobby.length;conns.push(c);lobby.push((m.name||'Jogador').slice(0,14));bcastLobby()}
   else if(m.t==='act'&&G&&c._seat!=null)act(m.a,c._seat)});
  c.on('close',()=>{if(!G){const i=conns.indexOf(c);if(i>=0){conns.splice(i,1);lobby.splice(i+1,1);conns.forEach((x,j)=>x._seat=j+1);bcastLobby()}}else{$('#pdesc')&&(G.msg=(G.players[c._seat]?.name||'Jogador')+' saiu da partida.');sync()}})})};
$('#joinRoom').onclick=()=>{const code=$('#code').value.trim().toUpperCase();if(code.length!==4){$('#onMsg').textContent='Digite o código de 4 letras.';return}
 reset();mode='online';$('#onMsg').textContent='Entrando…';peer=new Peer(PCFG);const to=setTimeout(()=>{if(!lobby.length)$('#onMsg').textContent='Não conectou. Confira o código e a internet dos dois aparelhos.'},15000);
 peer.on('error',e=>$('#onMsg').textContent=e.type==='peer-unavailable'?'Sala não encontrada.':'Erro de conexão. Tente de novo.');
 peer.on('open',()=>{const c=peer.connect('wwar-'+code,{reliable:true});hostConn=c;
  c.on('open',()=>c.send({t:'join',name:nick()}));
  c.on('data',m=>{clearTimeout(to);if(m.t==='lobby'){lobby=m.list;$('#roomCode').textContent=code;$('#lobMsg').textContent='Aguardando o anfitrião iniciar…';drawLobby();show('lobby')}
   else if(m.t==='state'){G=m.G;me=m.me;show('game');render()}
   else if(m.t==='full'){$('#onMsg').textContent='Sala cheia ou jogo já iniciado.';show('online')}});
  c.on('close',()=>{if(G){G.msg='Conexão com o anfitrião perdida.';render()}else{$('#onMsg').textContent='Sala fechada.';show('online')}})})};
$('#startOnline').onclick=()=>{if(lobby.length<2)return;newGame(lobby);show('game');sync()};
$('#leave').onclick=()=>{reset();show('online')};

/* ---------- desenho ---------- */
const hex=(x,y,r)=>[0,1,2,3,4,5].map(k=>(x+r*Math.cos(k*Math.PI/3+Math.PI/6)).toFixed(1)+','+(y+r*Math.sin(k*Math.PI/3+Math.PI/6)).toFixed(1)).join(' ');
const el=(n,a={},p)=>{const e=document.createElementNS(NS,n);for(const k in a)e.setAttribute(k,a[k]);p&&p.append(e);return e};
function render(){if(!G)return;const svg=$('#map');
 if(mode==='local')me=G.turn;
 const k=G.turn+G.phase;if(k!==key){key=k;sel=null;amt=1}
 if(sel!=null&&(G.owner[sel]!==me||G.armies[sel]<2))sel=null;
 svg.innerHTML='';if(!vb)fit();setVB();
 EDGES.forEach(([a,b])=>{const A=T[a],B=T[b];if(Math.abs(A[1]-B[1])>600){const[l,r]=A[1]<B[1]?[A,B]:[B,A];el('line',{x1:l[1],y1:l[2],x2:0,y2:l[2]-10,class:'ln'},svg);el('line',{x1:r[1],y1:r[2],x2:1080,y2:r[2]-10,class:'ln'},svg)}else el('line',{x1:A[1],y1:A[2],x2:B[1],y2:B[2],class:'ln'},svg)});
 svg.querySelectorAll('.ln').forEach(l=>{l.setAttribute('stroke','#9fb4ff55');l.setAttribute('stroke-width','2');l.setAttribute('stroke-dasharray','2 5')});
 for(const c in CONT){const[nm,b,col,x,y]=CONT[c],g=el('g',{class:'cb'},svg);el('rect',{x:x-62,y:y-14,width:124,height:28,rx:14,fill:'#0b1236',stroke:col,'stroke-width':3},g);el('text',{x,y,fill:'#fff'},g).textContent=nm.toUpperCase()+'  +'+b}
 const ok=i=>G.turn===me&&G.winner==null&&sel==null&&G.owner[i]===me&&G.armies[i]>1&&(G.phase==='attack'?ADJ[i].some(n=>G.owner[n]!==me):G.phase==='move'?reach(me,i).size>0:false);
 const tg=new Set();if(G.turn===me&&G.winner==null&&sel!=null){if(G.phase==='attack')ADJ[sel].forEach(n=>G.owner[n]!==me&&tg.add(n));else if(G.phase==='move')reach(me,sel).forEach(n=>tg.add(n))}
 T.forEach((t,i)=>{const g=el('g',{class:'t'+(sel===i?' sel':'')+(tg.has(i)?' tg':'')+(ok(i)?' ok':''),tabindex:0,role:'button','aria-label':`${t[0]}, ${G.armies[i]} exércitos, ${G.players[G.owner[i]].name}`},svg);
  el('circle',{cx:t[1],cy:t[2],r:34,fill:'transparent'},g);
  el('circle',{class:'r',cx:t[1],cy:t[2],r:31,fill:'none'},g);
  el('polygon',{class:'b',points:hex(t[1],t[2],26),fill:G.players[G.owner[i]].color,stroke:CONT[t[3]][2]},g);
  el('polygon',{points:hex(t[1],t[2],14),fill:'#02060f'},g);el('text',{class:'c',x:t[1],y:t[2]},g).textContent=G.armies[i];
  el('text',{class:'n',x:t[1],y:t[2]+42},g).textContent=t[0];
  g.onclick=()=>{if(!moved)click(i)};g.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();click(i)}}});
 $('#bar').innerHTML=G.players.map((p,i)=>`<span class="${i===G.turn?'cur':''} ${p.alive?'':'dead'}"><i class="dot" style="background:${p.color}"></i>${p.name.replace(/</g,'&lt;')}${mode==='online'&&i===me?' (você)':''} · ${G.owner.filter(o=>o===i).length}</span>`).join('');
 const mine=G.turn===me,pl=G.players[G.turn],ph=G.phase;
 $('#who').style.background=pl.color;
 let ti,de;
 if(G.winner!=null){ti=G.players[G.winner].name+' venceu!';de='O mundo foi conquistado.'}
 else if(!mine){ti='Vez de '+pl.name;de='Aguarde sua vez.'}
 else if(ph==='place'){ti='1/3 · Reforçar';de='Toque nos seus territórios para colocar exércitos (escolha 1, 5 ou Tudo).'}
 else if(ph==='attack'){ti='2/3 · Atacar';de=sel==null?'Toque num território seu brilhante (2+ exércitos).':'Agora toque num vizinho inimigo com borda verde. Conquiste ao menos 1 para vencer.'}
 else{ti='3/3 · Mover tropas';de=sel==null?'Opcional: toque na origem e depois no destino conectado.':'Toque no destino (verde). Depois encerre o turno.'}
 $('#ptitle').textContent=ti;$('#pdesc').textContent=G.msg||de;
 const l=G.last;$('#dice').textContent=l&&ph!=='place'?`Ataque ${l.ad.join(' ')}  ×  Defesa ${l.dd.join(' ')}`:'';
 $('#poolN').textContent=G.pool;
 const nx=$('#next');nx.disabled=!mine||G.winner!=null||ph==='place';
 nx.textContent=G.winner!=null?'Novo jogo':ph==='attack'?'Mover tropas':'Encerrar turno';
 if(G.winner!=null){nx.disabled=false}
 const en=$('#end');en.style.display=mine&&ph==='attack'&&G.winner==null?'':'none';
 const am=$('#amt'),ops=ph==='attack'?[[1,'1 rodada'],['all','Até vencer']]:[[1,'1'],[5,'5'],['all','Tudo']];
 am.innerHTML=mine&&G.winner==null?ops.map(([v,l])=>`<button class="chip${amt===v?' on':''}" data-v="${v}">${l}</button>`).join(''):'';
 if(mine&&G.turn+G.phase!==lastK){lastK=G.turn+G.phase;try{navigator.vibrate&&navigator.vibrate(40)}catch(e){}}}
let lastK='';
$('#amt').onclick=e=>{const b=e.target.closest('.chip');if(!b)return;amt=b.dataset.v==='all'?'all':+b.dataset.v;render()};
$('#end').onclick=()=>send({k:'end'});
function click(i){if(!G||G.winner!=null||G.turn!==me)return;const own=G.owner[i]===me;
 if(G.phase==='place'){if(own)send({k:'place',t:i,n:amt==='all'?99:amt})}
 else if(G.phase==='attack'){if(own){sel=G.armies[i]>1?i:null;render()}else if(sel!=null&&ADJ[sel].includes(i))send({k:'attack',f:sel,t:i,blitz:amt==='all'})}
 else if(own){if(sel!=null&&sel!==i&&reach(me,sel).has(i))send({k:'move',f:sel,t:i,n:amt==='all'?99:amt});else{sel=G.armies[i]>1?i:null;render()}}}
$('#next').onclick=()=>{if(G&&G.winner!=null)location.reload();else send({k:'next'})};

/* ---------- zoom e arrastar (toque, mouse, pinça) ---------- */
let vb=null,moved=false;const ptr=new Map(),MW=1080,MH=580;
const map=$('#map');
function fit(){const r=map.getBoundingClientRect(),a=r.width/Math.max(r.height,1);vb=a<.9?{x:260,y:30,w:560,h:560/a}:{x:0,y:0,w:Math.max(MW,MH*a),h:MH};vb.x=Math.min(vb.x,MW-vb.w+60);}
function setVB(){vb.w=Math.max(220,Math.min(vb.w,MW*1.4));vb.h=vb.w*(vb.h/vb.w);const k=sc();map.style.setProperty('--nf',Math.min(20,Math.max(13,10*k)).toFixed(1)+'px');map.style.setProperty('--cf',Math.min(16,Math.max(12,9*k)).toFixed(1)+'px');map.setAttribute('viewBox',`${vb.x} ${vb.y} ${vb.w} ${vb.h}`)}
function sc(){const r=map.getBoundingClientRect();return Math.max(vb.w/r.width,vb.h/r.height)}
function zoom(f,cx,cy){const r=map.getBoundingClientRect(),k=sc(),px=vb.x+(cx-r.left)*k,py=vb.y+(cy-r.top)*k,nw=Math.max(220,Math.min(MW*1.4,vb.w*f)),f2=nw/vb.w;vb.x=px-(px-vb.x)*f2;vb.y=py-(py-vb.y)*f2;vb.w=nw;vb.h*=f2;setVB()}
map.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY>0?1.12:.89,e.clientX,e.clientY)},{passive:false});
map.addEventListener('pointerdown',e=>{ptr.set(e.pointerId,{x:e.clientX,y:e.clientY});moved=false});
map.addEventListener('pointermove',e=>{const p=ptr.get(e.pointerId);if(!p)return;
 if(ptr.size===2){const o=[...ptr.entries()].find(([id])=>id!==e.pointerId)[1],d0=Math.hypot(p.x-o.x,p.y-o.y),d1=Math.hypot(e.clientX-o.x,e.clientY-o.y);if(d0>0&&Math.abs(d1-d0)>1){zoom(d0/d1,(e.clientX+o.x)/2,(e.clientY+o.y)/2);moved=true}}
 else{const dx=e.clientX-p.x,dy=e.clientY-p.y;if(moved||Math.hypot(dx,dy)>8){moved=true;const k=sc();vb.x-=dx*k;vb.y-=dy*k;setVB();p.x=e.clientX;p.y=e.clientY;return}}
 p.x=e.clientX;p.y=e.clientY});
['pointerup','pointercancel','pointerleave'].forEach(t=>map.addEventListener(t,e=>{ptr.delete(e.pointerId);setTimeout(()=>{if(!ptr.size)moved=false},60)}));
$('#zin').onclick=()=>{const r=map.getBoundingClientRect();zoom(.8,r.left+r.width/2,r.top+r.height/2)};
$('#zout').onclick=()=>{const r=map.getBoundingClientRect();zoom(1.25,r.left+r.width/2,r.top+r.height/2)};
$('#zfit').onclick=()=>{fit();setVB()};
addEventListener('resize',()=>{if(G){fit();setVB()}});

/* ---------- como jogar ---------- */
const help=$('#help'),openH=()=>help.classList.add('on'),closeH=()=>{help.classList.remove('on');try{localStorage.setItem('ww-help','1')}catch(e){}};
$('#howto').onclick=openH;$('#zhelp').onclick=openH;$('#hclose').onclick=closeH;help.onclick=e=>{if(e.target===help)closeH()};
addEventListener('keydown',e=>{if(e.key==='Escape')closeH()});
const _show=show;show=function(id){_show(id);if(id==='game'){try{if(!localStorage.getItem('ww-help'))openH()}catch(e){}}};
