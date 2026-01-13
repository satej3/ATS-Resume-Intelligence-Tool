// Education Extraction Utilities

/**
 * Extract degree information from text
 */
function extractDegrees(text) {
  const degreePatterns = [
    // Full degree names
    /\b(Bachelor(?:'s)?|Master(?:'s)?|Doctor(?:ate)?|Associate(?:'s)?|PhD|Ph\.D\.?|MBA|BS|BA|MS|MA|BSc|MSc)\s+(?:of\s+)?(?:Science|Arts|Engineering|Business|Technology|Fine Arts|Applied Science)?\s*(?:in\s+[\w\s,&]+)?/gi,
    // Abbreviated
    /\b(B\.?S\.?|B\.?A\.?|M\.?S\.?|M\.?A\.?|Ph\.?D\.?|MBA|BBA|BCA|MCA|BE|BTech|MTech)\b/gi
  ];
  
  const degrees = [];
  degreePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      degrees.push(...matches);
    }
  });
  
  return [...new Set(degrees.map(d => d.trim()))];
}

/**
 * Extract majors/fields of study
 */
function extractMajors(text) {
  const majorPatterns = [
    /\b(?:major(?:ed)?|specialization|concentration|field of study)(?:\s+in)?\s*:?\s*([\w\s,&]+)/gi,
    /\b(?:Bachelor|Master|PhD)\s+(?:of\s+)?(?:Science|Arts)\s+in\s+([\w\s,&]+)/gi,
    /\b(?:BS|BA|MS|MA)\s+in\s+([\w\s,&]+)/gi
  ];
  
  const majors = [];
  majorPatterns.forEach(pattern => {
    const matches = [...text.matchAll(pattern)];
    matches.forEach(match => {
      if (match[1]) {
        // Clean up the major name
        const major = match[1]
          .replace(/\(.*?\)/g, '') // Remove parentheses
          .replace(/\d{4}/g, '')    // Remove years
          .replace(/[,.]$/g, '')    // Remove trailing punctuation
          .trim();
        
        if (major.length > 3 && major.length < 100) {
          majors.push(major);
        }
      }
    });
  });
  
  return [...new Set(majors)];
}

/**
 * Extract GPA information
 */
function extractGPA(text) {
  const gpaPatterns = [
    /\bGPA\s*:?\s*(\d+\.?\d*)\s*(?:\/\s*(\d+\.?\d*))?/gi,
    /\bgrade\s+point\s+average\s*:?\s*(\d+\.?\d*)\s*(?:\/\s*(\d+\.?\d*))?/gi
  ];
  
  for (const pattern of gpaPatterns) {
    const matches = [...text.matchAll(pattern)];
    if (matches.length > 0) {
      const gpa = parseFloat(matches[0][1]);
      const scale = matches[0][2] ? parseFloat(matches[0][2]) : 4.0;
      return { gpa, scale };
    }
  }
  
  return null;
}

/**
 * Extract graduation year
 */
function extractGraduationYear(text) {
  // Look for patterns like "Graduated 2020", "Class of 2020", "2020"
  const yearPatterns = [
    /\b(?:graduated?|graduation|class of)\s*:?\s*(\d{4})\b/gi,
    /\b(20\d{2}|19\d{2})\s*-\s*(20\d{2}|present|current)/gi
  ];
  
  const years = [];
  yearPatterns.forEach(pattern => {
    const matches = [...text.matchAll(pattern)];
    matches.forEach(match => {
      const year = parseInt(match[1] || match[2]);
      const currentYear = new Date().getFullYear();
      
      // Only accept reasonable years (1950 to current year + 4)
      if (year >= 1950 && year <= currentYear + 4) {
        years.push(year);
      }
    });
  });
  
  return years.length > 0 ? Math.max(...years) : null;
}

/**
 * Extract university/institution names
 */
function extractInstitutions(text) {
  const institutionPatterns = [
    // University/College/Institute of
    /\b([\w\s]+)\s+(?:University|College|Institute|School|Academy)\b/gi,
    // ... University
    /\b[\w\s]+\s+(?:University|College|Institute)\b/gi
  ];
  
  const institutions = [];
  institutionPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      institutions.push(...matches.map(i => i.trim()));
    }
  });
  
  return [...new Set(institutions)];
}

/**
 * Classify degree level
 */
function classifyDegreeLevel(degree) {
  const upper = degree.toUpperCase();
  
  if (/\b(ASSOCIATE|AS|AA)\b/.test(upper)) return 'Associate';
  if (/\b(BACHELOR|BS|BA|BSC|BBA|BE|BTECH|BCA)\b/.test(upper)) return 'Bachelor';
  if (/\b(MASTER|MS|MA|MSC|MBA|ME|MTECH|MCA)\b/.test(upper)) return 'Master';
  if (/\b(PHD|PH\.D|DOCTOR|DOCTORATE)\b/.test(upper)) return 'Doctorate';
  
  return 'Unknown';
}

/**
 * Check if education meets requirement
 */
function meetsEducationRequirement(resumeDegree, requiredDegree) {
  const levelHierarchy = {
    'Associate': 1,
    'Bachelor': 2,
    'Master': 3,
    'Doctorate': 4
  };
  
  const resumeLevel = classifyDegreeLevel(resumeDegree);
  const requiredLevel = classifyDegreeLevel(requiredDegree);
  
  const resumeRank = levelHierarchy[resumeLevel] || 0;
  const requiredRank = levelHierarchy[requiredLevel] || 0;
  
  return resumeRank >= requiredRank;
}

/**
 * Extract all education information
 */
function extractEducationInfo(text) {
  const degrees = extractDegrees(text);
  const majors = extractMajors(text);
  const gpa = extractGPA(text);
  const graduationYear = extractGraduationYear(text);
  const institutions = extractInstitutions(text);
  
  return {
    degrees,
    majors,
    gpa,
    graduationYear,
    institutions,
    hasEducation: degrees.length > 0 || institutions.length > 0
  };
}

/**
 * Extract certifications
 */
function extractCertifications(text) {
  const certPatterns = [
    /\b(AWS\s+Certified|Azure|Google\s+Cloud|Certified\s+[\w\s]+|PMP|CISSP|CompTIA|CCNA|CCNP|CPA|CFA|Six\s+Sigma)\b/gi,
    /\bcertified?\s+(?:in\s+)?([\w\s]+)/gi
  ];
  
  const certifications = [];
  certPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      certifications.push(...matches.map(c => c.trim()));
    }
  });
  
  return [...new Set(certifications)];
}

module.exports = {
  extractDegrees,
  extractMajors,
  extractGPA,
  extractGraduationYear,
  extractInstitutions,
  classifyDegreeLevel,
  meetsEducationRequirement,
  extractEducationInfo,
  extractCertifications
};
