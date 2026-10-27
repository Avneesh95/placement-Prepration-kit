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
  doc.fillColor('#ffffff').fontSize(17).font('Helvetica-Bold').text(title, 40, 20);
  doc.fontSize(10).font('Helvetica').text(`Prepo by Avneesh — ${subtitle} | Category: ${category.toUpperCase()}`, 40, 44);

  doc.fillColor('#0f172a').font('Helvetica');
  doc.y = 85;
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

  doc.fontSize(13).font('Helvetica-Bold').fillColor('#0284c7').text('1. Percentages, Profit & Loss');
  doc.moveDown(0.2);
  doc.fontSize(9.5).font('Helvetica').fillColor('#334155').text(
    `• Standard Fractions: 1/2 = 50%, 1/3 = 33.33%, 1/4 = 25%, 1/5 = 20%, 1/6 = 16.66%, 1/7 = 14.28%, 1/8 = 12.5%\n` +
    `• Profit % = (Profit / CP) * 100 | Loss % = (Loss / CP) * 100\n` +
    `• SP = CP * (1 + Profit% / 100) or CP * (1 - Loss% / 100)\n` +
    `• Successive Discounts: Single equivalent discount = [d1 + d2 - (d1 * d2) / 100]%\n` +
    `• Faulty Balance / Weights: (True Weight / False Weight) = (100 + Gain%) / 100`
  );

  doc.moveDown(0.6);
  doc.fontSize(13).font('Helvetica-Bold').fillColor('#0284c7').text('2. Time & Work, Pipes & Cisterns');
  doc.moveDown(0.2);
  doc.fontSize(9.5).font('Helvetica').fillColor('#334155').text(
    `• Work = Efficiency * Time | If A takes X days and B takes Y days: (Together) = (X * Y) / (X + Y)\n` +
    `• Chain Rule: (M1 * D1 * H1) / W1 = (M2 * D2 * H2) / W2\n` +
    `• Alternating Work Cycles: Sum the work of one complete cycle first before remaining fraction.\n` +
    `• Pipes: Net filling rate = (Sum of inlet rates) - (Sum of outlet/leak rates)`
  );

  doc.moveDown(0.6);
  doc.fontSize(13).font('Helvetica-Bold').fillColor('#0284c7').text('3. Time, Speed & Distance, Trains & Boats');
  doc.moveDown(0.2);
  doc.fontSize(9.5).font('Helvetica').fillColor('#334155').text(
    `• Conversion: 1 km/h = 5/18 m/s | 1 m/s = 18/5 km/h\n` +
    `• Average Speed (Equal distances at speeds u and v) = 2uv / (u + v)\n` +
    `• Relative Speed: Same direction = S1 - S2 | Opposite directions = S1 + S2\n` +
    `• Crossing a platform of length P by train L: Distance = L + P\n` +
    `• Boats: Downstream = Speed + Stream | Upstream = Speed - Stream`
  );

  doc.moveDown(0.6);
  doc.fontSize(13).font('Helvetica-Bold').fillColor('#0284c7').text('4. Simple Interest & Compound Interest');
  doc.moveDown(0.2);
  doc.fontSize(9.5).font('Helvetica').fillColor('#334155').text(
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

  doc.fontSize(13).font('Helvetica-Bold').fillColor('#0284c7').text('1. Syllogisms & Venn Logic Rules');
  doc.moveDown(0.2);
  doc.fontSize(9.5).font('Helvetica').fillColor('#334155').text(
    `• Universal Positive (All A are B): Converse is 'Some B are A'. Does NOT imply All B are A.\n` +
    `• Particular Positive (Some A are B): Converse is 'Some B are A'. Universal conclusions invalid.\n` +
    `• Universal Negative (No A is B): Definite: 'No B is A' and 'Some A are not B'.\n` +
    `• Either/Or Pair Conditions: Identical subject/predicate, both false, one positive and one negative.`
  );

  doc.moveDown(0.6);
  doc.fontSize(13).font('Helvetica-Bold').fillColor('#0284c7').text('2. Coding-Decoding & Letter Ranks');
  doc.moveDown(0.2);
  doc.fontSize(9.5).font('Helvetica').fillColor('#334155').text(
    `• Forward Alphabet Ranks (EJOTY): E=5, J=10, O=15, T=20, Y=25\n` +
    `• Reverse Letters Rule: Sum of forward and reverse rank is always 27 (A<->Z, B<->Y, M<->N)\n` +
    `• Common Patterns: +1/-1 alternating shift, vowel shifts, reverse word string, split-half shifts.`
  );

  doc.moveDown(0.6);
  doc.fontSize(13).font('Helvetica-Bold').fillColor('#0284c7').text('3. Blood Relations & Direction Sense');
  doc.moveDown(0.2);
  doc.fontSize(9.5).font('Helvetica').fillColor('#334155').text(
    `• Tree Representation: (+) Male, (-) Female, (=) Spouses, (|) Parent-Child generation step.\n` +
    `• Direction Sense: Right turn from North is East. Right turn from West is North.\n` +
    `• Minimum Displacement: Pythagoras theorem: c = sqrt(a^2 + b^2)`
  );

  addFooter(doc);
  return new Promise((resolve) => {
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    doc.end();
    stream.on('finish', () => resolve(filePath));
  });
}

