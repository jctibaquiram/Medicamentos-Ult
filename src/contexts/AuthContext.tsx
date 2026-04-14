import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// 1. Definimos los roles permitidos
export type UserRole = 'admin' | 'empleado' | 'vendedor' | null;

interface AuthContextType {
  user: User | null;
  role: UserRole;
  roleLoading: boolean;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const ROLE_CACHE_PREFIX = 'medstock:role:';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [roleLoading, setRoleLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const roleRequestIdRef = useRef(0);

  const parseRole = (value: unknown): UserRole => {
    if (value === 'admin' || value === 'empleado' || value === 'vendedor') {
      return value;
    }

    return null;
  };

  const getRoleCacheKey = (authUser: User) => {
    const emailKey = authUser.email?.trim().toLowerCase();
    return `${ROLE_CACHE_PREFIX}${emailKey || authUser.id}`;
  };

  const getCachedRole = (authUser: User): UserRole => {
    try {
      const cachedValue = sessionStorage.getItem(getRoleCacheKey(authUser));
      return parseRole(cachedValue);
    } catch {
      return null;
    }
  };

  const setCachedRole = (authUser: User, resolvedRole: UserRole) => {
    if (!resolvedRole) {
      return;
    }

    try {
      sessionStorage.setItem(getRoleCacheKey(authUser), resolvedRole);
    } catch {
      // Ignore cache write failures.
    }
  };

  // Intenta obtener el rol desde profiles por email y, si falla, usa metadata del usuario.
  const fetchUserRole = async (authUser: User): Promise<UserRole> => {
    const metadataRole =
      parseRole(authUser.user_metadata?.role) || parseRole(authUser.app_metadata?.role);

    const userEmail = authUser.email?.trim().toLowerCase();

    if (!userEmail) {
      return metadataRole;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .ilike('email', userEmail)
        .maybeSingle();

      if (error) {
        console.warn('No se pudo consultar profiles. Usando metadata para rol.', error.message);
      } else {
        const dbRole = parseRole((data as any)?.role);
        if (dbRole) {
          return dbRole;
        }
      }

      const { data: byIdData, error: byIdError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authUser.id)
        .maybeSingle();

      if (byIdError) {
        console.warn('No se pudo consultar profiles por id. Usando metadata para rol.', byIdError.message);
        return metadataRole;
      }

      const byIdRole = parseRole((byIdData as any)?.role);
      return byIdRole || metadataRole;
    } catch (error) {
      console.error('Error fetching user role:', error);
      return metadataRole;
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let isActive = true;

    const getMetadataRole = (authUser: User): UserRole =>
      parseRole(authUser.user_metadata?.role) || parseRole(authUser.app_metadata?.role);

    const fetchUserRoleWithTimeout = async (authUser: User, timeoutMs = 2500): Promise<UserRole> => {
      const fallbackRole = getMetadataRole(authUser);

      const timeoutPromise = new Promise<UserRole>((resolve) => {
        setTimeout(() => resolve(fallbackRole), timeoutMs);
      });

      return Promise.race([fetchUserRole(authUser), timeoutPromise]);
    };

    const resolveUserRole = async (authUser: User) => {
      const requestId = ++roleRequestIdRef.current;
      const cachedRole = getCachedRole(authUser);

      if (cachedRole) {
        setRole(cachedRole);
        setRoleLoading(false);
      } else {
        setRoleLoading(true);
      }

      try {
        const userRole = await fetchUserRoleWithTimeout(authUser);

        if (!isActive || requestId !== roleRequestIdRef.current) {
          return;
        }

        setRole(userRole);
        setCachedRole(authUser, userRole);
      } catch (error) {
        if (!isActive || requestId !== roleRequestIdRef.current) {
          return;
        }

        console.error('Error resolving user role:', error);
        setRole(getMetadataRole(authUser));
      } finally {
        if (isActive && requestId === roleRequestIdRef.current) {
          setRoleLoading(false);
        }
      }
    };

    const syncSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!isActive) {
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          resolveUserRole(session.user);
        } else {
          roleRequestIdRef.current += 1;
          setRole(null);
          setRoleLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth session:', error);
        if (isActive) {
          roleRequestIdRef.current += 1;
          setSession(null);
          setUser(null);
          setRole(null);
          setRoleLoading(false);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    // 1. Check sesión inicial
    syncSession();

    // 2. Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        resolveUserRole(session.user);
      } else {
        roleRequestIdRef.current += 1;
        setRole(null);
        setRoleLoading(false);
      }
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    if (user) {
      try {
        sessionStorage.removeItem(getRoleCacheKey(user));
      } catch {
        // Ignore cache remove failures.
      }
    }

    roleRequestIdRef.current += 1;
    setRoleLoading(false);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, role, roleLoading, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};