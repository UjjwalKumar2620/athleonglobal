/**
 * Mock AI Analysis Service
 * In production, this would integrate with an actual AI service
 */

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

/**
 * Generate mock AI analysis for a video
 * Returns randomized but realistic-looking performance data
 */
export function analyzeVideo(videoTitle?: string): AIAnalysisResult {
    // Generate base score between 60-95
    const baseScore = 60 + Math.random() * 35;
    const score = Math.round(baseScore);

    // Generate skill breakdown
    const skillBreakdown: SkillBreakdown[] = [
        { skill: 'Speed', value: randomScore(baseScore), fullMark: 100 },
        { skill: 'Technique', value: randomScore(baseScore), fullMark: 100 },
        { skill: 'Endurance', value: randomScore(baseScore), fullMark: 100 },
        { skill: 'Accuracy', value: randomScore(baseScore), fullMark: 100 },
        { skill: 'Power', value: randomScore(baseScore), fullMark: 100 },
        { skill: 'Agility', value: randomScore(baseScore), fullMark: 100 },
    ];

    // Generate insights based on score
    const insights = generateInsights(score, skillBreakdown);

    // Random improvement from last analysis
    const improvement = Math.round(-5 + Math.random() * 15);

    return {
        score,
        insights,
        skillBreakdown,
        improvement,
    };
}

function randomScore(base: number): number {
    // Generate score within ±15 of base, clamped to 30-100
    const variation = -15 + Math.random() * 30;
    return Math.max(30, Math.min(100, Math.round(base + variation)));
}

function generateInsights(score: number, skills: SkillBreakdown[]): string[] {
    const insights: string[] = [];

    // Find best and worst skills
    const sorted = [...skills].sort((a, b) => b.value - a.value);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];

    // Add insights based on performance
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

    // Add sport-specific tips
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

/**
 * Generate AI chatbot response based on context
 */
export function generateChatResponse(
    message: string,
    context: {
        userName: string;
        recentScore?: number;
        skills?: SkillBreakdown[];
    }
): string {
    const { userName, recentScore, skills } = context;
    const firstName = userName.split(' ')[0];

    // Simple keyword-based responses
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

    // Default response
    return `Thanks for your message, ${firstName}! I'm here to help with your athletic performance. You can ask me about:\n\n- Your performance scores and trends\n- Improvement suggestions\n- Training drills and exercises\n- Analyzing your uploaded videos\n\nWhat would you like to know?`;
}
