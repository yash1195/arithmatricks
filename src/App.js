import './App.css';
import { useState, useEffect } from 'react';
import puzzleData from './puzzles_v1.json';

// Import Monoton font
const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Monoton&display=swap';
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);

// Add Roboto Slab font
const robotoSlabLink = document.createElement('link');
robotoSlabLink.href = 'https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@400;700&display=swap';
robotoSlabLink.rel = 'stylesheet';
document.head.appendChild(robotoSlabLink);

const OPERATORS = ['+', '-', '*', '÷'];
const FAV_COLOR = '#b5baff'; // Much lighter SlateBlue

function getRandomPair(positiveOnly = false) {
  const operator = OPERATORS[Math.floor(Math.random() * OPERATORS.length)];
  let operand;
  if (operator === '÷') {
    operand = Math.floor(Math.random() * 9) + 2;
  } else if (positiveOnly) {
    operand = Math.floor(Math.random() * 9) + 1;
  } else {
    operand = Math.floor(Math.random() * 19) - 9;
  }
  return { operator, operand };
}

// Pyramid layout: 1, 2, 3, 4 (total 10 hexes)
const HEX_LABELS = ['A','B','C','D','E','F','G','H','I','J'];

// Generate all possible 3-pick equations and count unique solutions
function getAllThreePickSolutions(pairs, target) {
  const n = pairs.length;
  let count = 0;
  let solutions = [];
  let seen = new Set();
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (j === i) continue;
      for (let k = 0; k < n; k++) {
        if (k === i || k === j) continue;
        const eq = [i, j, k];
        const value = evaluateEquationBODMAS(eq, pairs);
        const eqStr = getEquationString(eq, pairs);
        if (value === target && !seen.has(eqStr)) {
          count++;
          solutions.push(eq);
          seen.add(eqStr);
        }
      }
    }
  }
  return { count, solutions };
}

// Generator that ensures at least 5 unique solutions and first operand is positive
function generatePuzzle() {
  let pairs, target, tries = 0, solutions = [];
  while (true) {
    pairs = [getRandomPair(true), ...Array.from({ length: 9 }, () => getRandomPair())];
    let possibleResults = new Set();
    let allSolutions = [];
    let seen = new Set();
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
        if (j === i) continue;
        for (let k = 0; k < 10; k++) {
          if (k === i || k === j) continue;
          const eq = [i, j, k];
          let val = evaluateEquationBODMAS(eq, pairs);
          const eqStr = getEquationString(eq, pairs);
          if (!seen.has(eqStr)) {
            possibleResults.add(val);
            allSolutions.push({ eq, val });
            seen.add(eqStr);
          }
        }
      }
    }
    const resultsArr = Array.from(possibleResults);
    target = resultsArr[Math.floor(Math.random() * resultsArr.length)];
    const { count, solutions: sols } = getAllThreePickSolutions(pairs, target);
    if (count >= 5) {
      solutions = sols;
      break;
    }
    tries++;
    if (tries > 100) break; // fallback
  }
  return { pairs, target, solutions };
}

function getEquationString(picks, pairs) {
  if (picks.length === 0) return '';
  let str = Math.abs(pairs[picks[0]].operand).toString();
  for (let i = 1; i < picks.length; i++) {
    const { operator, operand } = pairs[picks[i]];
    str += ` ${operator} ${Math.abs(operand)}`;
  }
  return str;
}

// Manual BODMAS evaluation for three picks
function evaluateEquationBODMAS(picks, pairs) {
  if (picks.length === 0) return null;
  // Get numbers and operators
  const n1 = Math.abs(pairs[picks[0]].operand);
  if (picks.length === 1) return n1;
  const op1 = pairs[picks[1]].operator;
  const n2 = pairs[picks[1]].operand;
  if (picks.length === 2) {
    return applyOp(n1, op1, n2);
  }
  const op2 = pairs[picks[2]].operator;
  const n3 = pairs[picks[2]].operand;
  // BODMAS: handle * and ÷ first
  let result;
  if ((op1 === '*' || op1 === '÷') && (op2 === '*' || op2 === '÷')) {
    // Both are high precedence, evaluate left to right
    result = applyOp(applyOp(n1, op1, n2), op2, n3);
  } else if (op1 === '*' || op1 === '÷') {
    // op1 high, op2 low
    result = applyOp(applyOp(n1, op1, n2), op2, n3);
  } else if (op2 === '*' || op2 === '÷') {
    // op2 high, op1 low
    result = applyOp(n1, op1, applyOp(n2, op2, n3));
  } else {
    // Both low precedence, left to right
    result = applyOp(applyOp(n1, op1, n2), op2, n3);
  }
  return result;
}

