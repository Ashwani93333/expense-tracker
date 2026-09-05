// ─── Password Policy (mirrors backend com.expensetracker.auth.PasswordPolicy) ─
// Requirements:
//  - at least 8 characters
//  - at least one uppercase letter (A-Z)
//  - at least one symbol (any non-alphanumeric character)
export const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;

export const PASSWORD_REQUIREMENTS = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter (A–Z)', test: (p) => /[A-Z]/.test(p) },
  { label: 'One symbol (!, @, #, $, …)', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export const isPasswordValid = (password) =>
  typeof password === 'string' && PASSWORD_PATTERN.test(password);

export const missingPasswordRequirements = (password) =>
  PASSWORD_REQUIREMENTS.filter((r) => !r.test(password || '')).map((r) => r.label);

export const PASSWORD_POLICY_HINT = 'Min 8 characters, one uppercase letter, one symbol';