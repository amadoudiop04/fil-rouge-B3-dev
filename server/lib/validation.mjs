// Pure input validators shared by the auth routes (register, password reset).
// Kept side-effect-free so they can be unit-tested without a DB or HTTP layer.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (email) => EMAIL_RE.test(String(email ?? '').trim());

// Minimum policy: at least 6 characters. Returns { ok } or { ok:false, error }.
export const validatePassword = (password) => {
  const pw = String(password ?? '');
  if (pw.length < 6) {
    return { ok: false, error: 'Le mot de passe doit contenir au moins 6 caracteres' };
  }
  return { ok: true };
};
