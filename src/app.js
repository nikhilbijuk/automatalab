import {compile,simulate} from './automata.js';
const $=id=>document.getElementById(id);
let current=null,stepIndex=0,traceIndex=0,lastTrace=[];
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function graph(target, machine, active=null) {
  const dfa=!!machine.alphabet;
  const ids=dfa?machine.states.map(s=>s.id):machine.states;
  const count=ids.length, cols=Math.min(6,Math.max(1,Math.ceil(Math.sqrt(count*1.7)))), rows=Math.ceil(count/cols);
  const W=cols*160+80,H=rows*125+90;
  const pos=id=>({x:90+(id%cols)*160,y:75+Math.floor(id/cols)*125});
  const defs='<defs><marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8"/></marker></defs>';
  const grouped=new Map();
  for(const e of machine.edges){const k=`${e.from}:${e.to}`;if(!grouped.has(k))grouped.set(k,[]);grouped.get(k).push(e.symbol===null?'ε':e.symbol);}
  let paths='';
  for(const [k,labels] of grouped){const [from,to]=k.split(':').map(Number),a=pos(from),b=pos(to),label=escape([...new Set(labels)].join(', '));
    if(from===to){paths+=`<path d="M ${a.x-15} ${a.y-24} C ${a.x-75} ${a.y-110}, ${a.x+75} ${a.y-110}, ${a.x+15} ${a.y-24}" fill="none" stroke="#94a3b8" stroke-width="1.8" marker-end="url(#arrow)"/><text x="${a.x}" y="${a.y-77}" text-anchor="middle">${label}</text>`;continue;}
    const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy),ux=dx/len,uy=dy/len;
    const x1=a.x+ux*29,y1=a.y+uy*29,x2=b.x-ux*29,y2=b.y-uy*29;
    const midx=(x1+x2)/2,midy=(y1+y2)/2;
    paths+=`<path d="M ${x1} ${y1} L ${x2} ${y2}" fill="none" stroke="#94a3b8" stroke-width="1.8" marker-end="url(#arrow)"/><text x="${midx+uy*13}" y="${midy-ux*13-5}" text-anchor="middle">${label}</text>`;
  }
  const circles=ids.map(id=>{const p=pos(id),accept=machine.accepting.includes(id),selected=id===active;return `<g><circle cx="${p.x}" cy="${p.y}" r="27" fill="${selected?'#0f766e':'#18263c'}" stroke="${selected?'#5eead4':'#64748b'}" stroke-width="2"/>${accept?`<circle cx="${p.x}" cy="${p.y}" r="22" fill="none" stroke="#e2e8f0" stroke-width="1.5"/>`:''}<text class="node-label" x="${p.x}" y="${p.y+5}" text-anchor="middle">${dfa?'D':''}${id}</text>${id===machine.start?`<path d="M ${p.x-60} ${p.y} L ${p.x-30} ${p.y}" stroke="#5eead4" stroke-width="2" marker-end="url(#arrow)"/>`:''}</g>`}).join('');
  $(target).innerHTML=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${dfa?'DFA':'NFA'} state diagram">${defs}${paths}${circles}</svg>`;
}
function renderTable(dfa){let html='<thead><tr><th>State</th><th>NFA states</th>'+dfa.alphabet.map(a=>`<th>${escape(a)}</th>`).join('')+'</tr></thead><tbody>';
for(const s of dfa.states){html+=`<tr><td>${s.id===dfa.start?'→ ':''}${dfa.accepting.includes(s.id)?'* ':''}D${s.id}</td><td>{${s.members.join(', ')||'∅'}}</td>`;for(const symbol of dfa.alphabet){const e=dfa.edges.find(e=>e.from===s.id&&e.symbol===symbol);html+=`<td>D${e.to}</td>`;}html+='</tr>';}
$('table').innerHTML=html+'</tbody>';
}
function showStep(){const steps=current.dfa.steps;if(!steps.length){$('stepText').textContent='No transitions.';return;}
const s=steps[stepIndex];$('stepText').textContent=`Step ${stepIndex+1}/${steps.length}: From D${s.from} on '${s.symbol}', move to {${s.move.join(', ')||'∅'}}; ε-closure = {${s.closure.join(', ')||'∅'}} → D${s.to}.`;
graph('dfaGraph',current.dfa,s.to);}
function generate(){try{current=compile($('regex').value);$('error').textContent='';$('results').hidden=false;$('postfix').textContent=current.post.join(' ');$('counts').textContent=`${current.nfa.states.length} NFA states · ${current.dfa.states.length} DFA states · Alphabet: {${current.dfa.alphabet.join(', ')}}`;
graph('nfaGraph',current.nfa);graph('dfaGraph',current.dfa);renderTable(current.dfa);stepIndex=0;showStep();$('testResult').textContent='';$('trace').textContent='';}catch(e){$('error').textContent=e.message;$('results').hidden=true;current=null;}}
$('generate').addEventListener('click',generate);
$('regex').addEventListener('keydown',e=>{if(e.key==='Enter')generate();});
$('nextStep').addEventListener('click',()=>{if(!current)return;stepIndex=(stepIndex+1)%current.dfa.steps.length;showStep();});
$('prevStep').addEventListener('click',()=>{if(!current)return;stepIndex=(stepIndex-1+current.dfa.steps.length)%current.dfa.steps.length;showStep();});
$('test').addEventListener('click',()=>{if(!current)return;const result=simulate(current.dfa,$('testString').value);$('testResult').textContent=result.accepted?'✓ Accepted':'✗ Rejected'+(result.error?` — ${result.error}`:'');$('testResult').className=result.accepted?'success':'failure';lastTrace=result.trace;traceIndex=0;showTrace();});
function showTrace(){if(!current||!lastTrace.length)return;$('trace').textContent=`State ${traceIndex+1}/${lastTrace.length}: D${lastTrace[traceIndex]} · Path: ${lastTrace.slice(0,traceIndex+1).map(x=>'D'+x).join(' → ')}`;graph('dfaGraph',current.dfa,lastTrace[traceIndex]);}
$('nextTrace').addEventListener('click',()=>{if(traceIndex<lastTrace.length-1){traceIndex++;showTrace();}});
$('examples').addEventListener('change',e=>{if(e.target.value){$('regex').value=e.target.value;generate();}});
generate();
