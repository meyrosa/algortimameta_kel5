const $=id=>document.getElementById(id);

function buildSteps(id, color, list){
  const el=$(id);
  el.style.setProperty('--c', color);
  let k=0,hold=0;
  const focus=(i,h)=>{[...el.children].forEach(x=>x.classList.remove('on'));el.children[i].classList.add('on');k=i;if(h)hold=Date.now()+h};
  list.forEach((s,i)=>{
    const d=document.createElement('div');
    d.className='step'+(i?'':' on');
    d.innerHTML=`<div class="n">${String(i+1).padStart(2,'0')}</div><div><strong>${s[0]}</strong><p>${s[1]}</p></div>`;
    d.onclick=()=>focus(i,15000);
    el.appendChild(d);
  });
  setInterval(()=>{
    if(Date.now()<hold||!el.offsetParent)return;
    focus((k+1)%list.length);
  },3800);
  return focus;
}
const hsFocus=buildSteps('hsSteps','#ff922b',[
  ['Atur parameter','Tentukan nilai HMS, HMCR, PAR, dan jumlah iterasi maksimal. Seperti menyiapkan aturan band sebelum jam session.'],
  ['Isi Harmony Memory','Buat sejumlah jadwal secara acak sebanyak kapasitas HMS, lalu hitung nilai makespan masing-masing dan simpan ke dalam memori. Ini berfungsi sebagai "buku catatan" untuk kombinasi nada awal.'],
  ['Improvisasi harmoni baru','Untuk setiap tugas (task): pilih mesin virtual (VM) dari harmoni yang ada di memori berdasarkan peluang HMCR. Selanjutnya, lakukan penyesuaian (geser ke VM tetangga) berdasarkan peluang PAR. Jika tidak terpilih, tentukan VM secara acak.'],
  ['Perbarui memori','Hitung nilai makespan dari harmoni baru yang dihasilkan. Jika hasilnya lebih bagus daripada harmoni paling buruk yang tersimpan di memori, ganti harmoni terburuk tersebut dengan yang baru.'],
  ['Ulangi sampai selesai','Ulangi proses improvisasi dan pembaruan memori hingga batas maksimal iterasi terpenuhi. Harmoni terbaik yang tersisa di dalam memori akan menjadi hasil jadwal akhir.']
]);
const csFocus=buildSteps('csSteps','#4dabf7',[
  ['Buat populasi antibodi','Hasilkan sejumlah jadwal awal secara acak. Setiap jadwal = satu antibodi.'],
  ['Hitung affinity','Affinity = seberapa cocok antibodi dengan “kuman”. Di scheduling: affinity tinggi = makespan rendah.'],
  ['Seleksi terbaik','Ambil n antibodi dengan affinity tertinggi untuk diperbanyak.'],
  ['Kloning','Menggandakan antibodi yang telah lolos seleksi. Antibodi dengan peringkat terbaik akan mendapatkan jumlah salinan (klon) paling banyak.'],
  ['Hypermutation','Melakukan mutasi (perubahan) pada susunan antibodi. Antibodi yang sudah bagus hanya diubah sedikit agar tidak rusak, sedangkan antibodi yang kurang bagus dirombak lebih banyak untuk mencari alternatif baru (dengan memindahkan tugas ke VM lain).'],
  ['Seleksi ulang + receptor editing','Pilih yang terbaik dari induk dan klon untuk generasi berikutnya; ganti beberapa yang terburuk dengan antibodi acak baru agar variasi tetap terjaga.'],
  ['Ulangi','Mengulangi seluruh proses di atas sampai iterasi habis; antibodi terbaik = jadwal akhir.']
]);

const rnd=n=>Math.floor(Math.random()*n);
$('hmcr').oninput=e=>$('hv1').textContent=e.target.value;
$('par').oninput=e=>$('hv2').textContent=e.target.value;

