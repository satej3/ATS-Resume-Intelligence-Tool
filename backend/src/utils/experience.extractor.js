// Experience and Years Calculation Utilities
const nlp = require('compromise');
// Note: compromise-dates is optional - if installed, extend nlp
try {
  const compromiseDates = require('compromise-dates');
  nlp.extend(compromiseDates);
} catch (e) {
  // compromise-dates not installed, continue without it
  console.log('compromise-dates not found, using basic date extraction');
}

/**
 * Extract years of experience from job descriptions or resumes
 */
function extractYearsOfExperience(text) {
  const patterns = [
    // "5+ years of experience"
    /(\d+)\+?\s*years?\s*(of\s*)?(experience|exp)/gi,
    // "3-5 years experience"
    /(\d+)\s*-\s*(\d+)\s*years?\s*(of\s*)?(experience|exp)/gi,
    // "minimum 5 years"
    /minimum\s*(\d+)\s*years?/gi,
    // "at least 3 years"
    /at\s+least\s+(\d+)\s*years?/gi
  ];
  
  let years = [];
  
  patterns.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[2]) {
        // Range: take the maximum
        years.push(parseInt(match[2]));
      } else if (match[1]) {
        years.push(parseInt(match[1]));
      }
    }
  });
  
  return years.length > 0 ? Math.max(...years) : 0;
}

/**
 * Extract employment dates and calculate total years of experience
 */
function calculateTotalExperience(text) {
  const dateRanges = extractDateRanges(text);
  
  if (dateRanges.length === 0) return 0;
  
  let totalMonths = 0;
  
  dateRanges.forEach(range => {
    if (range.start && range.end) {
      const months = calculateMonthsBetween(range.start, range.end);
      totalMonths += months;
    }
  });
  
  return Math.round(totalMonths / 12 * 10) / 10; // Round to 1 decimal
}

/**
 * Extract date ranges from text (e.g., "Jan 2020 - Dec 2023")
 */
function extractDateRanges(text) {
  const ranges = [];
  const lines = text.split('\n');
  
  // Patterns for date ranges
  const patterns = [
    // "Jan 2020 - Dec 2023" or "January 2020 - December 2023"
    /(\w+\.?\s+\d{4})\s*[-–—]\s*(\w+\.?\s+\d{4})/g,
    // "01/2020 - 12/2023" or "2020 - 2023"
    /(\d{1,2}\/\d{4})\s*[-–—]\s*(\d{1,2}\/\d{4})/g,
    // "2020 - 2023"
    /(\d{4})\s*[-–—]\s*(\d{4})/g,
    // "Jan 2020 - Present"
    /(\w+\.?\s+\d{4})\s*[-–—]\s*(present|current|now)/gi,
    // "2020 - Present"
    /(\d{4})\s*[-–—]\s*(present|current|now)/gi
  ];
  
  lines.forEach(line => {
    patterns.forEach(pattern => {
      const matches = line.matchAll(pattern);
      for (const match of matches) {
        const startDate = parseDate(match[1]);
        const endDate = match[2].match(/present|current|now/i) 
          ? new Date() 
          : parseDate(match[2]);
        
        if (startDate && endDate) {
          ranges.push({ start: startDate, end: endDate });
        }
      }
    });
  });
  
  return ranges;
}

/**
 * Parse various date formats
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  
  // Try standard Date parsing first
  let date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date;
  }
  
  // Try MM/YYYY format
  const mmYyyy = dateStr.match(/(\d{1,2})\/(\d{4})/);
  if (mmYyyy) {
    return new Date(mmYyyy[2], mmYyyy[1] - 1, 1);
  }
  
  // Try just YYYY
  const yyyy = dateStr.match(/^\d{4}$/);
  if (yyyy) {
    return new Date(dateStr, 0, 1);
  }
  
  // Try Month YYYY
  const monthYear = dateStr.match(/(\w+\.?)\s+(\d{4})/);
  if (monthYear) {
    const monthMap = {
      'jan': 0, 'january': 0,
      'feb': 1, 'february': 1,
      'mar': 2, 'march': 2,
      'apr': 3, 'april': 3,
      'may': 4,
      'jun': 5, 'june': 5,
      'jul': 6, 'july': 6,
      'aug': 7, 'august': 7,
      'sep': 8, 'sept': 8, 'september': 8,
      'oct': 9, 'october': 9,
      'nov': 10, 'november': 10,
      'dec': 11, 'december': 11
    };
    
    const monthStr = monthYear[1].toLowerCase().replace('.', '');
    const month = monthMap[monthStr];
    
    if (month !== undefined) {
      return new Date(monthYear[2], month, 1);
    }
  }
  
  return null;
}

/**
 * Calculate months between two dates
 */
function calculateMonthsBetween(start, end) {
  const yearDiff = end.getFullYear() - start.getFullYear();
  const monthDiff = end.getMonth() - start.getMonth();
  return yearDiff * 12 + monthDiff;
}

/**
 * Detect employment gaps in resume
 */
function detectEmploymentGaps(text) {
  const dateRanges = extractDateRanges(text);
  
  if (dateRanges.length < 2) return [];
  
  // Sort by start date
  dateRanges.sort((a, b) => a.start - b.start);
  
  const gaps = [];
  
  for (let i = 0; i < dateRanges.length - 1; i++) {
    const currentEnd = dateRanges[i].end;
    const nextStart = dateRanges[i + 1].start;
    
    const gapMonths = calculateMonthsBetween(currentEnd, nextStart);
    
    // Consider gaps > 3 months significant
    if (gapMonths > 3) {
      gaps.push({
        start: currentEnd,
        end: nextStart,
        months: gapMonths,
        years: Math.round(gapMonths / 12 * 10) / 10
      });
    }
  }
  
  return gaps;
}

/**
 * Extract experience level keywords
 */
function extractExperienceLevel(text) {
  const levels = {
    'entry': /entry[\s-]level|junior|graduate|intern|fresher|0-2\s*years/gi,
    'mid': /mid[\s-]level|intermediate|3-5\s*years|4-6\s*years/gi,
    'senior': /senior|lead|principal|expert|5\+\s*years|6\+\s*years|7\+\s*years/gi,
    'executive': /director|vp|vice\s+president|c-level|chief|head\s+of/gi
  };
  
  for (const [level, pattern] of Object.entries(levels)) {
    if (pattern.test(text)) {
      return level;
    }
  }
  
  // Fallback to calculated experience
  const years = calculateTotalExperience(text);
  if (years === 0) return 'entry';
  if (years < 3) return 'entry';
  if (years < 6) return 'mid';
  if (years < 10) return 'senior';
  return 'executive';
}

module.exports = {
  extractYearsOfExperience,
  calculateTotalExperience,
  extractDateRanges,
  detectEmploymentGaps,
  extractExperienceLevel,
  parseDate,
  calculateMonthsBetween
};
