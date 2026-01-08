import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Upload, Play, Zap, TrendingUp, Target, Activity, Brain, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

const AIAnalysisPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [hasAnalysis, setHasAnalysis] = useState(true);

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

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">
            <span className="gradient-text">{t('ai.title')}</span>
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
          <div className="glass-card px-6 py-3 rounded-xl flex items-center gap-3">
            <Zap className="h-5 w-5 text-primary" />
            <span className="font-medium">{t('ai.credits')}:</span>
            <span className="text-2xl font-bold text-primary">{user?.credits || 0}</span>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="glass-card p-8 rounded-2xl h-full">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Video className="h-5 w-5 text-primary" />
                {t('ai.upload')}
              </h2>

              {isAnalyzing ? (
                <div className="text-center py-12">
                  <Brain className="h-16 w-16 text-primary mx-auto mb-4 animate-pulse" />
                  <h3 className="text-lg font-semibold mb-2">Analyzing Your Video...</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Our AI is processing your performance
                  </p>
                  <Progress value={analysisProgress} className="max-w-xs mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">{analysisProgress}%</p>
                </div>
              ) : (
                <div 
                  onClick={handleUpload}
                  className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Drop your video here</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    or click to browse files
                  </p>
                  <Button variant="hero">
                    <Play className="h-4 w-4" />
                    Select Video
                  </Button>
                  <p className="text-xs text-muted-foreground mt-4">
                    Supports MP4, MOV, AVI up to 500MB
                  </p>
                </div>
              )}

              {/* Recent Uploads */}
              <div className="mt-8">
                <h3 className="font-semibold mb-4">Recent Analyses</h3>
                <div className="space-y-3">
                  {['Cricket Batting Practice', 'Bowling Session', 'Fielding Drills'].map((video, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-secondary/50 rounded-lg">
                      <div className="w-16 h-12 bg-secondary rounded flex items-center justify-center">
                        <Play className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{video}</p>
                        <p className="text-xs text-muted-foreground">Analyzed 2 days ago</p>
                      </div>
                      <span className="text-lg font-bold text-primary">{78 + i * 3}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            {hasAnalysis ? (
              <div className="space-y-6">
                {/* Performance Score */}
                <div className="glass-card p-6 rounded-2xl">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    {t('ai.score')}
                  </h2>
                  <div className="flex items-center justify-center gap-8">
                    <div className="relative w-40 h-40">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="80"
                          cy="80"
                          r="70"
                          fill="none"
                          stroke="hsl(var(--secondary))"
                          strokeWidth="12"
                        />
                        <circle
                          cx="80"
                          cy="80"
                          r="70"
                          fill="none"
                          stroke="hsl(var(--primary))"
                          strokeWidth="12"
                          strokeDasharray={`${78 * 4.4} 440`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-4xl font-bold gradient-text">78</span>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-green-400 font-medium">+5 from last analysis</p>
                      <p className="text-sm text-muted-foreground mt-1">Keep up the great work!</p>
                    </div>
                  </div>
                </div>

                {/* Skills Radar Chart */}
                <div className="glass-card p-6 rounded-2xl">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Skill Breakdown
                  </h2>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="skill" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
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
                <div className="glass-card p-6 rounded-2xl">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Performance Trend
                  </h2>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData}>
                        <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
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

                {/* Insights */}
                <div className="glass-card p-6 rounded-2xl">
                  <h2 className="text-xl font-semibold mb-4">{t('ai.insights')}</h2>
                  <ul className="space-y-3">
                    {[
                      'Your batting stance shows excellent balance - maintain this form',
                      'Footwork can be improved by 15% with targeted drills',
                      'Shot timing is above average - focus on power generation',
                      'Consider working on playing spin bowling variations',
                    ].map((insight, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="glass-card p-12 rounded-2xl text-center h-full flex flex-col items-center justify-center">
                <Brain className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Analysis Yet</h3>
                <p className="text-muted-foreground">
                  Upload a performance video to get AI-powered insights
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AIAnalysisPage;
