import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Session type - matches Supabase auth session structure
type Session = {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at?: number;
  refresh_token: string;
  user: User;
} | null;

type UserRole = 'worker' | 'grower' | 'admin';

interface AuthContextType {
  user: User | null;
  session: Session;
  userRole: UserRole | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: { name?: string; phone?: string; role?: string }) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user role from database
  const fetchUserRole = async (userObj: User | null): Promise<UserRole | null> => {
    if (!isSupabaseConfigured || !userObj) {
      // If not configured, try to get from metadata
      const metadataRole = userObj?.user_metadata?.role;
      if (metadataRole && ['worker', 'grower', 'admin'].includes(metadataRole)) {
        return metadataRole as UserRole;
      }
      return null;
    }
    
    try {
      // First try to get from database
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userObj.id)
        .single();
      
      if (!error && data?.role) {
        return (data.role as UserRole);
      }
      
      // If not in database, try to get from user metadata as fallback
      const metadataRole = userObj.user_metadata?.role;
      if (metadataRole && ['worker', 'grower', 'admin'].includes(metadataRole)) {
        // If we have metadata but not in DB, try to create the record
        try {
          await supabase.from('users').insert({
            id: userObj.id,
            name: userObj.user_metadata?.name || userObj.email?.split('@')[0] || 'User',
            phone: userObj.user_metadata?.phone || 'N/A',
            role: metadataRole,
          });
        } catch (insertErr) {
          // Ignore insert errors - might already exist or other issue
          console.log('Could not sync user to database:', insertErr);
        }
        return metadataRole as UserRole;
      }
      
      return null;
    } catch (err) {
      console.error('Error fetching user role:', err);
      // Fallback to user metadata
      const metadataRole = userObj.user_metadata?.role;
      if (metadataRole && ['worker', 'grower', 'admin'].includes(metadataRole)) {
        return metadataRole as UserRole;
      }
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    // If Supabase is not configured, skip auth initialization
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Get initial session with timeout protection
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('Error getting session:', error);
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch user role if user exists (with timeout protection)
        if (session?.user) {
          try {
            const role = await Promise.race([
              fetchUserRole(session.user),
              new Promise<UserRole | null>((resolve) => 
                setTimeout(() => resolve(null), 5000) // 5 second timeout
              )
            ]);
            if (mounted) {
              setUserRole(role);
            }
          } catch (err) {
            console.error('Error fetching role:', err);
            // Fallback to metadata
            const metadataRole = session.user.user_metadata?.role;
            if (metadataRole && ['worker', 'grower', 'admin'].includes(metadataRole)) {
              if (mounted) {
                setUserRole(metadataRole as UserRole);
              }
            } else if (mounted) {
              setUserRole(null);
            }
          }
        } else {
          setUserRole(null);
        }
        
        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      // Fetch user role if user exists
      if (session?.user) {
        try {
          const role = await Promise.race([
            fetchUserRole(session.user),
            new Promise<UserRole | null>((resolve) => 
              setTimeout(() => resolve(null), 5000) // 5 second timeout
            )
          ]);
          if (mounted) {
            setUserRole(role);
          }
        } catch (err) {
          console.error('Error fetching role:', err);
          // Fallback to metadata
          const metadataRole = session.user.user_metadata?.role;
          if (metadataRole && ['worker', 'grower', 'admin'].includes(metadataRole)) {
            if (mounted) {
              setUserRole(metadataRole as UserRole);
            }
          } else if (mounted) {
            setUserRole(null);
          }
        }
      } else {
        if (mounted) {
          setUserRole(null);
        }
      }
      
      if (mounted) {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, metadata?: { name?: string; phone?: string; role?: string }) => {
    if (!isSupabaseConfigured) {
      return { error: { message: 'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.' } as AuthError };
    }

    try {
      const role = metadata?.role || 'worker';
      const name = metadata?.name || '';
      const phone = metadata?.phone || '';

      // Validate required fields
      if (!name) {
        return { error: { message: 'Name is required.' } as AuthError };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            phone,
            role,
          },
        },
      });

      if (error) {
        return { error };
      }

      // Create user record in the users table - this is required
      if (data.user) {
        try {
          const { error: insertError } = await supabase.from('users').insert({
            id: data.user.id,
            name: name,
            phone: phone || 'N/A', // Provide default if phone is empty
            role: role,
          });

          if (insertError) {
            console.error('Error creating user record:', insertError);
            // If user creation in auth succeeded but database insert failed,
            // we should still return success but log the error
            // The user can still log in, and we can try to fix the record later
          }
        } catch (err) {
          console.error('Error creating user record:', err);
          // Don't fail the signup if database insert fails
          // The user is still created in auth, just not in the users table
        }
      }

      return { error: null };
    } catch (err) {
      console.error('Signup error:', err);
      return { error: { message: 'An unexpected error occurred during sign up.' } as AuthError };
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: { message: 'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.' } as AuthError };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (err) {
      return { error: { message: 'An unexpected error occurred during sign in.' } as AuthError };
    }
  };

  const signOut = async () => {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const value = {
    user,
    session,
    userRole,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Return a safe default instead of throwing to prevent white screen
    console.error('useAuth must be used within an AuthProvider');
    return {
      user: null,
      session: null,
      userRole: null,
      loading: false,
      signUp: async () => ({ error: { message: 'Auth not initialized' } as AuthError }),
      signIn: async () => ({ error: { message: 'Auth not initialized' } as AuthError }),
      signOut: async () => {},
    };
  }
  return context;
}

