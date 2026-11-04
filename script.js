const $=id=>document.getElementById(id);

function buildSteps(id, color, list){
  const el=$(id);
  el.style.setProperty('--c', color);
  list.forEach((s,i)=>{
    const d=document.createElement('div');
    d.className='step'+(i?'':' on');
    d.innerHTML=`<div class="n">${String(i+1).padStart(2,'0')}</div><div><strong>${s[0]}</strong><p>${s[1]}</p></div>`;
    d.onclick=()=>{[...el.children].forEach(x=>x.classList.remove('on'));d.classList.add('on')};
    el.appendChild(d);
  });
  let k=0;
  setInterval(()=>{
    if(!document.body.contains(el)||!el.offsetParent)return;
    [...el.children].forEach(x=>x.classList.remove('on'));
    k=(k+1)%list.length;
    el.children[k].classList.add('on');
  },3800);
}
buildSteps('hsSteps','#ff922b',[
  ['Atur parameter','Tentukan nilai HMS, HMCR, PAR, dan jumlah iterasi maksimal. Seperti menyiapkan aturan band sebelum jam session.'],
  ['Isi Harmony Memory','Buat sejumlah jadwal secara acak sebanyak kapasitas HMS, lalu hitung nilai makespan masing-masing dan simpan ke dalam memori. Ini berfungsi sebagai "buku catatan" untuk kombinasi nada awal.'],
  ['Improvisasi harmoni baru','Untuk setiap tugas (task): pilih mesin virtual (VM) dari harmoni yang ada di memori berdasarkan peluang HMCR. Selanjutnya, lakukan penyesuaian (geser ke VM tetangga) berdasarkan peluang PAR. Jika tidak terpilih, tentukan VM secara acak.'],
  ['Perbarui memori','Hitung nilai makespan dari harmoni baru yang dihasilkan. Jika hasilnya lebih bagus daripada harmoni paling buruk yang tersimpan di memori, ganti harmoni terburuk tersebut dengan yang baru.'],
  ['Ulangi sampai selesai','Ulangi proses improvisasi dan pembaruan memori hingga batas maksimal iterasi terpenuhi. Harmoni terbaik yang tersisa di dalam memori akan menjadi hasil jadwal akhir.']
]);
buildSteps('csSteps','#4dabf7',[
  ['Buat populasi antibodi','Hasilkan sejumlah jadwal awal secara acak. Setiap jadwal = satu antibodi.'],
  ['Hitung affinity','Affinity = seberapa cocok antibodi dengan “kuman”. Di scheduling: affinity tinggi = makespan rendah.'],
  ['Seleksi terbaik','Ambil n antibodi dengan affinity tertinggi untuk diperbanyak.'],
  ['Kloning','Menggandakan antibodi yang telah lolos seleksi. Antibodi dengan peringkat terbaik akan mendapatkan jumlah salinan (klon) paling banyak.'],
  ['Hypermutation','Melakukan mutasi (perubahan) pada susunan antibodi. Antibodi yang sudah bagus hanya diubah sedikit agar tidak rusak, sedangkan antibodi yang kurang bagus dirombak lebih banyak untuk mencari alternatif baru (dengan memindahkan tugas ke VM lain).'],
  ['Seleksi ulang + receptor editing','Pilih yang terbaik dari induk dan klon untuk generasi berikutnya; ganti beberapa yang terburuk dengan antibodi acak baru agar variasi tetap terjaga.'],
  ['Ulangi','Mengulangi seluruh proses di atas sampai iterasi habis; antibodi terbaik = jadwal akhir.']
]);

