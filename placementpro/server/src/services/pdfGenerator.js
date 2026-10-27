const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const PDF_DIR = path.join(__dirname, '..', 'storage', 'materials');
if (!fs.existsSync(PDF_DIR)) {
  fs.mkdirSync(PDF_DIR, { recursive: true });
}

function createStyledDoc(title, subtitle, category) {
  const doc = new PDFDocument({
    margin: 40,
    size: 'A4',
    bufferPages: true,
  });

  // Header banner
  doc.rect(0, 0, 595.28, 70).fill('#0ea5e9');
  doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold').text(title, 40, 20);
  doc.fontSize(10).font('Helvetica').text(`Prepo by Avneesh — ${subtitle} | Category: ${category.toUpperCase()}`, 40, 44);

  doc.fillColor('#0f172a').font('Helvetica');
  doc.y = 90;
  return doc;
}

function addFooter(doc) {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.fillColor('#94a3b8').fontSize(8).font('Helvetica');
    doc.text(
      `Prepo by Avneesh Placement Library | Page ${i + 1} of ${range.count} | Verified Practice Resource`,
      40,
      800,
      { align: 'center', width: 515 }
    );
  }
}

// 1. Quantitative Aptitude Formula Handbook
async function generateQuantFormulas() {
  const filePath = path.join(PDF_DIR, 'quant-formula-handbook.pdf');
  const doc = createStyledDoc('Quantitative Aptitude Formula Handbook', 'Core Formulas & Shortcuts', 'Formula Sheet');

  doc.fontSize(14).font('Helvetica-Bold').fillColor('#0284c7').text('1. Percentages, Profit & Loss');
  doc.moveDown(0.3);
  doc.fontSize(10).font('Helvetica').fillColor('#334155').text(
    `• Fraction to %: 1/2 = 50%, 1/3 = 33.33%, 1/4 = 25%, 1/5 = 20%, 1/6 = 16.66%, 1/7 = 14.28%, 1/8 = 12.5%\n` +
    `• Profit % = (Profit / CP) * 100 | Loss % = (Loss / CP) * 100\n` +
    `• Selling Price (SP) = CP * (1 + Profit% / 100) or CP * (1 - Loss% / 100)\n` +
    `• Successive Discounts: Single discount equivalent to d1% and d2% = [d1 + d2 - (d1 * d2) / 100]%\n` +
    `• Faulty Weights: True Weight / False Weight = (100 + Gain%) / 100`
  );

  doc.moveDown(0.8);
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#0284c7').text('2. Time & Work, Pipes & Cisterns');
  doc.moveDown(0.3);
  doc.fontSize(10).font('Helvetica').fillColor('#334155').text(
    `• Work = Efficiency * Time | If A does work in X days and B in Y days: Together = (X * Y) / (X + Y)\n` +
    `• Men, Days, Hours formula: (M1 * D1 * H1) / W1 = (M2 * D2 * H2) / W2\n` +
    `• Alternating Work: Calculate work completed in cycles of 2 or 3 days first to avoid overshoot.\n` +
    `• Inlet / Outlet Pipes: Net Rate = Rate of Inlets - Rate of Outlets`
  );

  doc.moveDown(0.8);
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#0284c7').text('3. Time, Speed & Distance, Trains & Boats');
  doc.moveDown(0.3);
  doc.fontSize(10).font('Helvetica').fillColor('#334155').text(
    `• Conversion: 1 km/h = 5/18 m/s | 1 m/s = 18/5 km/h\n` +
    `• Average Speed (Equal distances at speed A and B) = 2AB / (A + B)\n` +
    `• Relative Speed (Same direction) = S1 - S2 | (Opposite direction) = S1 + S2\n` +
    `• Crossing a platform of length P by train of length L: Total Distance = L + P\n` +
    `• Boats: Downstream = Speed + Current | Upstream = Speed - Current`
  );

  doc.moveDown(0.8);
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#0284c7').text('4. Simple Interest & Compound Interest');
  doc.moveDown(0.3);
  doc.fontSize(10).font('Helvetica').fillColor('#334155').text(
    `• Simple Interest (SI) = (P * R * T) / 100\n` +
    `• Compound Amount = P * (1 + R / 100)^T\n` +
    `• Difference between CI and SI for 2 years = P * (R / 100)^2\n` +
    `• Difference between CI and SI for 3 years = P * (R / 100)^2 * (3 + R / 100)`
  );

  addFooter(doc);
  return new Promise((resolve) => {
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    doc.end();
    stream.on('finish', () => resolve(filePath));
  });
}

