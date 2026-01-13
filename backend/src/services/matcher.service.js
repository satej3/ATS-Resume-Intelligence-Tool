const { extractKeywords, calculateKeywordImportance } = require("../utils/text.utils");

function calculateMatch(resumeText, jdText) {
  // Step 1: Extract keywords from both texts using our dynamic system
  const jdKeywords = extractKeywords(jdText);
  const resumeKeywords = extractKeywords(resumeText);
  
  // Step 2: Perform comprehensive matching
  const matchingResult = performAdvancedMatching(jdKeywords, resumeKeywords, jdText, resumeText);
  
  // Step 3: Analyze different sections for detailed breakdown
  const sectionAnalysis = analyzeSections(jdText, resumeText);
  
  // Step 4: Generate professional recommendations
  const recommendations = generateRecommendations(matchingResult, sectionAnalysis);
  
  return {
    // Core metrics
    score: matchingResult.overallScore,
    matchedKeywords: matchingResult.matchedCount,
    totalKeywords: jdKeywords.length,
    
    // New detailed analysis
    sectionBreakdown: sectionAnalysis,
    keywordAnalysis: matchingResult.keywordAnalysis,
    strengthsWeaknessAnalysis: matchingResult.strengthsWeaknesses,
    recommendations: recommendations,
    
    // Professional insights
    matchQuality: getMatchQuality(matchingResult.overallScore),
    experienceAlignment: analyzeExperience(resumeText, jdText),
    
    // For backward compatibility
    missingKeywords: matchingResult.missingKeywords.slice(0, 15)
  };
}

function performAdvancedMatching(jdKeywords, resumeKeywords, jdText, resumeText) {
  const resumeSet = new Set(resumeKeywords.map(k => k.toLowerCase()));
  
  let exactMatches = 0;
  let partialMatches = 0;
  const matchedTerms = [];
  const missingTerms = [];
  
  jdKeywords.forEach(jdKeyword => {
    const jdLower = jdKeyword.toLowerCase();
    
    // Check for exact match
    if (resumeSet.has(jdLower)) {
      exactMatches++;
      matchedTerms.push(jdKeyword);
      return;
    }
    
    // Check for partial/semantic matches
    const partialMatch = findBestMatch(jdLower, resumeKeywords);
    if (partialMatch.score > 0.7) {
      partialMatches++;
      matchedTerms.push(`${jdKeyword} (similar: ${partialMatch.term})`);
    } else {
      missingTerms.push(jdKeyword);
    }
  });
  
  // Calculate score with partial credit
  const totalMatched = exactMatches + (partialMatches * 0.8);
  const overallScore = jdKeywords.length > 0 ? Math.round((totalMatched / jdKeywords.length) * 100) : 0;
  
  return {
    overallScore: Math.max(overallScore, 10), // Ensure minimum score for any reasonable match
    matchedCount: exactMatches + partialMatches,
    exactMatches,
    partialMatches,
    matchedTerms,
    missingKeywords: missingTerms,
    keywordAnalysis: generateKeywordAnalysis(exactMatches, partialMatches, jdKeywords.length),
    strengthsWeaknesses: analyzeStrengthsWeaknesses(exactMatches, partialMatches, jdKeywords.length)
  };
}

function findBestMatch(target, candidates) {
  let bestScore = 0;
  let bestMatch = '';
  
  candidates.forEach(candidate => {
    const candidateLower = candidate.toLowerCase();
    
    // Check for substring matches
    if (target.includes(candidateLower) || candidateLower.includes(target)) {
      const score = Math.min(target.length, candidateLower.length) / Math.max(target.length, candidateLower.length);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = candidate;
      }
    }
    
    // Check for word similarity
    const similarity = calculateSimilarity(target, candidateLower);
    if (similarity > bestScore) {
      bestScore = similarity;
      bestMatch = candidate;
    }
  });
  
  return { score: bestScore, term: bestMatch };
}