/* ===== HS: improvisasi bertahap ===== */
const memInit=[[0,1,2,1,0,2,1,0],[2,2,1,0,1,0,0,1],[1,0,0,2,2,1,2,2],[0,2,1,1,0,0,1,2]];
let mem=[],hsS=null,hsT=null;
const mkH=a=>{const L=[0,0,0];a.forEach((v,i)=>L[v]+=taskTimes[i][v]);return Math.max(...L)};
function hsSay(t){$('hsNarr').innerHTML=t}
function hsMemRender(h){
  h=h||{};
  $('hsMem').innerHTML='<table><thead><tr><th>Memori</th>'+Array.from({length:8},(_,i)=>`<th class="${h.col===i?'colhl':''}">T${i+1}</th>`).join('')+'<th>Makespan</th></tr></thead><tbody>'+
    mem.map((r,k)=>`<tr class="${h.row===k?'rowhl':''}"><td>H${k+1}</td>${r.map((v,i)=>`<td class="${h.col===i?'colhl':''}${h.row===k&&h.col===i?' cellhl':''}">${v}</td>`).join('')}<td>${mkH(r)}</td></tr>`).join('')+'</tbody></table>';
}
function hsReset(){
  clearInterval(hsT);hsT=null;$('hsBtn').textContent='▶ Putar otomatis';
  mem=memInit.map(r=>r.slice());
  hsS={i:0,ph:0,out:[],v:0,k:0,t:'M',r:0,done:false};
  $('hsChips').innerHTML='';hsMemRender();
  hsSay('Tekan <b>Langkah berikutnya</b> atau <b>Putar otomatis</b>. Harmoni baru akan dibangun dari nada 1 sampai 8, lalu dibandingkan dengan memori.');
}
function hsPut(){
  const s=hsS,d=document.createElement('div');
  d.className='mini-chip '+s.t;d.innerHTML=`${s.v}<small>T${s.i+1}·${s.t}</small>`;
  $('hsChips').appendChild(d);s.out.push(s.v);s.i++;s.ph=0;
}
function hsNext(){
  const s=hsS,H=+$('hmcr').value,P=+$('par').value;
  if(s.done){hsReset();return true}
  if(s.i>=8){
    hsFocus(3,9000);
    const f=mkH(s.out);let w=0;mem.forEach((r,k)=>{if(mkH(r)>mkH(mem[w]))w=k});
    const fw=mkH(mem[w]);
    if(f<fw){mem[w]=s.out.slice();hsMemRender({row:w});
      hsSay(`<b>Langkah akhir · Evaluasi & perbarui memori.</b> Makespan harmoni baru = <b>${f}</b>, harmoni terburuk di memori (H${w+1}) = ${fw}. Lebih kecil = lebih bagus, jadi H${w+1} <b>diganti</b> harmoni baru.`);
    }else{hsMemRender();
      hsSay(`<b>Langkah akhir · Evaluasi & perbarui memori.</b> Makespan harmoni baru = <b>${f}</b>, harmoni terburuk di memori = ${fw}. Tidak lebih bagus, jadi harmoni baru <b>dibuang</b> dan memori tetap. Klik “Langkah berikutnya” untuk mencoba lagi.`);
    }
    s.done=true;return false;
  }
  hsFocus(2,9000);
  const i=s.i;
  if(s.ph===0){
    s.r=Math.random();s.t=s.r<H?'M':'R';hsMemRender({col:i});
    hsSay(`<b>Nada ${i+1}/8 (task T${i+1}) · Pertanyaan 1:</b> lempar dadu r = <b>${s.r.toFixed(2)}</b> dibanding HMCR ${H}. `+(s.t==='M'?'r lebih kecil → <b>ambil dari memori</b>.':'r tidak lebih kecil → <b>pilih VM secara acak</b>.'));
    s.ph=1;
  }else if(s.ph===1){
    if(s.t==='M'){
      s.k=rnd(mem.length);s.v=mem[s.k][i];hsMemRender({col:i,row:s.k});
      hsSay(`<b>Pertanyaan 2:</b> pilih satu harmoni memori secara acak → <b>H${s.k+1}</b>, nada T${i+1}-nya VM <b>${s.v}</b>.`);s.ph=2;
    }else{
      s.v=rnd(3);hsPut();
      hsSay(`<b>Pertanyaan 2:</b> VM acak yang terpilih = <b>${s.v}</b> (tanpa melihat memori; ini yang disebut eksplorasi). Lanjut ke nada berikutnya.`);
    }
  }else{
    s.r=Math.random();
    if(s.r<P){const nv=(s.v+(Math.random()<.5?1:2))%3;
      hsSay(`<b>Pertanyaan 3:</b> r = <b>${s.r.toFixed(2)}</b> dibanding PAR ${P} → lebih kecil, jadi nada <b>digeser</b> dari VM ${s.v} ke VM <b>${nv}</b> (pitch adjustment).`);s.v=nv;s.t='A';
    }else hsSay(`<b>Pertanyaan 3:</b> r = <b>${s.r.toFixed(2)}</b> dibanding PAR ${P} → tidak lebih kecil, nada <b>dipertahankan</b> VM ${s.v}.`);
    hsPut();
  }
  return true;
}
function hsAll(){hsReset();while(hsNext());}
function hsToggle(){
  if(hsT){clearInterval(hsT);hsT=null;$('hsBtn').textContent='▶ Putar otomatis';return}
  if(hsS.done)hsReset();
  $('hsBtn').textContent='⏸ Jeda';
  hsT=setInterval(()=>{if(!hsNext()){clearInterval(hsT);hsT=null;$('hsBtn').textContent='▶ Putar otomatis'}},1200);
}

