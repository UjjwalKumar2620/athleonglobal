import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Upload, Play, Zap, TrendingUp, Target, Activity, Brain, Video, Send, Bot, User, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

const radarData = [
  { skill: 'Speed', value: 85, fullMark: 100 },
  { skill: 'Technique', value: 78, fullMark: 100 },
  { skill: 'Endurance', value: 72, fullMark: 100 },
  { skill: 'Accuracy', value: 88, fullMark: 100 },
  { skill: 'Power', value: 80, fullMark: 100 },
  { skill: 'Agility', value: 75, fullMark: 100 },
];

const barData = [
  { name: 'Jan', score: 65 },
  { name: 'Feb', score: 70 },
  { name: 'Mar', score: 72 },
  { name: 'Apr', score: 78 },
  { name: 'May', score: 82 },
  { name: 'Jun', score: 85 },
];

// Sample analyzed videos with insights
const analyzedVideos = [
  {
    id: 1,
    title: 'Cricket Batting Practice',
    date: '2 days ago',
    score: 78,
    insights: [
      'Your batting stance shows excellent balance and weight distribution',
      'Footwork can be improved by 15% - try wider stance drills',
      'Shot timing is above average at 85% accuracy',
      'Consider working on playing against spin bowling variations',
    ],
    improvements: '+5 from last session',
  },
  {
    id: 2,
    title: 'Bowling Session',
    date: '3 days ago',
    score: 81,
    insights: [
      'Bowling action is smooth with good follow-through',
      'Speed consistency improved by 12% since last analysis',
      'Line and length accuracy at 82% - focus on yorkers',
      'Arm rotation shows potential for more pace generation',
    ],
    improvements: '+8 from last session',
  },
  {
    id: 3,
    title: 'Fielding Drills',
    date: '5 days ago',
    score: 84,
    insights: [
      'Reaction time is excellent at 0.3 seconds average',
      'Ground fielding technique is professional level',
      'Throwing accuracy at 90% - maintain this form',
      'Diving catches need more practice for consistency',
    ],
    improvements: '+3 from last session',
  },
];

// Sample AI responses for the chatbot
const sampleResponses: Record<string, string> = {
  'default': "I'm your AI Sports Coach! I can help you analyze your performance videos, suggest improvements, and answer questions about your training. What would you like to know?",
  'batting': "Based on your recent batting analysis, I recommend focusing on:\n\n1. **Stance Adjustment**: Widen your base by 2 inches for better balance\n2. **Backlift**: Keep your bat closer to your body during the backlift\n3. **Follow-through**: Extend your arms fully after contact\n\nWould you like specific drills for any of these areas?",
  'bowling': "Your bowling technique shows great promise! Here are my recommendations:\n\n1. **Run-up**: Maintain consistent speed in your approach\n2. **Release Point**: Your release is slightly early - try releasing at 11 o'clock position\n3. **Follow-through**: Great job maintaining balance!\n\nShall I suggest some training exercises?",
  'improve': "To improve your overall performance, I suggest:\n\n1. **Daily Drills**: 30 minutes of focused practice\n2. **Video Analysis**: Record yourself weekly for comparison\n3. **Strength Training**: Focus on core and leg strength\n4. **Mental Practice**: Visualization exercises before matches\n\nWhich area would you like to focus on first?",
  'speed': "To increase your speed and agility:\n\n1. **Sprint Intervals**: 8x50m sprints with 30s rest\n2. **Ladder Drills**: Improve footwork coordination\n3. **Plyometrics**: Box jumps and burpees\n4. **Resistance Training**: Band work for explosive power\n\nWant me to create a weekly training schedule?",
  'technique': "Great question about technique! Based on your videos:\n\n1. Your form is 85% optimal - very good!\n2. Focus areas: hip rotation and shoulder alignment\n3. Recommended: Slow-motion practice sessions\n\nI can break down any specific movement you'd like to improve.",
};

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
}

const AIAnalysisPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [hasAnalysis, setHasAnalysis] = useState(true);
  const [expandedVideo, setExpandedVideo] = useState<number | null>(1);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 1, role: 'assistant', content: sampleResponses['default'] }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleUpload = () => {
    if ((user?.credits || 0) < 1) {
      toast({
        title: 'Insufficient Credits',
        description: 'You need at least 1 AI credit to analyze a video.',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);

    const interval = setInterval(() => {
      setAnalysisProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsAnalyzing(false);
          setHasAnalysis(true);
          updateUser({ credits: (user?.credits || 0) - 1 });
          toast({
            title: 'Analysis Complete!',
            description: 'Your performance video has been analyzed.',
          });
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: chatMessages.length + 1,
      role: 'user',
      content: chatInput,
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsTyping(true);

    // Simulate AI response based on keywords
    setTimeout(() => {
      let response = sampleResponses['default'];
      const lowerInput = chatInput.toLowerCase();

      if (lowerInput.includes('bat') || lowerInput.includes('batting')) {
        response = sampleResponses['batting'];
      } else if (lowerInput.includes('bowl') || lowerInput.includes('bowling')) {
        response = sampleResponses['bowling'];
      } else if (lowerInput.includes('improve') || lowerInput.includes('better')) {
        response = sampleResponses['improve'];
      } else if (lowerInput.includes('speed') || lowerInput.includes('fast') || lowerInput.includes('agility')) {
        response = sampleResponses['speed'];
      } else if (lowerInput.includes('technique') || lowerInput.includes('form')) {
        response = sampleResponses['technique'];
      }

      const assistantMessage: ChatMessage = {
        id: chatMessages.length + 2,
        role: 'assistant',
        content: response,
      };

      setChatMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">
            <span className="text-primary">{t('ai.title')}</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t('ai.subtitle')}
          </p>
        </motion.div>

        {/* Credits Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center mb-8"
        >
          <div className="bg-card border border-border px-6 py-3 rounded-xl flex items-center gap-3">
            <Zap className="h-5 w-5 text-primary" />
            <span className="font-medium text-foreground">{t('ai.credits')}:</span>
            <span className="text-2xl font-bold text-primary">{user?.credits || 0}</span>
          </div>
        </motion.div>

        {/* Main Content - 3 Column Layout */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Left Column - Upload & Video Insights */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1 space-y-6"
          >
            {/* Upload Section */}
            <div className="bg-card border border-border p-6 rounded-2xl">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-foreground">
                <Video className="h-5 w-5 text-primary" />
                {t('ai.upload')}
              </h2>

              {isAnalyzing ? (
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 text-primary mx-auto mb-3 animate-pulse" />
                  <h3 className="text-sm font-semibold mb-2 text-foreground">Analyzing...</h3>
                  <Progress value={analysisProgress} className="max-w-xs mx-auto" />
                  <p className="text-xs text-muted-foreground mt-2">{analysisProgress}%</p>
                </div>
              ) : (
                <div
                  onClick={handleUpload}
                  className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <h3 className="font-medium text-sm mb-1 text-foreground">Drop video here</h3>
                  <p className="text-xs text-muted-foreground mb-3">or click to browse</p>
                  <Button variant="hero" size="sm">
                    <Play className="h-3 w-3 mr-1" />
                    Select Video
                  </Button>
                </div>
              )}
            </div>

            {/* Analyzed Videos with Insights */}
            <div className="bg-card border border-border p-6 rounded-2xl">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-foreground">
                <Lightbulb className="h-5 w-5 text-primary" />
                Video Insights
              </h2>
              <div className="space-y-3">
                {analyzedVideos.map((video) => (
                  <div key={video.id} className="bg-secondary/50 rounded-xl overflow-hidden">
                    {/* Video Header - Clickable */}
                    <div
                      onClick={() => setExpandedVideo(expandedVideo === video.id ? null : video.id)}
                      className="flex items-center gap-3 p-3 cursor-pointer hover:bg-secondary/80 transition-colors"
                    >
                      <div className="w-12 h-10 bg-secondary rounded flex items-center justify-center flex-shrink-0">
                        <Play className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">{video.title}</p>
                        <p className="text-xs text-muted-foreground">{video.date}</p>
                      </div>
                      <span className="text-lg font-bold text-primary">{video.score}</span>
                      {expandedVideo === video.id ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>

                    {/* Expanded Insights */}
                    {expandedVideo === video.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-3 pb-3 border-t border-border/50"
                      >
                        <p className="text-xs text-green-500 font-medium mt-2 mb-2">{video.improvements}</p>
                        <ul className="space-y-2">
                          {video.insights.map((insight, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                              <span className="text-xs text-muted-foreground leading-relaxed">{insight}</span>
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Middle Column - Charts & Analytics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-1 space-y-6"
          >
            {hasAnalysis ? (
              <>
                {/* Performance Score */}
                <div className="bg-card border border-border p-6 rounded-2xl">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-foreground">
                    <Target className="h-5 w-5 text-primary" />
                    {t('ai.score')}
                  </h2>
                  <div className="flex items-center justify-center gap-4">
                    <div className="relative w-28 h-28">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="56"
                          cy="56"
                          r="48"
                          fill="none"
                          stroke="hsl(var(--secondary))"
                          strokeWidth="10"
                        />
                        <circle
                          cx="56"
                          cy="56"
                          r="48"
                          fill="none"
                          stroke="hsl(var(--primary))"
                          strokeWidth="10"
                          strokeDasharray={`${78 * 3.02} 302`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl font-bold text-primary">78</span>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-green-500 font-medium text-sm">+5 from last</p>
                      <p className="text-xs text-muted-foreground mt-1">Keep it up!</p>
                    </div>
                  </div>
                </div>

                {/* Skills Radar Chart */}
                <div className="bg-card border border-border p-6 rounded-2xl">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-foreground">
                    <Activity className="h-5 w-5 text-primary" />
                    Skill Breakdown
                  </h2>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="skill" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                        <Radar
                          name="Skills"
                          dataKey="value"
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.3}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Progress Bar Chart */}
                <div className="bg-card border border-border p-6 rounded-2xl">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-foreground">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Performance Trend
                  </h2>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData}>
                        <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                        <YAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-card border border-border p-12 rounded-2xl text-center h-full flex flex-col items-center justify-center">
                <Brain className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-foreground">No Analysis Yet</h3>
                <p className="text-muted-foreground">
                  Upload a performance video to get AI-powered insights
                </p>
              </div>
            )}
          </motion.div>

          {/* Right Column - AI Chatbot */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-1"
          >
            <div className="bg-card border border-border rounded-2xl h-[calc(100vh-220px)] min-h-[500px] flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-border flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">AI Sports Coach</h2>
                  <p className="text-xs text-green-500">● Online</p>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-primary/20 text-primary'
                      }`}>
                      {message.role === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-foreground'
                      }`}>
                      <p className="text-sm whitespace-pre-line">{message.content}</p>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-secondary rounded-2xl px-4 py-3">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about your technique..."
                    className="flex-1 bg-secondary border-border text-foreground"
                  />
                  <Button onClick={handleSendMessage} variant="hero" size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Try: "How can I improve my batting?" or "Tips for speed"
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AIAnalysisPage;
