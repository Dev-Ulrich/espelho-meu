export type AccessMode = 'login' | 'cadastro' | 'recuperar';
export interface AccessFields { name: string; email: string; phone: string; password: string; confirmation: string }
export type AccessErrors = Partial<Record<keyof AccessFields, string>>;

export function validateAccess(mode: AccessMode, fields: AccessFields): AccessErrors {
  const errors: AccessErrors = {};
  if (mode === 'cadastro' && fields.name.trim().length < 2) errors.name = 'Informe seu nome completo.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) errors.email = 'Informe um e-mail válido.';
  if (mode === 'cadastro' && fields.phone.trim()) {
    const digits = fields.phone.replace(/\D/g, '');
    if (!/^[\d\s()+-]+$/.test(fields.phone) || digits.length < 10 || digits.length > 13) errors.phone = 'Informe o telefone com DDD, ou deixe o campo vazio.';
  }
  if (mode !== 'recuperar' && !fields.password) errors.password = 'Informe sua senha.';
  if (mode === 'cadastro') {
    if (fields.password.length < 8) errors.password = 'Use pelo menos 8 caracteres.';
    if (!fields.confirmation || fields.password !== fields.confirmation) errors.confirmation = 'As senhas precisam ser iguais.';
  }
  return errors;
}
