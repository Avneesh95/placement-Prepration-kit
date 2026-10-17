// Original practice-question generators. Every answer is computed in code, so arithmetic cannot be mis-keyed.
// Output of each generator: { topic, subtopic, difficulty, text, answer, fmt?, options?, explanation, seconds }
function rng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const hashStr = (s) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const ri = (r, a, b) => a + Math.floor(r() * (b - a + 1));
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
const shuffle = (r, arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const lcm = (a, b) => (a / gcd(a, b)) * b;
const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));
const nCr = (n, r) => { let x = 1; for (let i = 1; i <= r; i++) x = (x * (n - r + i)) / i; return Math.round(x); };
const nPr = (n, r) => { let x = 1; for (let i = 0; i < r; i++) x *= n - i; return x; };
const trim = (n) => String(Math.round(n * 100) / 100);
const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

// Build 4 numeric options around `ans` with the correct one placed randomly.
function numOptions(r, ans, { fmt = String, step, allowNeg = false, integer = true } = {}) {
  step = step || Math.max(1, Math.round(Math.abs(ans) * 0.1)) ;
  const cands = [];
  for (const k of [1, -1, 2, -2, 3, -3, 4, 5]) { const v = ans + k * step; if ((allowNeg || v >= 0) && v !== ans && (!integer || Number.isInteger(v))) cands.push(v); }
  const wrong = shuffle(r, [...new Set(cands)]).slice(0, 3);
  const opts = shuffle(r, [ans, ...wrong]);
  return { options: opts.map(fmt), correct: opts.indexOf(ans) };
}
function strOptions(r, ans, distractors) {
  const d = [...new Set(distractors.filter((x) => x !== ans))];
  const opts = shuffle(r, [ans, ...shuffle(r, d).slice(0, 3)]);
  return { options: opts, correct: opts.indexOf(ans) };
}
const fracStr = (n, d) => { const g = gcd(n, d); return d / g === 1 ? `${n / g}` : `${n / g}/${d / g}`; };

