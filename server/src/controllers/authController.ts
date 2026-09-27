import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';
import { JWT_SECRET } from '../config/env';

const toPublicUser = (user: {
    id: number;
    email: string;
    displayName: string | null;
    valName: string | null;
    valTag: string | null;
    dotaId: string | null;
    faceitNickname: string | null;
}) => ({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    valName: user.valName,
    valTag: user.valTag,
    dotaId: user.dotaId,
    faceitNickname: user.faceitNickname,
});

const createToken = (userId: number) => jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d', algorithm: 'HS256' });

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72; // bcrypt ігнорує все після 72 байт

// '' або null — відв'язати акаунт; рядок — прив'язати; інше — невалідне значення
const normalizeOptionalString = (value: unknown, maxLength: number): string | null | undefined => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    if (typeof value !== 'string') throw new Error('invalid');

    const trimmed = value.trim();
    if (trimmed.length > maxLength) throw new Error('invalid');
    return trimmed || null;
};

export const register = async (req: Request, res: Response): Promise<any> => {
    try {
        const email = String(req.body.email || '').trim().toLowerCase();
        const password = String(req.body.password || '');

        if (!EMAIL_REGEX.test(email) || email.length > MAX_EMAIL_LENGTH) return res.status(400).json({ message: 'Invalid email format' });
        if (password.length < MIN_PASSWORD_LENGTH) return res.status(400).json({ message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
        if (Buffer.byteLength(password) > MAX_PASSWORD_LENGTH) return res.status(400).json({ message: 'Password is too long' });

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { email, password: hashedPassword }
        });

        const token = createToken(user.id);
        
        res.status(201).json({
            token,
            user: toPublicUser(user)
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const login = async (req: Request, res: Response): Promise<any> => {
    try {
        const email = String(req.body.email || '').trim().toLowerCase();
        const password = String(req.body.password || '');
        if (!email || !password || email.length > MAX_EMAIL_LENGTH) return res.status(400).json({ message: 'Invalid credentials' });

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = createToken(user.id);
        
        res.json({
            token,
            user: toPublicUser(user)
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const getMe = async (req: any, res: Response): Promise<any> => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({
            user: toPublicUser(user)
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const linkAccounts = async (req: any, res: Response): Promise<any> => {
    try {
        const userId = req.user.userId;

        const { valName, valTag, dotaId, faceitNickname } = req.body || {};

        let dataToUpdate: Record<string, string | null | undefined>;
        try {
            dataToUpdate = {
                valName: normalizeOptionalString(valName, 32),
                valTag: normalizeOptionalString(valTag, 10),
                dotaId: normalizeOptionalString(dotaId, 128),
                faceitNickname: normalizeOptionalString(faceitNickname, 128),
            };
        } catch {
            return res.status(400).json({ message: 'Invalid account data' });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: dataToUpdate
        });

        res.json({
            user: toPublicUser(updatedUser)
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to link accounts' });
    }
};

export const updateProfile = async (req: any, res: Response): Promise<any> => {
    try {
        const userId = req.user.userId;
        let displayName: string | null | undefined;
        try {
            displayName = normalizeOptionalString(req.body?.displayName, 32); // Тільки ім'я
        } catch {
            return res.status(400).json({ message: 'Display name must be a string up to 32 characters' });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { displayName }
        });

        res.json({
            user: toPublicUser(updatedUser)
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update profile' });
    }
};
