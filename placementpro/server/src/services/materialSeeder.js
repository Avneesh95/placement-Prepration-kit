const fs = require('fs');
const path = require('path');
const { Material } = require('../models');
const { generateAllPdfs, PDF_DIR } = require('../services/pdfGenerator');

const EXPANDED_MATERIALS = [
  {
    slug: 'quant-formula-handbook',
    title: 'Quantitative Aptitude Formula Handbook',
    category: 'formula_sheet',
    subject: 'aptitude',
    topic: 'percentages',
    companies: ['tcs', 'infosys', 'accenture', 'wipro', 'cognizant'],
    difficulty: 'all',
    description: 'Comprehensive formula reference covering profit & loss, time and work, time-speed-distance, simple and compound interest.',
    fileName: 'quant-formula-handbook.pdf',
    language: 'English',
    verificationStatus: 'original_guide',
    tags: ['Aptitude', 'Formulas', 'Math Shortcuts', 'Quant'],
  },
  {
    slug: 'reasoning-quick-notes',
    title: 'Logical Reasoning Quick Revision Notes',
    category: 'quick_notes',
    subject: 'reasoning',
    topic: 'syllogisms',
    companies: ['tcs', 'infosys', 'accenture', 'capgemini'],
    difficulty: 'all',
    description: 'Essential rules for syllogisms, Venn diagrams, EJOTY letter rankings, coding-decoding shifts, and blood relation trees.',
    fileName: 'reasoning-quick-notes.pdf',
    language: 'English',
    verificationStatus: 'original_guide',
    tags: ['Reasoning', 'Syllogisms', 'Blood Relations', 'Shortcuts'],
  },
  {
    slug: 'cs-fundamentals-handbook',
    title: 'CS Fundamentals Revision Handbook',
    category: 'quick_notes',
    subject: 'cs',
    topic: 'oop',
    companies: ['tcs', 'infosys', 'accenture', 'wipro', 'cognizant', 'deloitte', 'ibm'],
    difficulty: 'all',
    description: 'Must-know technical interview notes on OOP four pillars, ACID properties, normalization, deadlock conditions, and OSI/TCP layers.',
    fileName: 'cs-fundamentals-handbook.pdf',
    language: 'English',
    verificationStatus: 'original_guide',
    tags: ['CS Fundamentals', 'OOP', 'DBMS', 'OS', 'Networks'],
  },
  {
    slug: 'dsa-time-complexity-cheat-sheet',
    title: 'DSA & Time Complexity Cheat Sheet',
    category: 'formula_sheet',
    subject: 'coding',
    topic: 'complexity-analysis',
    companies: ['tcs', 'infosys', 'accenture', 'wipro', 'cognizant'],
    difficulty: 'all',
    description: 'Big-O reference table comparing best, average, and worst case time and space complexities for major sorting and search structures.',
    fileName: 'dsa-time-complexity-cheat-sheet.pdf',
    language: 'English',
    verificationStatus: 'original_guide',
    tags: ['DSA', 'Big-O', 'Algorithms', 'Time Complexity'],
  },
  {
    slug: 'tcs-nqt-placement-guide',
    title: 'TCS NQT Preparation Blueprint & Syllabus',
    category: 'company_guide',
    subject: 'general',
    topic: 'tcs-nqt-blueprint',
    companies: ['tcs'],
    difficulty: 'all',
    description: 'Verified syllabus breakdown, sectional distribution for Foundation vs Advanced tracks, and technical interview preparation checklist.',
    fileName: 'tcs-nqt-placement-guide.pdf',
    language: 'English',
    verificationStatus: 'verified_pattern',
    tags: ['TCS', 'NQT', 'Exam Pattern', 'Interview Checklist'],
  },
  {
    slug: 'aptitude-mock-test-solutions',
    title: 'Aptitude Practice Mock Paper with Solutions',
    category: 'mock_test',
    subject: 'aptitude',
    topic: 'mock-tests',
    companies: ['tcs', 'infosys', 'wipro', 'cognizant'],
    difficulty: 'medium',
    description: 'Standard aptitude model paper with full step-by-step mathematical explanations and answer key verification.',
    fileName: 'aptitude-mock-test-solutions.pdf',
    language: 'English',
    verificationStatus: 'practice_model',
    tags: ['Mock Test', 'Solved Paper', 'Aptitude Practice'],
  },
  {
    slug: 'verbal-ability-notes',
    title: 'Verbal Ability & Grammar Revision Notes',
    category: 'quick_notes',
    subject: 'english',
    topic: 'grammar',
    companies: ['tcs', 'infosys', 'accenture', 'cognizant'],
    difficulty: 'all',
    description: 'Golden rules for subject-verb agreement, high-frequency root words, idioms, and reading comprehension trap avoidance.',
    fileName: 'verbal-ability-notes.pdf',
    language: 'English',
    verificationStatus: 'original_guide',
    tags: ['Verbal', 'English', 'Grammar', 'Vocabulary'],
  },
  {
    slug: 'multicompany-placement-guide',
    title: 'Infosys, Accenture & Wipro Preparation Guide',
    category: 'company_guide',
    subject: 'general',
    topic: 'multicompany-guide',
    companies: ['infosys', 'accenture', 'wipro'],
    difficulty: 'all',
    description: 'Curated breakdown of hiring patterns, pseudocode assessment expectations, coding rounds, and interview tips.',
    fileName: 'multicompany-placement-guide.pdf',
    language: 'English',
    verificationStatus: 'verified_pattern',
    tags: ['Infosys', 'Accenture', 'Wipro', 'Hiring Pattern'],
  },
  {
    slug: 'technical-mcq-mock-paper',
    title: 'Technical MCQ Placement Model Paper',
    category: 'mock_test',
    subject: 'cs',
    topic: 'technical-mock',
    companies: ['tcs', 'infosys', 'accenture', 'wipro', 'cognizant'],
    difficulty: 'medium',
    description: 'Realistic technical section practice paper covering output prediction, pointer operations, SQL queries, and normalization.',
    fileName: 'technical-mcq-mock-paper.pdf',
    language: 'English',
    verificationStatus: 'practice_model',
    tags: ['Technical MCQ', 'Mock Test', 'Output Prediction', 'SQL'],
  },
];

async function seedMaterials() {
  await generateAllPdfs();

  for (const item of EXPANDED_MATERIALS) {
    const fullPath = path.join(PDF_DIR, item.fileName);
    let sizeKB = 15;
    if (fs.existsSync(fullPath)) {
      sizeKB = Math.round(fs.statSync(fullPath).size / 1024);
    }

    await Material.findOneAndUpdate(
      { slug: item.slug },
      {
        $set: {
          ...item,
          fileSizeKB: sizeKB,
          pageCount: 2,
          active: true,
        },
      },
      { upsert: true, new: true }
    );
  }
  console.log(`Seeded ${EXPANDED_MATERIALS.length} verified placement materials.`);
}

module.exports = { seedMaterials, EXPANDED_MATERIALS };