function applyOp(a, op, b) {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '*': return a * b;
    case '÷': return b !== 0 ? Math.floor(a / b) : null;
    default: return null;
  }
}

function parseOption(option) {
  // e.g. '+11', '*5', '/10'
  const operator = option[0];
  const operand = parseInt(option.slice(1), 10);
  return { operator, operand };
}

function getEquationStringFromOptions(picks, options) {
  if (picks.length === 0) return '';
  let str = parseInt(options[picks[0]].slice(1), 10).toString();
  for (let i = 1; i < picks.length; i++) {
    const op = options[picks[i]][0];
    const val = parseInt(options[picks[i]].slice(1), 10);
    str += ` ${op} ${Math.abs(val)}`;
  }
  return str;
}

function evaluateEquationBODMASFromOptions(picks, options) {
  if (picks.length === 0) return null;
  const n1 = Math.abs(parseInt(options[picks[0]].slice(1), 10));
  if (picks.length === 1) return n1;
  const op1 = options[picks[1]][0];
  const n2 = parseInt(options[picks[1]].slice(1), 10);
  if (picks.length === 2) {
    return applyOp(n1, op1, n2);
  }
  const op2 = options[picks[2]][0];
  const n3 = parseInt(options[picks[2]].slice(1), 10);
  // BODMAS logic
  let result;
  if ((op1 === '*' || op1 === '/') && (op2 === '*' || op2 === '/')) {
    result = applyOp(applyOp(n1, op1, n2), op2, n3);
  } else if (op1 === '*' || op1 === '/') {
    result = applyOp(applyOp(n1, op1, n2), op2, n3);
  } else if (op2 === '*' || op2 === '/') {
    result = applyOp(n1, op1, applyOp(n2, op2, n3));
  } else {
    result = applyOp(applyOp(n1, op1, n2), op2, n3);
  }
  return result;
}

const appreciationMessages = [
  'Nice!',
  'Great!',
  'Amazin!',
  'Brilliant!',
  'Genius!'
];

function normalizeEquation(picks, options) {
  // Returns a sorted string representation of the selected options (e.g. '+11|*5|-3')
  return picks.map(idx => options[idx]).sort().join('|');
}

function isValidEquation(picks, options, validEquations) {
  if (picks.length !== 3) return false;
  // Check if the selected options (in any order) match a valid equation (in any order)
  const selected = picks.map(idx => options[idx]);
  return validEquations.some(eq => {
    return eq.length === 3 && eq.slice().sort().join('|') === selected.slice().sort().join('|');
  });
}

