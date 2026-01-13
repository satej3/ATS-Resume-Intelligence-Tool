// NLP utilities using compromise and wink-nlp
const nlp = require('compromise');
const winkNLP = require('wink-nlp');
const model = require('wink-eng-lite-web-model');
const { removeStopwords } = require('stopword');
const stringSimilarity = require('string-similarity');

const wink = winkNLP(model);

/**
 * STEP 1: Text Preprocessing
 * Normalize and clean text for NLP processing
 */
function preprocessText(text) {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\w\s\.\+\#\-\/\(\)]/g, ' ') // Keep technical chars but remove others
    .replace(/\s+/g, ' ') // Clean up extra spaces created
    .replace(/\b\s+/g, ' ') // Remove leading/trailing spaces from words
    .trim();
}

/**
 * Extract sentences from text
 */
function extractSentences(text) {
  const doc = nlp(text);
  return doc.sentences().out('array');
}

/**
 * Remove stopwords from text while preserving technical terms
 */
function removeCommonWords(text) {
  const words = text.toLowerCase().split(/\s+/);
  const cleaned = removeStopwords(words);
  return cleaned.join(' ');
}

/**
 * STEP 2: Skill & Phrase Extraction
 * Extract technical skills, tools, and concepts using NLP
 */
function extractSkills(text) {
  const cleanedText = preprocessText(text);
  const doc = nlp(cleanedText);
  const skills = new Set();
  
  // Extract nouns and noun phrases (often skills/tools) - filtered
  const nouns = doc.nouns().out('array');
  nouns.forEach(noun => {
    const cleaned = noun.toLowerCase().trim();
    // More strict filtering to prevent fragments
    if (cleaned.length > 2 && cleaned.length < 30 && 
        !isGenericWord(cleaned) && 
        !isStopWord(cleaned) &&
        !cleaned.startsWith(' ') && 
        !cleaned.endsWith(' ') &&
        !/^\s/.test(cleaned) &&
        !/\s$/.test(cleaned)) {
      // Only add if it looks like a technical term
      if (isTechnicalTerm(cleaned, cleanedText)) {
        skills.add(cleaned);
      }
    }
  });
  
  // Extract acronyms and technical abbreviations
  const terms = doc.terms().out('array');
  terms.forEach(term => {
    const cleaned = term.trim();
    
    // Skip if starts or ends with space (fragment)
    if (cleaned.startsWith(' ') || cleaned.endsWith(' ') || cleaned !== term) {
      return;
    }
    
    // Acronyms (AWS, API, CI/CD, etc.)
    if (/^[A-Z]{2,6}$/.test(cleaned)) {
      skills.add(cleaned.toLowerCase());
    }
    
    // Technical terms with mixed case (JavaScript, TypeScript, MongoDB)
    if (/^[A-Z][a-z]+[A-Z]/.test(cleaned)) {
      skills.add(cleaned.toLowerCase());
    }
    
    // Terms with numbers/versions (React16, Python3, etc.)
    if (/\w+\d+/.test(cleaned) || /\d+\.\d+/.test(cleaned)) {
      skills.add(cleaned.toLowerCase());
    }
    
    // Terms with technical punctuation (.js, .net, C++, C#)
    if (/[\.+#]/.test(cleaned) && cleaned.length > 2 && cleaned.length < 20) {
      skills.add(cleaned.toLowerCase());
    }
  });
  
  return Array.from(skills).filter(skill => 
    skill.trim() === skill && // No leading/trailing spaces
    skill.length > 2 && 
    !isStopWord(skill)
  );
}

/**
 * Check if a term is technical based on context and patterns
 */
function isTechnicalTerm(term, fullText) {
  // Skip if too short or too long
  if (term.length < 3 || term.length > 25) return false;
  
  // Has technical indicators (numbers, special chars)
  if (/[\d\.+#\-]/.test(term)) return true;
  
  // Appears in a technical context (near other tech terms)
  const index = fullText.toLowerCase().indexOf(term);
  if (index !== -1) {
    const contextStart = Math.max(0, index - 50);
    const contextEnd = Math.min(fullText.length, index + term.length + 50);
    const context = fullText.substring(contextStart, contextEnd).toLowerCase();
    
    // Technical context indicators
    const techIndicators = [
      'language', 'framework', 'library', 'tool', 'technology', 'platform',
      'database', 'server', 'cloud', 'api', 'using', 'with', 'including',
      'experience in', 'proficiency', 'knowledge of', 'skills:', 'technologies:',
      'stack:', 'developed', 'built', 'implemented', 'deployed'
    ];
    
    if (techIndicators.some(indicator => context.includes(indicator))) {
      return true;
    }
  }
  
  // Capitalized in original text (often indicates proper nouns/technologies)
  const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const capitalizedRegex = new RegExp('\\b' + escapedTerm.charAt(0).toUpperCase() + escapedTerm.slice(1) + '\\b');
  if (capitalizedRegex.test(fullText)) return true;
  
  return false;
}

/**
 * Check if term is a stopword or generic word
 */
function isStopWord(term) {
  const stopwords = [
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can',
    'with', 'from', 'have', 'this', 'that', 'will', 'your', 'about',
    'which', 'their', 'said', 'each', 'she', 'how', 'been', 'been',
    'who', 'called', 'its', 'would', 'make', 'like', 'him', 'into',
    'time', 'has', 'look', 'two', 'more', 'write', 'see', 'number',
    'way', 'could', 'people', 'experience', 'years', 'work', 'working',
    'build', 'building', 'develop', 'developing', 'create', 'creating',
    'implement', 'implementing', 'collaborate', 'collaborating', 'participate',
    'participating', 'integrate', 'integrating', 'optimize', 'optimizing',
    'troubleshoot', 'troubleshooting', 'knowledge', 'proficiency', 'expertise',
    'familiarity', 'understanding', 'solid', 'strong', 'good', 'excellent'
  ];
  return stopwords.includes(term.toLowerCase().trim());
}

/**
 * Extract multi-word phrases using NLP
 */
function extractPhrases(text) {
  const cleanedText = preprocessText(text);
  const doc = nlp(cleanedText);
  const phrases = new Set();
  
  // Extract noun phrases (filtered)
  const nounPhrases = doc.match('#Noun+ #Noun+').out('array');
  nounPhrases.forEach(phrase => {
    const cleaned = phrase.trim();
    const wordCount = cleaned.split(' ').length;
    
    // Skip fragments and poorly formed phrases
    if (cleaned.startsWith(' ') || cleaned.endsWith(' ') || 
        cleaned !== phrase || wordCount < 2 || wordCount > 4) {
      return;
    }
    
    if (!isGenericPhrase(cleaned)) {
      phrases.add(cleaned.toLowerCase());
    }
  });
  
  // Extract adjective + noun combinations (e.g., "agile development")
  const adjNoun = doc.match('#Adjective #Noun+').out('array');
  adjNoun.forEach(phrase => {
    const cleaned = phrase.trim();
    
    // Skip fragments
    if (cleaned.startsWith(' ') || cleaned.endsWith(' ') || 
        cleaned !== phrase || cleaned.length < 5) {
      return;
    }
    
    if (!isGenericPhrase(cleaned)) {
      phrases.add(cleaned.toLowerCase());
    }
  });
  
  // Extract technical compound terms (e.g., "machine learning", "web development")
  const compoundTerms = extractCompoundTechnicalTerms(cleanedText);
  compoundTerms.forEach(term => {
    const cleaned = term.trim();
    if (cleaned === term && cleaned.length > 3) {
      phrases.add(cleaned);
    }
  });
  
  return Array.from(phrases).filter(p => 
    p.trim() === p && // No leading/trailing spaces
    p.length > 3 && 
    p.length < 50 &&
    !isStopWord(p) &&
    !/^\s/.test(p) &&
    !/\s$/.test(p)
  );
}

/**
 * Extract compound technical terms using patterns
 */
function extractCompoundTechnicalTerms(text) {
  const terms = new Set();
  const lines = text.split('\n');
  
  lines.forEach(line => {
    // Look for technical combinations
    const technicalPatterns = [
      // Technology + noun patterns
      /\b(web|mobile|cloud|data|software|system|network)\s+(development|engineering|architecture|design|application|service|platform)\b/gi,
      // Domain + technology
      /\b(machine|artificial|deep)\s+(learning|intelligence)\b/gi,
      // Stack/framework terms
      /\b(full\s+stack|front\s+end|back\s+end|mern\s+stack|mean\s+stack)\b/gi,
      // Development methodologies
      /\b(agile|scrum|devops|ci\/cd)\s+(development|methodology|practices)\b/gi,
      // Service types
      /\b(restful|graphql)\s+(api|apis|services)\b/gi,
      // Database + type
      /\b(relational|nosql|sql)\s+(database|databases)\b/gi
    ];
    
    technicalPatterns.forEach(pattern => {
      const matches = line.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleaned = match.toLowerCase().trim();
          if (!isGenericPhrase(cleaned)) {
            terms.add(cleaned);
          }
        });
      }
    });
  });
  
  return Array.from(terms);
}

