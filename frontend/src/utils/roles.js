const ADMIN_EMAILS = [
  'topher.cook7@gmail.com',
  'andrewbeck209@gmail.com',
  'strainspotter25feedback@gmail.com'
];

export function isAdminEmail(email) {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

export { ADMIN_EMAILS };