// ---------------------------------------------------------------- APTITUDE
const apt = {};
apt.percentages = (r) => {
  const v = ri(r, 0, 2);
  if (v === 0) { const x = pick(r, [10, 15, 20, 25, 30, 40]), y = pick(r, [5, 10, 15, 20, 25]); const net = Math.round((x - y - (x * y) / 100) * 100) / 100;
    return { subtopic: 'successive change', difficulty: 'medium', text: `A number is first increased by ${x}% and then decreased by ${y}%. What is the net percentage change?`, answer: net, fmt: (n) => `${trim(n)}%`, step: 2.5, integer: false, allowNeg: true,
      explanation: `Net change = x − y − xy/100 = ${x} − ${y} − (${x}×${y})/100 = ${trim(net)}%. A positive value means a net increase, a negative one a net decrease.`, seconds: 70 }; }
  if (v === 1) { const total = pick(r, [400, 500, 600, 800, 1200, 1500]), p = pick(r, [12, 15, 18, 24, 35, 45]); const ans = (total * p) / 100;
    return { subtopic: 'percentage of a quantity', difficulty: 'easy', text: `What is ${p}% of ${total}?`, answer: ans, explanation: `${p}% of ${total} = ${p}/100 × ${total} = ${ans}.`, seconds: 40 }; }
  const m = pick(r, [200, 250, 400, 500, 800]), s = pick(r, [8, 12, 16, 20, 24, 36].filter((x) => (m * x) % 100 === 0)) ; const got = (m * s) / 100;
  return { subtopic: 'finding the whole', difficulty: 'easy', text: `${got} is ${s}% of a number. What is the number?`, answer: m, explanation: `Number = ${got} × 100 / ${s} = ${m}.`, seconds: 50 };
};
apt['profit-loss'] = (r) => {
  const v = ri(r, 0, 2);
  if (v === 0) { const cp = ri(r, 10, 100) * 20, p = pick(r, [5, 10, 15, 20, 25, 30, 40]); const sp = (cp * (100 + p)) / 100;
    return { subtopic: 'selling price from profit', difficulty: 'easy', text: `An article is bought for ${inr(cp)} and sold at a profit of ${p}%. Find its selling price (in ₹).`, answer: sp, explanation: `SP = CP × (100 + profit%)/100 = ${cp} × ${100 + p}/100 = ${sp}.`, seconds: 50 }; }
  if (v === 1) { const mp = ri(r, 5, 60) * 100, d = pick(r, [10, 20, 25, 30]); const sp = (mp * (100 - d)) / 100;
    return { subtopic: 'discount', difficulty: 'easy', text: `A shirt has a marked price of ${inr(mp)}. A discount of ${d}% is given. What is the price paid (in ₹)?`, answer: sp, explanation: `Price = ${mp} × (100 − ${d})/100 = ${sp}.`, seconds: 50 }; }
  const cp = ri(r, 10, 60) * 100, l = pick(r, [10, 20, 25]); const sp = (cp * (100 - l)) / 100;
  return { subtopic: 'cost price from loss', difficulty: 'medium', text: `By selling an item for ${inr(sp)}, a shopkeeper incurs a loss of ${l}%. What was the cost price (in ₹)?`, answer: cp, explanation: `SP = 0.${100 - l} × CP → CP = ${sp} × 100/${100 - l} = ${cp}.`, seconds: 70 };
};
apt['ratio-proportion'] = (r) => {
  const a = ri(r, 2, 5), b = ri(r, 2, 6), c = ri(r, 3, 8), k = ri(r, 4, 25) * 10; const total = k * (a + b + c);
  return { subtopic: 'dividing in a ratio', difficulty: 'easy', text: `${inr(total)} is divided among three people in the ratio ${a}:${b}:${c}. How much does the second person get (in ₹)?`, answer: k * b, explanation: `Total parts = ${a + b + c}. One part = ${total}/${a + b + c} = ${k}. Second share = ${b} × ${k} = ${k * b}.`, seconds: 60 };
};
apt.averages = (r) => {
  const A = ri(r, 20, 40), B = A + ri(r, 2, 6); const N = 6 * B - 5 * A;
  return { subtopic: 'average after adding an item', difficulty: 'medium', text: `The average of 5 numbers is ${A}. A sixth number is added and the average becomes ${B}. What is the sixth number?`, answer: N, explanation: `Sum of 5 = ${5 * A}. Sum of 6 = ${6 * B}. Sixth number = ${6 * B} − ${5 * A} = ${N}.`, seconds: 70 };
};
apt['time-work'] = (r) => {
  const x = ri(r, 1, 4), y = ri(r, x + 1, 6); const a = x * (x + y), b = y * (x + y);
  return { subtopic: 'two workers together', difficulty: 'medium', text: `A can finish a job in ${a} days and B can finish it in ${b} days. Working together, in how many days will they finish it?`, answer: x * y, explanation: `Rate = 1/${a} + 1/${b} = ${b + a}/${a * b} per day. Days = ${a * b}/${a + b} = ${x * y}.`, seconds: 80 };
};
apt['pipes-cisterns'] = (r) => {
  const x = ri(r, 2, 5), d = ri(r, 1, 3); const a = x * d, b = (x + 1) * d; const t = x * (x + 1) * d;
  return { subtopic: 'inlet and leak', difficulty: 'hard', text: `A pipe fills a tank in ${a} hours. Because of a leak at the bottom, it takes the pipe ${t} hours to fill the tank. In how many hours can the leak alone empty the full tank?`, answer: b,
    explanation: `Net fill rate = 1/${t}. Pipe rate = 1/${a}. Leak rate = 1/${a} − 1/${t} = ${t - a}/${a * t} = 1/${(a * t) / (t - a)}. So the leak empties the tank in ${b} hours.`, seconds: 100 };
};
apt['speed-distance'] = (r) => {
  const v = ri(r, 0, 2);
  if (v === 0) { const k = ri(r, 2, 6), t = ri(r, 4, 12); const L = 5 * k * t;
    return { subtopic: 'train crossing a pole', difficulty: 'medium', text: `A train ${L} m long runs at ${18 * k} km/h. How many seconds does it take to cross a telegraph pole?`, answer: t, explanation: `Speed = ${18 * k} × 5/18 = ${5 * k} m/s. Time = ${L}/${5 * k} = ${t} s.`, seconds: 70 }; }
  if (v === 1) { const k = ri(r, 3, 8), t = ri(r, 5, 12); const s1 = ri(r, 4, 10) * 3; const rel = 18 * k; const s2 = rel - s1; if (s2 <= 0) return apt['speed-distance'](r); const L = 5 * k * t; const l1 = Math.round(L / 2);
    return { subtopic: 'trains in opposite directions', difficulty: 'hard', text: `Two trains of lengths ${l1} m and ${L - l1} m run in opposite directions at ${s1} km/h and ${s2} km/h. In how many seconds do they completely cross each other?`, answer: t, explanation: `Relative speed = ${s1} + ${s2} = ${rel} km/h = ${5 * k} m/s. Distance = ${l1} + ${L - l1} = ${L} m. Time = ${L}/${5 * k} = ${t} s.`, seconds: 100 }; }
  const [a, b] = pick(r, [[30, 60], [40, 60], [20, 30], [60, 90], [50, 75]]); const avg = (2 * a * b) / (a + b);
  return { subtopic: 'average speed', difficulty: 'medium', text: `A car covers a distance at ${a} km/h and returns the same distance at ${b} km/h. What is its average speed for the whole trip (in km/h)?`, answer: avg, explanation: `For equal distances, average speed = 2ab/(a+b) = 2×${a}×${b}/${a + b} = ${avg} km/h.`, seconds: 70 };
};
apt['boats-streams'] = (r) => {
  const u = ri(r, 8, 20), s = ri(r, 2, 6); const k = ri(r, 2, 5); const D = (u + s) * k;
  if (ri(r, 0, 1)) return { subtopic: 'time downstream', difficulty: 'medium', text: `A boat goes ${u} km/h in still water and the stream flows at ${s} km/h. How many hours will it take to go ${D} km downstream?`, answer: k, explanation: `Downstream speed = ${u} + ${s} = ${u + s} km/h. Time = ${D}/${u + s} = ${k} h.`, seconds: 60 };
  return { subtopic: 'upstream speed', difficulty: 'easy', text: `A boat's speed in still water is ${u} km/h and the stream's speed is ${s} km/h. What is its speed upstream (in km/h)?`, answer: u - s, explanation: `Upstream speed = ${u} − ${s} = ${u - s} km/h.`, seconds: 40 };
};
apt.interest = (r) => {
  if (ri(r, 0, 1)) { const P = ri(r, 5, 40) * 1000, R = ri(r, 4, 12), T = ri(r, 2, 5); const si = (P * R * T) / 100;
    return { subtopic: 'simple interest', difficulty: 'easy', text: `Find the simple interest on ${inr(P)} at ${R}% per annum for ${T} years (in ₹).`, answer: si, explanation: `SI = PRT/100 = ${P}×${R}×${T}/100 = ${si}.`, seconds: 50 }; }
  const P = 400 * ri(r, 2, 15), R = pick(r, [5, 10, 15, 20]); const ci = Math.round(P * ((1 + R / 100) ** 2 - 1));
  return { subtopic: 'compound interest (2 years)', difficulty: 'medium', text: `What is the compound interest on ${inr(P)} for 2 years at ${R}% per annum, compounded annually (in ₹)?`, answer: ci, explanation: `Amount = ${P} × (1 + ${R}/100)² = ${Math.round(P * (1 + R / 100) ** 2)}. CI = Amount − Principal = ${ci}.`, seconds: 80 };
};
apt['number-series'] = (r) => {
  const v = ri(r, 0, 3);
  if (v === 0) { const a = ri(r, 2, 20), d = ri(r, 3, 9); const s = [0, 1, 2, 3, 4].map((i) => a + i * d);
    return { subtopic: 'arithmetic series', difficulty: 'easy', text: `Find the next number: ${s.join(', ')}, ?`, answer: a + 5 * d, explanation: `Each term increases by ${d}. Next = ${s[4]} + ${d} = ${a + 5 * d}.`, seconds: 40 }; }
  if (v === 1) { const a = ri(r, 1, 4), q = ri(r, 2, 3); const s = [0, 1, 2, 3, 4].map((i) => a * q ** i);
    return { subtopic: 'geometric series', difficulty: 'easy', text: `Find the next number: ${s.join(', ')}, ?`, answer: a * q ** 5, explanation: `Each term is multiplied by ${q}. Next = ${s[4]} × ${q} = ${a * q ** 5}.`, seconds: 40 }; }
  if (v === 2) { const n = ri(r, 2, 6); const s = [0, 1, 2, 3, 4].map((i) => (n + i) ** 2 + 1);
    return { subtopic: 'squares plus constant', difficulty: 'medium', text: `Find the next number: ${s.join(', ')}, ?`, answer: (n + 5) ** 2 + 1, explanation: `The terms are ${[0, 1, 2, 3, 4].map((i) => `${n + i}²+1`).join(', ')}. Next = ${n + 5}²+1 = ${(n + 5) ** 2 + 1}.`, seconds: 60 }; }
  const a = ri(r, 2, 10), d1 = ri(r, 2, 5); const s = [a]; for (let i = 1; i < 6; i++) s.push(s[i - 1] + d1 + i);
  return { subtopic: 'increasing differences', difficulty: 'medium', text: `Find the next number: ${s.slice(0, 5).join(', ')}, ?`, answer: s[5], explanation: `Differences are ${[1, 2, 3, 4].map((i) => s[i] - s[i - 1]).join(', ')} — they grow by 1 each step. Next difference ${s[5] - s[4]}, so ${s[4]} + ${s[5] - s[4]} = ${s[5]}.`, seconds: 70 };
};
apt['hcf-lcm'] = (r) => {
  const g = ri(r, 2, 9), x = pick(r, [2, 3, 4, 5, 7]), y = pick(r, [3, 5, 6, 7, 8, 9].filter((v) => gcd(v, x) === 1)); const a = g * x, b = g * y, l = g * x * y;
  if (ri(r, 0, 1)) return { subtopic: 'LCM of two numbers', difficulty: 'easy', text: `Find the LCM of ${a} and ${b}.`, answer: l, explanation: `HCF = ${g}. LCM = (${a} × ${b})/${g} = ${l}.`, seconds: 60 };
  return { subtopic: 'HCF × LCM relation', difficulty: 'medium', text: `The HCF of two numbers is ${g} and their LCM is ${l}. If one number is ${a}, what is the other?`, answer: b, explanation: `Product of the numbers = HCF × LCM = ${g} × ${l} = ${g * l}. Other number = ${g * l}/${a} = ${b}.`, seconds: 60 };
};
apt.ages = (r) => {
  if (ri(r, 0, 1)) { const B = ri(r, 12, 30), d = ri(r, 4, 14); const S = 2 * B + d;
    return { subtopic: 'sum and difference', difficulty: 'easy', text: `The sum of the ages of Asha and Bala is ${S} years and Asha is ${d} years older than Bala. How old is Asha?`, answer: B + d, explanation: `Asha = (sum + difference)/2 = (${S} + ${d})/2 = ${B + d}.`, seconds: 50 }; }
  const b = ri(r, 10, 25), k = ri(r, 2, 4), x = ri(r, 2, 8); const A = k * (b - x) + x;
  return { subtopic: 'ages in the past', difficulty: 'medium', text: `${x} years ago, Ravi was ${k} times as old as Sita. Sita is now ${b} years old. How old is Ravi now?`, answer: A, explanation: `Sita ${x} years ago = ${b - x}. Ravi then = ${k} × ${b - x} = ${k * (b - x)}. Ravi now = ${k * (b - x)} + ${x} = ${A}.`, seconds: 70 };
};
apt['permutations-combinations'] = (r) => {
  const v = ri(r, 0, 2);
  if (v === 0) { const n = ri(r, 6, 10), k = ri(r, 2, 4);
    return { subtopic: 'combinations', difficulty: 'easy', text: `In how many ways can a committee of ${k} be chosen from ${n} people?`, answer: nCr(n, k), explanation: `${n}C${k} = ${n}!/(${k}!×${n - k}!) = ${nCr(n, k)}.`, seconds: 50 }; }
  if (v === 1) { const w = pick(r, ['LEVEL', 'APPLE', 'BANANA', 'TOMATO', 'SUCCESS', 'COMMITTEE']); const f = {}; for (const c of w) f[c] = (f[c] || 0) + 1; const rep = Object.entries(f).filter(([, c]) => c > 1);
    const ans = Math.round(fact(w.length) / Object.values(f).reduce((a, c) => a * fact(c), 1));
    return { subtopic: 'arrangements with repeated letters', difficulty: 'hard', text: `How many distinct arrangements can be made using all the letters of the word ${w}?`, answer: ans, explanation: `${w.length}! divided by the factorial of each repeated letter's count (${rep.map(([l, c]) => `${l}:${c}`).join(', ')}) = ${ans}.`, seconds: 90 }; }
  const n = ri(r, 4, 7), k = ri(r, 2, 3);
  return { subtopic: 'permutations', difficulty: 'medium', text: `In how many ways can ${k} different prizes be given to ${n} students if no student gets more than one prize?`, answer: nPr(n, k), explanation: `${n}P${k} = ${n}×${n - 1}${k === 3 ? `×${n - 2}` : ''} = ${nPr(n, k)}.`, seconds: 60 };
};
apt.probability = (r) => {
  if (ri(r, 0, 1)) { const s = ri(r, 3, 11); const cnt = s <= 7 ? s - 1 : 13 - s; const ans = fracStr(cnt, 36);
    return { subtopic: 'two dice', difficulty: 'medium', text: `Two fair dice are rolled. What is the probability that the sum of the numbers is ${s}?`, answer: ans, strAnswer: true, distractors: [fracStr(cnt + 1, 36), fracStr(cnt + 2, 36), fracStr(Math.max(1, cnt - 1), 36), fracStr(cnt, 18)], explanation: `Ways to get a sum of ${s} = ${cnt} out of 36 outcomes, so P = ${cnt}/36 = ${ans}.`, seconds: 80 }; }
  const red = ri(r, 3, 7), blue = ri(r, 2, 6); const n = red + blue; const ans = fracStr(red, n);
  return { subtopic: 'drawing a ball', difficulty: 'easy', text: `A bag has ${red} red and ${blue} blue balls. One ball is drawn at random. What is the probability that it is red?`, answer: ans, strAnswer: true, distractors: [fracStr(blue, n), fracStr(red, n + 1), fracStr(red + 1, n), fracStr(red, blue)], explanation: `P(red) = favourable/total = ${red}/${n} = ${ans}.`, seconds: 40 };
};
apt['mixtures-alligation'] = (r) => {
  if (ri(r, 0, 1)) { const a = ri(r, 3, 5), b = ri(r, 1, a - 1), k = ri(r, 2, 6); const M = k * a, W = k * b;
    return { subtopic: 'adding water', difficulty: 'medium', text: `A ${k * (a + b)} litre mixture has milk and water in the ratio ${a}:${b}. How many litres of water must be added to make the ratio 1:1?`, answer: M - W, explanation: `Milk = ${M} L, water = ${W} L. For 1:1 water must equal milk, so add ${M} − ${W} = ${M - W} L.`, seconds: 70 }; }
  const p = ri(r, 4, 10) * 10, q = p + ri(r, 2, 5) * 10, m = ri(r, 1, 3), n = ri(r, 1, 3); const tot = m + n; const price = (m * p + n * q) / tot;
  if (!Number.isInteger(price)) return apt['mixtures-alligation'](r);
  return { subtopic: 'mean price', difficulty: 'medium', text: `Rice at ₹${p}/kg and rice at ₹${q}/kg are mixed in the ratio ${m}:${n}. What is the price per kg of the mixture (in ₹)?`, answer: price, explanation: `Mean price = (${m}×${p} + ${n}×${q})/${tot} = ${price}.`, seconds: 70 };
};
apt.partnership = (r) => {
  const i1 = ri(r, 2, 6) * 1000, i2 = ri(r, 2, 6) * 1000, m1 = ri(r, 6, 12), m2 = ri(r, 4, 12); const r1 = i1 * m1, r2 = i2 * m2; const g = gcd(r1, r2); const a = r1 / g, b = r2 / g; const k = ri(r, 2, 9) * 100; const profit = k * (a + b);
  return { subtopic: 'investment × time', difficulty: 'hard', text: `Anil invests ${inr(i1)} for ${m1} months and Binu invests ${inr(i2)} for ${m2} months. They earn a profit of ${inr(profit)}. What is Anil's share (in ₹)?`, answer: k * a, explanation: `Ratio = ${i1}×${m1} : ${i2}×${m2} = ${r1} : ${r2} = ${a} : ${b}. Anil's share = ${a}/${a + b} × ${profit} = ${k * a}.`, seconds: 100 };
};
apt.algebra = (r) => {
  if (ri(r, 0, 1)) { const x = ri(r, 2, 15), a = ri(r, 2, 6), b = ri(r, 1, 9); const c = a * (x + b);
    return { subtopic: 'linear equation', difficulty: 'easy', text: `If ${a}(x + ${b}) = ${c}, find x.`, answer: x, explanation: `x + ${b} = ${c}/${a} = ${x + b}, so x = ${x}.`, seconds: 45 }; }
  const k = ri(r, 3, 9);
  return { subtopic: 'x + 1/x identity', difficulty: 'medium', text: `If x + 1/x = ${k}, find the value of x² + 1/x².`, answer: k * k - 2, explanation: `Square both sides: x² + 2 + 1/x² = ${k * k}. So x² + 1/x² = ${k * k} − 2 = ${k * k - 2}.`, seconds: 60 };
};
apt.progressions = (r) => {
  const v = ri(r, 0, 2); const a = ri(r, 2, 9), d = ri(r, 2, 7), n = ri(r, 8, 20);
  if (v === 0) return { subtopic: 'nth term of AP', difficulty: 'easy', text: `The first term of an AP is ${a} and the common difference is ${d}. Find its ${n}th term.`, answer: a + (n - 1) * d, explanation: `Tₙ = a + (n−1)d = ${a} + ${n - 1}×${d} = ${a + (n - 1) * d}.`, seconds: 45 };
  if (v === 1) return { subtopic: 'sum of AP', difficulty: 'medium', text: `Find the sum of the first ${n} terms of the AP ${a}, ${a + d}, ${a + 2 * d}, ...`, answer: (n * (2 * a + (n - 1) * d)) / 2, explanation: `Sₙ = n/2 × [2a + (n−1)d] = ${n}/2 × [${2 * a} + ${(n - 1) * d}] = ${(n * (2 * a + (n - 1) * d)) / 2}.`, seconds: 70 };
  const q = ri(r, 2, 3), m = ri(r, 4, 6); return { subtopic: 'GP term', difficulty: 'medium', text: `The first term of a GP is ${a} and the common ratio is ${q}. What is its ${m}th term?`, answer: a * q ** (m - 1), explanation: `Tₙ = a·r^(n−1) = ${a} × ${q}^${m - 1} = ${a * q ** (m - 1)}.`, seconds: 60 };
};
apt['geometry-mensuration'] = (r) => {
  const v = ri(r, 0, 3);
  if (v === 0) { const l = ri(r, 8, 20), b = ri(r, 4, l - 1); return { subtopic: 'rectangle', difficulty: 'easy', text: `The perimeter of a rectangle is ${2 * (l + b)} cm and its length is ${l} cm. What is its area (in cm²)?`, answer: l * b, explanation: `l + b = ${l + b}, so b = ${b} cm. Area = ${l} × ${b} = ${l * b} cm².`, seconds: 60 }; }
  if (v === 1) { const rad = 7 * ri(r, 1, 4); return { subtopic: 'circle', difficulty: 'easy', text: `Find the area of a circle of radius ${rad} cm (take π = 22/7), in cm².`, answer: (22 * rad * rad) / 7, explanation: `Area = πr² = 22/7 × ${rad}² = ${(22 * rad * rad) / 7} cm².`, seconds: 50 }; }
  if (v === 2) { const [a, b, c] = pick(r, [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]]); const k = ri(r, 1, 4); return { subtopic: 'right triangle', difficulty: 'easy', text: `The two shorter sides of a right-angled triangle are ${a * k} cm and ${b * k} cm. Find the hypotenuse (in cm).`, answer: c * k, explanation: `Hypotenuse = √(${a * k}² + ${b * k}²) = √${(a * k) ** 2 + (b * k) ** 2} = ${c * k} cm.`, seconds: 45 }; }
  const rad = 7 * ri(r, 1, 3), h = ri(r, 3, 12); return { subtopic: 'cylinder', difficulty: 'medium', text: `Find the volume of a cylinder with radius ${rad} cm and height ${h} cm (π = 22/7), in cm³.`, answer: (22 * rad * rad * h) / 7, explanation: `V = πr²h = 22/7 × ${rad}² × ${h} = ${(22 * rad * rad * h) / 7} cm³.`, seconds: 70 };
};
apt['data-interpretation'] = (r) => {
  const prods = ['Pens', 'Books', 'Bags', 'Bottles']; const yrs = ['2022', '2023', '2024'];
  const d = prods.map(() => yrs.map(() => ri(r, 8, 40) * 10));
  const table = `Units sold (in hundreds)\nProduct | 2022 | 2023 | 2024\n${prods.map((p, i) => `${p} | ${d[i].join(' | ')}`).join('\n')}`;
  const v = ri(r, 0, 2); const pi = ri(r, 0, 3);
  if (v === 0) { const tot = d[pi].reduce((a, b) => a + b, 0); return { subtopic: 'table totals', difficulty: 'easy', text: `${table}\n\nWhat is the total number of ${prods[pi]} sold over the three years (in hundreds)?`, answer: tot, explanation: `${prods[pi]}: ${d[pi].join(' + ')} = ${tot}.`, seconds: 50 }; }
  if (v === 1) { const tot = d.reduce((a, row) => a + row[2], 0); return { subtopic: 'column totals', difficulty: 'easy', text: `${table}\n\nHow many items of all products together were sold in 2024 (in hundreds)?`, answer: tot, explanation: `2024: ${d.map((x) => x[2]).join(' + ')} = ${tot}.`, seconds: 50 }; }
  const a = d[pi][0], b = d[pi][2]; if (a === b) return apt['data-interpretation'](r); const ch = Math.round(((b - a) / a) * 10000) / 100;
  return { subtopic: 'percentage change', difficulty: 'medium', text: `${table}\n\nBy what percentage did sales of ${prods[pi]} change from 2022 to 2024? (Negative means a decrease; answer to 2 decimals)`, answer: ch, fmt: (n) => `${trim(n)}%`, step: 5, integer: false, allowNeg: true, explanation: `Change = (${b} − ${a})/${a} × 100 = ${ch}%.`, seconds: 80 };
};
apt['approximation-simplification'] = (r) => {
  if (ri(r, 0, 1)) { const c = ri(r, 3, 9), q = ri(r, 4, 15), a = ri(r, 3, 12) * c, b = ri(r, 2, 9); const d = ri(r, 5, 40), e = ri(r, 1, 5); const ans = (a * b) / c + d - e;
    if (!Number.isInteger(ans)) return apt['approximation-simplification'](r);
    return { subtopic: 'BODMAS', difficulty: 'easy', text: `Simplify: ${a} × ${b} ÷ ${c} + ${d} − ${e}`, answer: ans, explanation: `Left to right for × and ÷ first: ${a} × ${b} = ${a * b}; ÷ ${c} = ${(a * b) / c}; then + ${d} − ${e} = ${ans}.`, seconds: 45 }; }
  const x = ri(r, 4, 15), y = ri(r, 3, 12); return { subtopic: 'squares and roots', difficulty: 'easy', text: `Evaluate: √${x * x} + ${y}² − ${x}`, answer: y * y, explanation: `√${x * x} = ${x}; ${y}² = ${y * y}. So ${x} + ${y * y} − ${x} = ${y * y}.`, seconds: 40 };
};
apt['remainders-divisibility'] = (r) => {
  if (ri(r, 0, 1)) { const base = ri(r, 2, 9), p = ri(r, 20, 99), m = pick(r, [5, 6, 7, 9, 11]); let rem = 1; for (let i = 0; i < p; i++) rem = (rem * base) % m;
    return { subtopic: 'power remainders', difficulty: 'hard', text: `What is the remainder when ${base}^${p} is divided by ${m}?`, answer: rem, explanation: `Use the repeating cycle of ${base}^k mod ${m}. Reducing the exponent ${p} by the cycle length gives a remainder of ${rem}.`, seconds: 100 }; }
  const d = pick(r, [7, 9, 11, 13]), q = ri(r, 20, 90), rm = ri(r, 1, d - 1); const N = d * q + rm;
  return { subtopic: 'division remainder', difficulty: 'easy', text: `A number gives remainder ${rm} when divided by ${d}. If the quotient is ${q}, what is the number?`, answer: N, explanation: `Dividend = divisor × quotient + remainder = ${d}×${q} + ${rm} = ${N}.`, seconds: 40 };
};
apt['number-systems'] = (r) => {
  if (ri(r, 0, 1)) { const b = ri(r, 2, 9), p = ri(r, 20, 98); const cyc = []; let x = 1; for (let i = 0; i < 4; i++) { x = (x * b) % 10; cyc.push(x); } const ans = cyc[(p - 1) % 4];
    return { subtopic: 'unit digit', difficulty: 'medium', text: `What is the unit digit of ${b}^${p}?`, answer: ans, explanation: `Unit digits of ${b}^k repeat every 4 steps: ${cyc.join(', ')}. Position (${p} − 1) mod 4 = ${(p - 1) % 4} gives ${ans}.`, seconds: 60 }; }
  const lo = ri(r, 10, 40), hi = lo + ri(r, 15, 30); let c = 0; const ps = []; for (let n = lo; n <= hi; n++) { let pr = n > 1; for (let k = 2; k * k <= n; k++) if (n % k === 0) { pr = false; break; } if (pr) { c++; ps.push(n); } }
  return { subtopic: 'primes in a range', difficulty: 'medium', text: `How many prime numbers are there between ${lo} and ${hi} (both inclusive)?`, answer: c, explanation: `The primes in the range are ${ps.join(', ')} — ${c} in total.`, seconds: 80 };
};
const APT_TOPICS = Object.keys(apt);