/**
 * Extract action verbs (for experience section analysis)
 */
function extractActionVerbs(text) {
  const doc = nlp(text);
  const verbs = doc.verbs().out('array');
  
  return verbs
    .map(v => v.toLowerCase())
    .filter(v => v.length > 3 && !isGenericVerb(v));
}

/**
 * STEP 3: Semantic Normalization
 * Normalize synonyms and variations of skills - EXPANDED DICTIONARY
 */
const skillNormalizations = {
  // JavaScript Ecosystem
  'reactjs': 'react',
  'react.js': 'react',
  'react native': 'react',
  'nodejs': 'node.js',
  'node': 'node.js',
  'vuejs': 'vue',
  'vue.js': 'vue',
  'angularjs': 'angular',
  'angular.js': 'angular',
  'angular 2': 'angular',
  'angular 4': 'angular',
  'nextjs': 'next.js',
  'next': 'next.js',
  'nuxtjs': 'nuxt.js',
  'nuxt': 'nuxt.js',
  'express': 'express.js',
  'expressjs': 'express.js',
  'jquery': 'jquery',
  'js': 'javascript',
  'javascript': 'javascript',
  'es6': 'javascript',
  'ecmascript': 'javascript',
  
  // TypeScript
  'ts': 'typescript',
  'typescript': 'typescript',
  
  // Python
  'py': 'python',
  'python': 'python',
  'python2': 'python',
  'python3': 'python',
  'django': 'django',
  'flask': 'flask',
  'fastapi': 'fastapi',
  
  // Databases
  'postgres': 'postgresql',
  'postgresql': 'postgresql',
  'postgre': 'postgresql',
  'psql': 'postgresql',
  'mongo': 'mongodb',
  'mongodb': 'mongodb',
  'mysql': 'mysql',
  'mariadb': 'mysql',
  'mssql': 'sql server',
  'sql server': 'sql server',
  'oracle': 'oracle',
  'redis': 'redis',
  'elasticsearch': 'elasticsearch',
  'cassandra': 'cassandra',
  'dynamodb': 'dynamodb',
  'nosql': 'nosql',
  'sql': 'sql',
  
  // Cloud Platforms
  'aws': 'amazon web services',
  'amazon web services': 'aws',
  'ec2': 'aws',
  'lambda': 'aws lambda',
  's3': 'aws s3',
  'gcp': 'google cloud platform',
  'google cloud': 'google cloud platform',
  'google cloud platform': 'gcp',
  'azure': 'microsoft azure',
  'microsoft azure': 'azure',
  
  // DevOps & Tools
  'k8s': 'kubernetes',
  'kubernetes': 'kubernetes',
  'docker': 'docker',
  'ci/cd': 'continuous integration',
  'cicd': 'continuous integration',
  'continuous integration': 'ci/cd',
  'continuous deployment': 'ci/cd',
  'devops': 'development operations',
  'jenkins': 'jenkins',
  'gitlab': 'gitlab',
  'github': 'github',
  'git': 'git',
  'bitbucket': 'bitbucket',
  'terraform': 'terraform',
  'ansible': 'ansible',
  'puppet': 'puppet',
  'chef': 'chef',
  
  // Web Technologies
  'html': 'html5',
  'html5': 'html',
  'css': 'css3',
  'css3': 'css',
  'sass': 'scss',
  'scss': 'sass',
  'less': 'less',
  'bootstrap': 'bootstrap',
  'tailwind': 'tailwind css',
  'tailwindcss': 'tailwind css',
  'material ui': 'material-ui',
  'mui': 'material-ui',
  
  // API & Communication
  'api': 'apis',
  'apis': 'api',
  'rest': 'restful',
  'restful': 'rest api',
  'rest api': 'restful',
  'graphql': 'graphql',
  'grpc': 'grpc',
  'websocket': 'websockets',
  'websockets': 'websocket',
  
  // Machine Learning & AI
  'ml': 'machine learning',
  'machine learning': 'ml',
  'ai': 'artificial intelligence',
  'artificial intelligence': 'ai',
  'deep learning': 'deep learning',
  'dl': 'deep learning',
  'nlp': 'natural language processing',
  'natural language processing': 'nlp',
  'tensorflow': 'tensorflow',
  'pytorch': 'pytorch',
  'keras': 'keras',
  'scikit-learn': 'scikit-learn',
  'sklearn': 'scikit-learn',
  
  // Mobile Development
  'ios': 'ios',
  'android': 'android',
  'react native': 'react native',
  'flutter': 'flutter',
  'swift': 'swift',
  'kotlin': 'kotlin',
  'objective-c': 'objective-c',
  'objective c': 'objective-c',
  
  // Testing
  'jest': 'jest',
  'mocha': 'mocha',
  'chai': 'chai',
  'junit': 'junit',
  'pytest': 'pytest',
  'selenium': 'selenium',
  'cypress': 'cypress',
  'testing': 'testing',
  'unit testing': 'testing',
  'integration testing': 'testing',
  'e2e': 'end-to-end testing',
  'end to end testing': 'e2e',
  
  // Methodologies
  'agile': 'agile',
  'scrum': 'scrum',
  'kanban': 'kanban',
  'waterfall': 'waterfall',
  'tdd': 'test driven development',
  'test driven development': 'tdd',
  'bdd': 'behavior driven development',
  
  // Other Languages
  'java': 'java',
  'c#': 'c sharp',
  'c sharp': 'c#',
  'c++': 'c++',
  'c': 'c',
  'go': 'golang',
  'golang': 'go',
  'rust': 'rust',
  'ruby': 'ruby',
  'php': 'php',
  'r': 'r',
  'scala': 'scala',
  'elixir': 'elixir',
  
  // CMS & E-commerce
  'wordpress': 'wordpress',
  'wp': 'wordpress',
  'drupal': 'drupal',
  'shopify': 'shopify',
  'magento': 'magento',
  'woocommerce': 'woocommerce',
  
  // Business Tools
  'salesforce': 'salesforce',
  'sap': 'sap',
  'oracle': 'oracle',
  'jira': 'jira',
  'confluence': 'confluence',
  'slack': 'slack',
  'teams': 'microsoft teams',
  'microsoft teams': 'teams',
  
  // Data & Analytics
  'tableau': 'tableau',
  'power bi': 'power bi',
  'powerbi': 'power bi',
  'looker': 'looker',
  'excel': 'excel',
  'spreadsheets': 'excel',
  'google sheets': 'google sheets',
  'spark': 'apache spark',
  'apache spark': 'spark',
  'hadoop': 'hadoop',
  'kafka': 'apache kafka',
  'apache kafka': 'kafka',
  'airflow': 'airflow',
  
  // Version Control
  'version control': 'git',
  'source control': 'git',
  'svn': 'subversion',
  'subversion': 'svn'
};

