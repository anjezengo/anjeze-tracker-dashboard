import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated && router.pathname !== '/login') {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Show loading while checking authentication
  if (!isAuthenticated && router.pathname !== '/login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-dark-950">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-highlight-blue"></div>
          <p className="mt-4 text-gray-700 dark:text-accent-secondary">
            Loading...
          </p>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