let mem=[[0,1,2,1,0,2,1,0],[2,2,1,0,1,0,0,1],[1,0,0,2,2,1,2,2],[0,2,1,1,0,0,1,2]];
$('hmcr').oninput=e=>$('hv1').textContent=e.target.value;
$('par').oninput=e=>$('hv2').textContent=e.target.value;
function improv(){
  const H=+$('hmcr').value,P=+$('par').value,c=$('hsChips');
  c.innerHTML='';
  let n=[0,0,0];
  for(let i=0;i<8;i++){
    let v,t;
    if(Math.random()<H){
      v=mem[Math.floor(Math.random()*mem.length)][i];t='M';
      if(Math.random()<P){v=(v+(Math.random()<.5?1:2))%3;t='A'}
    }else{v=Math.floor(Math.random()*3);t='R'}
    n['MAR'.indexOf(t)]++;
    const d=document.createElement('div');
    d.className='mini-chip '+t;
    d.style.animationDelay=i*90+'ms';
    d.innerHTML=`${v}<small>T${i+1}·${t}</small>`;
    c.appendChild(d);
  }
  $('hsLog').textContent=`Memori: ${n[0]} nada · digeser: ${n[1]} · acak: ${n[2]}. Coba HMCR rendah → hasil makin acak (eksplorasi). HMCR tinggi → makin mirip memori (eksploitasi).`;
}

let ab=[];
function csaInit(){
  ab=Array.from({length:6},()=>20+Math.random()*50);
  showBars();
  $('csLog').textContent='Populasi awal dibuat acak.';
}
function showBars(){
  const b=$('bars');
  if(b.children.length!==ab.length){
    b.innerHTML='';
    ab.forEach(()=>{const d=document.createElement('div');d.className='bar';d.innerHTML='<span></span>';b.appendChild(d)});
  }
  const mx=Math.max(...ab);
  [...b.children].forEach((d,i)=>{
    d.style.height=(ab[i]*1.15)+'px';
    d.firstChild.textContent=ab[i].toFixed(0);
    d.style.opacity=.45+.55*ab[i]/mx;
    d.style.background=ab[i]===mx?'var(--ok)':'var(--cs)';
  });
}
function csaGen(){
  const o=[...ab].sort((a,b)=>b-a);
  let nw=[],clones=0;
  o.slice(0,3).forEach((a,r)=>{
    let best=a;
    const k=3-r;
    for(let j=0;j<k;j++){
      clones++;
      const m=(1-a/100)*28+3;
      const c=Math.min(100,Math.max(1,a+(Math.random()-.35)*m));
      if(c>best)best=c;
    }
    nw.push(best);
  });
  nw.push(...o.slice(3,5));
  nw.push(15+Math.random()*50);
  ab=nw;
  showBars();
  $('csLog').textContent=`${clones} klon dibuat dari 3 antibodi terbaik. Mutasi kecil untuk yang kuat, besar untuk yang lemah. Antibodi terlemah diganti satu antibodi acak (receptor editing). Batang hijau = terbaik.`;
}
csaInit();

const taskTimes=[[4,6,5],[7,3,4],[5,4,6],[6,5,3],[3,7,4],[5,4,7],[4,6,3],[6,3,5]];
let mode='hs', bestAssign=[], bestScore=Infinity, iteration=0, evaluations=0, timer=null, running=false, population=[];

