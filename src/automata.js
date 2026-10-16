// AutomataLab core: no regex library is used for parsing, conversion or matching.
export function tokenize(input) {
  if (!input || !input.trim()) throw Error('Enter a regular expression.');
  const raw = [...input.replace(/\s+/g, '')];
  const isSymbol = c => /^[a-zA-Z0-9]$/.test(c);
  const out = [];
  let depth = 0, expectOperand = true;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (!isSymbol(c) && !'()|*+?'.includes(c)) throw Error(`Unsupported character '${c}' at position ${i + 1}.`);
    const prev = raw[i - 1];
    if (i && (isSymbol(prev) || [')','*','+','?'].includes(prev)) && (isSymbol(c) || c === '(')) out.push('.');
    if (isSymbol(c)) { expectOperand = false; }
    else if (c === '(') { depth++; expectOperand = true; }
    else if (c === ')') { if (depth === 0 || expectOperand) throw Error('Unmatched or empty parentheses.'); depth--; expectOperand = false; }
    else if (c === '|') { if (expectOperand) throw Error('Union operator needs a left operand.'); expectOperand = true; }
    else if ('*+?'.includes(c)) { if (expectOperand) throw Error(`Operator '${c}' needs an operand.`); expectOperand = false; }
    out.push(c);
  }
  if (depth) throw Error('Unclosed parenthesis.');
  if (expectOperand) throw Error('Incomplete regular expression.');
  return out;
}
export function postfix(tokens) {
  const out = [], ops = [], prec = { '|': 1, '.': 2 };
  for (const t of tokens) {
    if (/^[a-zA-Z0-9]$/.test(t)) out.push(t);
    else if ('*+?'.includes(t)) out.push(t);
    else if (t === '(') ops.push(t);
    else if (t === ')') { while (ops.length && ops.at(-1) !== '(') out.push(ops.pop()); ops.pop(); }
    else { while (ops.length && ops.at(-1) !== '(' && prec[ops.at(-1)] >= prec[t]) out.push(ops.pop()); ops.push(t); }
  }
  while (ops.length) out.push(ops.pop());
  return out;
}
export function buildNFA(post) {
  let next = 0;
  const edges = [], stack = [];
  const state = () => next++;
  const link = (from, to, symbol = null) => edges.push({ from, to, symbol });
  for (const t of post) {
    if (/^[a-zA-Z0-9]$/.test(t)) { const a=state(), b=state(); link(a,b,t); stack.push({start:a,end:b}); }
    else if (t === '.') { if(stack.length<2) throw Error('Invalid concatenation.'); const b=stack.pop(), a=stack.pop(); link(a.end,b.start); stack.push({start:a.start,end:b.end}); }
    else if (t === '|') { if(stack.length<2) throw Error('Invalid union.'); const b=stack.pop(), a=stack.pop(), s=state(), e=state(); link(s,a.start);link(s,b.start);link(a.end,e);link(b.end,e);stack.push({start:s,end:e}); }
    else if (t === '*') { if(!stack.length) throw Error('Invalid star.'); const a=stack.pop(),s=state(),e=state();link(s,a.start);link(s,e);link(a.end,a.start);link(a.end,e);stack.push({start:s,end:e}); }
    else if (t === '+') { if(!stack.length) throw Error('Invalid plus.'); const a=stack.pop(),s=state(),e=state();link(s,a.start);link(a.end,a.start);link(a.end,e);stack.push({start:s,end:e}); }
    else if (t === '?') { if(!stack.length) throw Error('Invalid optional.'); const a=stack.pop(),s=state(),e=state();link(s,a.start);link(s,e);link(a.end,e);stack.push({start:s,end:e}); }
  }
  if (stack.length !== 1) throw Error('Invalid expression.');
  const f=stack.pop();
  return { states: Array.from({length:next},(_,i)=>i), start:f.start, accepting:[f.end], edges };
}
export function convertToDFA(nfa) {
  const alphabet = [...new Set(nfa.edges.map(e=>e.symbol).filter(x=>x!==null))].sort();
  const epsilonClosure = ids => {
    const found = new Set(ids), pending=[...ids];
    while(pending.length) { const current=pending.pop(); for(const e of nfa.edges) if(e.from===current && e.symbol===null && !found.has(e.to)){found.add(e.to);pending.push(e.to);} }
    return [...found].sort((a,b)=>a-b);
  };
  const move = (ids, symbol) => [...new Set(nfa.edges.filter(e=>ids.includes(e.from)&&e.symbol===symbol).map(e=>e.to))];
  const key = ids => ids.join(',');
  const initial = epsilonClosure([nfa.start]);
  const sets=[initial], map=new Map([[key(initial),0]]), edges=[], steps=[];
  for(let index=0;index<sets.length;index++) {
    for(const symbol of alphabet) {
      const moved=move(sets[index],symbol), closure=epsilonClosure(moved);
      let target;
      if(!map.has(key(closure))) { target=sets.length;sets.push(closure);map.set(key(closure),target); }
      else target=map.get(key(closure));
      edges.push({from:index,to:target,symbol});
      steps.push({from:index,symbol,move:moved,closure,to:target,discovered:target===sets.length-1 && edges.filter(e=>e.to===target).length===1});
    }
  }
  return {states:sets.map((members,id)=>({id,members})),start:0,accepting:sets.filter(m=>m.some(s=>nfa.accepting.includes(s))).map(m=>map.get(key(m))),edges,alphabet,steps};
}
export function simulate(dfa, input) {
  let state=dfa.start; const trace=[state];
  for(const symbol of input) {
    const edge=dfa.edges.find(e=>e.from===state && e.symbol===symbol);
    if(!edge) return {accepted:false,trace,error:`No transition for '${symbol}'.`};
    state=edge.to;trace.push(state);
  }
  return {accepted:dfa.accepting.includes(state),trace};
}
export function compile(regex) { const tokens=tokenize(regex), post=postfix(tokens), nfa=buildNFA(post), dfa=convertToDFA(nfa); return {tokens,post,nfa,dfa}; }