function normalizeSkill(skill) {
  const lower = skill.toLowerCase().trim();
  return skillNormalizations[lower] || lower;
}

/**
 * Fuzzy match two skills using string similarity
 * Returns similarity score (0-1)
 */
function calculateSimilarity(skill1, skill2) {
  const normalized1 = normalizeSkill(skill1);
  const normalized2 = normalizeSkill(skill2);
  
  // Exact match after normalization
  if (normalized1 === normalized2) return 1.0;
  
  // Fuzzy match using string similarity
  return stringSimilarity.compareTwoStrings(normalized1, normalized2);
}

/**
 * Find best match for a skill from a list of skills
 * Returns { match: string, score: number }
 */
function findBestMatch(targetSkill, skillsList) {
  if (!skillsList || skillsList.length === 0) {
    return { match: null, score: 0 };
  }
  
  const matches = skillsList.map(skill => ({
    skill,
    score: calculateSimilarity(targetSkill, skill)
  }));
  
  const best = matches.reduce((prev, current) => 
    current.score > prev.score ? current : prev
  );
  
  return { match: best.skill, score: best.score };
}

/**
 * Helper: Check if word is generic
 */
function isGenericWord(word) {
  const generic = [
    'description', 'experience', 'skills', 'education', 'work', 'job',
    'company', 'team', 'role', 'position', 'responsibilities', 'requirements',
    'qualifications', 'candidate', 'professional', 'summary', 'objective',
    'things', 'stuff', 'various', 'multiple', 'several', 'many', 'some',
    'good', 'great', 'excellent', 'strong', 'ability', 'knowledge',
    'years', 'required', 'preferred', 'must', 'should', 'will', 'can',
    'seeking', 'looking', 'join', 'growing', 'field', 'related', 'degree'
  ];
  return generic.includes(word.toLowerCase());
}

