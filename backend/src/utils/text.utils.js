
// Completely dynamic keyword extraction - zero static patterns
// Pure linguistic analysis for any industry/language

function extractKeywords(text) {
  if (!text) return [];
  
  const tokens = tokenizeText(text);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  // Dynamic candidate collection
  const candidates = new Set();
  
  // 1. Extract by linguistic importance (no patterns)
  extractLinguisticallyImportant(text, tokens).forEach(term => candidates.add(term));
  
  // 2. Extract by document structure (dynamic detection)
  extractStructurallyImportant(text).forEach(term => candidates.add(term));
  
  // 3. Extract by frequency and context significance
  extractFrequencyBased(tokens, text).forEach(term => candidates.add(term));
  
  // 4. Extract by capitalization intelligence
  extractCapitalizationBased(text).forEach(term => candidates.add(term));
  
  // Score all candidates dynamically
  const scoredTerms = Array.from(candidates)
    .map(term => ({
      term: term.toLowerCase(),
      score: calculateDynamicScore(term, text, tokens)
    }))
    .filter(item => item.score > 2) // Dynamic threshold
    .sort((a, b) => b.score - a.score)
    .slice(0, 25)
    .map(item => item.term);
  
  return [...new Set(scoredTerms)];
}

function tokenizeText(text) {
  return text
    .replace(/[^\w\s\.\+\#\-]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 1 && !/^\d+$/.test(word));
}

function extractLinguisticallyImportant(text, tokens) {
  const important = [];
  
  // Find words that have technical characteristics
  tokens.forEach(token => {
    const word = token.toLowerCase();
    // Skip generic business words
    if (isGenericBusinessWord(word)) return;
    
    // Include terms with technical characteristics
    if (hasTechnicalCharacteristics(word, text)) {
      important.push(word);
    }
  });
  
  // Find technical multi-word terms
  for (let i = 0; i < tokens.length - 1; i++) {
    const bigram = `${tokens[i]} ${tokens[i + 1]}`.toLowerCase();
    if (isTechnicalPhrase(bigram, text)) {
      important.push(bigram);
    }
  }
  
  return important.filter(term => term && term.length > 2);
}

function extractStructurallyImportant(text) {
  const important = [];
  const lines = text.split('\n');
  
  lines.forEach(line => {
    const trimmed = line.trim();
    
    // Dynamic detection of structured content (no hardcoded patterns)
    if (isStructurallySignificant(trimmed, text)) {
      const terms = extractTermsFromLine(trimmed);
      important.push(...terms);
    }
  });
  
  return important;
}

function extractFrequencyBased(tokens, text) {
  const frequency = {};
  const textLower = text.toLowerCase();
  
  // Calculate term frequency
  tokens.forEach(token => {
    const lower = token.toLowerCase();
    frequency[lower] = (frequency[lower] || 0) + 1;
  });
  
  // Find terms with optimal frequency (not too common, not too rare)
  const totalTokens = tokens.length;
  const meaningful = [];
  
  Object.entries(frequency).forEach(([term, freq]) => {
    const relativeFreq = freq / totalTokens;
    
    // Dynamic frequency analysis - sweet spot for meaningful terms
    if (isOptimalFrequency(relativeFreq, term.length, freq)) {
      meaningful.push(term);
    }
  });
  
  return meaningful;
}

function extractCapitalizationBased(text) {
  const important = [];
  const words = text.split(/\s+/);
  
  // Dynamic capitalization analysis
  words.forEach(word => {
    if (hasSignificantCapitalization(word, text)) {
      important.push(word.toLowerCase().replace(/[^\w]/g, ''));
    }
  });
  
  return important.filter(word => word.length > 1);
}

function getLinguisticImportance(term, fullText) {
  let score = 0;
  const termLength = term.length;
  const termLower = term.toLowerCase();
  
  // Length-based intelligence (longer = more specific)
  if (termLength > 8) score += 3;
  else if (termLength > 5) score += 2;
  else if (termLength < 3) score -= 2;
  
  // Special character intelligence (technical indicators)
  if (/[\.\+\#\-\d]/.test(term)) score += 3;
  
  // Multi-word intelligence
  if (term.includes(' ')) score += 2;
  
  // Uniqueness intelligence (rare words are valuable)
  const frequency = (fullText.toLowerCase().match(new RegExp(termLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  if (frequency === 1) score += 2; // Unique terms
  else if (frequency === 2) score += 1; // Semi-rare terms
  else if (frequency > 5) score -= 1; // Over-common terms
  
  // Vowel/consonant ratio intelligence (real words have balance)
  const vowels = (term.match(/[aeiou]/gi) || []).length;
  const consonants = termLength - vowels;
  const ratio = vowels / (consonants || 1);
  if (ratio > 0.2 && ratio < 0.8) score += 1; // Balanced words
  
  // Context position intelligence
  if (isInImportantContext(term, fullText)) score += 2;
  
  return score;
}

function isStructurallySignificant(line, fullText) {
  // Dynamic detection without hardcoded patterns
  
  // Short lines often headers
  if (line.length < 30 && line.length > 3) return true;
  
  // Lines ending with punctuation often section markers
  if (/[:\-]$/.test(line)) return true;
  
  // Lines starting with special chars often bullets
  if (/^[\s]*[\•\-\*\+]/.test(line)) return true;
  
  // Lines with different formatting (all caps, etc.)
  if (line === line.toUpperCase() && line.length < 40) return true;
  
  // Lines that are distinctly different from surrounding text
  return isDifferentFromContext(line, fullText);
}

function extractTermsFromLine(line) {
  const cleanLine = line.replace(/^[\s\•\-\*\+:\d\.]+/, '').trim();
  const words = cleanLine.split(/\s+/).filter(word => word.length > 2);
  
  const terms = [];
  
  // Single meaningful words
  words.forEach(word => {
    const cleaned = word.replace(/[^\w\.\+\#\-]/g, '');
    if (cleaned.length > 2 && !isCommonWord(cleaned)) {
      terms.push(cleaned);
    }
  });
  
  // Meaningful pairs
  for (let i = 0; i < words.length - 1; i++) {
    const pair = `${words[i]} ${words[i + 1]}`.replace(/[^\w\s\.\+\#\-]/g, '').trim();
    if (pair.length > 6) {
      terms.push(pair);
    }
  }
  
  return terms;
}

function isOptimalFrequency(relativeFreq, termLength, absoluteFreq) {
  // Dynamic frequency optimization based on term characteristics
  
  // Very short terms need higher frequency to be meaningful
  if (termLength <= 3) return absoluteFreq >= 2 && relativeFreq < 0.05;
  
  // Medium terms are most valuable in mid-frequency range
  if (termLength <= 7) return relativeFreq > 0.005 && relativeFreq < 0.02;
  
  // Long terms are valuable even with low frequency
  if (termLength > 7) return absoluteFreq >= 1 && relativeFreq < 0.01;
  
  return false;
}

function hasSignificantCapitalization(word, fullText) {
  const cleanWord = word.replace(/[^\w]/g, '');
  if (cleanWord.length < 2) return false;
  
  // Acronyms (all caps, 2-6 letters)
  if (/^[A-Z]{2,6}$/.test(cleanWord)) return true;
  
  // Proper nouns (first letter caps, not at sentence start)
  if (/^[A-Z][a-z]+$/.test(cleanWord)) {
    // Check if it's not just at the start of a sentence
    const wordIndex = fullText.indexOf(word);
    if (wordIndex > 0) {
      const prevChar = fullText[wordIndex - 1];
      return prevChar !== '.' && prevChar !== '!' && prevChar !== '?';
    }
  }
  
  return false;
}

function isInImportantContext(term, fullText) {
  // Dynamic context detection without hardcoded patterns
  const termIndex = fullText.toLowerCase().indexOf(term.toLowerCase());
  if (termIndex === -1) return false;
  
  // Check surrounding text for importance indicators
  const contextStart = Math.max(0, termIndex - 50);
  const contextEnd = Math.min(fullText.length, termIndex + term.length + 50);
  const context = fullText.substring(contextStart, contextEnd).toLowerCase();
  
  // Dynamic importance scoring based on context characteristics
  let contextScore = 0;
  
  // Near colons or dashes (often after labels)
  if (/[:\-]/.test(context)) contextScore += 1;
  
  // In structured content (bullets, lists)
  if (/[\•\-\*]/.test(context)) contextScore += 1;
  
  // Near numbers (often requirements like "3+ years")
  if (/\d+/.test(context)) contextScore += 1;
  
  return contextScore >= 2;
}

function isDifferentFromContext(line, fullText) {
  // Analyze if line is structurally different from surrounding text
  const lines = fullText.split('\n');
  const lineIndex = lines.indexOf(line);
  
  if (lineIndex === -1) return false;
  
  // Compare with surrounding lines
  const avgLineLength = lines.reduce((sum, l) => sum + l.length, 0) / lines.length;
  const isSignificantlyDifferent = Math.abs(line.length - avgLineLength) > avgLineLength * 0.3;
  
  return isSignificantlyDifferent;
}

function isCommonWord(word) {
  // Dynamic common word detection using linguistic rules
  const wordLower = word.toLowerCase();
  
  // Very short words are often common
  if (wordLower.length <= 2) return true;
  
  // High vowel ratio words are often common
  const vowels = (wordLower.match(/[aeiou]/g) || []).length;
  const consonants = wordLower.length - vowels;
  if (vowels > consonants * 1.5) return true; // Too many vowels
  
  // Common ending patterns (but dynamic, not hardcoded lists)
  if (wordLower.length <= 4 && vowels <= 1) return true; // Short with few vowels
  
  return false;
}

function calculateDynamicScore(term, fullText, allTokens) {
  let score = getLinguisticImportance(term, fullText);
  
  const termLower = term.toLowerCase();
  const termLength = term.length;
  
  // Structural importance
  if (isInImportantContext(term, fullText)) score += 2;
  
  // Uniqueness bonus
  const frequency = (fullText.toLowerCase().match(new RegExp(termLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  if (frequency === 1) score += 3; // Very unique
  else if (frequency === 2) score += 1; // Somewhat unique
  
  // Technical indicators
  if (/[\.\+\#\-\d]/.test(term)) score += 2;
  
  // Compound term bonus
  if (term.includes(' ')) score += 2;
  
  // Length optimization
  if (termLength > 6 && termLength < 15) score += 2; // Sweet spot
  else if (termLength > 15) score -= 1; // Too long
  else if (termLength < 3) score -= 2; // Too short
  
  return Math.max(score, 0);
}

function calculateKeywordImportance(keywords, context) {
  return keywords.map(keyword => ({
    term: keyword,
    importance: keyword.length > 6 ? 'high' : keyword.length > 3 ? 'medium' : 'low'
  }));
}

// Enhanced functions to focus on technical and industry-specific terms
function isGenericBusinessWord(word) {
  // Dynamic detection of generic business terms that don't add ATS value
  const genericPatterns = [
    /^(looking|seeking|required|preferred|must|should|would|could|ideal|perfect|great|good|best|strong|excellent|with|have|this|that|they|them|their|where|when|what|your|experience|years|skill|ability|knowledge|will|from|work)$/,
    /^(company|team|role|position|job|candidate|person|individual|people|member|group|organization|responsibilities|requirements|qualifications|description|full|stack)$/,
    /^(the|and|for|are|but|not|you|all|can|had|her|was|one|our|out|day|get|has|him|his|how|its|may|new|now|old|see|two|who|boy|did|man|men|own|say|she|too|use)$/
  ];
  
  return genericPatterns.some(pattern => pattern.test(word)) || word.length < 3;
}

function hasTechnicalCharacteristics(word, fullText) {
  // Terms with numbers/versions are often technical (react16, node.js, 3+ years)
  if (/\d/.test(word)) return true;
  
  // Terms with technical punctuation (.js, .net, c++, c#)
  if (/[\.\+\#\-]/.test(word)) return true;
  
  // Longer words are more likely to be specific technical terms
  if (word.length > 7) return true;
  
  // Terms that appear in capitalized form in original text
  const capitalizedRegex = new RegExp('\\b' + word.charAt(0).toUpperCase() + word.slice(1) + '\\b');
  if (capitalizedRegex.test(fullText)) return true;
  
  // Terms with specific technical endings
  if (/(ing|ment|tion|sion|ness|ity|ogy|ics|ed|er|or|al|ic|ive)$/.test(word) && word.length > 5) return true;
  
  return false;
}

function isTechnicalPhrase(phrase, fullText) {
  const words = phrase.split(' ');
  if (words.length !== 2) return false;
  
  // Skip if contains too many generic words
  if (words.some(word => isGenericBusinessWord(word))) return false;
  
  // Technical multi-word patterns
  const technicalPatterns = [
    // Technology patterns (without hardcoding specific tech)
    /\w+\s+(development|programming|engineering|architecture|design|management|administration|analysis|testing|optimization)/,
    /\w+\s+(stack|framework|library|platform|database|server|system|application|service|tool)/,
    /(web|mobile|cloud|data|software|system|network|security|machine|artificial)\s+\w+/,
    /\d+[\+]?\s+(years?|experience|exp)/,
    /[a-z]+\.(js|net|py|rb|php|go|rs|kt|tsx?)/,
  ];
  
  return technicalPatterns.some(pattern => pattern.test(phrase));
}

module.exports = { extractKeywords, calculateKeywordImportance };


