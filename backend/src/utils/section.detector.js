// Resume Section Detection using NLP
const nlp = require('compromise');

/**
 * STEP 1: Detect Resume Sections
 * Identifies different sections in a resume (Skills, Experience, Education, etc.)
 */

const SECTION_HEADERS = {
  skills: ['skills', 'technical skills', 'core competencies', 'technologies', 'expertise', 'proficiencies'],
  experience: ['experience', 'work experience', 'professional experience', 'employment history', 'work history', 'career'],
  education: ['education', 'academic background', 'qualifications', 'degrees'],
  projects: ['projects', 'personal projects', 'key projects', 'portfolio'],
  certifications: ['certifications', 'certificates', 'licenses', 'credentials'],
  summary: ['summary', 'professional summary', 'objective', 'profile', 'about'],
  achievements: ['achievements', 'awards', 'honors', 'accomplishments']
};

/**
 * Detect sections in resume text
 * Returns object with section names as keys and content as values
 */
function detectSections(resumeText) {
  if (!resumeText) return {};
  
  const lines = resumeText.split('\n');
  const sections = {};
  let currentSection = 'header';
  let currentContent = [];
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // Skip empty lines
    if (!trimmed) return;
    
    // Check if this line is a section header
    const detectedSection = detectSectionHeader(trimmed);
    
    if (detectedSection) {
      // Save previous section
      if (currentContent.length > 0) {
        sections[currentSection] = currentContent.join('\n');
      }
      
      // Start new section
      currentSection = detectedSection;
      currentContent = [];
    } else {
      // Add line to current section
      currentContent.push(trimmed);
    }
  });
  
  // Save last section
  if (currentContent.length > 0) {
    sections[currentSection] = currentContent.join('\n');
  }
  
  return sections;
}

/**
 * Detect if a line is a section header
 * Returns section name or null
 */
function detectSectionHeader(line) {
  const lower = line.toLowerCase().trim();
  
  // Check for exact matches first
  for (const [sectionName, headers] of Object.entries(SECTION_HEADERS)) {
    if (headers.some(header => lower === header || lower.startsWith(header + ':'))) {
      return sectionName;
    }
  }
  
  // Check for partial matches
  for (const [sectionName, headers] of Object.entries(SECTION_HEADERS)) {
    if (headers.some(header => lower.includes(header))) {
      // Verify it's likely a header (short, no punctuation except colon)
      if (line.length < 50 && !line.includes('.') && !line.includes(',')) {
        return sectionName;
      }
    }
  }
  
  return null;
}

/**
 * Extract structured information from experience section
 */
function parseExperienceSection(experienceText) {
  if (!experienceText) return [];
  
  const jobs = [];
  const lines = experienceText.split('\n').filter(l => l.trim());
  
  let currentJob = null;
  
  lines.forEach(line => {
    const trimmed = line.trim();
    
    // Detect job title line (usually has company name or dates)
    if (isJobTitleLine(trimmed)) {
      if (currentJob) {
        jobs.push(currentJob);
      }
      currentJob = {
        title: trimmed,
        bullets: []
      };
    } else if (currentJob && isBulletPoint(trimmed)) {
      currentJob.bullets.push(cleanBullet(trimmed));
    }
  });
  
  if (currentJob) {
    jobs.push(currentJob);
  }
  
  return jobs;
}

/**
 * Check if line is a job title/company line
 */
function isJobTitleLine(line) {
  // Contains dates (2020-2023, Jan 2020, etc.)
  if (/\d{4}/.test(line)) return true;
  
  // Contains common job title words
  const jobWords = ['engineer', 'developer', 'manager', 'analyst', 'designer', 'consultant', 'specialist', 'lead', 'senior', 'junior'];
  if (jobWords.some(word => line.toLowerCase().includes(word))) return true;
  
  // Has pipe separator (common in resume formatting)
  if (line.includes('|') || line.includes('–') || line.includes('—')) return true;
  
  return false;
}

/**
 * Check if line is a bullet point
 */
function isBulletPoint(line) {
  return /^[\s]*[•\-\*\+]/.test(line) || /^[\s]*\d+[\.\)]/.test(line);
}

/**
 * Clean bullet point text
 */
function cleanBullet(bullet) {
  return bullet.replace(/^[\s\•\-\*\+\d\.\)]+/, '').trim();
}

/**
 * Extract skills from skills section
 */
function parseSkillsSection(skillsText) {
  if (!skillsText) return [];
  
  const skills = new Set();
  
  // Split by common delimiters
  const parts = skillsText.split(/[,;|\n•\-\*]/);
  
  parts.forEach(part => {
    const trimmed = part.trim();
    if (trimmed && trimmed.length > 1 && trimmed.length < 50) {
      // Remove category labels (e.g., "Languages: ")
      const cleaned = trimmed.replace(/^[^:]+:\s*/, '');
      if (cleaned.length > 1) {
        skills.add(cleaned.toLowerCase());
      }
    }
  });
  
  return Array.from(skills);
}

/**
 * Check if resume has metrics/numbers in experience
 */
function hasQuantifiableMetrics(experienceText) {
  if (!experienceText) return false;
  
  // Look for numbers with context (percentages, dollar amounts, counts)
  const metricPatterns = [
    /\d+%/,  // Percentages
    /\$[\d,]+/,  // Dollar amounts
    /\d+[\+]?\s*(users?|customers?|clients?|projects?)/i,  // User counts
    /\d+x/,  // Multipliers
    /by\s+\d+/i,  // Improvements
    /\d+\s*(million|thousand|billion)/i  // Large numbers
  ];
  
  return metricPatterns.some(pattern => pattern.test(experienceText));
}

/**
 * Analyze section ordering (ATS systems prefer certain orders)
 */
function analyzeSectionOrder(sections) {
  const sectionNames = Object.keys(sections);
  const feedback = [];
  
  // Preferred order: Summary -> Experience -> Skills -> Education
  const skillsIndex = sectionNames.indexOf('skills');
  const experienceIndex = sectionNames.indexOf('experience');
  
  if (skillsIndex !== -1 && experienceIndex !== -1) {
    if (skillsIndex > experienceIndex + 1) {
      feedback.push({
        type: 'section_order',
        severity: 'medium',
        message: 'Consider moving Skills section closer to the top for better ATS visibility'
      });
    }
  }
  
  // Check if summary exists
  if (!sectionNames.includes('summary')) {
    feedback.push({
      type: 'missing_section',
      severity: 'low',
      message: 'Adding a professional summary can improve ATS matching'
    });
  }
  
  return feedback;
}

module.exports = {
  detectSections,
  detectSectionHeader,
  parseExperienceSection,
  parseSkillsSection,
  hasQuantifiableMetrics,
  analyzeSectionOrder
};
