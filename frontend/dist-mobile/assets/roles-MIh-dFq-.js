var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
const ADMIN_EMAILS = [
  "topher.cook7@gmail.com",
  "andrewbeck209@gmail.com",
  "strainspotter25feedback@gmail.com"
];
function isAdminEmail(email) {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
__name(isAdminEmail, "isAdminEmail");
export {
  isAdminEmail as i
};
