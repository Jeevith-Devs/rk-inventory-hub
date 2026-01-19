import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'admin' | 'staff';

// Mock user object for local authentication
interface MockUser extends Omit<User, 'id'> {
  id: string;
  email: string;
  user_metadata: {
    username: string;
  };
}

interface AuthContextType {
  user: (User | MockUser) | null;
  session: Session | null;
  userRole: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<(User | MockUser) | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }

      return data?.role as UserRole | null;
    } catch (err) {
      console.error('Error fetching user role:', err);
      return null;
    }
  };

  useEffect(() => {
    // Check for local authentication first
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    const username = localStorage.getItem('username');
    const userEmail = localStorage.getItem('userEmail');

    if (isAuthenticated === 'true' && username && userEmail) {
      // Create a mock user object
      const mockUser: MockUser = {
        id: 'local-user-' + Date.now(),
        email: userEmail,
        user_metadata: {
          username: username,
        },
      } as any;

      setUser(mockUser);
      setUserRole('admin'); // Local user is always admin
      setLoading(false);
      return;
    }

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Fetch role with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id).then(role => {
              setUserRole(role);
              setLoading(false);
            });
          }, 0);
        } else {
          setUserRole(null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserRole(session.user.id).then(role => {
          setUserRole(role);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    // Clear local authentication
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('username');
    localStorage.removeItem('userEmail');
    setUser(null);
    setUserRole(null);
    
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    userRole,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin: userRole === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
