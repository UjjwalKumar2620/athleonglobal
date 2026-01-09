import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Upload, Play, Zap, TrendingUp, Target, Activity, Brain, Video, Send, Bot, User, Lightbulb, ChevronDown, ChevronUp, X } from 'lucide-react';
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

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
}

interface AnalysisResult {
  id: string;
  videoTitle: string;
  videoUrl?: string;
  score: number;
  insights: string[];
  skillBreakdown: Array<{ skill: string; value: number; fullMark: number }>;
  analyzedAt: string;
}

interface CreditsInfo {
  credits: number;
  plan: string;
  isUnlimited: boolean;
  monthlyUsed: number;
  monthlyLimit: number | null;
}

const AIAnalysisPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [analyzedVideos, setAnalyzedVideos] = useState<AnalysisResult[]>([]);
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null);
  const [creditsInfo, setCreditsInfo] = useState<CreditsInfo | null>(null);
  const [performanceTrend, setPerformanceTrend] = useState<Array<{ score: number; date: string }>>([]);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 1, role: 'assistant', content: "I'm your AI Sports Coach! I can help you analyze your performance videos, suggest improvements, and answer questions about your training. What would you like to know?" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('athleon_token') || '';
  };

  // Fetch credits info
  const fetchCredits = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch('/api/ai/credits', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setCreditsInfo(data);
      }
    } catch (error) {
      console.error('Failed to fetch credits:', error);
    }
  };

  // Fetch analysis results
  const fetchResults = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch('/api/ai/results', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          setAnalyzedVideos(data.results);
          setHasAnalysis(true);
          setCurrentAnalysis(data.results[0]);
          setPerformanceTrend(data.performanceTrend || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch results:', error);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchCredits();
    fetchResults();
  }, []);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/mkv', 'video/webm'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Invalid File Type',
          description: 'Please select a video file (mp4, mov, avi, mkv, webm)',
          variant: 'destructive',
        });
        return;
      }
      // Validate file size (100MB)
      if (file.size > 100 * 1024 * 1024) {
        toast({
          title: 'File Too Large',
          description: 'Please select a video file smaller than 100MB',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
      if (!videoTitle) {
        setVideoTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: 'No File Selected',
        description: 'Please select a video file to upload',
        variant: 'destructive',
      });
      return;
    }

    if (!creditsInfo) {
      await fetchCredits();
    }

    if (!creditsInfo?.isUnlimited && (creditsInfo?.credits || 0) < 1) {
      if (creditsInfo?.monthlyLimit && creditsInfo.monthlyUsed < creditsInfo.monthlyLimit) {
        // Still have free analyses
      } else {
        toast({
          title: 'Insufficient Credits',
          description: 'You need at least 1 AI credit to analyze a video.',
          variant: 'destructive',
        });
        return;
      }
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      const formData = new FormData();
      formData.append('video', selectedFile);
      if (videoTitle) {
        formData.append('videoTitle', videoTitle);
      }

      const token = getAuthToken();
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setAnalysisProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 5;
        });
      }, 500);

      const response = await fetch('/api/ai/upload-video', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setAnalysisProgress(100);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze video');
      }

      const data = await response.json();
      
      // Create analysis result object
      const newAnalysis: AnalysisResult = {
        id: data.analysis.id,
        videoTitle: videoTitle || selectedFile.name,
        score: data.analysis.score,
        insights: data.analysis.insights,
        skillBreakdown: data.analysis.skillBreakdown,
        analyzedAt: new Date().toISOString(),
      };

      setCurrentAnalysis(newAnalysis);
      setHasAnalysis(true);
      setAnalyzedVideos(prev => [newAnalysis, ...prev]);
      setSelectedFile(null);
      setVideoTitle('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Refresh credits
      await fetchCredits();
      await fetchResults();

      toast({
        title: 'Analysis Complete!',
        description: `Your performance score is ${data.analysis.score}/100`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Failed to analyze video',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: chatMessages.length + 1,
      role: 'user',
      content: chatInput,
    };

    setChatMessages(prev => [...prev, userMessage]);
    const messageToSend = chatInput;
    setChatInput('');
    setIsTyping(true);

    try {
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('Please log in to use the AI Coach');
      }

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message: messageToSend }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.message) {
        throw new Error('Invalid response from server');
      }
      
      const assistantMessage: ChatMessage = {
        id: chatMessages.length + 2,
        role: 'assistant',
        content: data.message,
      };

      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: chatMessages.length + 2,
        role: 'assistant',
        content: error instanceof Error 
          ? `Sorry, I encountered an error: ${error.message}. Please make sure you're logged in and try again.`
          : 'Sorry, I encountered an error. Please try again.',
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const radarData = currentAnalysis?.skillBreakdown || [];
  const barData = performanceTrend.map((p, i) => ({
    name: new Date(p.date).toLocaleDateString('en-US', { month: 'short' }),
    score: p.score,
  }));

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
            <span className="text-2xl font-bold text-primary">
              {creditsInfo?.isUnlimited ? '∞' : (creditsInfo?.credits || 0)}
            </span>
            {creditsInfo?.monthlyLimit && (
              <span className="text-sm text-muted-foreground">
                ({creditsInfo.monthlyUsed}/{creditsInfo.monthlyLimit} free this month)
              </span>
            )}
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
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  {selectedFile ? (
                    <div className="space-y-4">
                      <div className="border border-border rounded-xl p-4 bg-secondary/50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Video className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium text-foreground truncate flex-1">
                              {selectedFile.name}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => {
                              setSelectedFile(null);
                              if (fileInputRef.current) {
                                fileInputRef.current.value = '';
                              }
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                      
                      <Input
                        placeholder="Video title (optional)"
                        value={videoTitle}
                        onChange={(e) => setVideoTitle(e.target.value)}
                        className="bg-secondary"
                      />
                      
                      <Button
                        onClick={handleUpload}
                        variant="hero"
                        className="w-full"
                        disabled={!selectedFile}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Analyze Video
                      </Button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
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
                </>
              )}
            </div>

            {/* Analyzed Videos with Insights */}
            {analyzedVideos.length > 0 && (
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
                          <p className="font-medium text-sm text-foreground truncate">{video.videoTitle}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(video.analyzedAt)}</p>
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
                          <ul className="space-y-2 mt-2">
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
            )}
          </motion.div>

          {/* Middle Column - Charts & Analytics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-1 space-y-6"
          >
            {hasAnalysis && currentAnalysis ? (
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
                          strokeDasharray={`${(currentAnalysis.score / 100) * 302} 302`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl font-bold text-primary">{currentAnalysis.score}</span>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-green-500 font-medium text-sm">Latest Analysis</p>
                      <p className="text-xs text-muted-foreground mt-1">{currentAnalysis.videoTitle}</p>
                    </div>
                  </div>
                </div>

                {/* Skills Radar Chart */}
                {radarData.length > 0 && (
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
                )}

                {/* Progress Bar Chart */}
                {barData.length > 0 && (
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
                )}
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
                  <Button onClick={handleSendMessage} variant="hero" size="icon" disabled={isTyping}>
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
