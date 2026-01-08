import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Menu, X, Globe, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import athleonLogo from '@/assets/athleon-logo.jpeg';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const languages = [
  { code: 'en', name: 'English' }, { code: 'hi', name: 'हिंदी' }, { code: 'ta', name: 'தமிழ்' },
  { code: 'te', name: 'తెలుగు' }, { code: 'mr', name: 'मराठी' }, { code: 'kn', name: 'ಕನ್ನಡ' },
];

const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      const heroHeight = window.innerHeight;
      setIsScrolled(window.scrollY > heroHeight - 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isHomePage = location.pathname === '/';
  const showWhiteNav = isAuthenticated || (isHomePage && isScrolled) || (!isHomePage && !isAuthenticated);

  // Role-specific navigation
  const getNavLinks = () => {
    if (!isAuthenticated) return [{ path: '/', label: t('nav.home') }];
    
    const baseLinks = [{ path: '/dashboard', label: t('nav.home') }];
    
    if (user?.role === 'organizer') {
      return [...baseLinks, { path: '/events', label: t('nav.events') }, { path: '/profile', label: t('nav.profile') }];
    }
    if (user?.role === 'coach') {
      return [...baseLinks, { path: '/athletes', label: 'Athletes' }, { path: '/profile', label: t('nav.profile') }];
    }
    return [...baseLinks, { path: '/ai-analysis', label: t('nav.aiAnalysis') }, { path: '/events', label: t('nav.events') }, { path: '/pricing', label: t('nav.pricing') }, { path: '/profile', label: t('nav.profile') }];
  };

  const navLinks = getNavLinks();
  const changeLanguage = (code: string) => i18n.changeLanguage(code);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        showWhiteNav 
          ? 'bg-white/95 backdrop-blur-xl border-b border-[hsl(220,15%,90%)] shadow-sm' 
          : 'bg-[hsla(220,18%,8%,0.85)] backdrop-blur-xl border-b border-[hsla(220,15%,25%,0.5)]'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-3">
            <img src={athleonLogo} alt="Athleon Global" className="h-10 w-10 rounded-full object-cover" />
            <span className="font-helvetica text-xl font-bold text-[hsl(200,100%,50%)]">ATHLEON GLOBAL</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path} className={`text-sm font-medium transition-colors ${location.pathname === link.path ? 'text-[hsl(200,100%,50%)]' : showWhiteNav ? 'text-[hsl(220,10%,40%)] hover:text-[hsl(220,20%,10%)]' : 'text-[hsl(220,10%,55%)] hover:text-white'}`}>{link.label}</Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className={showWhiteNav ? 'text-[hsl(220,20%,10%)]' : 'text-white'}><Globe className="h-5 w-5" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white border-[hsl(220,15%,90%)]">
                {languages.map((lang) => (<DropdownMenuItem key={lang.code} onClick={() => changeLanguage(lang.code)} className={i18n.language === lang.code ? 'bg-[hsl(200,100%,50%)]/10' : ''}>{lang.name}</DropdownMenuItem>))}
              </DropdownMenuContent>
            </DropdownMenu>

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className={`flex items-center gap-2 ${showWhiteNav ? 'text-[hsl(220,20%,10%)]' : 'text-white'}`}><User className="h-5 w-5" /><span className="text-sm">{user?.name?.split(' ')[0]}</span></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white border-[hsl(220,15%,90%)]">
                  <DropdownMenuItem asChild><Link to="/profile" className="flex items-center gap-2"><User className="h-4 w-4" />{t('nav.profile')}</Link></DropdownMenuItem>
                  <DropdownMenuItem onClick={logout} className="flex items-center gap-2 text-destructive"><LogOut className="h-4 w-4" />{t('nav.logout')}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/auth"><Button variant="ghost" className={showWhiteNav ? 'text-[hsl(220,20%,10%)]' : 'text-white'}>{t('nav.login')}</Button></Link>
                <Link to="/auth?mode=signup"><Button variant="hero">{t('nav.signup')}</Button></Link>
              </div>
            )}
          </div>

          <Button variant="ghost" size="icon" className={`md:hidden ${showWhiteNav ? 'text-[hsl(220,20%,10%)]' : 'text-white'}`} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {isMobileMenuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className={`md:hidden py-4 border-t ${showWhiteNav ? 'border-[hsl(220,15%,90%)]' : 'border-[hsl(220,15%,18%)]'}`}>
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (<Link key={link.path} to={link.path} onClick={() => setIsMobileMenuOpen(false)} className={`text-sm font-medium py-2 ${location.pathname === link.path ? 'text-[hsl(200,100%,50%)]' : showWhiteNav ? 'text-[hsl(220,10%,40%)]' : 'text-[hsl(220,10%,55%)]'}`}>{link.label}</Link>))}
              {!isAuthenticated && (
                <div className="flex flex-col gap-2 pt-4 border-t border-[hsl(220,15%,90%)]">
                  <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}><Button variant="outline" className="w-full">{t('nav.login')}</Button></Link>
                  <Link to="/auth?mode=signup" onClick={() => setIsMobileMenuOpen(false)}><Button variant="hero" className="w-full">{t('nav.signup')}</Button></Link>
                </div>
              )}
              {isAuthenticated && (<Button variant="ghost" onClick={logout} className="justify-start text-destructive"><LogOut className="h-4 w-4 mr-2" />{t('nav.logout')}</Button>)}
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
};

export default Navbar;
