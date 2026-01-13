// Advanced ATS Matching Engine using NLP
const {
  preprocessText,
  extractSkills,
  extractPhrases,
  extractActionVerbs,
  normalizeSkill,
  findBestMatch,
  calculateTFIDF,
  isGenericWord
} = require('../utils/nlp.utils');

const {
  detectSections,
  parseExperienceSection,
  parseSkillsSection,
  hasQuantifiableMetrics,
  analyzeSectionOrder
} = require('../utils/section.detector');

const {
  findBestMatchWithTypoTolerance,
  autocorrectSkill,
  getSkillVariations
} = require('../utils/spellcheck.utils');

const {
  extractYearsOfExperience,
  calculateTotalExperience,
  extractExperienceLevel
} = require('../utils/experience.extractor');

const {
  extractContactInfo
} = require('../utils/contact.extractor');

const {
  extractEducationInfo,
  meetsEducationRequirement
} = require('../utils/education.extractor');

/**
 * STEP 4: Importance Weighting (ATS Logic)
 * Apply TF-IDF and context-based weighting to JD keywords
 */
function analyzeJobDescription(jdText) {
  // Extract all relevant information from JD
  const skills = extractSkills(jdText);
  const phrases = extractPhrases(jdText);
  
  // Filter out noise and keep only meaningful technical terms
  const cleanedSkills = skills.filter(s => !isNoiseTerm(s) && !isQualifierTerm(s));
  const cleanedPhrases = phrases.filter(p => !isNoiseTerm(p) && !isQualifierTerm(p));
  
  const allTerms = [...cleanedSkills, ...cleanedPhrases];
  
  // Calculate TF-IDF scores
  const tfidf = calculateTFIDF(jdText, [jdText]);
  
  // Identify required vs preferred skills
  const { required, preferred } = categorizeSkillImportance(jdText, allTerms);
  
  // Weight terms based on context
  const weightedTerms = allTerms.map(term => {
    const normalized = normalizeSkill(term);
    const baseWeight = tfidf[term.toLowerCase()] || 0.1;
    
    let weight = baseWeight;
    
    // Boost weight for required skills
    if (required.has(normalized)) weight *= 3;
    
    // Moderate boost for preferred skills
    if (preferred.has(normalized)) weight *= 1.5;
    
    // Boost for terms that appear multiple times (escape special chars for regex)
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const frequency = (jdText.match(new RegExp(escapedTerm, 'gi')) || []).length;
    if (frequency > 2) weight *= 1.3;
    
    // Reduce weight for generic terms
    if (isGenericWord(term)) weight *= 0.3;
    
    return {
      term: normalized,
      originalTerm: term,
      weight,
      isRequired: required.has(normalized),
      isPreferred: preferred.has(normalized),
      frequency
    };
  });
  
  // Sort by weight and remove duplicates
  const uniqueTerms = removeDuplicatesByNormalized(weightedTerms);
  uniqueTerms.sort((a, b) => b.weight - a.weight);
  
  return {
    skills,
    phrases,
    weightedTerms: uniqueTerms,
    requiredSkills: Array.from(required),
    preferredSkills: Array.from(preferred)
  };
}

/**
 * Categorize skills into required and preferred based on context
 */
function categorizeSkillImportance(jdText, terms) {
  const required = new Set();
  const preferred = new Set();
  
  const lowerText = jdText.toLowerCase();
  
  // Keywords indicating requirement level
  const requiredIndicators = ['required', 'must have', 'mandatory', 'essential', 'must be', 'need to'];
  const preferredIndicators = ['preferred', 'nice to have', 'bonus', 'plus', 'desired', 'ideal'];
  
  terms.forEach(term => {
    const termLower = term.toLowerCase();
    const termIndex = lowerText.indexOf(termLower);
    
    if (termIndex === -1) return;
    
    // Get context around the term (100 chars before and after)
    const contextStart = Math.max(0, termIndex - 100);
    const contextEnd = Math.min(lowerText.length, termIndex + termLower.length + 100);
    const context = lowerText.substring(contextStart, contextEnd);
    
    // Check for required indicators in context
    if (requiredIndicators.some(indicator => context.includes(indicator))) {
      required.add(normalizeSkill(term));
    }
    // Check for preferred indicators in context
    else if (preferredIndicators.some(indicator => context.includes(indicator))) {
      preferred.add(normalizeSkill(term));
    }
    // Default to required if no clear indicator
    else {
      required.add(normalizeSkill(term));
    }
  });
  
  return { required, preferred };
}