// 3. CS Fundamentals Handbook
async function generateCsNotes() {
  const filePath = path.join(PDF_DIR, 'cs-fundamentals-handbook.pdf');
  const doc = createStyledDoc('CS Fundamentals Revision Handbook', 'OOP, DBMS, SQL, OS & Networks', 'Quick Revision Notes');

  doc.fontSize(13).font('Helvetica-Bold').fillColor('#0284c7').text('1. OOP Principles');
  doc.moveDown(0.2);
  doc.fontSize(9.5).font('Helvetica').fillColor('#334155').text(
    `• Encapsulation: Binding data & methods inside class; protection through private/protected access.\n` +
    `• Abstraction: Hiding implementation complexity and exposing interfaces (Interfaces & Abstract Classes).\n` +
    `• Inheritance: Code reuse through IS-A hierarchy; Single, Multilevel, Multiple (via interfaces).\n` +
    `• Polymorphism: Compile-time (Method Overloading) vs Runtime (Virtual Method Overriding).`
  );

  doc.moveDown(0.6);
  doc.fontSize(13).font('Helvetica-Bold').fillColor('#0284c7').text('2. DBMS & SQL Core');
  doc.moveDown(0.2);
  doc.fontSize(9.5).font('Helvetica').fillColor('#334155').text(
    `• ACID: Atomicity (All or none), Consistency (State valid), Isolation (Concurrent safe), Durability (Persisted).\n` +
    `• Normalization: 1NF (Atomic fields), 2NF (No partial dependency), 3NF (No transitive dependency), BCNF.\n` +
    `• Joins: INNER (matching rows), LEFT/RIGHT (preserve unmatching side), CROSS (Cartesian product).\n` +
    `• GROUP BY & HAVING: GROUP BY aggregates data; HAVING filters aggregate metrics (WHERE cannot).`
  );

  doc.moveDown(0.6);
  doc.fontSize(13).font('Helvetica-Bold').fillColor('#0284c7').text('3. Operating Systems & Computer Networks');
  doc.moveDown(0.2);
  doc.fontSize(9.5).font('Helvetica').fillColor('#334155').text(
    `• Deadlock Coffman Conditions: Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait.\n` +
    `• Process vs Thread: Processes have independent memory; threads share heap, code, data of parent.\n` +
    `• OSI Layers: Physical, Data Link, Network (IP), Transport (TCP/UDP), Session, Presentation, Application.\n` +
    `• TCP vs UDP: TCP is connection-oriented, reliable (3-way handshake); UDP is connectionless and fast.`
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

  doc.fontSize(13).font('Helvetica-Bold').fillColor('#0284c7').text('1. Sorting Algorithm Complexities');
  doc.moveDown(0.2);
  doc.fontSize(9.5).font('Helvetica').fillColor('#334155').text(
    `• Quick Sort: Best/Avg: O(N log N) | Worst: O(N^2) | Space: O(log N) auxiliary recursion\n` +
    `• Merge Sort: Best/Avg/Worst: O(N log N) | Space: O(N) | Stable sorting\n` +
    `• Heap Sort: Best/Avg/Worst: O(N log N) | Space: O(1) in-place\n` +
    `• Insertion Sort: Best: O(N) (nearly sorted) | Worst: O(N^2) | Space: O(1)`
  );

  doc.moveDown(0.6);
  doc.fontSize(13).font('Helvetica-Bold').fillColor('#0284c7').text('2. Core Data Structure Operations');
  doc.moveDown(0.2);
  doc.fontSize(9.5).font('Helvetica').fillColor('#334155').text(
    `• Array / Vector: Access O(1), Search O(N), Insertion/Deletion O(N)\n` +
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
  const doc = createStyledDoc('TCS NQT Preparation Blueprint & Syllabus', 'Exam Pattern, Syllabus & Interview FAQ', 'Company Guides & Patterns');

  doc.fontSize(13).font('Helvetica-Bold').fillColor('#0284c7').text('1. TCS NQT Hiring Structure & Patterns');
  doc.moveDown(0.2);
  doc.fontSize(9.5).font('Helvetica').fillColor('#334155').text(
    `• Track: Ninja (Foundation) and Digital/Prime (Advanced Cognitive + Coding).\n` +
    `• Numerical Ability: Arithmetic, statistics, time & work, data interpretation.\n` +
    `• Reasoning Ability: Syllogisms, series, blood relations, arrangements, data sufficiency.\n` +
    `• Verbal Ability: Reading comprehension, sentence completion, error detection, vocabulary.\n` +
    `• Advanced Coding: 2 problems (Java, Python, C, C++). Complexity O(N) or O(N log N).`
  );

  doc.moveDown(0.6);
  doc.fontSize(13).font('Helvetica-Bold').fillColor('#0284c7').text('2. Technical Interview Survival Checklist');
  doc.moveDown(0.2);
  doc.fontSize(9.5).font('Helvetica').fillColor('#334155').text(
    `• Project Architecture Pitch: Problem -> Technology Stack -> Personal Contribution -> Real Impact.\n` +
    `• Be ready to write clean code on paper/notepad for string manipulation or SQL aggregations.\n` +
    `• Core Interview Topics: Difference between abstract class and interface, indexing, memory allocation.`
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
  const doc = createStyledDoc('Aptitude Practice Mock Paper with Solutions', 'Model Questions with Step-by-Step Solutions', 'Solved Mock Papers');

  doc.fontSize(12).font('Helvetica-Bold').fillColor('#0284c7').text('Section A: Quantitative Aptitude (Sample Problems)');
  doc.moveDown(0.3);
  doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#0f172a').text('Q1. A train running at 54 km/h takes 20 seconds to pass a platform 150m long. Find train length.');
  doc.fontSize(9).font('Helvetica').fillColor('#475569').text(
    'Solution: Speed = 54 * (5/18) = 15 m/s. Total distance = Speed * Time = 15 * 20 = 300m.\n' +
    'Total distance = Train Length + Platform Length => 300 = Train Length + 150 => Train Length = 150m. (Answer: 150m)'
  );

  doc.moveDown(0.5);
  doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#0f172a').text('Q2. A sum of money doubles itself in 5 years at simple interest. In how many years will it become 4 times?');
  doc.fontSize(9).font('Helvetica').fillColor('#475569').text(
    'Solution: Let Principal = P. Amount = 2P, so SI = P. Formula: SI = (P * R * T)/100 => P = (P * R * 5)/100 => R = 20%.\n' +
    'For amount to become 4P: SI required = 3P. 3P = (P * 20 * T)/100 => T = 15 years. (Answer: 15 years)'
  );

  doc.moveDown(0.6);
  doc.fontSize(12).font('Helvetica-Bold').fillColor('#0284c7').text('Section B: Logical Reasoning (Sample Problems)');
  doc.moveDown(0.3);
  doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#0f172a').text('Q3. Pointing to a photograph, a man says: "She is the daughter of my grandfather\'s only son."');
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

// 7. Verbal Ability & English Grammar Master Notes
async function generateVerbalNotes() {
  const filePath = path.join(PDF_DIR, 'verbal-ability-notes.pdf');
  const doc = createStyledDoc('Verbal Ability & Grammar Revision Notes', 'Rules, Idioms, Vocab & Reading Comprehension', 'Quick Revision Notes');

  doc.fontSize(13).font('Helvetica-Bold').fillColor('#0284c7').text('1. Subject-Verb Agreement Golden Rules');
  doc.moveDown(0.2);
  doc.fontSize(9.5).font('Helvetica').fillColor('#334155').text(
    `• Rule 1: Two singular subjects connected by 'and' require a plural verb (e.g. Gold and silver are precious).\n` +
    `• Rule 2: Connected by 'as well as', 'with', 'together with' -> Verb agrees with the FIRST subject.\n` +
    `• Rule 3: Connected by 'either...or', 'neither...nor' -> Verb agrees with the CLOSER (second) subject.\n` +
    `• Rule 4: 'Each of', 'Either of', 'Neither of', 'Every one of' always take a SINGULAR verb.`
  );

  doc.moveDown(0.6);
  doc.fontSize(13).font('Helvetica-Bold').fillColor('#0284c7').text('2. High-Frequency Placement Vocabulary & Root Words');
  doc.moveDown(0.2);
  doc.fontSize(9.5).font('Helvetica').fillColor('#334155').text(
    `• Bene (Good): Benevolent (kind), Benefactor, Beneficiary | Mal (Bad): Malevolent, Malicious, Malfunction\n` +
    `• Chron (Time): Synchronize, Chronic, Anachronism | Greg (Flock/Group): Gregarious (sociable), Segregate\n` +
    `• Placement Keywords: Lucrative (profitable), Pragmatic (practical), Ephemeral (short-lived), Resilient (tough)`
  );

  doc.moveDown(0.6);
  doc.fontSize(13).font('Helvetica-Bold').fillColor('#0284c7').text('3. Reading Comprehension Strategy');
  doc.moveDown(0.2);
  doc.fontSize(9.5).font('Helvetica').fillColor('#334155').text(
    `• Skim First: Read the first & last sentence of each paragraph to identify main theme & author tone.\n` +
    `• Trap Options: Avoid choices that use absolute qualifiers ('always', 'never', 'completely') unless explicitly in passage.\n` +
    `• Inference vs Direct: An inference is implied by the passage facts, not an exaggerated logical leap.`
  );

  addFooter(doc);
  return new Promise((resolve) => {
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    doc.end();
    stream.on('finish', () => resolve(filePath));
  });
}

// 8. Infosys, Accenture & Wipro Company Prep Blueprint
async function generateMultiCompanyGuide() {
  const filePath = path.join(PDF_DIR, 'multicompany-placement-guide.pdf');
  const doc = createStyledDoc('Infosys, Accenture & Wipro Preparation Guide', 'Assessment Tracks, Pseudocode & Patterns', 'Company Guides & Patterns');

  doc.fontSize(13).font('Helvetica-Bold').fillColor('#0284c7').text('1. Infosys DSE & Specialist Hiring Pattern');
  doc.moveDown(0.2);
  doc.fontSize(9.5).font('Helvetica').fillColor('#334155').text(
    `• Reasoning (15 Qs): Data sufficiency, cryptarithmetic, syllogisms, puzzle test.\n` +
    `• Mathematical Ability (10 Qs): High-difficulty algebra, probability, permutations, geometry.\n` +
    `• Verbal Ability (20 Qs): Sentence correction, reading comprehension, critical reasoning.\n` +
    `• Pseudocode Section: Dry-running nested loops, recursion trees, and bitwise operations.`
  );

  doc.moveDown(0.6);
  doc.fontSize(13).font('Helvetica-Bold').fillColor('#0284c7').text('2. Accenture Cognitive & Technical Assessment');
  doc.moveDown(0.2);
  doc.fontSize(9.5).font('Helvetica').fillColor('#334155').text(
    `• Stage 1 (Cognitive & Tech): Critical thinking, abstract reasoning, pseudocode, MS Office & Cloud basics.\n` +
    `• Stage 2 (Coding): 2 coding problems (Strings, basic algorithms, matrix manipulations).\n` +
    `• Communication Assessment: Reading, repeating sentences, vocabulary questions, listening comprehension.`
  );

  doc.moveDown(0.6);
  doc.fontSize(13).font('Helvetica-Bold').fillColor('#0284c7').text('3. Wipro Elite National Talent Hunt (NTH)');
  doc.moveDown(0.2);
  doc.fontSize(9.5).font('Helvetica').fillColor('#334155').text(
    `• Aptitude Section: Logical reasoning, quantitative aptitude, English grammar.\n` +
    `• Written Communication: Automated essay grading evaluating grammar, coherence, vocabulary.\n` +
    `• Coding Challenge: 2 problems testing arrays, recursion, and sorting logic.`
  );

  addFooter(doc);
  return new Promise((resolve) => {
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    doc.end();
    stream.on('finish', () => resolve(filePath));
  });
}

// 9. Technical MCQ Mock Test with Detailed Explanations
async function generateTechMcqMock() {
  const filePath = path.join(PDF_DIR, 'technical-mcq-mock-paper.pdf');
  const doc = createStyledDoc('Technical MCQ Placement Model Paper', 'OOP, DBMS, SQL & C/Java Output Prediction with Solutions', 'Solved Mock Papers');

  doc.fontSize(12).font('Helvetica-Bold').fillColor('#0284c7').text('Section 1: Output Prediction & Programming Logic');
  doc.moveDown(0.3);
  doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#0f172a').text('Q1. In C/Java, what is the output of: int a = 5; int b = a++ + ++a; System.out.println(b);');
  doc.fontSize(9).font('Helvetica').fillColor('#475569').text(
    'Solution: a++ uses current value (5) and increments a to 6. Then ++a increments a from 6 to 7 and uses 7.\n' +
    'Total = 5 + 7 = 12. Value of a becomes 7. Output: 12. (Answer: 12)'
  );

  doc.moveDown(0.5);
  doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#0f172a').text('Q2. Which SQL keyword is used to eliminate duplicate rows from a query result set?');
  doc.fontSize(9).font('Helvetica').fillColor('#475569').text(
    'Solution: The DISTINCT clause filters out identical rows returned by the SELECT query.\n' +
    'Syntax: SELECT DISTINCT column_name FROM table_name; (Answer: DISTINCT)'
  );

  doc.moveDown(0.6);
  doc.fontSize(12).font('Helvetica-Bold').fillColor('#0284c7').text('Section 2: Database Systems & Operating Systems');
  doc.moveDown(0.3);
  doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#0f172a').text('Q3. In DBMS, which normal form eliminates transitive functional dependency?');
  doc.fontSize(9).font('Helvetica').fillColor('#475569').text(
    'Solution: 3NF (Third Normal Form) requires relation to be in 2NF and have no transitive dependency\n' +
    '(where non-prime attribute X determines non-prime attribute Y). (Answer: 3NF)'
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
  console.log('Generating full expanded placement PDF library...');
  const results = await Promise.all([
    generateQuantFormulas(),
    generateReasoningNotes(),
    generateCsNotes(),
    generateDsaCheatSheet(),
    generateCompanyGuide(),
    generateAptitudeMock(),
    generateVerbalNotes(),
    generateMultiCompanyGuide(),
    generateTechMcqMock(),
  ]);
  console.log('Generated all 9 comprehensive placement PDFs successfully.');
  return results;
}

module.exports = { generateAllPdfs, PDF_DIR };