function calculateSimilarity(str1, str2) {
  // Simple Jaccard similarity for words
  const words1 = str1.split(/\s+/);
  const words2 = str2.split(/\s+/);
  
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

function analyzeSections(jdText, resumeText) {
  const sections = {
    skills: analyzeSkillsSection(jdText, resumeText),
    experience: analyzeExperienceSection(jdText, resumeText), 
    requirements: analyzeRequirementsSection(jdText, resumeText),
    qualifications: analyzeQualificationsSection(jdText, resumeText)
  };
  
  return sections;
}

function analyzeSkillsSection(jdText, resumeText) {
  const jdSkillsKeywords = extractSectionKeywords(jdText, ['skills', 'technical', 'competencies']);
  const resumeSkillsKeywords = extractSectionKeywords(resumeText, ['skills', 'technical', 'competencies']);
  
  const matchResult = matchKeywordSets(jdSkillsKeywords, resumeSkillsKeywords);
  
  return {
    score: matchResult.score,
    matched: matchResult.matched,
    total: jdSkillsKeywords.length,
    matchedTerms: matchResult.matchedTerms,
    missingTerms: matchResult.missingTerms.slice(0, 5),
    weight: 25, // 25% weight for skills
    status: getStatusText(matchResult.score)
  };
}

function analyzeExperienceSection(jdText, resumeText) {
  const jdExpKeywords = extractSectionKeywords(jdText, ['experience', 'background', 'work', 'professional']);
  const resumeExpKeywords = extractSectionKeywords(resumeText, ['experience', 'background', 'work', 'professional']);
  
  const matchResult = matchKeywordSets(jdExpKeywords, resumeExpKeywords);
  
  return {
    score: matchResult.score,
    matched: matchResult.matched,
    total: jdExpKeywords.length,
    matchedTerms: matchResult.matchedTerms,
    missingTerms: matchResult.missingTerms.slice(0, 5),
    weight: 30, // 30% weight for experience
    status: getStatusText(matchResult.score)
  };
}

function analyzeRequirementsSection(jdText, resumeText) {
  const jdReqKeywords = extractSectionKeywords(jdText, ['requirements', 'required', 'must have', 'essential']);
  const resumeAllKeywords = extractKeywords(resumeText);
  
  const matchResult = matchKeywordSets(jdReqKeywords, resumeAllKeywords);
  
  return {
    score: matchResult.score,
    matched: matchResult.matched,
    total: jdReqKeywords.length,
    matchedTerms: matchResult.matchedTerms,
    missingTerms: matchResult.missingTerms.slice(0, 5),
    weight: 35, // 35% weight for requirements
    status: getStatusText(matchResult.score)
  };
}

function analyzeQualificationsSection(jdText, resumeText) {
  const jdQualKeywords = extractSectionKeywords(jdText, ['qualifications', 'preferred', 'nice to have', 'plus']);
  const resumeAllKeywords = extractKeywords(resumeText);
  
  const matchResult = matchKeywordSets(jdQualKeywords, resumeAllKeywords);
  
  return {
    score: matchResult.score,
    matched: matchResult.matched,
    total: jdQualKeywords.length,
    matchedTerms: matchResult.matchedTerms,
    missingTerms: matchResult.missingTerms.slice(0, 5),
    weight: 10, // 10% weight for preferred qualifications
    status: getStatusText(matchResult.score)
  };
}

function extractSectionKeywords(text, sectionIndicators) {
  const lines = text.split('\n');
  let relevantText = '';
  let inRelevantSection = false;
  
  lines.forEach(line => {
    const lineLower = line.toLowerCase().trim();
    
    // Check if we're entering a relevant section
    if (sectionIndicators.some(indicator => lineLower.includes(indicator))) {
      inRelevantSection = true;
    }
    
    // Check if we're leaving the section (hit another header)
    if (inRelevantSection && lineLower.match(/^[a-z\s]{3,30}:?\s*$/) && 
        !sectionIndicators.some(indicator => lineLower.includes(indicator))) {
      inRelevantSection = false;
    }
    
    if (inRelevantSection) {
      relevantText += line + ' ';
    }
  });
  
  // If no specific section found, extract from full text with lower priority
  if (!relevantText.trim()) {
    relevantText = text;
  }
  
  return extractKeywords(relevantText);
}

function matchKeywordSets(jdKeywords, resumeKeywords) {
  if (jdKeywords.length === 0) {
    return { score: 100, matched: 0, matchedTerms: [], missingTerms: [] };
  }
  
  const resumeSet = new Set(resumeKeywords.map(k => k.toLowerCase()));
  let matched = 0;
  const matchedTerms = [];
  const missingTerms = [];
  
  jdKeywords.forEach(keyword => {
    const keywordLower = keyword.toLowerCase();
    
    if (resumeSet.has(keywordLower)) {
      matched++;
      matchedTerms.push(keyword);
    } else {
      // Try partial matching
      const partialMatch = resumeKeywords.find(rk => 
        rk.toLowerCase().includes(keywordLower) || keywordLower.includes(rk.toLowerCase())
      );
      
      if (partialMatch) {
        matched += 0.7; // Partial credit
        matchedTerms.push(`${keyword} (~${partialMatch})`);
      } else {
        missingTerms.push(keyword);
      }
    }
  });
  
  const score = Math.round((matched / jdKeywords.length) * 100);
  
  return {
    score,
    matched: Math.round(matched),
    matchedTerms,
    missingTerms
  };
}

function generateKeywordAnalysis(exactMatches, partialMatches, totalKeywords) {
  return {
    exactMatches,
    partialMatches,
    totalKeywords,
    matchRate: `${exactMatches + partialMatches}/${totalKeywords}`,
    exactMatchPercentage: Math.round((exactMatches / totalKeywords) * 100),
    partialMatchPercentage: Math.round((partialMatches / totalKeywords) * 100)
  };
}

function analyzeStrengthsWeaknesses(exactMatches, partialMatches, totalKeywords) {
  const strengths = [];
  const weaknesses = [];
  
  const exactRate = exactMatches / totalKeywords;
  const totalRate = (exactMatches + partialMatches) / totalKeywords;
  
  if (exactRate > 0.6) {
    strengths.push({
      area: "Keyword Matching",
      description: `Strong exact keyword alignment (${Math.round(exactRate * 100)}%)`
    });
  }
  
  if (totalRate > 0.7) {
    strengths.push({
      area: "Overall Match",
      description: "Good overall skill and requirement coverage"
    });
  }
  
  if (exactRate < 0.3) {
    weaknesses.push({
      area: "Exact Keywords",
      description: "Need more specific keyword matches from job description"
    });
  }
  
  if (totalRate < 0.5) {
    weaknesses.push({
      area: "Coverage Gap",
      description: "Missing several key requirements and skills"
    });
  }
  
  return { strengths, weaknesses };
}

function generateRecommendations(matchingResult, sectionAnalysis) {
  const recommendations = [];
  
  // High-priority recommendations based on score
  if (matchingResult.overallScore < 60) {
    recommendations.push({
      priority: 'HIGH',
      action: 'Add Key Missing Keywords',
      description: `Include these important terms: ${matchingResult.missingKeywords.slice(0, 5).join(', ')}`,
      impact: '+20-30% score increase',
      section: 'Throughout Resume'
    });
  }
  
  // Section-specific recommendations
  Object.entries(sectionAnalysis).forEach(([sectionName, analysis]) => {
    if (analysis.score < 50 && analysis.total > 0) {
      recommendations.push({
        priority: analysis.weight > 25 ? 'HIGH' : 'MEDIUM',
        action: `Improve ${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}`,
        description: `Add: ${analysis.missingTerms.slice(0, 3).join(', ')}`,
        impact: `+${Math.round(analysis.weight / 5)}% potential increase`,
        section: sectionName
      });
    }
  });
  
  // Experience-specific recommendations
  if (matchingResult.partialMatches > matchingResult.exactMatches) {
    recommendations.push({
      priority: 'MEDIUM',
      action: 'Use More Specific Keywords',
      description: 'Replace general terms with exact keywords from job description',
      impact: '+10-15% score increase',
      section: 'All Sections'
    });
  }
  
  return recommendations.slice(0, 6); // Return top 6 recommendations
}

function analyzeExperience(resumeText, jdText) {
  const jdYearMatches = jdText.match(/(\d+)\+?\s*years?\s*(of\s*)?(experience|exp)/gi);
  const resumeYearMatches = resumeText.match(/(\d+)\+?\s*years?\s*(of\s*)?(experience|exp)/gi);
  
  const requiredYears = jdYearMatches ? Math.max(...jdYearMatches.map(m => parseInt(m.match(/\d+/)[0]))) : 0;
  const candidateYears = resumeYearMatches ? Math.max(...resumeYearMatches.map(m => parseInt(m.match(/\d+/)[0]))) : 0;
  
  return {
    required: requiredYears || 'Not specified',
    candidate: candidateYears || 'Not clearly specified',
    alignment: requiredYears && candidateYears ? 
      (candidateYears >= requiredYears ? 'Meets Requirements ✅' : 'Below Requirements ⚠️') : 
      'Cannot determine',
    score: requiredYears ? Math.min((candidateYears / requiredYears) * 100, 100) : 100
  };
}

function getMatchQuality(score) {
  if (score >= 85) return "Excellent - Strong alignment with job requirements";
  if (score >= 70) return "Good - Solid match with room for minor improvements";
  if (score >= 55) return "Moderate - Decent foundation with some gaps to address";
  if (score >= 40) return "Fair - Several important requirements missing";
  return "Needs Improvement - Significant gaps in key requirements";
}

function getStatusText(score) {
  if (score >= 80) return "Excellent";
  if (score >= 65) return "Good";
  if (score >= 50) return "Moderate";
  if (score >= 35) return "Fair";
  return "Needs Work";
}

module.exports = { calculateMatch };