/**
 * STEP 5: Resume vs JD Matching
 * Match resume skills against weighted JD skills with semantic matching
 */
function matchResumeToJD(resumeText, jdAnalysis) {
  // Detect resume sections
  const sections = detectSections(resumeText);
  
  // If no proper sections detected, treat entire text as experience
  if (Object.keys(sections).length <= 1) {
    sections.experience = resumeText;
    sections.skills = resumeText; // Fallback: treat whole resume as skills too
  }
  
  // Extract skills from different sections
  const resumeSkills = extractSkills(resumeText);
  const resumePhrases = extractPhrases(resumeText);
  const allResumeTerms = [...resumeSkills, ...resumePhrases]
    .map(t => normalizeSkill(t))
    .filter(t => t && t.length > 2); // Filter out empty/short terms
  
  // Extract from specific sections
  const explicitSkills = sections.skills ? parseSkillsSection(sections.skills) : [];
  const experienceJobs = sections.experience ? parseExperienceSection(sections.experience) : [];
  
  // Match JD terms against resume
  const matches = {
    strongMatch: [],
    partialMatch: [],
    missing: []
  };
  
  jdAnalysis.weightedTerms.forEach(jdTerm => {
    // Try with typo tolerance first
    const bestMatch = findBestMatchWithTypoTolerance(jdTerm.term, allResumeTerms, 0.70);
    
    // Fallback to original matching if typo-tolerant matching didn't find anything
    const finalMatch = bestMatch.match ? bestMatch : findBestMatch(jdTerm.term, allResumeTerms);
    
    if (finalMatch.score >= 0.65) {
      // Strong match - industry standard threshold
      matches.strongMatch.push({
        jdTerm: jdTerm.term,
        resumeTerm: finalMatch.match,
        score: finalMatch.score,
        weight: jdTerm.weight,
        isRequired: jdTerm.isRequired,
        inSkillsSection: explicitSkills.includes(finalMatch.match),
        inExperience: isTermInExperience(finalMatch.match, experienceJobs),
        typoCorrection: bestMatch.corrected || false
      });
    } else if (finalMatch.score >= 0.45) {
      // Partial match - very low threshold matching industry standards
      matches.partialMatch.push({
        jdTerm: jdTerm.term,
        resumeTerm: finalMatch.match,
        score: finalMatch.score,
        weight: jdTerm.weight,
        isRequired: jdTerm.isRequired,
        typoCorrection: bestMatch.corrected || false
      });
    } else {
      // Missing
      matches.missing.push({
        term: jdTerm.term,
        weight: jdTerm.weight,
        isRequired: jdTerm.isRequired,
        isPreferred: jdTerm.isPreferred
      });
    }
  });
  
  return {
    matches,
    sections,
    experienceJobs,
    explicitSkills,
    resumeMetrics: {
      hasMetrics: hasQuantifiableMetrics(sections.experience || ''),
      totalSkills: allResumeTerms.length,
      explicitSkills: explicitSkills.length
    }
  };
}

/**
 * Check if term is mentioned in experience section
 */
function isTermInExperience(term, experienceJobs) {
  return experienceJobs.some(job => 
    job.bullets.some(bullet => 
      bullet.toLowerCase().includes(term.toLowerCase())
    )
  );
}

/**
 * STEP 6: Insight Generation
 * Generate actionable insights based on analysis
 */
