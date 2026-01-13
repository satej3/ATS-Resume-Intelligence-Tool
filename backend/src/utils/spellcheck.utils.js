// Spell-checking utilities for typo-tolerant skill matching
const stringSimilarity = require('string-similarity');

/**
 * Simple Levenshtein distance calculator for spell checking
 */
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));
  
  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;
  
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,     // deletion
        matrix[i][j - 1] + 1,     // insertion
        matrix[i - 1][j - 1] + cost  // substitution
      );
    }
  }
  
  return matrix[len1][len2];
}

/**
 * Check if two skills are similar enough (handles typos)
 * Returns true if edit distance is within threshold
 */
function areSkillsSimilar(skill1, skill2, threshold = 2) {
  const s1 = skill1.toLowerCase().trim();
  const s2 = skill2.toLowerCase().trim();
  
  // Exact match
  if (s1 === s2) return true;
  
  // Check Levenshtein distance (good for typos)
  const distance = levenshteinDistance(s1, s2);
  const maxLen = Math.max(s1.length, s2.length);
  
  // Allow 1-2 character differences depending on length
  const allowedDistance = maxLen <= 5 ? 1 : threshold;
  
  return distance <= allowedDistance;
}

/**
 * Common typo corrections for technical terms
 */
const commonTechTypos = {
  'pyhton': 'python',
  'pytohn': 'python',
  'javasript': 'javascript',
  'javascirpt': 'javascript',
  'javascrpit': 'javascript',
  'typescipt': 'typescript',
  'typescirpt': 'typescript',
  'kuberntes': 'kubernetes',
  'kuberentes': 'kubernetes',
  'postgre': 'postgresql',
  'postgress': 'postgresql',
  'mongod': 'mongodb',
  'mongobd': 'mongodb',
  'reactjs': 'react',
  'react.js': 'react',
  'nodejs': 'node.js',
  'node.js': 'node',
  'angularjs': 'angular',
  'vuejs': 'vue',
  'vue.js': 'vue',
  'expresjs': 'express',
  'expres': 'express',
  'redis': 'redis',
  'rediss': 'redis',
  'docker': 'docker',
  'dokcer': 'docker',
  'git': 'git',
  'github': 'github',
  'gitlab': 'gitlab',
  'jira': 'jira',
  'aws': 'aws',
  'gcp': 'gcp',
  'azure': 'azure',
  'asure': 'azure'
};

/**
 * Autocorrect a skill name if it's a common typo
 */
function autocorrectSkill(skill) {
  const lower = skill.toLowerCase().trim();
  
  // Check exact typo match
  if (commonTechTypos[lower]) {
    return commonTechTypos[lower];
  }
  
  // Check fuzzy match against known typos
  const typoKeys = Object.keys(commonTechTypos);
  for (const typo of typoKeys) {
    if (areSkillsSimilar(lower, typo, 1)) {
      return commonTechTypos[typo];
    }
  }
  
  return skill;
}

/**
 * Find best match with typo tolerance
 */
function findBestMatchWithTypoTolerance(targetSkill, skillsList, threshold = 0.80) {
  if (!skillsList || skillsList.length === 0) {
    return { match: null, score: 0, corrected: false };
  }
  
  // First try autocorrect
  const corrected = autocorrectSkill(targetSkill);
  const skillToMatch = corrected.toLowerCase();
  
  const matches = skillsList.map(skill => {
    const s = skill.toLowerCase();
    
    // Exact match
    if (skillToMatch === s) return { skill, score: 1.0 };
    
    // String similarity (Dice coefficient)
    const similarity = stringSimilarity.compareTwoStrings(skillToMatch, s);
    
    // Levenshtein-based similarity
    const distance = levenshteinDistance(skillToMatch, s);
    const maxLen = Math.max(skillToMatch.length, s.length);
    const levenSimilarity = 1 - (distance / maxLen);
    
    // Use the better of the two scores
    const finalScore = Math.max(similarity, levenSimilarity);
    
    return { skill, score: finalScore };
  });
  
  const best = matches.reduce((prev, current) => 
    current.score > prev.score ? current : prev
  );
  
  return {
    match: best.score >= threshold ? best.skill : null,
    score: best.score,
    corrected: corrected !== targetSkill
  };
}

/**
 * Expand skill variations (handles plurals, verb forms, etc.)
 */
function getSkillVariations(skill) {
  const variations = new Set([skill.toLowerCase()]);
  const base = skill.toLowerCase().trim();
  
  // Remove common suffixes
  const suffixes = ['ing', 'ed', 's', 'es', 'er', 'or'];
  suffixes.forEach(suffix => {
    if (base.endsWith(suffix)) {
      variations.add(base.slice(0, -suffix.length));
    }
  });
  
  // Add common variations
  if (base.endsWith('y')) {
    variations.add(base.slice(0, -1) + 'ies');
  }
  
  // Technical term variations
  if (base.includes('.')) {
    variations.add(base.replace(/\./g, ''));
  }
  if (base.includes('-')) {
    variations.add(base.replace(/-/g, ' '));
    variations.add(base.replace(/-/g, ''));
  }
  if (base.includes(' ')) {
    variations.add(base.replace(/\s+/g, ''));
    variations.add(base.replace(/\s+/g, '-'));
  }
  
  return Array.from(variations);
}

module.exports = {
  levenshteinDistance,
  areSkillsSimilar,
  autocorrectSkill,
  findBestMatchWithTypoTolerance,
  getSkillVariations,
  commonTechTypos
};
