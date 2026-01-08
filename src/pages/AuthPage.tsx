import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Mail, Lock, User, Trophy, Users, Calendar, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import AadhaarVerification from '@/components/AadhaarVerification';
import athleonLogo from '@/assets/athleon-logo.jpeg';

const roles: { value: UserRole; label: string; icon: React.ElementType; description: string }[] = [
  { value: 'athlete', label: 'Athlete', icon: Trophy, description: 'Track performance & connect with scouts' },
  { value: 'coach', label: 'Coach / Scout', icon: Users, description: 'Discover and analyze top talents' },
  { value: 'organizer', label: 'Event Organizer', icon: Calendar, description: 'Create and manage sports events' },
  { value: 'viewer', label: 'Viewer / Fan', icon: Ticket, description: 'Watch events & support athletes' },
];

const AuthPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, signup } = useAuth();
  const { toast } = useToast();

  const [isLogin, setIsLogin] = useState(searchParams.get('mode') !== 'signup');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'aadhaar'>('form');
  const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '', name: '', role: 'athlete' as UserRole });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleRoleSelect = (role: UserRole) => setFormData({ ...formData, role });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      setIsLoading(true);
      try {
        await login(formData.email, formData.password);
        toast({ title: 'Welcome back!', description: 'You have successfully logged in.' });
        navigate('/dashboard');
      } catch (error) {
        toast({ title: 'Error', description: 'Something went wrong. Please try again.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    } else {
      if (formData.password !== formData.confirmPassword) {
        toast({ title: 'Error', description: 'Passwords do not match.', variant: 'destructive' });
        return;
      }
      setStep('aadhaar');
    }
  };

  const handleAadhaarVerified = async () => {
    setIsLoading(true);
    try {
      await signup(formData.email, formData.password, formData.name, formData.role);
      toast({ title: 'Account created!', description: 'Welcome to Athleon Global.' });
      navigate('/dashboard');
    } catch (error) {
      toast({ title: 'Error', description: 'Something went wrong. Please try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-20 bg-white">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="w-full max-w-md mx-4">
        <div className="bg-white border border-[hsl(220,15%,90%)] shadow-lg p-8 rounded-2xl">
          <Link to="/" className="flex items-center justify-center gap-3 mb-8">
            <img src={athleonLogo} alt="Athleon" className="h-12 w-12 rounded-full" />
            <span className="font-display text-2xl font-bold text-[hsl(200,100%,50%)]">ATHLEON</span>
          </Link>

          {step === 'form' ? (
            <>
              <div className="flex bg-[hsl(220,15%,95%)] rounded-lg p-1 mb-8">
                <button onClick={() => setIsLogin(true)} className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${isLogin ? 'bg-[hsl(200,100%,50%)] text-white' : 'text-[hsl(220,10%,40%)]'}`}>{t('auth.login')}</button>
                <button onClick={() => setIsLogin(false)} className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${!isLogin ? 'bg-[hsl(200,100%,50%)] text-white' : 'text-[hsl(220,10%,40%)]'}`}>{t('auth.signup')}</button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[hsl(220,20%,10%)]">{t('auth.name')}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[hsl(220,10%,40%)]" />
                      <Input id="name" name="name" type="text" required value={formData.name} onChange={handleInputChange} className="pl-10 bg-[hsl(220,15%,98%)] border-[hsl(220,15%,90%)] text-[hsl(220,20%,10%)]" placeholder="Enter your full name" />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[hsl(220,20%,10%)]">{t('auth.email')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[hsl(220,10%,40%)]" />
                    <Input id="email" name="email" type="email" required value={formData.email} onChange={handleInputChange} className="pl-10 bg-[hsl(220,15%,98%)] border-[hsl(220,15%,90%)] text-[hsl(220,20%,10%)]" placeholder="Enter your email" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[hsl(220,20%,10%)]">{t('auth.password')}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[hsl(220,10%,40%)]" />
                    <Input id="password" name="password" type={showPassword ? 'text' : 'password'} required value={formData.password} onChange={handleInputChange} className="pl-10 pr-10 bg-[hsl(220,15%,98%)] border-[hsl(220,15%,90%)] text-[hsl(220,20%,10%)]" placeholder="Enter your password" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(220,10%,40%)] hover:text-[hsl(220,20%,10%)]">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
                  </div>
                </div>
                {!isLogin && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-[hsl(220,20%,10%)]">{t('auth.confirmPassword')}</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[hsl(220,10%,40%)]" />
                        <Input id="confirmPassword" name="confirmPassword" type="password" required value={formData.confirmPassword} onChange={handleInputChange} className="pl-10 bg-[hsl(220,15%,98%)] border-[hsl(220,15%,90%)] text-[hsl(220,20%,10%)]" placeholder="Confirm your password" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[hsl(220,20%,10%)]">{t('auth.selectRole')}</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {roles.map((role) => (
                          <button key={role.value} type="button" onClick={() => handleRoleSelect(role.value)} className={`p-3 rounded-xl text-left transition-all ${formData.role === role.value ? 'bg-[hsl(200,100%,50%)]/10 border-2 border-[hsl(200,100%,50%)]' : 'bg-[hsl(220,15%,98%)] border-2 border-transparent hover:border-[hsl(220,15%,85%)]'}`}>
                            <role.icon className={`h-5 w-5 mb-2 ${formData.role === role.value ? 'text-[hsl(200,100%,50%)]' : 'text-[hsl(220,10%,40%)]'}`} />
                            <p className="font-medium text-sm text-[hsl(220,20%,10%)]">{role.label}</p>
                            <p className="text-xs text-[hsl(220,10%,40%)] mt-1">{role.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading}>{isLoading ? 'Loading...' : isLogin ? t('auth.login') : 'Continue to Verification'}</Button>
              </form>
              <p className="text-center text-sm text-[hsl(220,10%,40%)] mt-6">{isLogin ? t('auth.dontHaveAccount') : t('auth.alreadyHaveAccount')}{' '}<button onClick={() => setIsLogin(!isLogin)} className="text-[hsl(200,100%,50%)] hover:underline font-medium">{isLogin ? t('auth.signup') : t('auth.login')}</button></p>
            </>
          ) : (
            <AadhaarVerification onVerified={handleAadhaarVerified} />
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
