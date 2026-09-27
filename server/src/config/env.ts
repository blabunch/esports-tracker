const INSECURE_JWT_SECRETS = new Set([
    'my_super_secret_gamehub_key_2026',
    'change-me',
    'secret',
]);

export const getRequiredEnv = (name: string): string => {
    const value = process.env[name]?.trim();

    if (!value) {
        throw new Error(`${name} environment variable is required`);
    }

    return value;
};

export const JWT_SECRET = (() => {
    const secret = getRequiredEnv('JWT_SECRET');

    if (secret.length < 32 || INSECURE_JWT_SECRETS.has(secret)) {
        throw new Error('JWT_SECRET must be at least 32 characters and must not use a default value');
    }

    return secret;
})();