// ---------------------------------------------------------------- REASONING
const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const sh = (c, k) => A[(A.indexOf(c) + k + 2600) % 26];
const rea = {};
rea['alphabet-series'] = (r) => {
  const k = ri(r, 2, 5), s = ri(r, 0, 10); const seq = [0, 1, 2, 3, 4].map((i) => sh(A[s], i * k)); const ans = sh(A[s], 5 * k);
  return { subtopic: 'constant step', difficulty: 'easy', text: `Find the next letter in the series: ${seq.join(', ')}, ?`, optsStr: true, answer: ans, distractors: [sh(ans, 1), sh(ans, -1), sh(ans, 2), sh(ans, -2)], explanation: `Each letter moves forward by ${k} positions. After ${seq[4]} comes ${ans}.`, seconds: 40 };
};
rea['coding-decoding'] = (r) => {
  const k = ri(r, 1, 4); const w1 = pick(r, ['CAT', 'DOG', 'SUN', 'BAG', 'PEN']); let w2 = pick(r, ['MAP', 'TOP', 'HIT', 'BOX', 'FAN']);
  const enc = (w) => [...w].map((c) => sh(c, k)).join(''); const ans = enc(w2);
  return { subtopic: 'letter shift', difficulty: 'medium', text: `In a certain code, ${w1} is written as ${enc(w1)}. How is ${w2} written in that code?`, optsStr: true, answer: ans, distractors: [[...w2].map((c) => sh(c, k + 1)).join(''), [...w2].map((c) => sh(c, k - 1)).join(''), [...w2].map((c) => sh(c, -k)).join(''), [...w2].reverse().join('')], explanation: `Each letter is shifted forward by ${k}. Applying the same shift to ${w2} gives ${ans}.`, seconds: 70 };
};
rea['direction-sense'] = (r) => {
  if (ri(r, 0, 1)) { const [a, b, c] = pick(r, [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17]]); const k = ri(r, 1, 3) * 1;
    return { subtopic: 'distance from start', difficulty: 'medium', text: `Ramesh walks ${a * k} km north, turns right and walks ${b * k} km. How far is he from his starting point (in km)?`, answer: c * k, explanation: `North then east makes a right angle. Distance = √(${a * k}² + ${b * k}²) = ${c * k} km.`, seconds: 60 }; }
  const dirs = ['North', 'East', 'South', 'West']; let d = 0; const steps = []; const n = ri(r, 3, 4);
  for (let i = 0; i < n; i++) { const t = pick(r, ['left', 'right', 'right', 'left', 'about-turn']); steps.push(t); d = (d + (t === 'right' ? 1 : t === 'left' ? 3 : 2)) % 4; }
  return { subtopic: 'facing direction', difficulty: 'easy', text: `Meena faces North. She turns ${steps.map((s) => (s === 'about-turn' ? 'about (180°)' : s)).join(', then ')}. Which direction is she facing now?`, optsStr: true, answer: dirs[d], distractors: dirs, explanation: `Start North. Right = +90°, left = −90°, about-turn = 180°. The final heading is ${dirs[d]}.`, seconds: 50 };
};
rea.ranking = (r) => {
  if (ri(r, 0, 1)) { const p = ri(r, 5, 18), q = ri(r, 5, 18);
    return { subtopic: 'total in a row', difficulty: 'easy', text: `In a row, Kavya is ${p}th from the left and ${q}th from the right. How many people are in the row?`, answer: p + q - 1, explanation: `Total = left position + right position − 1 = ${p} + ${q} − 1 = ${p + q - 1}.`, seconds: 40 }; }
  const n = ri(r, 30, 60), t = ri(r, 5, 25);
  return { subtopic: 'rank from bottom', difficulty: 'easy', text: `In a class of ${n} students, Arun's rank from the top is ${t}. What is his rank from the bottom?`, answer: n - t + 1, explanation: `Rank from bottom = total − rank from top + 1 = ${n} − ${t} + 1 = ${n - t + 1}.`, seconds: 40 };
};
rea.clocks = (r) => {
  const h = ri(r, 1, 11), m = ri(r, 1, 29) * 2; let ang = Math.abs(30 * h - 5.5 * m); if (ang > 180) ang = 360 - ang;
  return { subtopic: 'angle between hands', difficulty: 'medium', text: `What is the smaller angle (in degrees) between the hour and minute hands of a clock at ${h}:${String(m).padStart(2, '0')}?`, answer: ang, explanation: `Angle = |30h − 5.5m| = |30×${h} − 5.5×${m}| = ${Math.abs(30 * h - 5.5 * m)}°${Math.abs(30 * h - 5.5 * m) > 180 ? `, so the smaller angle is 360 − that = ${ang}°` : ''}.`, seconds: 80 };
};
rea.calendars = (r) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  if (ri(r, 0, 1)) { const y = ri(r, 1990, 2030), m = ri(r, 0, 11), dd = ri(r, 1, 28); const dt = new Date(Date.UTC(y, m, dd)); const mn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m]; const ans = days[dt.getUTCDay()];
    return { subtopic: 'day of a date', difficulty: 'medium', text: `On which day of the week does ${dd} ${mn} ${y} fall?`, optsStr: true, answer: ans, distractors: days, explanation: `Counting odd days from a known reference date gives ${ans} for ${dd} ${mn} ${y} (checked with calendar arithmetic).`, seconds: 90 }; }
  const si = ri(r, 0, 6), n = ri(r, 20, 200); const ans = days[(si + n) % 7];
  return { subtopic: 'days after', difficulty: 'easy', text: `Today is ${days[si]}. What day of the week will it be after ${n} days?`, optsStr: true, answer: ans, distractors: days, explanation: `${n} mod 7 = ${n % 7}. ${days[si]} + ${n % 7} days = ${ans}.`, seconds: 45 };
};
rea['odd-one-out'] = (r) => {
  const base = [2, 3, 4, 5, 6, 7, 8, 9, 10]; const cubes = shuffle(r, base).slice(0, 4).map((x) => x ** 3); let odd = ri(r, 20, 200); while (cubes.includes(odd) || Math.round(Math.cbrt(odd)) ** 3 === odd) odd++;
  const arr = shuffle(r, [...cubes, odd]);
  return { subtopic: 'number classification', difficulty: 'easy', text: `Find the odd one out: ${arr.join(', ')}`, optsStr: true, answer: String(odd), distractors: cubes.map(String), explanation: `All numbers except ${odd} are perfect cubes (${cubes.map((c) => `${Math.round(Math.cbrt(c))}³=${c}`).join(', ')}).`, seconds: 40 };
};
const REA_TOPICS = Object.keys(rea);

