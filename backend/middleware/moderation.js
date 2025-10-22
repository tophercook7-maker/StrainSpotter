import leoProfanity from 'leo-profanity';

// Initialize profanity dictionaries (English by default)
// You can add other languages or custom words as needed.
leoProfanity.loadDictionary();

export function checkAndCleanMessage(text) {
  const content = String(text || '');
  const isProfane = leoProfanity.check(content);
  const cleaned = isProfane ? leoProfanity.clean(content) : content;
  return { isProfane, cleaned };
}

export function rejectIfProfane(req, res, next) {
  const { content } = req.body || {};
  const { isProfane } = checkAndCleanMessage(content || '');
  if (isProfane) {
    return res.status(400).json({ error: 'Message contains prohibited language. Please revise and try again.' });
  }
  next();
}