function numTasks(){return +$('tasks').value}
function numVM(){return +$('vms').value}
function score(a){
  let loads=Array(numVM()).fill(0);
  a.forEach((vm,i)=>loads[vm]+=taskTimes[i][vm]);
  return Math.max(...loads);
}
function randomAssign(){return Array.from({length:numTasks()},()=>Math.floor(Math.random()*numVM()))}
function mutate(a,rate){
  let b=a.slice();
  for(let i=0;i<b.length;i++)if(Math.random()<rate)b[i]=Math.floor(Math.random()*numVM());
  if(Math.random()<.22){
    let i=Math.floor(Math.random()*b.length);
    b[i]=(b[i]+1+Math.floor(Math.random()*(numVM()-1)))%numVM();
  }
  return b;
}
function makeCandidate(){
  if(mode==='hs'){
    let a=[];
    for(let i=0;i<numTasks();i++){
      if(population.length && Math.random()<.82){
        let base=population[Math.floor(Math.random()*Math.min(5,population.length))].a[i];
        a[i]=Math.random()<.28?(base+1+Math.floor(Math.random()*(numVM()-1)))%numVM():base;
      }else a[i]=Math.floor(Math.random()*numVM());
    }
    return a;
  }
  let parent=population[Math.floor(Math.random()*Math.min(4,population.length))]?.a || randomAssign();
  let rate=.12+Math.random()*.55;
  return mutate(parent,rate);
}
function fmt(a){return a.map((v,i)=>`T${i+1}→VM${v+1}`).join(', ')}
function log(msg){$('log').innerHTML+=`<div>› ${msg}</div>`;$('log').scrollTop=$('log').scrollHeight}
function render(){
  $('metricIter').textContent=iteration;
  $('metricBest').textContent=Number.isFinite(bestScore)?bestScore+' unit':'—';
  $('metricEval').textContent=evaluations;
  $('progress').style.width=(iteration/(+$('iters').value)*100)+'%';
  const loads=Array(numVM()).fill(0),tasks=Array.from({length:numVM()},()=>[]);
  bestAssign.forEach((vm,i)=>{loads[vm]+=taskTimes[i][vm];tasks[vm].push({i,time:taskTimes[i][vm]})});
  $('schedule').innerHTML=tasks.map((arr,v)=>`
    <div class="vm">
      <div class="vmname">VM ${v+1}<br><b>${loads[v]} u</b></div>
      <div class="track">${arr.length?arr.map(t=>`<div class="taskblock t${(t.i%5)+1}" title="Task ${t.i+1}: ${t.time} unit" style="width:${Math.max(35,t.time*8)}px;flex-grow:${t.time}">T${t.i+1}</div>`).join(''):'<span class="small muted">Belum ada task</span>'}</div>
    </div>`).join('');
  $('legend').innerHTML=Array.from({length:numTasks()},(_,i)=>`<span><i class="dot t${i%5+1}"></i>T${i+1} (${taskTimes[i][bestAssign[i]]||0}u)</span>`).join('');
}
function reset(){
  if(timer)clearTimeout(timer);
  running=false;iteration=0;evaluations=0;bestScore=Infinity;bestAssign=randomAssign();population=[];
  for(let i=0;i<12;i++){let a=randomAssign();population.push({a,s:score(a)});evaluations++}
  population.sort((a,b)=>a.s-b.s);
  bestAssign=population[0].a.slice();bestScore=population[0].s;
  $('log').innerHTML='Eksperimen direset. Kandidat awal dibangkitkan dan dinilai.';
  render();
}
function step(){
  if(iteration>=+$('iters').value){
    running=false;
    log(`Selesai. Jadwal terbaik yang ditemukan memiliki makespan ${bestScore} unit.`);
    return false;
  }
  let a=makeCandidate(),s=score(a);evaluations++;iteration++;
  if(mode==='hs'){
    population.sort((x,y)=>x.s-y.s);
    if(s<population[population.length-1].s)population[population.length-1]={a,s};
  }else{
    population.push({a,s});
    population.sort((x,y)=>x.s-y.s);
    population=population.slice(0,12);
    if(iteration%7===0){
      population[population.length-1]={a:randomAssign(),s:0};
      population[population.length-1].s=score(population[population.length-1].a);
    }
  }
  population.sort((x,y)=>x.s-y.s);
  if(population[0].s<bestScore){
    bestScore=population[0].s;
    bestAssign=population[0].a.slice();
    log(`Iterasi ${iteration}: solusi terbaik membaik → makespan ${bestScore}. ${fmt(bestAssign)}`);
  }else if(iteration===1||iteration%15===0){
    log(`Iterasi ${iteration}: kandidat ${s} unit; terbaik tetap ${bestScore} unit.`);
  }
  render();
  return true;
}
function run(){
  if(running){running=false;return}
  running=true;
  log(`Menjalankan ${mode.toUpperCase()}…`);
  const delay=$('speed').value==='fast'?30:$('speed').value==='slow'?420:150;
  function tick(){if(!running)return;if(step())timer=setTimeout(tick,delay);else running=false}
  tick();
}
function setMode(m){
  mode=m;
  document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===(m==='hs'?'simhs':'simcsa')));
  $('demoTitle').textContent=m==='hs'?'Atur eksperimen HS':'Atur eksperimen CSA';
  $('demoDesc').textContent=m==='hs'?'HS membentuk kandidat dari memori solusi dan mencoba improvisasi.':'CSA memilih kandidat bagus, mengkloningnya, lalu mencoba mutasi.';
  reset();
}
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.tab==='simhs'?'hs':'csa')));
$('run').addEventListener('click',run);
$('next').addEventListener('click',()=>{if(running){running=false}step()});
$('reset').addEventListener('click',reset);
$('iters').addEventListener('input',()=>{$('itersVal').textContent=$('iters').value;render()});
$('tasks').addEventListener('input',()=>{$('tasksVal').textContent=$('tasks').value;reset()});
$('vms').addEventListener('change',reset);
reset();

