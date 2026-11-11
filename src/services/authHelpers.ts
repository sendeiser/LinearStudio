export const slugify = (text: string): string => {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove invalid chars
    .replace(/[\s_-]+/g, '-') // Swap spaces/underscores with hyphen
    .replace(/^-+|-+$/g, ''); // Trim hyphens
};

export const isValidRepoName = (repo: string): boolean => {
  // Checks format: owner/repo (alphanumeric, dots, dashes, underscores, no spaces, exactly one slash)
  const regex = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/;
  return regex.test(repo.trim());
};

export const friendlyAuthError = (message: string): string => {
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials')) {
    return 'Email o contraseña incorrectos. Por favor verifica tus credenciales.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Tu email aún no ha sido confirmado. Revisa tu bandeja de entrada o confirma el usuario.';
  }
  if (lower.includes('user already registered') || lower.includes('already registered')) {
    return 'El usuario ya existe con este correo electrónico.';
  }
  if (lower.includes('password should be at least 6 characters')) {
    return 'La contraseña debe tener al menos 6 caracteres.';
  }
  if (lower.includes('new password should be different')) {
    return 'La nueva contraseña debe ser diferente a la anterior.';
  }
  if (lower.includes('reauthentication') || lower.includes('requires recent login')) {
    return 'Por seguridad, debes haber iniciado sesión recientemente para actualizar tu contraseña.';
  }
  return message;
};

