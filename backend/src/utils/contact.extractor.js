// Contact Information Extraction Utilities

/**
 * Extract email addresses from text
 */
function extractEmails(text) {
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emails = text.match(emailPattern) || [];
  return [...new Set(emails)]; // Remove duplicates
}

/**
 * Extract phone numbers from text (various formats)
 */
function extractPhoneNumbers(text) {
  const phonePatterns = [
    // (123) 456-7890
    /\(\d{3}\)\s*\d{3}[-.\s]?\d{4}/g,
    // 123-456-7890
    /\d{3}[-.\s]\d{3}[-.\s]\d{4}/g,
    // +1 123 456 7890
    /\+\d{1,3}\s?\d{3}\s?\d{3}\s?\d{4}/g,
    // 1234567890
    /\b\d{10}\b/g,
    // +91 12345 67890 (India)
    /\+\d{2}\s?\d{5}\s?\d{5}/g
  ];
  
  const phones = [];
  phonePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      phones.push(...matches);
    }
  });
  
  return [...new Set(phones)]; // Remove duplicates
}

/**
 * Extract LinkedIn profile URL
 */
function extractLinkedInURL(text) {
  const linkedInPattern = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+\/?/gi;
  const matches = text.match(linkedInPattern);
  return matches ? matches[0] : null;
}

/**
 * Extract GitHub profile URL
 */
function extractGitHubURL(text) {
  const githubPattern = /(?:https?:\/\/)?(?:www\.)?github\.com\/[\w-]+\/?/gi;
  const matches = text.match(githubPattern);
  return matches ? matches[0] : null;
}

/**
 * Extract portfolio/website URL
 */
function extractWebsiteURL(text) {
  const websitePattern = /(?:https?:\/\/)?(?:www\.)?[\w-]+\.(?:com|net|org|io|dev|me|co)(?:\/[\w\-._~:/?#[\]@!$&'()*+,;=]*)?/gi;
  const matches = text.match(websitePattern) || [];
  
  // Filter out common platforms
  const filtered = matches.filter(url => {
    const lower = url.toLowerCase();
    return !lower.includes('linkedin.com') && 
           !lower.includes('github.com') &&
           !lower.includes('twitter.com') &&
           !lower.includes('facebook.com') &&
           !lower.includes('instagram.com');
  });
  
  return filtered.length > 0 ? filtered[0] : null;
}

/**
 * Extract location/address information
 */
function extractLocation(text) {
  // Common location patterns
  const patterns = [
    // City, State ZIP
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})\s*\d{5}/g,
    // City, State
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})\b/g,
    // City, Country
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g
  ];
  
  const locations = [];
  patterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      locations.push(...matches);
    }
  });
  
  return locations.length > 0 ? locations[0] : null;
}

/**
 * Extract all contact information
 */
function extractContactInfo(text) {
  return {
    emails: extractEmails(text),
    phones: extractPhoneNumbers(text),
    linkedin: extractLinkedInURL(text),
    github: extractGitHubURL(text),
    website: extractWebsiteURL(text),
    location: extractLocation(text)
  };
}

/**
 * Validate email format
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (basic)
 */
function validatePhoneNumber(phone) {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  // Check if it has 10-15 digits (covers most formats)
  return digits.length >= 10 && digits.length <= 15;
}

/**
 * Format phone number to standard format
 */
function formatPhoneNumber(phone) {
  const digits = phone.replace(/\D/g, '');
  
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (digits.length === 11 && digits[0] === '1') {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  
  return phone; // Return original if can't format
}

module.exports = {
  extractEmails,
  extractPhoneNumbers,
  extractLinkedInURL,
  extractGitHubURL,
  extractWebsiteURL,
  extractLocation,
  extractContactInfo,
  validateEmail,
  validatePhoneNumber,
  formatPhoneNumber
};