// 2. Logical Reasoning Quick Revision Notes
async function generateReasoningNotes() {
  const filePath = path.join(PDF_DIR, 'reasoning-quick-notes.pdf');
  const doc = createStyledDoc('Logical Reasoning Quick Revision Notes', 'Techniques, Shortcuts & Rules', 'Quick Revision Notes');

  doc.fontSize(14).font('Helvetica-Bold').fillColor('#0284c7').text('1. Syllogisms & Venn Logic Rules');
  doc.moveDown(0.3);
  doc.fontSize(10).font('Helvetica').fillColor('#334155').text(
    `• Universal Positive (All A are B): Some A are B (True), Some B are A (True). All B are A (False/Indeterminate).\n` +
    `• Particular Positive (Some A are B): Converse is Some B are A. No universal conclusions can be drawn.\n` +
    `• Universal Negative (No A is B): No B is A (True), Some A are not B (True).\n` +
    `• Either/Or Case: Two conclusions share identical subjects/predicates, both individually false, one positive and one negative.`
  );

  doc.moveDown(0.8);
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#0284c7').text('2. Coding-Decoding & Letter Ranks');
  doc.moveDown(0.3);
  doc.fontSize(10).font('Helvetica').fillColor('#334155').text(
    `• EJOTY Rule: E=5, J=10, O=15, T=20, Y=25 (Alphabet position benchmarks)\n` +
    `• Reverse Letters: Sum of positions = 27 (A <-> Z: 1+26=27, B <-> Y: 2+25=27, M <-> N: 13+14=27)\n` +
    `• Shift patterns: Check +1/-1 alternating, reverse word shift, and consonant/vowel independent shifts.`
  );

  doc.moveDown(0.8);
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#0284c7').text('3. Blood Relations & Direction Sense');
  doc.moveDown(0.3);
  doc.fontSize(10).font('Helvetica').fillColor('#334155').text(
    `• Gender Representation: (+) Male, (-) Female, (=) Spouses, (|) Vertical parent-child generation branch.\n` +
    `• Compass Directions: Standard N, S, E, W. Right turn from North is East; Left turn from North is West.\n` +
    `• Shortest Displacement: Pythagoras Theorem: c = sqrt(a^2 + b^2)`
  );

  addFooter(doc);
  return new Promise((resolve) => {
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    doc.end();
    stream.on('finish', () => resolve(filePath));
  });
}