/**
 * Helper: Check if phrase is generic
 */
function isGenericPhrase(phrase) {
  const words = phrase.toLowerCase().split(' ');
  
  // Skip if contains sentence fragments or punctuation markers
  if (/^[-•\*:]\s*/.test(phrase) || phrase.endsWith(':') || phrase.endsWith('.')) {
    return true;
  }
  
  // Skip if contains generic business terms
  const genericCount = words.filter(w => isGenericWord(w)).length;
  if (genericCount > words.length / 2) return true;
  
  // Skip very generic phrases
  const superGeneric = [
    'years of experience', 'our team', 'your team', 'required skills',
    'preferred skills', 'qualifications', 'responsibilities',
    'related field', 'computer science', 'bachelor degree',
    'communication skills', 'problem solving', 'excellent communication'
  ];
  
  return superGeneric.some(g => phrase.toLowerCase().includes(g));
}

/**
 * Helper: Check if verb is generic
 */
function isGenericVerb(verb) {
  const generic = ['is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did'];
  return generic.includes(verb.toLowerCase());
}

/**
 * Calculate TF-IDF scores for terms in document
 */
function calculateTFIDF(text, allDocuments = []) {
  const words = preprocessText(text).split(/\s+/);
  const totalWords = words.length;
  
  // Calculate term frequency
  const termFreq = {};
  words.forEach(word => {
    if (word.length > 2) {
      termFreq[word] = (termFreq[word] || 0) + 1;
    }
  });
  
  // Normalize TF
  Object.keys(termFreq).forEach(term => {
    termFreq[term] = termFreq[term] / totalWords;
  });
  
  // If we have multiple documents, calculate IDF
  if (allDocuments.length > 1) {
    const docCount = allDocuments.length;
    const idf = {};
    
    Object.keys(termFreq).forEach(term => {
      const docsWithTerm = allDocuments.filter(doc => 
        doc.toLowerCase().includes(term)
      ).length;
      idf[term] = Math.log(docCount / (docsWithTerm + 1));
    });
    
    // Calculate TF-IDF
    const tfidf = {};
    Object.keys(termFreq).forEach(term => {
      tfidf[term] = termFreq[term] * (idf[term] || 0);
    });
    
    return tfidf;
  }
  
  return termFreq;
}

module.exports = {
  preprocessText,
  extractSentences,
  removeCommonWords,
  extractSkills,
  extractPhrases,
  extractActionVerbs,
  normalizeSkill,
  calculateSimilarity,
  findBestMatch,
  calculateTFIDF,
  isGenericWord,
  isGenericPhrase
};
