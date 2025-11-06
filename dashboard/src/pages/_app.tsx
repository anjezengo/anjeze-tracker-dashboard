import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';

function AppContent({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, user, logout } = useAuth();

  // Public pages that don't require authentication
  const publicPages = ['/login'];
  const isPublicPage = publicPages.includes(router.pathname);

  // Initialize GSAP defaults
  useEffect(() => {
    gsap.config({
      nullTargetWarn: false,
    });
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-dark-950 transition-colors duration-300">
      {/* Header - Only show on authenticated pages */}
      {!isPublicPage && (
        <motion.header
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-effect border-b border-gray-200 dark:border-dark-600 sticky top-0 z-40"
        >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <motion.h1
                whileHover={{ scale: 1.02 }}
                className="text-2xl font-bold text-gray-900 dark:text-accent-primary"
              >
                Anjeze Tracker Dashboard
              </motion.h1>
            </Link>
            <nav className="flex items-center space-x-6">
              <Link
                href="/"
                className={`text-sm font-medium transition-colors ${
                  router.pathname === '/'
                    ? 'text-highlight-blue'
                    : 'text-gray-600 dark:text-accent-secondary hover:text-gray-900 dark:hover:text-accent-primary'
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/submit"
                className={`text-sm font-medium transition-colors ${
                  router.pathname === '/submit'
                    ? 'text-highlight-blue'
                    : 'text-gray-600 dark:text-accent-secondary hover:text-gray-900 dark:hover:text-accent-primary'
                }`}
              >
                Submit Data
              </Link>

              {/* User Info */}
              {isAuthenticated && user && (
                <span className="text-sm text-gray-700 dark:text-accent-secondary">
                  {user.name}
                </span>
              )}

              {/* Theme Toggle Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-200 dark:bg-dark-700 text-gray-800 dark:text-accent-primary hover:bg-gray-300 dark:hover:bg-dark-600 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </motion.button>

              {/* Logout Button */}
              {isAuthenticated && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={logout}
                  className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
                >
                  Logout
                </motion.button>
              )}
            </nav>
          </div>
        </div>
      </motion.header>
      )}

      {/* Main Content */}
      <main className={`${!isPublicPage ? 'container mx-auto px-4 py-8' : ''}`}>
        {isPublicPage ? (
          <Component {...pageProps} />
        ) : (
          <ProtectedRoute>
            <Component {...pageProps} />
          </ProtectedRoute>
        )}
      </main>

      {/* Footer - Only show on authenticated pages */}
      {!isPublicPage && (
        <footer className="border-t border-gray-200 dark:border-dark-600 mt-16">
          <div className="container mx-auto px-4 py-6">
            <p className="text-center text-sm text-gray-500 dark:text-accent-tertiary">
              Anjeze Tracker Dashboard © {new Date().getFullYear()}
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}

export default function App(props: AppProps) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent {...props} />
      </AuthProvider>
    </ThemeProvider>
  );
}
