import leoProfanity from 'leo-profanity';
import fs from 'fs';
import path from 'path';

// Initialize profanity dictionaries (English by default)
leoProfanity.loadDictionary();

// Load moderation config
let moderationConfig = {};
try {
  const configPath = path.join(new URL('../config/moderation.json', import.meta.url).pathname);
  moderationConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (e) {
  console.warn('[moderation] Could not load config:', e.message);
}

export function checkAndCleanMessage(text) {
  const content = String(text || '');
  const isProfane = leoProfanity.check(content);
  
  // Check custom blocked words
  const blockedWords = moderationConfig.blockedWords || [];
  const hasBlockedWord = blockedWords.some(word => 
    content.toLowerCase().includes(word.toLowerCase())
  );
  
  // Check custom blocked patterns
  const blockedPatterns = moderationConfig.blockedPatterns || [];
  const hasBlockedPattern = blockedPatterns.some(pattern => {
    try {
      return new RegExp(pattern, 'i').test(content);
    } catch {
      return false;
    }
  });
  
  const isBlocked = isProfane || hasBlockedWord || hasBlockedPattern;
  const cleaned = isProfane ? leoProfanity.clean(content) : content;
  
  return { 
    isProfane, 
    hasBlockedWord, 
    hasBlockedPattern, 
    isBlocked, 
    cleaned,
    reason: isProfane ? 'profanity' : hasBlockedWord ? 'blocked_word' : hasBlockedPattern ? 'blocked_pattern' : null
  };
}

export function rejectIfProfane(req, res, next) {
  const { content } = req.body || {};
  const check = checkAndCleanMessage(content || '');
  
  if (check.isBlocked && moderationConfig.settings?.autoRejectProfanity !== false) {
    return res.status(400).json({ 
      error: 'Message contains prohibited language. Please revise and try again.',
      reason: check.reason
    });
  }
  
  // Attach check results to request for logging/auditing
  req.moderationCheck = check;
  next();
}
