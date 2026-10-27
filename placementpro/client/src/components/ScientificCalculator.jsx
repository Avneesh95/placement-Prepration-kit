import { useState } from 'react';
import { Calculator as CalcIcon, X, Delete } from 'lucide-react';

export default function ScientificCalculator({ onClose }) {
  const [display, setDisplay] = useState('0');
  const [memory, setMemory] = useState(0);
  const [isRad, setIsRad] = useState(true);

  const inputDigit = (d) => {
    setDisplay((prev) => (prev === '0' || prev === 'Error' ? String(d) : prev + d));
  };

  const inputDot = () => {
    if (display === 'Error') {
      setDisplay('0.');
      return;
    }
    const parts = display.split(/[\+\-\*\/\(\)]/);
    const last = parts[parts.length - 1];
    if (!last.includes('.')) {
      setDisplay((prev) => prev + '.');
    }
  };

  const inputOp = (op) => {
    if (display === 'Error') return;
    setDisplay((prev) => prev + op);
  };

  const clearAll = () => setDisplay('0');

  const backspace = () => {
    if (display === 'Error' || display.length <= 1) {
      setDisplay('0');
    } else {
      setDisplay((prev) => prev.slice(0, -1));
    }
  };

  const calculate = () => {
    try {
      // Clean display expression for evaluation
      let expr = display
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/π/g, 'Math.PI')
        .replace(/e/g, 'Math.E');

      // Safely evaluate simple math expressions
      // eslint-disable-next-line no-new-func
      const result = Function(`"use strict"; return (${expr})`)();
      if (Number.isFinite(result)) {
        setDisplay(String(Math.round(result * 100000000) / 100000000));
      } else {
        setDisplay('Error');
      }
    } catch {
      setDisplay('Error');
    }
  };

  const applyFunc = (fnName) => {
    try {
      let val = parseFloat(display);
      if (Number.isNaN(val)) return;

      let res = val;
      const angle = isRad ? val : (val * Math.PI) / 180;

      switch (fnName) {
        case 'sin':
          res = Math.sin(angle);
          break;
        case 'cos':
          res = Math.cos(angle);
          break;
        case 'tan':
          res = Math.tan(angle);
          break;
        case 'sqrt':
          res = Math.sqrt(val);
          break;
        case 'sqr':
          res = Math.pow(val, 2);
          break;
        case 'cube':
          res = Math.pow(val, 3);
          break;
        case 'log':
          res = Math.log10(val);
          break;
        case 'ln':
          res = Math.log(val);
          break;
        case '1/x':
          res = 1 / val;
          break;
        case 'fact': {
          let f = 1;
          for (let i = 2; i <= Math.min(val, 20); i++) f *= i;
          res = f;
          break;
        }
        case '+/-':
          res = -val;
          break;
        default:
          break;
      }

      if (Number.isFinite(res)) {
        setDisplay(String(Math.round(res * 100000000) / 100000000));
      } else {
        setDisplay('Error');
      }
    } catch {
      setDisplay('Error');
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 select-none overflow-hidden rounded-2xl border border-slate-300 bg-slate-900 text-white shadow-2xl ring-1 ring-black/40">
      {/* Calculator Header Bar (TCS iON Style) */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-3 py-2 text-xs">
        <div className="flex items-center gap-1.5 font-bold tracking-wide text-sky-400">
          <CalcIcon className="h-3.5 w-3.5" />
          <span>Virtual Calculator</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsRad(!isRad)}
            className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-300 hover:text-white"
          >
            {isRad ? 'RAD' : 'DEG'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Close calculator"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Screen Display */}
      <div className="p-3">
        <div className="flex h-12 items-center justify-end overflow-x-auto rounded-xl bg-slate-950 px-3 font-mono text-lg font-bold text-emerald-400 shadow-inner">
          {display}
        </div>
      </div>

      {/* Keypad Grid */}
      <div className="grid grid-cols-5 gap-1 p-2 pt-0 text-[11px] font-semibold">
        {/* Scientific Row 1 */}
        <button type="button" onClick={() => applyFunc('sin')} className="btn-calc">sin</button>
        <button type="button" onClick={() => applyFunc('cos')} className="btn-calc">cos</button>
        <button type="button" onClick={() => applyFunc('tan')} className="btn-calc">tan</button>
        <button type="button" onClick={() => applyFunc('log')} className="btn-calc">log</button>
        <button type="button" onClick={() => applyFunc('ln')} className="btn-calc">ln</button>

        {/* Scientific Row 2 */}
        <button type="button" onClick={() => applyFunc('sqrt')} className="btn-calc">√</button>
        <button type="button" onClick={() => applyFunc('sqr')} className="btn-calc">x²</button>
        <button type="button" onClick={() => applyFunc('cube')} className="btn-calc">x³</button>
        <button type="button" onClick={() => applyFunc('1/x')} className="btn-calc">1/x</button>
        <button type="button" onClick={() => applyFunc('fact')} className="btn-calc">n!</button>

        {/* Standard Row 1 */}
        <button type="button" onClick={() => inputDigit('(')} className="btn-calc">(</button>
        <button type="button" onClick={() => inputDigit(')')} className="btn-calc">)</button>
        <button type="button" onClick={clearAll} className="btn-calc bg-rose-600/30 text-rose-300 hover:bg-rose-600 hover:text-white">C</button>
        <button type="button" onClick={backspace} className="btn-calc text-amber-300"><Delete className="h-3 w-3 inline" /></button>
        <button type="button" onClick={() => inputOp('/')} className="btn-calc text-sky-400">÷</button>

        {/* Standard Row 2 */}
        <button type="button" onClick={() => inputDigit('7')} className="btn-num">7</button>
        <button type="button" onClick={() => inputDigit('8')} className="btn-num">8</button>
        <button type="button" onClick={() => inputDigit('9')} className="btn-num">9</button>
        <button type="button" onClick={() => applyFunc('+/-')} className="btn-calc">±</button>
        <button type="button" onClick={() => inputOp('*')} className="btn-calc text-sky-400">×</button>

        {/* Standard Row 3 */}
        <button type="button" onClick={() => inputDigit('4')} className="btn-num">4</button>
        <button type="button" onClick={() => inputDigit('5')} className="btn-num">5</button>
        <button type="button" onClick={() => inputDigit('6')} className="btn-num">6</button>
        <button type="button" onClick={() => inputDigit('π')} className="btn-calc">π</button>
        <button type="button" onClick={() => inputOp('-')} className="btn-calc text-sky-400">−</button>

        {/* Standard Row 4 */}
        <button type="button" onClick={() => inputDigit('1')} className="btn-num">1</button>
        <button type="button" onClick={() => inputDigit('2')} className="btn-num">2</button>
        <button type="button" onClick={() => inputDigit('3')} className="btn-num">3</button>
        <button type="button" onClick={() => inputDigit('e')} className="btn-calc">e</button>
        <button type="button" onClick={() => inputOp('+')} className="btn-calc text-sky-400">+</button>

        {/* Standard Row 5 */}
        <button type="button" onClick={() => inputDigit('0')} className="btn-num col-span-2">0</button>
        <button type="button" onClick={inputDot} className="btn-num">.</button>
        <button
          type="button"
          onClick={calculate}
          className="col-span-2 rounded-lg bg-sky-500 py-1.5 font-bold text-white shadow-sm hover:bg-sky-600 active:bg-sky-700"
        >
          =
        </button>
      </div>

      <style>{`
        .btn-calc {
          border-radius: 0.5rem;
          background-color: #1e293b;
          padding: 0.375rem 0.25rem;
          text-align: center;
          transition: background-color 0.15s;
        }
        .btn-calc:hover {
          background-color: #334155;
        }
        .btn-num {
          border-radius: 0.5rem;
          background-color: #0f172a;
          padding: 0.375rem 0.25rem;
          text-align: center;
          color: #f8fafc;
          transition: background-color 0.15s;
        }
        .btn-num:hover {
          background-color: #1e293b;
        }
      `}</style>
    </div>
  );
}