function App() {
  useEffect(() => {
    document.body.style.fontFamily = "'Roboto Slab', serif";
  }, []);

  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const puzzles = puzzleData.puzzles;
  const puzzle = puzzles[puzzleIdx];
  const options = puzzle.options;
  const target = puzzle.target;

  const [picks, setPicks] = useState([]); // indices of picked hexes
  const [scoreboard, setScoreboard] = useState([]); // {picks, value, correct}
  const [showAppreciation, setShowAppreciation] = useState(false);
  const [appreciationMsg, setAppreciationMsg] = useState('');
  const [showAnswers, setShowAnswers] = useState(false);

  const validEquations = puzzle.valid_equations || [];
  const [submittedEquations, setSubmittedEquations] = useState([]); // normalized eq strings

  // Pyramid rows
  const rows = [
    [0],        // A
    [1,2],      // B,C
    [3,4,5],    // D,E,F
    [6,7,8,9],  // G,H,I,J
  ];

  function getCurrentValue(picks, options) {
    if (picks.length === 0) return null;
    const n1 = Math.abs(parseInt(options[picks[0]].slice(1), 10));
    if (picks.length === 1) return n1;
    const op1 = options[picks[1]][0];
    const n2 = parseInt(options[picks[1]].slice(1), 10);
    return applyOp(n1, op1, n2);
  }

  // Toggle pick/unpick
  const handlePick = idx => {
    if (picks.includes(idx)) {
      setPicks(picks.filter(i => i !== idx));
    } else if (picks.length < 3) {
      setPicks([...picks, idx]);
    }
  };

  // Submit equation
  const handleSubmit = () => {
    if (picks.length !== 3) return;
    if (!isValidEquation(picks, options, validEquations)) return;
    const norm = normalizeEquation(picks, options);
    if (submittedEquations.includes(norm)) return;
    const value = evaluateEquationBODMASFromOptions(picks, options);
    const correct = value === target;
    const newScoreboard = [{ picks: [...picks], value, correct }, ...scoreboard];
    setScoreboard(newScoreboard);
    setSubmittedEquations([norm, ...submittedEquations]);
    setPicks([]);
    if (correct) {
      // Count unique correct answers
      const correctCount = newScoreboard.filter(e => e.correct).length;
      const msg = appreciationMessages[Math.min(correctCount - 1, appreciationMessages.length - 1)];
      setAppreciationMsg(msg);
      setShowAppreciation(true);
      setTimeout(() => setShowAppreciation(false), 1800);
    }
  };

  // Change puzzle
  const handleNext = () => {
    setPuzzleIdx((puzzleIdx + 1) % puzzles.length);
    setPicks([]);
    setScoreboard([]);
    setShowAppreciation(false);
    setShowAnswers(false);
  };
  const handlePrev = () => {
    setPuzzleIdx((puzzleIdx - 1 + puzzles.length) % puzzles.length);
    setPicks([]);
    setScoreboard([]);
    setShowAppreciation(false);
    setShowAnswers(false);
  };

  // Today's date
  const today = new Date().toLocaleDateString();

  // For division validation
  const currentValue = getCurrentValue(picks, options);

  return (
    <div className="App">
      <div className="date-top-left roboto-slab" style={{ position: 'absolute', top: 18, left: 24, fontWeight: 'bold', color: FAV_COLOR, fontSize: '1.2rem', fontFamily: 'Roboto Slab, serif', letterSpacing: '2px' }}>{today}</div>
      <div className="logo-mobile-spacer" />
      <h1 className="monoton-title logo-break-mobile">
        <span className="logo-part1">ARITHMA</span>
        <span className="logo-part2">TRICKS</span>
      </h1>
      <div className="game-area">
        <div className="pyramid">
          {rows.map((row, rowIdx) => (
            <div className={`pyramid-row row-${rowIdx}`} key={rowIdx}>
              {row.map(idx => {
                let disabled = picks.length >= 3 && !picks.includes(idx);
                if (!picks.includes(idx) && picks.length > 0 && picks.length < 3) {
                  if (options[idx][0] === '/') {
                    const divisor = parseInt(options[idx].slice(1), 10);
                    if (currentValue === null || currentValue % divisor !== 0) {
                      disabled = true;
                    }
                  }
                }
                return (
                  <div className={`hex ${picks.includes(idx) ? 'used' : ''}`} key={idx}>
                    {/* <div className="hex-label">{HEX_LABELS[idx]}</div> */}
                    <div className="hex-content">
                      <button
                        className="pair-btn roboto-slab"
                        onClick={() => handlePick(idx)}
                        disabled={disabled}
                        style={{ fontFamily: 'Roboto Slab, serif', textTransform: 'uppercase' }}
                      >
                        {picks[0] === idx
                          ? <span style={{ fontFamily: 'Roboto Slab, serif', fontWeight: 'bold', fontSize: '1.7rem' }}>{Math.abs(parseInt(options[idx].slice(1), 10))}</span>
                          : <span><span style={{ fontFamily: 'Roboto Slab, serif', fontSize: '1.1rem' }}>{options[idx][0]}</span><span style={{ fontFamily: 'Roboto Slab, serif', fontWeight: 'bold', fontSize: '1.7rem' }}>{Math.abs(parseInt(options[idx].slice(1), 10))}</span></span>}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="target-box roboto-slab" style={{ fontFamily: 'Roboto Slab, serif', textTransform: 'uppercase', position: 'relative' }}>
          <div className="target-label">TARGET</div>
          <div className="target-value roboto-slab" style={{ fontFamily: 'Roboto Slab, serif', fontWeight: 'bold', fontSize: '3.5rem' }}>{target}</div>
          <span className={`appreciation-message-mobile${showAppreciation ? ' show' : ''}`}>{showAppreciation && appreciationMsg}</span>
        </div>
      </div>
      <div className="current-box roboto-slab" style={{ fontFamily: 'Roboto Slab, serif', textTransform: 'uppercase' }}>
        {picks.length > 0 && (
          <div>
            Equation: <strong>{getEquationStringFromOptions(picks, options)}</strong>
            {picks.length === 3 && (
              <>
                {' '}= <strong style={{ fontFamily: 'Roboto Slab, serif', fontWeight: 'bold', fontSize: '1.7rem' }}>{evaluateEquationBODMASFromOptions(picks, options)}</strong>
              </>
            )}
          </div>
        )}
        <div className="button-row">
          <button
            onClick={handleSubmit}
            disabled={
              picks.length !== 3 ||
              !isValidEquation(picks, options, validEquations) ||
              submittedEquations.includes(normalizeEquation(picks, options))
            }
            className="submit-btn roboto-slab"
            style={{ fontFamily: 'Roboto Slab, serif', textTransform: 'uppercase' }}
          >
            Submit
          </button>
          <button
            onClick={() => setShowAnswers(!showAnswers)}
            className="show-answers-btn roboto-slab"
            style={{ fontFamily: 'Roboto Slab, serif', textTransform: 'uppercase' }}
          >
            {showAnswers ? 'Hide Solutions' : 'Show Solutions'}
          </button>
        </div>
      </div>
      <div className="scoreboard-outer">
        <div className="scoreboard roboto-slab" style={{ fontFamily: 'Roboto Slab, serif', textTransform: 'uppercase' }}>
          <h2>Scoreboard</h2>
          <ul>
            {scoreboard.map((entry, i) => (
              <li key={i} className={entry.correct ? 'correct' : 'incorrect'}>
                {getEquationStringFromOptions(entry.picks, options)} = <strong style={{ fontFamily: 'Roboto Slab, serif', fontWeight: 'bold', fontSize: '1.7rem' }}>{entry.value}</strong>
                {entry.correct && <span className="check"> ✔</span>}
              </li>
            ))}
          </ul>
        </div>
        <div className={`appreciation-message-subtle${showAppreciation ? ' show' : ''}`}>{showAppreciation && appreciationMsg}</div>
      </div>
      {showAnswers && (
        <div className="answers-box roboto-slab" style={{ fontFamily: 'Roboto Slab, serif', textTransform: 'uppercase' }}>
          <h2>All Possible Solutions</h2>
          <ul>
            {puzzle.valid_equations && puzzle.valid_equations.map((eq, i) => (
              <li key={i}>
                {eq.join(' ')} = <strong style={{ fontFamily: 'Roboto Slab, serif', fontWeight: 'bold', fontSize: '1.7rem' }}>{target}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="nav-button-row">
        <button
          onClick={handlePrev}
          className="reset-btn roboto-slab"
          style={{ fontFamily: 'Roboto Slab, serif', textTransform: 'uppercase' }}
        >
          Previous
        </button>
        <button
          onClick={handleNext}
          className="reset-btn roboto-slab"
          style={{ fontFamily: 'Roboto Slab, serif', textTransform: 'uppercase' }}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default App;
