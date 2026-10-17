// Company records are PREPARATION TEMPLATES built from commonly reported historical formats.
// They have NOT been verified against a 2027 notification. dateVerified stays null until someone checks the official source.
const DISCLAIMER = 'Preparation template based on commonly reported historical assessment formats. It has not been verified against an official 2027 notification and must not be treated as the confirmed 2027 pattern. Check the official careers page before relying on any detail.';
const HR = [
  { q: 'Tell me about yourself.', tip: 'Give a 60–90 second story: education, one or two projects, and why this role. Avoid reciting your resume line by line.' },
  { q: 'Why do you want to join this company?', tip: 'Mention concrete reasons (domain, learning programmes, products) from the company\'s own website rather than generic praise.' },
  { q: 'What are your strengths and weaknesses?', tip: 'Pick a real weakness you are actively improving, and show the steps you are taking.' },
  { q: 'Describe a project you are proud of.', tip: 'Use problem → your role → decisions → result. Be ready for follow-up questions on every technology you list.' },
  { q: 'Are you willing to relocate or work in shifts?', tip: 'Answer honestly. If you have constraints, state them politely.' },
  { q: 'Tell me about a time you worked in a team and faced a conflict.', tip: 'Use the STAR method (Situation, Task, Action, Result) and focus on what you did.' },
  { q: 'Where do you see yourself in five years?', tip: 'Talk about skills you want to build and responsibility you want to grow into.' },
  { q: 'Do you have any questions for us?', tip: 'Ask about training, team structure or the first-year learning path.' },
];
const TECH = (extra = []) => [
  { topic: 'Your projects', points: ['Be able to explain architecture, your exact contribution and one bug you fixed', 'Know why you chose each technology'] },
  { topic: 'Programming fundamentals (Java / Python / C)', points: ['OOP pillars with examples', 'Arrays vs linked lists, stack vs queue, HashMap internals at a basic level', 'Output-prediction and simple coding on a whiteboard'] },
  { topic: 'DBMS and SQL', points: ['Normalisation, keys, joins, ACID', 'Write a join, GROUP BY / HAVING and second-highest salary query'] },
  { topic: 'OS and networks basics', points: ['Process vs thread, deadlock, scheduling', 'OSI/TCP-IP layers, HTTP vs HTTPS, DNS'] },
  ...extra,
];
const LAST = [
  'Redo the questions you got wrong in mocks — not new material',
  'Revise formulas and shortcut sheets for percentages, ratios, time-work and speed-distance',
  'Do two timed sectional tests and one full mock, then review every mistake',
  'Re-read your resume and prepare a short explanation for every project and skill',
  'Check the official instructions, ID requirements, system and internet setup for the exam',
  'Sleep well the night before; do not start new topics',
];
const sec = (name, subject, topics, notes) => ({ name, subject, topics, notes });
const pr = (topic, subject, level, reason) => ({ topic, subject, level, reason });
const NOTE = 'Typical section reported historically. Question count and time vary by year and track — confirm in the official notification.';
const COMMON_APT = [
  pr('percentages', 'aptitude', 'High', 'Core quantitative topic that supports profit/loss, interest and data interpretation; appears in practice sets of every company module.'),
  pr('profit-loss', 'aptitude', 'High', 'Frequently used word-problem format in fresher aptitude screening; quick to master with formulas.'),
  pr('time-work', 'aptitude', 'High', 'Standard fresher aptitude topic with high return for practice time; also covers pipes and cisterns.'),
  pr('speed-distance', 'aptitude', 'High', 'Includes trains and boats; formulas are short and reusable.'),
  pr('ratio-proportion', 'aptitude', 'Medium', 'Foundation for partnership, mixtures and ages.'),
  pr('permutations-combinations', 'aptitude', 'Medium', 'Smaller topic, but a common source of harder questions.'),
  pr('probability', 'aptitude', 'Medium', 'Usually simple counting questions; practise dice, cards and balls.'),
  pr('number-series', 'aptitude', 'High', 'Quick to solve once pattern types are known; useful for improving speed.'),
];
const defs = [
  { slug: 'tcs', name: 'TCS NQT', tagline: 'National Qualifier Test for TCS fresher hiring tracks.', links: [['TCS careers', 'https://www.tcs.com/careers']],
    roles: [['Ninja / Digital / Prime style tracks', 'Track names and eligibility change by year; confirm on the official page']],
    tracks: [{ track: 'NQT foundation + advanced (historical template)', summary: 'Historically a foundation section on numerical, verbal and reasoning ability, followed for some tracks by an advanced section with harder aptitude and coding.', sections: [sec('Numerical Ability', 'aptitude', ['percentages', 'profit-loss', 'time-work', 'speed-distance', 'number-series', 'data-interpretation'], NOTE), sec('Reasoning Ability', 'reasoning', ['series', 'coding-decoding', 'blood-relations', 'seating-arrangements'], NOTE), sec('Verbal Ability', 'english', ['reading-comprehension', 'error-spotting', 'vocabulary'], NOTE), sec('Advanced Coding', 'coding', ['arrays', 'strings', 'number-theory'], NOTE)] }],
    pri: [...COMMON_APT, pr('reading-comprehension', 'english', 'High', 'Verbal sections commonly feature passages; improves with daily reading practice.'), pr('arrays', 'coding', 'High', 'Array and string manipulation form the base of most fresher coding questions.')],
    tech: [{ topic: 'TCS-style interview emphasis (typical, unverified)', points: ['Project walk-through and fundamentals', 'Basic coding on arrays/strings', 'DBMS and SQL queries'] }] },
  { slug: 'infosys', name: 'Infosys', tagline: 'Systems Engineer and higher fresher roles.', links: [['Infosys careers', 'https://www.infosys.com/careers/']],
    roles: [['Systems Engineer', 'Entry-level role'], ['Specialist programmer / digital roles', 'Higher tracks reported in some years']],
    tracks: [{ track: 'Online assessment (historical template)', summary: 'Historically reported to combine reasoning, mathematical and verbal ability with pseudocode and puzzle-style questions.', sections: [sec('Reasoning', 'reasoning', ['series', 'syllogisms', 'seating-arrangements'], NOTE), sec('Mathematical Ability', 'aptitude', ['percentages', 'time-work', 'permutations-combinations', 'probability'], NOTE), sec('Verbal Ability', 'english', ['reading-comprehension', 'sentence-correction'], NOTE), sec('Pseudocode / Technical', 'cs', ['java-basics', 'data-structures'], NOTE)] }],
    pri: [...COMMON_APT, pr('java-basics', 'cs', 'High', 'Output prediction and pseudocode reading reward strong language basics.'), pr('syllogisms', 'reasoning', 'Medium', 'Logical reasoning sections often include set-based deduction.')],
    tech: [{ topic: 'Infosys-style interview emphasis (typical, unverified)', points: ['Programming language fundamentals', 'DBMS and SQL', 'Problem solving and communication'] }] },
  { slug: 'accenture', name: 'Accenture', tagline: 'Associate Software Engineer and graduate technology roles.', links: [['Accenture India careers', 'https://www.accenture.com/in-en/careers']],
    roles: [['Associate Software Engineer', 'Entry-level role'], ['Advanced roles', 'Reported in some hiring cycles']],
    tracks: [{ track: 'Cognitive + technical assessment (historical template)', summary: 'Historically reported to include cognitive ability, a technical MCQ section (pseudocode, networking, cloud, security) and a coding section, followed by communication assessment.', sections: [sec('Cognitive Ability', 'aptitude', ['percentages', 'ratio-proportion', 'number-series'], NOTE), sec('Logical Reasoning', 'reasoning', ['direction-sense', 'blood-relations', 'data-sufficiency'], NOTE), sec('Technical MCQ', 'cs', ['networks', 'cloud-security', 'java-basics'], NOTE), sec('Coding', 'coding', ['arrays', 'strings'], NOTE)] }],
    pri: [...COMMON_APT.slice(0, 5), pr('networks', 'cs', 'High', 'Networking and cloud/security basics are commonly part of technical MCQ sections.'), pr('cloud-security', 'cs', 'Medium', 'Short conceptual questions; quick to prepare.'), pr('strings', 'coding', 'High', 'String handling is a staple of fresher coding.')],
    tech: [{ topic: 'Accenture-style interview emphasis (typical, unverified)', points: ['Cloud and security fundamentals', 'Communication skills', 'Project discussion'] }] },
  { slug: 'wipro', name: 'Wipro', tagline: 'Fresher hiring assessments.', links: [['Wipro careers', 'https://careers.wipro.com/']],
    roles: [['Project Engineer / entry-level engineer roles', 'Names vary by year']],
    tracks: [{ track: 'Online assessment (historical template)', summary: 'Historically reported to combine aptitude, written communication and coding.', sections: [sec('Aptitude', 'aptitude', ['percentages', 'time-work', 'speed-distance', 'data-interpretation'], NOTE), sec('Logical Reasoning', 'reasoning', ['series', 'coding-decoding'], NOTE), sec('Written Communication', 'english', ['email-writing', 'sentence-correction', 'reading-comprehension'], NOTE), sec('Coding', 'coding', ['basics', 'arrays'], NOTE)] }],
    pri: [...COMMON_APT.slice(0, 6), pr('email-writing', 'english', 'Medium', 'Written communication is commonly assessed; practise short, clear emails.'), pr('basics', 'coding', 'High', 'Basic programs (loops, conditions, strings) form the foundation.')],
    tech: [{ topic: 'Wipro-style interview emphasis (typical, unverified)', points: ['Fundamentals of your primary language', 'Project explanation', 'Basic SQL'] }] },
  { slug: 'capgemini', name: 'Capgemini', tagline: 'Analyst and entry-level engineering roles.', links: [['Capgemini India careers', 'https://www.capgemini.com/in-en/careers/']],
    roles: [['Analyst / entry-level engineer', 'Names vary by year']],
    tracks: [{ track: 'Assessment (historical template)', summary: 'Historically reported to include aptitude/behavioural, pseudocode and communication components, with coding for some roles.', sections: [sec('Aptitude', 'aptitude', ['percentages', 'ratio-proportion', 'averages'], NOTE), sec('Pseudocode', 'cs', ['java-basics', 'complexity'], NOTE), sec('English Communication', 'english', ['vocabulary', 'error-spotting'], NOTE), sec('Coding', 'coding', ['strings', 'arrays'], NOTE)] }],
    pri: [...COMMON_APT.slice(0, 5), pr('java-basics', 'cs', 'High', 'Pseudocode and output prediction depend on reading code accurately.'), pr('vocabulary', 'english', 'Medium', 'Vocabulary and grammar items are quick marks.')],
    tech: [{ topic: 'Capgemini-style interview emphasis (typical, unverified)', points: ['Fundamentals of programming', 'Project and teamwork discussion'] }] },
  { slug: 'cognizant', name: 'Cognizant', tagline: 'GenC and related fresher programmes.', links: [['Cognizant careers', 'https://careers.cognizant.com/']],
    roles: [['GenC and related programmes', 'Track names and eligibility vary']],
    tracks: [{ track: 'Online assessment (historical template)', summary: 'Historically reported to include aptitude, reasoning, verbal and technical/coding sections.', sections: [sec('Quantitative Aptitude', 'aptitude', ['percentages', 'profit-loss', 'time-work'], NOTE), sec('Logical Reasoning', 'reasoning', ['series', 'blood-relations'], NOTE), sec('Verbal', 'english', ['reading-comprehension', 'sentence-correction'], NOTE), sec('Technical / Coding', 'coding', ['basics', 'strings'], NOTE)] }],
    pri: [...COMMON_APT.slice(0, 6), pr('sentence-correction', 'english', 'Medium', 'Grammar items reward knowing a small set of rules.'), pr('strings', 'coding', 'High', 'String problems are common in fresher coding.')],
    tech: [{ topic: 'Cognizant-style interview emphasis (typical, unverified)', points: ['Core programming', 'Database basics', 'Communication'] }] },
  { slug: 'tech-mahindra', name: 'Tech Mahindra', tagline: 'Software engineer fresher roles.', links: [['Tech Mahindra careers', 'https://careers.techmahindra.com/']],
    roles: [['Associate software engineer roles', 'Names vary by year']],
    tracks: [{ track: 'Assessment (historical template)', summary: 'Historically reported to include aptitude, English and technical sections.', sections: [sec('Aptitude', 'aptitude', ['percentages', 'ratio-proportion', 'time-work'], NOTE), sec('English', 'english', ['reading-comprehension', 'vocabulary', 'error-spotting'], NOTE), sec('Technical', 'cs', ['dbms', 'os', 'networks'], NOTE)] }],
    pri: [...COMMON_APT.slice(0, 5), pr('dbms', 'cs', 'High', 'DBMS fundamentals are common technical MCQ material.'), pr('os', 'cs', 'Medium', 'Core OS concepts appear in many technical rounds.')],
    tech: [{ topic: 'Tech Mahindra-style interview emphasis (typical, unverified)', points: ['DBMS, OS and networking basics', 'Project discussion'] }] },
  { slug: 'hcltech', name: 'HCLTech', tagline: 'Graduate engineer trainee and fresher roles.', links: [['HCLTech careers', 'https://www.hcltech.com/careers']],
    roles: [['Graduate Engineer Trainee / entry-level roles', 'Names vary by year']],
    tracks: [{ track: 'Assessment (historical template)', summary: 'Historically reported to include aptitude, verbal and technical sections with coding for some roles.', sections: [sec('Aptitude', 'aptitude', ['percentages', 'time-work', 'number-series'], NOTE), sec('Verbal', 'english', ['reading-comprehension', 'vocabulary'], NOTE), sec('Technical', 'cs', ['data-structures', 'dbms', 'java-basics'], NOTE), sec('Coding', 'coding', ['arrays'], NOTE)] }],
    pri: [...COMMON_APT.slice(0, 5), pr('data-structures', 'cs', 'High', 'Core data-structure concepts underpin technical MCQs and coding.'), pr('dbms', 'cs', 'Medium', 'Frequently revised concept area.')],
    tech: [{ topic: 'HCLTech-style interview emphasis (typical, unverified)', points: ['Data structures and DBMS', 'Project depth'] }] },
  { slug: 'ltimindtree', name: 'LTIMindtree', tagline: 'Graduate engineer trainee roles.', links: [['LTIMindtree careers', 'https://www.ltimindtree.com/careers/']],
    roles: [['Graduate Engineer Trainee', 'Names vary by year']],
    tracks: [{ track: 'Assessment (historical template)', summary: 'Historically reported to include aptitude, technical MCQ and coding.', sections: [sec('Aptitude', 'aptitude', ['percentages', 'profit-loss', 'time-work'], NOTE), sec('Technical MCQ', 'cs', ['oop', 'dbms', 'data-structures'], NOTE), sec('Coding', 'coding', ['arrays', 'strings'], NOTE)] }],
    pri: [...COMMON_APT.slice(0, 5), pr('oop', 'cs', 'High', 'OOP concepts and output prediction are common technical themes.'), pr('arrays', 'coding', 'High', 'Array problems are the base of fresher coding questions.')],
    tech: [{ topic: 'LTIMindtree-style interview emphasis (typical, unverified)', points: ['OOP and DBMS', 'Coding walkthrough'] }] },
  { slug: 'general-sde', name: 'General SDE / Product Companies', tagline: 'DSA-centred preparation for product and startup roles.', links: [],
    roles: [['Software Development Engineer (fresher / new grad)', 'Roles and processes differ widely between companies']],
    tracks: [{ track: 'DSA-centred online assessment (general template)', summary: 'Product-company processes commonly emphasise data structures and algorithms, problem solving under time pressure and CS fundamentals. This is a general template, not any one company\'s pattern.', sections: [sec('Coding (DSA)', 'coding', ['arrays', 'hashing', 'two-pointers', 'sliding-window', 'binary-search', 'graphs', 'dynamic-programming'], NOTE), sec('CS Fundamentals', 'cs', ['data-structures', 'dbms', 'os'], NOTE), sec('SQL', 'sql', ['joins', 'window-ranking'], NOTE)] }],
    pri: [pr('arrays', 'coding', 'High', 'Array techniques (two pointers, prefix sums) are the base of most DSA rounds.'), pr('hashing', 'coding', 'High', 'Hash maps unlock many O(N) solutions.'), pr('dynamic-programming', 'coding', 'Medium', 'Needs steady practice; start with 1-D DP.'), pr('graphs', 'coding', 'Medium', 'BFS/DFS on grids and graphs.'), pr('data-structures', 'cs', 'High', 'Be fluent in complexity and trade-offs.'), pr('window-ranking', 'sql', 'Medium', 'Window functions are common in SQL screens.')],
    tech: [{ topic: 'DSA interview habits', points: ['Clarify the problem, state brute force, then optimise', 'Talk through edge cases and complexity'] }] },
];
const eff = { High: [40, 6], Medium: [25, 4], Low: [12, 2] };
const companies = defs.map((d, i) => ({
  company: { slug: d.slug, name: d.name, order: i, tagline: d.tagline, officialLinks: d.links.map(([label, url]) => ({ label, url })), roles: d.roles.map(([name, note]) => ({ name, note })),
    eligibility: ['Eligibility (degree, branch, backlog and percentage criteria) changes every hiring cycle. Read the current notification on the official page.', 'Graduation year 2027 candidates should look for campus or off-campus notifications for the 2027 batch.'],
    stages: ['Registration / application', 'Online assessment (aptitude, verbal/communication, technical or coding as applicable)', 'Technical interview', 'HR / managerial interview', 'Offer and onboarding'],
    technicalInterview: TECH(d.tech), hrQuestions: HR, lastMinute: LAST, patternStatus: 'preparation_template' },
  patterns: d.tracks.map((t) => ({ company: d.slug, track: t.track, assessmentYear: 2027, status: 'preparation_template', summary: t.summary, sections: t.sections.map((s) => ({ name: s.name, subject: s.subject, topics: s.topics, questionCount: 'varies', notes: s.notes })),
    scoringNotes: 'Scoring and negative-marking rules differ between tracks and years. Practice mocks here use configurable marks; confirm the real rules in the official instructions.',
    priorities: d.pri.map((p) => ({ ...p, evidence: undefined, recommendedPracticeCount: eff[p.level][0], estimatedPrepHours: eff[p.level][1], lastVerified: null })),
    sourceUrl: d.links[0] ? d.links[0][1] : '', dateVerified: null, confidence: 'low', disclaimer: DISCLAIMER })) }));
const highTopics = (slug) => { const d = defs.find((x) => x.slug === slug); return d ? d.pri.filter((p) => p.level === 'High').map((p) => p.topic) : []; };
module.exports = { companies, highTopics, DISCLAIMER };