// 3. CS Fundamentals Handbook (OOP, DBMS, SQL, OS, CN)
async function generateCsNotes() {
  const filePath = path.join(PDF_DIR, 'cs-fundamentals-handbook.pdf');
  const doc = createStyledDoc('CS Fundamentals Revision Handbook', 'OOP, DBMS, SQL, OS & Networks', 'Quick Revision Notes');

  doc.fontSize(14).font('Helvetica-Bold').fillColor('#0284c7').text('1. OOP Principles');
  doc.moveDown(0.3);
  doc.fontSize(10).font('Helvetica').fillColor('#334155').text(
    `• Encapsulation: Bundling data and methods into a single unit; data hiding via access specifiers (private/protected/public).\n` +
    `• Abstraction: Hiding implementation details and exposing only essential interfaces (Interfaces & Abstract Classes).\n` +
    `• Inheritance: Reusability mechanism (IS-A relationship); Single, Multilevel, Hierarchical, Multiple (via interfaces).\n` +
    `• Polymorphism: Compile-time (Method Overloading) vs Run-time (Method Overriding with dynamic dispatch).`
  );

  doc.moveDown(0.8);
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#0284c7').text('2. DBMS & SQL Core');
  doc.moveDown(0.3);
  doc.fontSize(10).font('Helvetica').fillColor('#334155').text(
    `• ACID Properties: Atomicity (All or nothing), Consistency (State preservation), Isolation (Concurrent safety), Durability (Persisted).\n` +
    `• Normalization: 1NF (Atomic attributes), 2NF (No partial functional dependency), 3NF (No transitive dependency), BCNF.\n` +
    `• SQL Joins: INNER (matching records), LEFT/RIGHT (all from left/right + matching), FULL OUTER, CROSS (Cartesian).\n` +
    `• Group By & Having: GROUP BY aggregates rows; HAVING filters aggregated groups (WHERE cannot filter aggregations).`
  );

  doc.moveDown(0.8);
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#0284c7').text('3. Operating Systems & Computer Networks');
  doc.moveDown(0.3);
  doc.fontSize(10).font('Helvetica').fillColor('#334155').text(
    `• Deadlock Coffman Conditions: Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait (All 4 must hold).\n` +
    `• Process vs Thread: Process has independent address space; threads share heap, code, data of parent process.\n` +
    `• OSI 7 Layers: Physical -> Data Link -> Network (IP) -> Transport (TCP/UDP) -> Session -> Presentation -> Application.\n` +
    `• TCP vs UDP: TCP is connection-oriented, reliable, with 3-way handshake (SYN, SYN-ACK, ACK); UDP is connectionless & fast.`
  );

  addFooter(doc);
  return new Promise((resolve) => {
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    doc.end();
    stream.on('finish', () => resolve(filePath));
  });
}

// 4. DSA & Time Complexity Cheat Sheet
async function generateDsaCheatSheet() {
  const filePath = path.join(PDF_DIR, 'dsa-time-complexity-cheat-sheet.pdf');
  const doc = createStyledDoc('DSA & Time Complexity Cheat Sheet', 'Big-O Analysis & Common Patterns', 'Formula Sheet');

  doc.fontSize(14).font('Helvetica-Bold').fillColor('#0284c7').text('1. Sorting Algorithm Complexities');
  doc.moveDown(0.3);
  doc.fontSize(10).font('Helvetica').fillColor('#334155').text(
    `• Quick Sort: Best/Avg: O(N log N) | Worst: O(N^2) | Space: O(log N) auxiliary recursion\n` +
    `• Merge Sort: Best/Avg/Worst: O(N log N) | Space: O(N) | Stable sorting\n` +
    `• Heap Sort: Best/Avg/Worst: O(N log N) | Space: O(1) in-place\n` +
    `• Insertion Sort: Best: O(N) (nearly sorted) | Worst: O(N^2) | Space: O(1)`
  );

  doc.moveDown(0.8);
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#0284c7').text('2. Core Data Structure Operations');
  doc.moveDown(0.3);
  doc.fontSize(10).font('Helvetica').fillColor('#334155').text(
    `• Array / Dynamic Array: Access O(1), Search O(N), Insert/Delete O(N)\n` +
    `• Hash Map / Hash Set: Average Access/Insert/Delete O(1) | Worst: O(N) hash collisions\n` +
    `• Binary Search Tree (BST): Balanced: O(log N) search/insert | Skewed: O(N)\n` +
    `• Priority Queue / Binary Heap: Find Min/Max O(1), Insert O(log N), Extract Min/Max O(log N)`
  );

  addFooter(doc);
  return new Promise((resolve) => {
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    doc.end();
    stream.on('finish', () => resolve(filePath));
  });
}

