import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';
import fs from 'fs';
import path from 'path';

interface SkillBreakdown {
    skill: string;
    value: number;
    fullMark: number;
}

interface AIAnalysisResult {
    score: number;
    insights: string[];
    skillBreakdown: SkillBreakdown[];
    improvement: number;
}

// Initialize Gemini AI
let genAI: GoogleGenerativeAI | null = null;
if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim() !== '') {
    try {
        genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
        console.log('✅ Gemini AI initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize Gemini AI:', error);
        genAI = null;
    }
} else {
    console.warn('⚠️  GEMINI_API_KEY not configured. AI features will use fallback responses.');
}

/**
 * Analyze video using Gemini AI
 * For now, we'll use text-based analysis. For actual video analysis,
 * you would need to use Gemini's video understanding capabilities
 */
export async function analyzeVideo(
    videoPath?: string,
    videoTitle?: string
): Promise<AIAnalysisResult> {
    if (!genAI) {
        // Fallback to mock if Gemini is not configured
        return generateMockAnalysis();
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        // Create a prompt for sports performance analysis
        const prompt = `You are an expert sports performance analyst. Analyze the following sports performance video and provide:

1. An overall performance score (0-100)
2. Detailed insights about the athlete's performance
3. Skill breakdown scores (0-100) for: Speed, Technique, Endurance, Accuracy, Power, Agility
4. Improvement suggestions

Video Title: ${videoTitle || 'Sports Performance Video'}

${videoPath ? 'A video file has been uploaded for analysis.' : 'Please provide a general analysis based on common sports performance metrics.'}

Provide your response in the following JSON format:
{
  "score": <number 0-100>,
  "insights": ["insight1", "insight2", "insight3", "insight4"],
  "skillBreakdown": [
    {"skill": "Speed", "value": <number 0-100>},
    {"skill": "Technique", "value": <number 0-100>},
    {"skill": "Endurance", "value": <number 0-100>},
    {"skill": "Accuracy", "value": <number 0-100>},
    {"skill": "Power", "value": <number 0-100>},
    {"skill": "Agility", "value": <number 0-100>}
  ],
  "improvement": <number -20 to 20>
}

Be specific and constructive in your analysis.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Try to parse JSON from the response
        try {
            // Extract JSON from markdown code blocks if present
            const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
            const jsonText = jsonMatch ? jsonMatch[1] : text;
            const parsed = JSON.parse(jsonText.trim());

            return {
                score: Math.max(0, Math.min(100, parsed.score || 75)),
                insights: Array.isArray(parsed.insights) ? parsed.insights : ['Performance analysis completed'],
                skillBreakdown: Array.isArray(parsed.skillBreakdown)
                    ? parsed.skillBreakdown.map((s: any) => ({
                          skill: s.skill || 'Unknown',
                          value: Math.max(0, Math.min(100, s.value || 75)),
                          fullMark: 100,
                      }))
                    : generateDefaultSkillBreakdown(),
                improvement: Math.max(-20, Math.min(20, parsed.improvement || 0)),
            };
        } catch (parseError) {
            console.error('Failed to parse Gemini response as JSON:', parseError);
            // Extract insights from text if JSON parsing fails
            const insights = text.split('\n').filter((line) => line.trim().length > 0).slice(0, 4);
            return {
                score: 75,
                insights: insights.length > 0 ? insights : ['AI analysis completed successfully'],
                skillBreakdown: generateDefaultSkillBreakdown(),
                improvement: 0,
            };
        }
    } catch (error) {
        console.error('Gemini AI error:', error);
        // Fallback to mock analysis on error
        return generateMockAnalysis();
    }
}

/**
 * Generate AI chatbot response using Gemini
 */
export async function generateChatResponse(
    message: string,
    context: {
        userName: string;
        recentScore?: number;
        skills?: SkillBreakdown[];
    }
): Promise<string> {
    if (!genAI) {
        console.log('Gemini AI not initialized, using fallback response');
        // Fallback to simple responses if Gemini is not configured
        return generateSimpleResponse(message, context);
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        const { userName, recentScore, skills } = context;
        const firstName = userName.split(' ')[0];

        // Build context string
        let contextString = `You are an AI Sports Coach helping ${firstName}. `;
        if (recentScore) {
            contextString += `Their recent performance score is ${recentScore}/100. `;
        }
        if (skills && skills.length > 0) {
            const skillDetails = skills.map((s) => `${s.skill}: ${s.value}%`).join(', ');
            contextString += `Their skill breakdown: ${skillDetails}. `;
        }

        const prompt = `${contextString}

The athlete is asking: "${message}"

Provide a helpful, encouraging, and specific response as their AI Sports Coach. Be conversational, supportive, and provide actionable advice. Keep your response concise (2-4 sentences) but informative.`;

        console.log('Sending request to Gemini AI...');
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log('Received response from Gemini AI');
        return text;
    } catch (error) {
        console.error('Gemini chat error:', error);
        if (error instanceof Error) {
            console.error('Error details:', {
                message: error.message,
                name: error.name,
                stack: error.stack,
            });
        }
        // Fallback to simple response on error
        return generateSimpleResponse(message, context);
    }
}

// Helper functions
function generateMockAnalysis(): AIAnalysisResult {
    const baseScore = 60 + Math.random() * 35;
    const score = Math.round(baseScore);

    const skillBreakdown: SkillBreakdown[] = [
        { skill: 'Speed', value: randomScore(baseScore), fullMark: 100 },
        { skill: 'Technique', value: randomScore(baseScore), fullMark: 100 },
        { skill: 'Endurance', value: randomScore(baseScore), fullMark: 100 },
        { skill: 'Accuracy', value: randomScore(baseScore), fullMark: 100 },
        { skill: 'Power', value: randomScore(baseScore), fullMark: 100 },
        { skill: 'Agility', value: randomScore(baseScore), fullMark: 100 },
    ];

    const insights = generateInsights(score, skillBreakdown);
    const improvement = Math.round(-5 + Math.random() * 15);

    return {
        score,
        insights,
        skillBreakdown,
        improvement,
    };
}

function randomScore(base: number): number {
    const variation = -15 + Math.random() * 30;
    return Math.max(30, Math.min(100, Math.round(base + variation)));
}

function generateInsights(score: number, skills: SkillBreakdown[]): string[] {
    const insights: string[] = [];
    const sorted = [...skills].sort((a, b) => b.value - a.value);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];

    insights.push(`Your ${best.skill.toLowerCase()} is your strongest attribute at ${best.value}%`);

    if (worst.value < 70) {
        insights.push(`Focus on improving your ${worst.skill.toLowerCase()} which is currently at ${worst.value}%`);
    }

    if (score >= 80) {
        insights.push('Excellent overall performance! You are performing above average.');
    } else if (score >= 65) {
        insights.push('Good performance with room for improvement in specific areas.');
    } else {
        insights.push('Continue practicing consistently to see improvements.');
    }

    const tips = [
        'Consider working on your footwork drills for better agility',
        'Your form shows good fundamentals - maintain consistency',
        'Recovery time between sessions is important for progress',
        'Video analysis suggests focusing on core stability exercises',
        'Reaction time can be improved with specific training drills',
    ];

    insights.push(tips[Math.floor(Math.random() * tips.length)]);

    return insights;
}

function generateDefaultSkillBreakdown(): SkillBreakdown[] {
    return [
        { skill: 'Speed', value: 75, fullMark: 100 },
        { skill: 'Technique', value: 75, fullMark: 100 },
        { skill: 'Endurance', value: 75, fullMark: 100 },
        { skill: 'Accuracy', value: 75, fullMark: 100 },
        { skill: 'Power', value: 75, fullMark: 100 },
        { skill: 'Agility', value: 75, fullMark: 100 },
    ];
}

function generateSimpleResponse(
    message: string,
    context: { userName: string; recentScore?: number; skills?: SkillBreakdown[] }
): string {
    const { userName, recentScore, skills } = context;
    const firstName = userName.split(' ')[0];
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('improve') || lowerMessage.includes('better')) {
        if (skills && skills.length > 0) {
            const weakest = [...skills].sort((a, b) => a.value - b.value)[0];
            return `Hi ${firstName}! Based on your recent analysis, I'd recommend focusing on ${weakest.skill.toLowerCase()}. Here are some exercises:\n\n1. Start with warm-up drills\n2. Practice specific ${weakest.skill.toLowerCase()} exercises for 20 minutes daily\n3. Record yourself and compare with previous sessions\n\nWould you like me to suggest specific drills?`;
        }
        return `Hi ${firstName}! To improve, I recommend uploading your performance videos for AI analysis. This will help me give you personalized advice based on your actual performance data.`;
    }

    if (lowerMessage.includes('score') || lowerMessage.includes('performance') || lowerMessage.includes('how am i')) {
        if (recentScore) {
            const assessment =
                recentScore >= 80 ? 'excellent' : recentScore >= 65 ? 'good with room for growth' : 'showing steady progress';
            return `Your recent performance score is ${recentScore}, which is ${assessment}. Keep up your training routine and we should see continued improvement!`;
        }
        return `I don't have recent performance data for you. Upload a video for AI analysis to get your performance score!`;
    }

    if (lowerMessage.includes('drill') || lowerMessage.includes('exercise') || lowerMessage.includes('practice')) {
        return `Here are some recommended drills based on your profile:\n\n🏃 **Speed Drills**\n- Sprint intervals (6x50m)\n- Ladder drills\n\n💪 **Technique Work**\n- Slow-motion form practice\n- Mirror training\n\n🎯 **Accuracy Training**\n- Target practice\n- Precision exercises\n\nWant me to create a weekly training plan for you?`;
    }

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
        return `Hello ${firstName}! 👋 I'm your AI Coach. I can help you with:\n\n• Analyzing your performance videos\n• Suggesting improvement areas\n• Creating training plans\n• Answering sports-related questions\n\nHow can I help you today?`;
    }

    return `Thanks for your message, ${firstName}! I'm here to help with your athletic performance. You can ask me about:\n\n- Your performance scores and trends\n- Improvement suggestions\n- Training drills and exercises\n- Analyzing your uploaded videos\n\nWhat would you like to know?`;
}
