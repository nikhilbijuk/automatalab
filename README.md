# AutomataLab — Interactive Regex to DFA Converter

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)](https://automatalab.netlify.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

> **Live Website:** [automatalab.netlify.app](https://automatalab.netlify.app/)

A working, browser-based Theory of Computation team mini-project. **No framework, backend, cloud service, npm install, or internet access required.** The actual automata algorithms are implemented from scratch in JavaScript ES modules.

## 🌐 Live Demo & Run

- **Online**: Visit [automatalab.netlify.app](https://automatalab.netlify.app/)
- **Locally**:

1. Extract the ZIP.
2. In the `AutomataLab` folder, run `python -m http.server 8000` (or `python3 -m http.server 8000`).
3. Open `http://localhost:8000` in a browser.

> Do not double-click `index.html`: some browsers block JavaScript ES modules from `file://`. The local HTTP server works offline.

## Automated tests

With Node.js 18+: `npm test` (no `npm install` needed).

## Features

- Parse regular expressions with letters `a-z`, `A-Z`, digits `0-9`, union `|`, implicit concatenation, Kleene star `*`, one-or-more `+`, optional `?`, and parentheses.
- Validate input, insert explicit concatenation, and convert to postfix via the shunting-yard algorithm.
- Thompson's construction: postfix → ε-NFA.
- ε-closure and subset construction: ε-NFA → DFA, including the empty/dead state.
- Draw state diagrams, show subset-construction steps, and render a DFA transition table.
- Test input strings and step through the DFA's visited states.

## Team roles (suggestion)

1. Regex tokenisation, validation, postfix conversion (`src/automata.js`: `tokenize`, `postfix`).
2. Thompson's construction (`buildNFA`).
3. ε-closure, subset construction, string simulation (`convertToDFA`, `simulate`).
4. UI, state diagrams, integration (`src/app.js`, `index.html`, `style.css`).

All four should be able to explain the complete pipeline and run the tests.

## Demo

Enter `(a|b)*abb`, click **Generate automata**, inspect the ε-NFA and DFA, click **Next step**, then test `aabb` (accepted) and `abab` (rejected).

## Important limitations

- Supports single-character alphanumeric symbols, not character classes, escapes, anchors, backreferences, or multi-character tokens.
- Input spaces are ignored in regex expressions; spaces in test strings are literal characters and will be rejected if not in the alphabet.
- DFA is equivalent to the regex but **not necessarily minimal**. Minimisation is a separate algorithm.
- The visual graph uses a simple grid layout; larger automata can have overlapping arrows. The transition table remains authoritative.
- The next-step display shows each subset-construction transition, not an animated construction of Thompson fragments.

## Theory

Regex → postfix → Thompson ε-NFA → subset-construction DFA → DFA string simulation.