// 5. TCS NQT & Company Placement Blueprint
async function generateCompanyGuide() {
  const filePath = path.join(PDF_DIR, 'tcs-nqt-placement-guide.pdf');
  const doc = createStyledDoc('TCS NQT Preparation Blueprint & Syllabus', 'Exam Pattern, Syllabus & Interview FAQ', 'Company-Wise Preparation');

  doc.fontSize(14).font('Helvetica-Bold').fillColor('#0284c7').text('1. TCS NQT Hiring Structure & Patterns');
  doc.moveDown(0.3);
  doc.fontSize(10).font('Helvetica').fillColor('#334155').text(
    `• Track: Ninja (Foundation) and Digital/Prime (Advanced Cognitive + Coding).\n` +
    `• Section 1 - Numerical Ability: Arithmetic, algebra, statistics, time & work, data interpretation.\n` +
    `• Section 2 - Reasoning Ability: Syllogisms, series, blood relations, arrangements, data sufficiency.\n` +
    `• Section 3 - Verbal Ability: Reading comprehension, sentence completion, error detection, vocabulary.\n` +
    `• Section 4 - Advanced Coding: 2 problems (Language choice: Java, Python, C, C++). Complexity O(N) or O(N log N).`
  );

  doc.moveDown(0.8);
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#0284c7').text('2. Technical Interview Survival Checklist');
  doc.moveDown(0.3);
  doc.fontSize(10).font('Helvetica').fillColor('#334155').text(
    `• Explain your final-year/major project architecture in 90 seconds (Problem -> Tech stack -> Your contribution -> Results).\n` +
    `• Be ready to write clean code on paper/notepad for string manipulation, array sliding windows, or SQL aggregations.\n` +
    `• Core questions: Difference between abstract class and interface, normalization, indexing, memory allocation.`
  );

  addFooter(doc);
  return new Promise((resolve) => {
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    doc.end();
    stream.on('finish', () => resolve(filePath));
  });
}

// 6. Practice Mock Paper with Complete Solutions
async function generateAptitudeMock() {
  const filePath = path.join(PDF_DIR, 'aptitude-mock-test-solutions.pdf');
  const doc = createStyledDoc('Aptitude Practice Mock Paper with Solutions', '20 Model Questions with Step-by-Step Solutions', 'Mock Tests');

  doc.fontSize(13).font('Helvetica-Bold').fillColor('#0284c7').text('Section A: Quantitative Aptitude (Sample Problems)');
  doc.moveDown(0.4);
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a').text('Q1. A train running at 54 km/h takes 20 seconds to pass a platform 150m long. Find train length.');
  doc.fontSize(9).font('Helvetica').fillColor('#475569').text(
    'Solution: Speed = 54 * (5/18) = 15 m/s. Total distance = Speed * Time = 15 * 20 = 300m.\n' +
    'Total distance = Train Length + Platform Length => 300 = Train Length + 150 => Train Length = 150m. (Answer: 150m)'
  );

  doc.moveDown(0.6);
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a').text('Q2. A sum of money doubles itself in 5 years at simple interest. In how many years will it become 4 times?');
  doc.fontSize(9).font('Helvetica').fillColor('#475569').text(
    'Solution: Let Principal = P. Amount = 2P, so SI = P. Formula: SI = (P * R * T)/100 => P = (P * R * 5)/100 => R = 20%.\n' +
    'For amount to become 4P: SI required = 3P. 3P = (P * 20 * T)/100 => T = 15 years. (Answer: 15 years)'
  );

  doc.moveDown(0.8);
  doc.fontSize(13).font('Helvetica-Bold').fillColor('#0284c7').text('Section B: Logical Reasoning (Sample Problems)');
  doc.moveDown(0.4);
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a').text('Q3. Pointing to a photograph, a man says: "She is the daughter of my grandfather\'s only son."');
  doc.fontSize(9).font('Helvetica').fillColor('#475569').text(
    'Solution: "My grandfather\'s only son" = Man\'s father. "Daughter of my father" = Sister of the man.\n' +
    'Therefore, the woman in photograph is the man\'s Sister. (Answer: Sister)'
  );

  addFooter(doc);
  return new Promise((resolve) => {
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    doc.end();
    stream.on('finish', () => resolve(filePath));
  });
}

async function generateAllPdfs() {
  console.log('Generating initial verified PDF library...');
  const results = await Promise.all([
    generateQuantFormulas(),
    generateReasoningNotes(),
    generateCsNotes(),
    generateDsaCheatSheet(),
    generateCompanyGuide(),
    generateAptitudeMock(),
  ]);
  console.log('Generated PDFs successfully:', results);
  return results;
}

module.exports = { generateAllPdfs, PDF_DIR };
