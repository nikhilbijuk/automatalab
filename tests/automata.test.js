import test from 'node:test';
import assert from 'node:assert/strict';
import {compile,simulate} from '../src/automata.js';
const cases=[
 ['a',['a'],['','b','aa']],
 ['a|b',['a','b'],['','ab','c']],
 ['ab',['ab'],['','a','b','abb']],
 ['a*',['','a','aaaa'],['b','ab']],
 ['(a|b)*abb',['abb','aabb','babb','abababb'],['','ab','abab','aaa']],
 ['a+',['a','aa'],['','b']],
 ['ab?',['a','ab'],['','abb','b']]
];
for(const [regex,yes,no] of cases)test(regex,()=>{const {dfa}=compile(regex);for(const s of yes)assert.equal(simulate(dfa,s).accepted,true,`${regex} should accept '${s}'`);for(const s of no)assert.equal(simulate(dfa,s).accepted,false,`${regex} should reject '${s}'`);});
for(const regex of ['','(a|b','a|','*a','()','a$'])test('invalid: '+regex,()=>assert.throws(()=>compile(regex)));