/* ===== CSA: satu generasi bertahap ===== */
let cs=null,csT=null;
const CSN=['0 Populasi','1 Hitung affinity','2 Seleksi','3 Kloning','4 Hypermutation','5 Seleksi ulang'];
function csSay(t){$('csLog').innerHTML=t}
function csaInit(){
  clearInterval(csT);csT=null;$('csBtn').textContent='▶ Putar otomatis';
  cs={pop:Array.from({length:6},()=>20+Math.random()*50),ph:0,gen:0,rank:[],cl:[],flags:[]};
  csRender();
  csSay('<b>Populasi awal:</b> 6 antibodi (jadwal) dibuat acak. Tinggi batang = affinity. Tekan “Langkah berikutnya”.');
}
function csRender(){
  const s=cs;if(!s)return;
  const bar=(v,cls,lab)=>`<div class="bar ${cls}" style="height:${v*1.15}px"><span>${v.toFixed(0)}</span><em>${lab}</em></div>`;
  $('csGen').textContent=s.gen;
  $('csPh').innerHTML=CSN.map((t,i)=>`<span class="${i===s.ph?'on':''}">${t}</span>`).join('<i>→</i>');
  $('bars').innerHTML=s.pop.map((v,i)=>{
    const r=s.rank.indexOf(i);let cls='',lab='A'+(i+1);
    if(s.ph>=1&&s.ph<5)lab='#'+(r+1);
    if(s.ph>=2&&s.ph<5)cls=r<3?'sel':'dim';
    if(s.ph===5){const f=s.flags[i];cls=f==='rnd'?'new':f==='imp'?'sel':'';lab=f==='rnd'?'acak baru':f==='imp'?'terbaik':'tetap'}
    return bar(v,cls,lab);
  }).join('');
  $('clones').innerHTML=s.cl.length?s.cl.map(c=>bar(s.ph>=4?c.v:c.v0,'clone',`dari #${c.from+1}`+(s.ph>=4?(c.v>=c.v0?' ▲':' ▼'):''))).join(''):'<span class="small muted" style="align-self:center">(belum ada klon, muncul di langkah 3)</span>';
}
function csaNext(){
  const s=cs;
  if(s.ph===5){s.ph=1;s.gen++;s.cl=[]}else s.ph++;
  csFocus(s.ph,9000);
  if(s.ph===1){
    s.rank=[...s.pop.keys()].sort((a,b)=>s.pop[b]-s.pop[a]);
    csSay('<b>Langkah 1 · Hitung affinity.</b> Tiap antibodi dinilai; batang tertinggi = jadwal terbaik (makespan terendah). Label <b>#1…#6</b> adalah peringkatnya.');
  }else if(s.ph===2){
    csSay('<b>Langkah 2 · Seleksi.</b> Tiga antibodi teratas (hijau) dipilih untuk diperbanyak. Sisanya diredupkan untuk sementara.');
  }else if(s.ph===3){
    s.cl=[];s.rank.slice(0,3).forEach((idx,r)=>{for(let j=0;j<3-r;j++)s.cl.push({from:r,v0:s.pop[idx],v:s.pop[idx]})});
    csSay('<b>Langkah 3 · Kloning.</b> #1 digandakan 3×, #2 2×, #3 1× (total 6 klon, ungu). Makin bagus peringkatnya, makin banyak salinannya. Nilai klon masih sama dengan induknya.');
  }else if(s.ph===4){
    s.cl.forEach(c=>{const m=(1-c.v0/100)*28+3;c.v=Math.min(100,Math.max(1,c.v0+(Math.random()-.35)*m))});
    csSay('<b>Langkah 4 · Hypermutation.</b> Tiap klon diubah. Induk yang sudah bagus hanya mutasi kecil (agar tidak rusak), induk yang lemah mutasi lebih besar. ▲ = klon lebih baik dari induk, ▼ = lebih buruk.');
  }else{
    const nw=[],fl=[];
    s.rank.slice(0,3).forEach((idx,r)=>{nw.push(Math.max(s.pop[idx],...s.cl.filter(c=>c.from===r).map(c=>c.v)));fl.push('imp')});
    nw.push(s.pop[s.rank[3]],s.pop[s.rank[4]]);fl.push('stay','stay');
    nw.push(15+Math.random()*50);fl.push('rnd');
    s.pop=nw;s.flags=fl;s.cl=[];
    csSay('<b>Langkah 5 · Seleksi ulang + receptor editing.</b> Dari tiap induk dan klonnya diambil yang terbaik (hijau). Peringkat 4 dan 5 tetap. Peringkat 6 diganti antibodi acak (pink) supaya populasi tetap beragam. Tekan lagi untuk generasi berikutnya.');
  }
  csRender();
}
function csToggle(){
  if(csT){clearInterval(csT);csT=null;$('csBtn').textContent='▶ Putar otomatis';return}
  $('csBtn').textContent='⏸ Jeda';
  csT=setInterval(csaNext,2300);
}

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
    let a=[],src=[];
    for(let i=0;i<numTasks();i++){
      if(population.length && Math.random()<.82){
        let base=population[Math.floor(Math.random()*Math.min(5,population.length))].a[i];
        if(Math.random()<.28){a[i]=(base+1+Math.floor(Math.random()*(numVM()-1)))%numVM();src[i]='A'}
        else{a[i]=base;src[i]='M'}
      }else{a[i]=Math.floor(Math.random()*numVM());src[i]='R'}
    }
    return {a,src};
  }
  const parent=population[Math.floor(Math.random()*Math.min(4,population.length))]?.a || randomAssign();
  const a=mutate(parent,.12+Math.random()*.55);
  return {a,src:a.map((v,i)=>v===parent[i]?'W':'X')};
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
  $('labCand').innerHTML='';labPh(false);
  $('labNarr').innerHTML='Setiap iterasi punya 4 tahap: <b>bangkitkan</b> kandidat → <b>hitung</b> makespan → <b>bandingkan</b> → <b>perbarui</b>. Tekan “Langkah berikutnya” untuk melihat satu iterasi saja.';
  render();
}
const TAG={M:'memori',A:'geser',R:'acak',W:'induk',X:'mutasi'};
function labPh(lit,acc){
  const hs=mode==='hs';
  $('labPhases').innerHTML=['1 Bangkitkan kandidat','2 Hitung makespan','3 Bandingkan',hs?'4 Perbarui memori':'4 Perbarui populasi']
    .map((t,i)=>`<span class="${lit?'lit':''}${lit&&i===3&&!acc?' no':''}" style="animation-delay:${i*160}ms">${t}</span>`).join('<i>→</i>');
}
function labInfo(c,s,w,acc,rec){
  const hs=mode==='hs',cnt=k=>c.src.filter(x=>x===k).length;
  labPh(true,acc);
  $('labCand').innerHTML=c.src.map((t,i)=>`<div class="mini-chip ${t}" style="animation-delay:${i*70}ms">${c.a[i]+1}<small>T${i+1}·${TAG[t]}</small></div>`).join('');
  $('labNarr').innerHTML=
    `<b>1 Bangkitkan:</b> `+(hs?`${cnt('M')} nada dari memori, ${cnt('A')} digeser, ${cnt('R')} acak.`:`satu induk dipilih, lalu ${cnt('X')} dari ${c.src.length} task dimutasi.`)+
    ` <b>2 Hitung:</b> makespan kandidat = <b>${s}</b>. <b>3 Bandingkan:</b> ${hs?'yang terburuk di memori':'yang terburuk di populasi'} = ${w}. <b>4 Perbarui:</b> `+
    (acc?(hs?'kandidat lebih bagus → menggantikan yang terburuk.':'kandidat cukup bagus → masuk populasi.'):(hs?'tidak lebih bagus → dibuang.':'kalah dari populasi → dibuang.'))+
    (rec?' 🏆 <b>Rekor baru!</b>':'');
}
function step(){
  if(iteration>=+$('iters').value){
    running=false;
    log(`Selesai. Jadwal terbaik yang ditemukan memiliki makespan ${bestScore} unit.`);
    return false;
  }
  const c=makeCandidate(),a=c.a,s=score(a);evaluations++;iteration++;
  population.sort((x,y)=>x.s-y.s);
  const worst=population[population.length-1].s,prev=bestScore;let acc;
  if(mode==='hs'){
    acc=s<worst;
    if(acc)population[population.length-1]={a,s};
  }else{
    population.push({a,s});
    population.sort((x,y)=>x.s-y.s);
    population=population.slice(0,12);
    acc=population.some(p=>p.a===a);
    if(iteration%7===0){
      const r=randomAssign();
      population[population.length-1]={a:r,s:score(r)};
    }
  }
  population.sort((x,y)=>x.s-y.s);
  labInfo(c,s,worst,acc,population[0].s<prev);
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
reset();hsReset();csaInit();

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
  syncBtn();draw();csRender();
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