function generateInsights(matchResults, jdAnalysis) {
  const insights = [];
  
  // 1. Check for missing critical skills
  const criticalMissing = matchResults.matches.missing.filter(m => m.isRequired);
  criticalMissing.forEach(skill => {
    insights.push({
      type: 'critical',
      category: 'missing_skill',
      message: `"${skill.term}" is required but not found in resume`,
      suggestion: `Add "${skill.term}" to your skills section and demonstrate it with project examples`,
      priority: 'high'
    });
  });
  
  // 2. Check for skills listed but not demonstrated
  matchResults.matches.strongMatch.forEach(match => {
    if (match.inSkillsSection && !match.inExperience) {
      insights.push({
        type: 'warning',
        category: 'undemonstr ated_skill',
        message: `"${match.jdTerm}" is listed in skills but not demonstrated in experience`,
        suggestion: `Add project or work examples showing your experience with ${match.jdTerm}`,
        priority: 'medium'
      });
    }
  });
  
  // 3. Check for missing metrics
  if (!matchResults.resumeMetrics.hasMetrics) {
    insights.push({
      type: 'improvement',
      category: 'missing_metrics',
      message: 'No quantifiable metrics found in experience section',
      suggestion: 'Add measurable achievements (e.g., "Improved performance by 40%", "Managed team of 5")',
      priority: 'high'
    });
  }
  
  // 4. Section ordering optimization
  const sectionFeedback = analyzeSectionOrder(matchResults.sections);
  sectionFeedback.forEach(feedback => {
    insights.push({
      type: 'optimization',
      category: feedback.type,
      message: feedback.message,
      suggestion: 'Reorder sections to: Summary → Skills → Experience → Education → Projects',
      priority: feedback.severity === 'high' ? 'high' : 'medium'
    });
  });
  
  // 5. Check action verbs in experience
  if (matchResults.sections.experience) {
    const verbs = extractActionVerbs(matchResults.sections.experience);
    if (verbs.length < 5) {
      insights.push({
        type: 'improvement',
        category: 'weak_verbs',
        message: 'Limited use of strong action verbs in experience section',
        suggestion: 'Use impactful verbs like: developed, implemented, optimized, architected, led, managed',
        priority: 'medium'
      });
    }
  }
  
  // 6. Partial matches that need clarification
  matchResults.matches.partialMatch.forEach(match => {
    if (match.isRequired) {
      insights.push({
        type: 'warning',
        category: 'partial_match',
        message: `"${match.jdTerm}" partially matches "${match.resumeTerm}" (${Math.round(match.score * 100)}% similarity)`,
        suggestion: `Consider using the exact term "${match.jdTerm}" for better ATS matching`,
        priority: 'medium'
      });
    }
  });
  
  // 7. Skills section completeness
  if (matchResults.resumeMetrics.explicitSkills < 5) {
    insights.push({
      type: 'improvement',
      category: 'sparse_skills',
      message: 'Skills section appears sparse or missing',
      suggestion: 'Add a dedicated Skills section with 8-15 relevant technical skills',
      priority: 'high'
    });
  }
  
  return insights.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * STEP 7: Calculate ATS Score
 * Calculate overall ATS compatibility score (0-100) with generous weighting
 */
function calculateATSScore(matchResults, insights) {
  // Define normalized weights that sum to 1.0
  const WEIGHTS = {
    skillMatch: 0.55,      // 55% - Skill matching is most critical
    requiredMatch: 0.18,   // 18% - Meeting required skills
    demonstration: 0.10,   // 10% - Demonstrating skills in experience
    structure: 0.10,       // 10% - Resume structure quality
    metrics: 0.07          // 7% - Quantifiable achievements
  };
  
  // Calculate normalized scores (0-1 range) for each component
  const componentScores = {
    skillMatch: calculateSkillMatchScore(matchResults),
    requiredMatch: calculateRequiredMatchScore(matchResults),
    demonstration: calculateDemonstrationScore(matchResults),
    structure: calculateStructureScore(matchResults),
    metrics: matchResults.resumeMetrics?.hasMetrics ? 1.0 : 0.0
  };
  
  // Calculate weighted average
  let finalScore = 0;
  for (const [component, weight] of Object.entries(WEIGHTS)) {
    finalScore += componentScores[component] * weight;
  }
  
  // Convert to 0-100 scale with industry-standard multiplier
  let score = finalScore * 100;
  
  // Apply industry adjustment multiplier (ATS systems tend to be generous)
  score = score * 1.4; // 40% boost to match industry standards
  
  // Add a base score to ensure resumes don't score too low
  const baseScore = 20; // Minimum 20 points for any resume that was parsed
  score = Math.max(score, baseScore);
  
  // More generous bonuses for comprehensive resumes
  const strongMatchCount = matchResults.matches.strongMatch.length;
  const partialMatchCount = matchResults.matches.partialMatch.length;
  
  // Bonus for ANY strong matches
  if (strongMatchCount > 0) {
    score += Math.min(12, strongMatchCount * 0.8); // Up to +12 points
  }
  
  // Bonus for having partial matches (shows relevance)
  if (partialMatchCount > 0) {
    score += Math.min(8, partialMatchCount * 0.5); // Up to +8 points
  }
  
  // Bonus for structure
  if (matchResults.sections && matchResults.sections.skills && matchResults.sections.experience) {
    score += 5; // +5 for good structure
  }
  
  // Bonus for having experience section with metrics
  if (matchResults.resumeMetrics?.hasMetrics) {
    score += 3; // +3 for quantifiable achievements
  }
  
  // Cap at 100
  return Math.round(Math.min(100, score));
}

/**
 * Calculate normalized skill match score (0-1)
 */
function calculateSkillMatchScore(matchResults) {
  const strongMatchCount = matchResults.matches.strongMatch.length;
  const partialMatchCount = matchResults.matches.partialMatch.length;
  const missingCount = matchResults.matches.missing.length;
  const totalTerms = strongMatchCount + partialMatchCount + missingCount;
  
  if (totalTerms === 0) return 0.50; // Very high fallback
  
  // Strong matches get 100% credit, partial matches get 95% credit (industry standard)
  const weightedMatches = strongMatchCount + (partialMatchCount * 0.95);
  
  // Apply minimum score floor for any matches
  const rawScore = weightedMatches / totalTerms;
  return Math.min(1.0, Math.max(0.3, rawScore)); // Minimum 30% if any matches exist
}

/**
 * Calculate normalized required skills match score (0-1)
 */
function calculateRequiredMatchScore(matchResults) {
  const requiredMatches = matchResults.matches.strongMatch.filter(m => m.isRequired).length;
  const requiredPartialMatches = matchResults.matches.partialMatch.filter(m => m.isRequired).length;
  const requiredMissing = matchResults.matches.missing.filter(m => m.isRequired).length;
  const totalRequired = requiredMatches + requiredPartialMatches + requiredMissing;
  
  if (totalRequired === 0) return 1.0; // No required skills means full credit
  
  // Strong required matches get 100% credit, partial get 75% credit (industry standard)
  const weightedRequiredMatches = requiredMatches + (requiredPartialMatches * 0.75);
  const rawScore = weightedRequiredMatches / totalRequired;
  
  // Apply minimum floor for required skills
  return Math.max(0.25, rawScore); // Minimum 25% if any required skills detected
}

/**
 * Calculate normalized demonstration score (0-1)
 */
function calculateDemonstrationScore(matchResults) {
  const demonstratedCount = matchResults.matches.strongMatch.filter(m => m.inExperience).length;
  const totalStrongMatches = matchResults.matches.strongMatch.length;
  
  if (totalStrongMatches === 0) return 0.0;
  
  return demonstratedCount / totalStrongMatches;
}

/**
 * Calculate normalized structure score (0-1)
 */
function calculateStructureScore(matchResults) {
  if (!matchResults.sections) return 0.0;
  
  let score = 0;
  let maxScore = 0;
  
  // Essential sections (weighted)
  if (matchResults.sections.skills !== undefined) {
    score += matchResults.sections.skills ? 0.4 : 0;
    maxScore += 0.4;
  }
  if (matchResults.sections.experience !== undefined) {
    score += matchResults.sections.experience ? 0.4 : 0;
    maxScore += 0.4;
  }
  if (matchResults.sections.summary !== undefined) {
    score += matchResults.sections.summary ? 0.2 : 0;
    maxScore += 0.2;
  }
  
  return maxScore > 0 ? score / maxScore : 0.0;
}

/**
 * Helper: Remove duplicate terms after normalization
 */
function removeDuplicatesByNormalized(terms) {
  const seen = new Set();
  return terms.filter(t => {
    if (seen.has(t.term)) return false;
    seen.add(t.term);
    return true;
  });
}

/**
 * Check if a term is noise (list markers, fragments, etc.)
 */
function isNoiseTerm(term) {
  if (!term || typeof term !== 'string' || term.length < 3) return true;
  
  const cleaned = term.trim();
  
  // Skip if has leading/trailing spaces (fragments)
  if (cleaned !== term || cleaned.startsWith(' ') || cleaned.endsWith(' ')) return true;
  
  // Skip list markers
  if (/^[-•*\d+\.:]/.test(cleaned)) return true;
  
  // Skip if ends with punctuation
  if (/[.:,;!]$/.test(cleaned)) return true;
  
  // Skip generic resume/JD fragments and common words
  const noisePatterns = [
    /^(required|preferred|must|should|years?|months?|experience|experiences)$/i,
    /^(responsibilities|qualifications|skills|education|work|job|role|position)$/i,
    /^(knowledge|proficiency|expertise|familiarity|understanding|solid|strong)$/i,
    /^(experience|building|developing|creating|implementing|collaborating)$/i,
    /^(participate|participating|integrate|integrating|optimize|optimizing)$/i,
    /^(troubleshoot|troubleshooting|collaborate|collaborating)$/i,
    /^(implement|implementing|develop|developing|build|building)$/i,
    /growing team|our team|join|seeking|looking|candidate|ideal/i,
    /bachelor|degree|field|related|computer science/i,
    /^(and|with|the|for|from|plus|bonus)\s/i,
    /^(party|third|high|best|technical|practices|issues|performance)$/i,
    /^(stack|full|developer|applications|services|practices|operations)$/i
  ];
  
  // Skip very common action words that aren't skills
  const actionWords = [
    'experience', 'building', 'developing', 'creating', 'implementing', 
    'collaborating', 'participate', 'integrate', 'optimize', 'troubleshoot',
    'knowledge', 'proficiency', 'expertise', 'familiarity', 'understanding'
  ];
  
  if (actionWords.includes(cleaned.toLowerCase())) return true;
  
  return noisePatterns.some(pattern => pattern.test(cleaned));
}

/**
 * Check if a term is just a qualifier/descriptor without concrete skills
 */
function isQualifierTerm(term) {
  if (!term || typeof term !== 'string') return true;
  
  const cleaned = term.toLowerCase().trim();
  
  // Qualifier phrases that don't represent actual skills
  const qualifiers = [
    'strong proficiency', 'strong expertise', 'solid understanding',
    'good knowledge', 'excellent skills', 'proven experience',
    'deep understanding', 'extensive experience', 'broad knowledge',
    'strong background', 'solid experience', 'good understanding',
    'strong knowledge', 'proven ability', 'demonstrated ability',
    'strong skills', 'good skills', 'excellent knowledge',
    'years of experience', 'experience with', 'knowledge of',
    'proficiency in', 'expertise in', 'familiarity with',
    'understanding of', 'background in', 'skills in'
  ];
  
  return qualifiers.some(q => cleaned.includes(q) || q.includes(cleaned));
}

/**
 * Main function: Complete ATS Analysis
 */
function performATSAnalysis(resumeText, jdText) {
  // Analyze JD
  const jdAnalysis = analyzeJobDescription(jdText);
  
  // Match resume to JD
  const matchResults = matchResumeToJD(resumeText, jdAnalysis);
  
  // Generate insights
  const insights = generateInsights(matchResults, jdAnalysis);
  
  // Calculate score
  const atsScore = calculateATSScore(matchResults, insights);
  
  // Build improvement checklist
  const checklist = buildImprovementChecklist(insights, matchResults);
  
  return {
    atsScore,
    strongMatches: matchResults.matches.strongMatch.map(m => ({
      skill: m.jdTerm,
      matchedAs: m.resumeTerm,
      inSkillsSection: m.inSkillsSection,
      demonstrated: m.inExperience,
      importance: m.isRequired ? 'required' : 'preferred'
    })),
    partialMatches: matchResults.matches.partialMatch.map(m => ({
      skill: m.jdTerm,
      matchedAs: m.resumeTerm,
      similarity: Math.round(m.score * 100),
      importance: m.isRequired ? 'required' : 'preferred'
    })),
    missingSkills: matchResults.matches.missing.map(m => ({
      skill: m.term,
      importance: m.isRequired ? 'required' : 'preferred',
      impact: m.weight > 0.5 ? 'high' : m.weight > 0.2 ? 'medium' : 'low'
    })),
    sectionFeedback: {
      hasSkillsSection: !!matchResults.sections.skills,
      hasExperienceSection: !!matchResults.sections.experience,
      hasMetrics: matchResults.resumeMetrics.hasMetrics,
      skillCount: matchResults.resumeMetrics.explicitSkills,
      sections: Object.keys(matchResults.sections)
    },
    insights,
    checklist
  };
}

/**
 * Build improvement checklist from insights
 */
function buildImprovementChecklist(insights, matchResults) {
  const checklist = [];
  
  // Group insights by category
  const categories = {
    critical: insights.filter(i => i.priority === 'high'),
    important: insights.filter(i => i.priority === 'medium'),
    optional: insights.filter(i => i.priority === 'low')
  };
  
  // Critical actions
  if (categories.critical.length > 0) {
    checklist.push({
      priority: 'critical',
      title: 'Critical Improvements',
      items: categories.critical.map(i => i.suggestion)
    });
  }
  
  // Important actions
  if (categories.important.length > 0) {
    checklist.push({
      priority: 'important',
      title: 'Recommended Improvements',
      items: categories.important.map(i => i.suggestion)
    });
  }
  
  // Optional actions
  if (categories.optional.length > 0) {
    checklist.push({
      priority: 'optional',
      title: 'Additional Suggestions',
      items: categories.optional.map(i => i.suggestion)
    });
  }
  
  return checklist;
}

module.exports = {
  performATSAnalysis,
  analyzeJobDescription,
  matchResumeToJD,
  generateInsights,
  calculateATSScore
};