// Turn a generator spec into a question document.
function toQuestion(spec, { r, uid, companies, topic, allowNumeric = false }) {
  const base = { uid, companies, topic, subtopic: spec.subtopic, difficulty: spec.difficulty, explanation: spec.explanation, estimatedSeconds: spec.seconds || 60, provenance: 'practice', verificationStatus: 'original', sourceTitle: 'Original practice question (generated, answer computed in code)', marks: 1, negativeMarks: 0 };
  if (spec.strAnswer || spec.optsStr) {
    const o = strOptions(r, spec.answer, spec.distractors);
    return { ...base, type: 'mcq_single', text: spec.text, options: o.options, correct: [o.correct] };
  }
  if (allowNumeric && Number.isInteger(spec.answer) && !spec.fmt && r() < 0.18) {
    return { ...base, type: 'numeric', text: `${spec.text}\n(Type your answer as a number.)`, numericAnswer: spec.answer, tolerance: 0 };
  }
  const o = numOptions(r, spec.answer, { fmt: spec.fmt || String, step: spec.step, allowNeg: spec.allowNeg, integer: spec.integer !== false });
  return { ...base, type: 'mcq_single', text: spec.text, options: o.options, correct: [o.correct] };
}

function generateSet({ company, subject, perTopic, extra, seedLabel, companies }) {
  const gens = subject === 'aptitude' ? apt : rea; const topics = Object.keys(gens);
  const out = []; const seen = new Set(); let n = 0;
  const plan = [];
  for (const t of topics) for (let i = 0; i < perTopic; i++) plan.push(t);
  const rr = rng(hashStr(`${seedLabel}:plan`)); for (let i = 0; i < extra; i++) plan.push(pick(rr, topics));
  for (const t of plan) {
    for (let attempt = 0; attempt < 25; attempt++) {
      const r = rng(hashStr(`${seedLabel}:${t}:${n}:${attempt}`));
      const spec = gens[t](r); const key = spec.text;
      if (seen.has(key)) continue; seen.add(key);
      const uid = `${company}-${subject.slice(0, 3)}-${t}-${String(++n).padStart(3, '0')}`;
      out.push(toQuestion(spec, { r, uid, companies, topic: t, allowNumeric: subject === 'aptitude' }));
      break;
    }
  }
  return out.map((q) => ({ ...q, subject }));
}
module.exports = { generateSet, APT_TOPICS, REA_TOPICS, rng, hashStr, shuffle, pick, ri };