let seed=7,tasks=[],mips=[1000,1500,2500];
function rng(s){return()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
let R=rng(seed);
function newCase(){seed=Math.floor(Math.random()*1e6);startCase()}
function startCase(){
  stopCase();
  R=rng(seed);
  const n=+$('nt').value;
  tasks=Array.from({length:n},()=>Math.round((2000+R()*18000)/100)*100);
  $('taskList').innerHTML=tasks.map((l,i)=>`<div class="mini-chip" style="background:hsl(${i*47%360} 55% 45%);min-width:54px;animation-delay:${i*25}ms">T${i+1}<small>${l} MI</small></div>`).join('');
  $('vmInfo').textContent='VM: '+mips.map((m,i)=>`VM${i+1} (${m} MIPS)`).join(' · ');
  const rr=tasks.map((_,i)=>i%3);
  $('stRR').textContent=fit(rr).toFixed(2);
  $('stHS').textContent=$('stCS').textContent='–';
  $('stIt').textContent=0;
  hh=[];cc=[];
  draw();
  $('verdict').textContent='';
}
$('nt').oninput=e=>{$('tv').textContent=e.target.value;startCase()};
$('ni').oninput=e=>$('iv').textContent=e.target.value;
const fit=s=>{const L=[0,0,0];s.forEach((v,i)=>L[v]+=tasks[i]/mips[v]);return Math.max(...L)};
const rs=()=>tasks.map(()=>Math.floor(R()*3));
let hh=[],cc=[],tm=null,it=0;
function stopCase(){clearInterval(tm);tm=null;it=0;$('runBtn').textContent='▶ Jalankan HS & CSA'}
function runCase(){
  if(tm){stopCase();return}
  startCase();
  const N=+$('ni').value,n=tasks.length;
  let HM=Array.from({length:10},()=>{const s=rs();return{s,f:fit(s)}}),bestH=HM.reduce((a,b)=>a.f<b.f?a:b);
  let P=Array.from({length:12},()=>{const s=rs();return{s,f:fit(s)}}),bestC=P.reduce((a,b)=>a.f<b.f?a:b);
  function hsStep(){
    const s=[];
    for(let i=0;i<n;i++){
      let v;
      if(R()<.9){v=HM[Math.floor(R()*HM.length)].s[i];if(R()<.3)v=(v+(R()<.5?1:2))%3}
      else v=Math.floor(R()*3);
      s.push(v);
    }
    const f=fit(s);
    let w=0;HM.forEach((h,k)=>{if(h.f>HM[w].f)w=k});
    if(f<HM[w].f)HM[w]={s,f};
    bestH=HM.reduce((a,b)=>a.f<b.f?a:b);
  }
  function csStep(){
    P.sort((a,b)=>a.f-b.f);
    let pool=P.slice(0,8);
    P.slice(0,5).forEach((a,r)=>{
      const k=5-r,rate=.05+.25*r/5;
      for(let j=0;j<k;j++){
        const s=[...a.s];
        s.forEach((_,i)=>{if(R()<rate)s[i]=Math.floor(R()*3)});
        pool.push({s,f:fit(s)});
      }
    });
    pool.sort((a,b)=>a.f-b.f);
    P=pool.slice(0,10);
    for(let j=0;j<2;j++){const s=rs();P.push({s,f:fit(s)})}
    bestC=P.reduce((a,b)=>a.f<b.f?a:b);
  }
  const per=Math.max(1,Math.ceil(N/120));
  tm=setInterval(()=>{
    for(let k=0;k<per&&it<N;k++){hsStep();csStep();it++;hh.push(bestH.f);cc.push(bestC.f)}
    $('stHS').textContent=bestH.f.toFixed(2);
    $('stCS').textContent=bestC.f.toFixed(2);
    $('stIt').textContent=it;
    draw(N);
    if(it>=N){
      clearInterval(tm);tm=null;
      $('runBtn').textContent='▶ Jalankan lagi';
      const rr=+$('stRR').textContent,d=bestH.f-bestC.f;
      $('verdict').innerHTML=`Hasil: HS <b>${bestH.f.toFixed(2)}</b> · CSA <b>${bestC.f.toFixed(2)}</b> · Round Robin <b>${rr.toFixed(2)}</b>. `+(Math.abs(d)<.01?'Keduanya imbang.':(d<0?'HS':'CSA')+' sedikit lebih unggul pada kasus ini.')+' Coba acak kasus lain: pemenangnya bisa berubah.';
    }
  },40);
  $('runBtn').textContent='⏸ Berhenti';
}
function draw(N){
  const c=$('cv'),x=c.getContext('2d'),W=c.width,H=c.height;
  const cs=getComputedStyle(document.documentElement);
  const line=cs.getPropertyValue('--line').trim(),mute=cs.getPropertyValue('--muted').trim();
  const colHS=cs.getPropertyValue('--hs').trim(),colCS=cs.getPropertyValue('--cs').trim();
  x.clearRect(0,0,W,H);
  const rr=+$('stRR').textContent;
  if(!rr)return;
  const all=[rr,...hh,...cc],mx=Math.max(...all)*1.05,mn=Math.min(...all)*.9,N2=N||+$('ni').value;
  const X=i=>40+i/Math.max(N2-1,1)*(W-60),Y=v=>H-24-(v-mn)/(mx-mn||1)*(H-44);
  x.strokeStyle=line;x.fillStyle=mute;x.font='12px system-ui';x.lineWidth=1;
  for(let k=0;k<=4;k++){
    const v=mn+(mx-mn)*k/4,y=Y(v);
    x.beginPath();x.moveTo(40,y);x.lineTo(W-10,y);x.stroke();
    x.fillText(v.toFixed(1),2,y+4);
  }
  x.setLineDash([6,5]);x.strokeStyle=mute;
  x.beginPath();x.moveTo(40,Y(rr));x.lineTo(W-10,Y(rr));x.stroke();
  x.setLineDash([]);x.fillText('Round Robin',W-90,Y(rr)-6);
  [[hh,colHS],[cc,colCS]].forEach(([a,col])=>{
    if(!a.length)return;
    x.strokeStyle=col;x.lineWidth=3;x.lineJoin='round';
    x.beginPath();
    a.forEach((v,i)=>i?x.lineTo(X(i),Y(v)):x.moveTo(X(i),Y(v)));
    x.stroke();
    x.fillStyle=col;
    x.beginPath();x.arc(X(a.length-1),Y(a[a.length-1]),5,0,7);x.fill();
  });
  x.fillStyle=mute;x.fillText('iterasi →',W-70,H-6);
}

const root=document.documentElement,tb=$('themeBtn');
function syncBtn(){tb.textContent=root.dataset.theme==='dark'?'☀️ Terang':'🌙 Gelap'}
tb.addEventListener('click',()=>{
  const t=root.dataset.theme==='dark'?'light':'dark';
  root.dataset.theme=t;
  try{localStorage.setItem('theme',t)}catch(e){}
  syncBtn();draw();showBars();
});
syncBtn();

addEventListener('scroll',()=>{
  const h=document.documentElement;
  $('sp').style.width=(h.scrollTop/(h.scrollHeight-h.clientHeight)*100)+'%';
},{passive:true});

const io=new IntersectionObserver(es=>es.forEach(e=>{
  if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}
}),{threshold:.08});
document.querySelectorAll('.card,.section-head,.callout').forEach(el=>{el.classList.add('reveal');io.observe(el)});
