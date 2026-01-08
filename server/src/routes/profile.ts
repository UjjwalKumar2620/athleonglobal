import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleGuard.js';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const updateProfileSchema = z.object({
    name: z.string().min(2).optional(),
    avatar: z.string().url().optional(),
    sports: z.array(z.string()).optional(),
    position: z.string().optional(),
    location: z.string().optional(),
    bio: z.string().optional(),
    experience: z.string().optional(),
    achievements: z.array(z.string()).optional(),
});

/**
 * GET /profile/me
 * Get current user's profile
 */
router.get('/me', authenticate, async (req: Request, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.id },
            include: {
                subscription: {
                    include: { plan: true },
                },
                aiCreditsWallet: true,
                athleteProfile: {
                    include: {
                        performanceData: {
                            orderBy: { recordedAt: 'desc' },
                            take: 10,
                        },
                    },
                },
            },
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatar: user.avatar,
            phone: user.phone,
            aadhaarVerified: user.aadhaarVerified,
            credits: user.aiCreditsWallet?.balance || 0,
            subscription: user.subscription?.plan?.slug || 'free',
            profile: user.athleteProfile
                ? {
                    sports: user.athleteProfile.sports,
                    position: user.athleteProfile.position,
                    location: user.athleteProfile.location,
                    bio: user.athleteProfile.bio,
                    experience: user.athleteProfile.experience,
                    achievements: user.athleteProfile.achievements,
                    certificates: user.athleteProfile.certificates,
                    videos: user.athleteProfile.videos,
                    rating: user.athleteProfile.rating,
                    followers: user.athleteProfile.followers,
                    following: user.athleteProfile.following,
                    performanceHistory: user.athleteProfile.performanceData,
                }
                : null,
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
});

/**
 * PUT /profile/update
 * Update current user's profile
 */
router.put('/update', authenticate, async (req: Request, res: Response) => {
    try {
        const data = updateProfileSchema.parse(req.body);

        // Update user name/avatar if provided
        if (data.name || data.avatar) {
            await prisma.user.update({
                where: { id: req.user!.id },
                data: {
                    name: data.name,
                    avatar: data.avatar,
                },
            });
        }

        // Update athlete profile if user is an athlete
        if (req.user!.role === 'athlete') {
            await prisma.athleteProfile.upsert({
                where: { userId: req.user!.id },
                update: {
                    sports: data.sports,
                    position: data.position,
                    location: data.location,
                    bio: data.bio,
                    experience: data.experience,
                    achievements: data.achievements,
                },
                create: {
                    userId: req.user!.id,
                    sports: data.sports || [],
                    position: data.position,
                    location: data.location,
                    bio: data.bio,
                    experience: data.experience,
                    achievements: data.achievements || [],
                    certificates: [],
                    videos: [],
                },
            });
        }

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

/**
 * GET /profile/athletes
 * List athletes (public, with filters)
 */
router.get('/athletes', async (req: Request, res: Response) => {
    try {
        const { sport, location, search, page = '1', limit = '20' } = req.query;

        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);

        const where: any = {};

        if (sport) {
            where.sports = { has: sport as string };
        }

        if (location) {
            where.location = { contains: location as string, mode: 'insensitive' };
        }

        if (search) {
            where.OR = [
                { user: { name: { contains: search as string, mode: 'insensitive' } } },
                { bio: { contains: search as string, mode: 'insensitive' } },
            ];
        }

        const athletes = await prisma.athleteProfile.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                    },
                },
            },
            skip: (pageNum - 1) * limitNum,
            take: limitNum,
            orderBy: { rating: 'desc' },
        });

        const total = await prisma.athleteProfile.count({ where });

        res.json({
            athletes: athletes.map((a) => ({
                id: a.user.id,
                name: a.user.name,
                avatar: a.user.avatar,
                sports: a.sports,
                position: a.position,
                location: a.location,
                bio: a.bio,
                experience: a.experience,
                rating: a.rating,
                achievements: a.achievements,
            })),
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    } catch (error) {
        console.error('List athletes error:', error);
        res.status(500).json({ error: 'Failed to list athletes' });
    }
});

/**
 * GET /profile/athletes/:id
 * Get athlete details (Coach/Scout can see full details)
 */
router.get('/athletes/:id', authenticate, requireRole('coach', 'organizer'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id, role: 'athlete' },
            include: {
                athleteProfile: {
                    include: {
                        performanceData: {
                            orderBy: { recordedAt: 'desc' },
                            take: 10,
                        },
                    },
                },
            },
        });

        if (!user || !user.athleteProfile) {
            res.status(404).json({ error: 'Athlete not found' });
            return;
        }

        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            avatar: user.avatar,
            profile: {
                sports: user.athleteProfile.sports,
                position: user.athleteProfile.position,
                location: user.athleteProfile.location,
                bio: user.athleteProfile.bio,
                experience: user.athleteProfile.experience,
                achievements: user.athleteProfile.achievements,
                certificates: user.athleteProfile.certificates,
                videos: user.athleteProfile.videos,
                rating: user.athleteProfile.rating,
                followers: user.athleteProfile.followers,
                performanceHistory: user.athleteProfile.performanceData,
            },
        });
    } catch (error) {
        console.error('Get athlete error:', error);
        res.status(500).json({ error: 'Failed to get athlete' });
    }
});

export default router;
