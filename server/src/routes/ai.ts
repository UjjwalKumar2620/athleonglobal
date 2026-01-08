import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { athleteOnly } from '../middleware/roleGuard.js';
import { analyzeVideo, generateChatResponse } from '../services/ai.js';

const router = Router();
const prisma = new PrismaClient();

// Constants
const FREE_MONTHLY_ANALYSES = 2;

/**
 * POST /ai/upload-video
 * Upload and analyze a video (Athletes only)
 */
router.post('/upload-video', authenticate, athleteOnly, async (req: Request, res: Response) => {
    try {
        const { videoUrl, videoTitle } = req.body;

        if (!videoUrl) {
            res.status(400).json({ error: 'Video URL is required' });
            return;
        }

        // Get user's subscription and credits
        const user = await prisma.user.findUnique({
            where: { id: req.user!.id },
            include: {
                subscription: { include: { plan: true } },
                aiCreditsWallet: true,
            },
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const isProPlan = user.subscription?.plan?.slug === 'athlete_pro';
        const credits = user.aiCreditsWallet?.balance || 0;

        // Check if user has credits (unless Pro plan with unlimited)
        if (!isProPlan) {
            // Count this month's analyses for free tier
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const monthlyAnalyses = await prisma.aIUsageLog.count({
                where: {
                    userId: user.id,
                    createdAt: { gte: startOfMonth },
                },
            });

            // Free plan check
            if (user.subscription?.plan?.slug === 'free' && monthlyAnalyses >= FREE_MONTHLY_ANALYSES) {
                if (credits < 1) {
                    res.status(403).json({
                        error: 'No AI credits remaining',
                        message: `You've used your ${FREE_MONTHLY_ANALYSES} free analyses this month. Purchase more credits or upgrade to Pro.`,
                    });
                    return;
                }

                // Deduct credit
                await prisma.aICreditsWallet.update({
                    where: { userId: user.id },
                    data: { balance: { decrement: 1 } },
                });
            }
        }

        // Run AI analysis (mock)
        const analysis = analyzeVideo(videoTitle);

        // Save analysis results
        const usageLog = await prisma.aIUsageLog.create({
            data: {
                userId: user.id,
                videoUrl,
                videoTitle: videoTitle || 'Untitled Video',
                score: analysis.score,
                insights: analysis.insights,
                skillBreakdown: analysis.skillBreakdown,
            },
        });

        // Also save to performance history
        await prisma.performanceData.create({
            data: {
                athleteProfileId: (await prisma.athleteProfile.findUnique({ where: { userId: user.id } }))?.id || '',
                overallScore: analysis.score,
                speedScore: analysis.skillBreakdown.find((s) => s.skill === 'Speed')?.value || 0,
                techniqueScore: analysis.skillBreakdown.find((s) => s.skill === 'Technique')?.value || 0,
                enduranceScore: analysis.skillBreakdown.find((s) => s.skill === 'Endurance')?.value || 0,
                accuracyScore: analysis.skillBreakdown.find((s) => s.skill === 'Accuracy')?.value || 0,
                powerScore: analysis.skillBreakdown.find((s) => s.skill === 'Power')?.value || 0,
                agilityScore: analysis.skillBreakdown.find((s) => s.skill === 'Agility')?.value || 0,
            },
        });

        res.json({
            message: 'Video analyzed successfully',
            analysis: {
                id: usageLog.id,
                score: analysis.score,
                improvement: analysis.improvement,
                insights: analysis.insights,
                skillBreakdown: analysis.skillBreakdown,
            },
        });
    } catch (error) {
        console.error('AI upload error:', error);
        res.status(500).json({ error: 'Failed to analyze video' });
    }
});

/**
 * GET /ai/results
 * Get analysis history (Athletes only)
 */
router.get('/results', authenticate, athleteOnly, async (req: Request, res: Response) => {
    try {
        const { page = '1', limit = '10' } = req.query;
        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);

        const results = await prisma.aIUsageLog.findMany({
            where: { userId: req.user!.id },
            orderBy: { createdAt: 'desc' },
            skip: (pageNum - 1) * limitNum,
            take: limitNum,
        });

        const total = await prisma.aIUsageLog.count({
            where: { userId: req.user!.id },
        });

        // Get performance trend data
        const performanceHistory = await prisma.aIUsageLog.findMany({
            where: { userId: req.user!.id },
            orderBy: { createdAt: 'asc' },
            take: 12,
            select: {
                score: true,
                createdAt: true,
            },
        });

        res.json({
            results: results.map((r) => ({
                id: r.id,
                videoTitle: r.videoTitle,
                score: r.score,
                insights: r.insights,
                skillBreakdown: r.skillBreakdown,
                analyzedAt: r.createdAt,
            })),
            performanceTrend: performanceHistory.map((p) => ({
                score: p.score,
                date: p.createdAt,
            })),
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    } catch (error) {
        console.error('Get AI results error:', error);
        res.status(500).json({ error: 'Failed to get results' });
    }
});

/**
 * POST /ai/chat
 * AI Coach chatbot (Athletes only)
 */
router.post('/chat', authenticate, athleteOnly, async (req: Request, res: Response) => {
    try {
        const { message } = req.body;

        if (!message || typeof message !== 'string') {
            res.status(400).json({ error: 'Message is required' });
            return;
        }

        // Get user's recent analysis for context
        const recentAnalysis = await prisma.aIUsageLog.findFirst({
            where: { userId: req.user!.id },
            orderBy: { createdAt: 'desc' },
        });

        const response = generateChatResponse(message, {
            userName: req.user!.name,
            recentScore: recentAnalysis?.score || undefined,
            skills: (recentAnalysis?.skillBreakdown as any[]) || undefined,
        });

        res.json({
            message: response,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('AI chat error:', error);
        res.status(500).json({ error: 'Failed to generate response' });
    }
});

/**
 * GET /ai/credits
 * Get current AI credit balance
 */
router.get('/credits', authenticate, async (req: Request, res: Response) => {
    try {
        const wallet = await prisma.aICreditsWallet.findUnique({
            where: { userId: req.user!.id },
        });

        const subscription = await prisma.subscription.findUnique({
            where: { userId: req.user!.id },
            include: { plan: true },
        });

        // Count this month's analyses
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const monthlyAnalyses = await prisma.aIUsageLog.count({
            where: {
                userId: req.user!.id,
                createdAt: { gte: startOfMonth },
            },
        });

        res.json({
            credits: wallet?.balance || 0,
            plan: subscription?.plan?.slug || 'free',
            isUnlimited: subscription?.plan?.slug === 'athlete_pro',
            monthlyUsed: monthlyAnalyses,
            monthlyLimit: subscription?.plan?.slug === 'free' ? FREE_MONTHLY_ANALYSES : null,
        });
    } catch (error) {
        console.error('Get credits error:', error);
        res.status(500).json({ error: 'Failed to get credits' });
    }
});

export default router;
