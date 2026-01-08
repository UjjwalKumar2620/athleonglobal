import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'athlete' | 'coach' | 'organizer' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  sport?: string;
  location?: string;
  bio?: string;
  followers?: number;
  following?: number;
  credits?: number;
  subscription?: 'free' | 'athlete_pro' | 'organizer_pro' | 'coach_pro';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user data for demo
const mockUsers: Record<string, User & { password: string }> = {
  'demo@athleon.com': {
    id: '1',
    email: 'demo@athleon.com',
    password: 'demo123',
    name: 'Ujjwal Sharma',
    role: 'athlete',
    avatar: '/placeholder.svg',
    sport: 'Cricket',
    location: 'Delhi, India',
    bio: 'Passionate cricketer with 8+ years of experience. Captain of Delhi Premier League team.',
    followers: 2450,
    following: 180,
    credits: 50,
    subscription: 'athlete_pro',
  },
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored session
    const storedUser = localStorage.getItem('athleon_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));

    const mockUser = mockUsers[email];
    if (mockUser && mockUser.password === password) {
      const { password: _, ...userWithoutPassword } = mockUser;
      setUser(userWithoutPassword);
      localStorage.setItem('athleon_user', JSON.stringify(userWithoutPassword));
    } else {
      // For demo, create a new user on any login
      const newUser: User = {
        id: Date.now().toString(),
        email,
        name: email.split('@')[0],
        role: 'athlete',
        credits: 10,
        subscription: 'free',
        followers: 0,
        following: 0,
      };
      setUser(newUser);
      localStorage.setItem('athleon_user', JSON.stringify(newUser));
    }
    setIsLoading(false);
  };

  const signup = async (email: string, password: string, name: string, role: UserRole): Promise<void> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    const newUser: User = {
      id: Date.now().toString(),
      email,
      name,
      role,
      credits: 10,
      subscription: 'free',
      followers: 0,
      following: 0,
    };
    setUser(newUser);
    localStorage.setItem('athleon_user', JSON.stringify(newUser));
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('athleon_user');
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('athleon_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
