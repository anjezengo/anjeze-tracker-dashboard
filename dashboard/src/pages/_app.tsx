import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import gsap from 'gsap';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Initialize GSAP defaults
  useEffect(() => {
    gsap.config({
      nullTargetWarn: false,
    });
  }, []);

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-effect border-b border-dark-600 sticky top-0 z-40"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <motion.h1
                whileHover={{ scale: 1.02 }}
                className="text-2xl font-bold text-accent-primary"
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
                    : 'text-accent-secondary hover:text-accent-primary'
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/submit"
                className={`text-sm font-medium transition-colors ${
                  router.pathname === '/submit'
                    ? 'text-highlight-blue'
                    : 'text-accent-secondary hover:text-accent-primary'
                }`}
              >
                Submit Data
              </Link>
            </nav>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Component {...pageProps} />
      </main>

      {/* Footer */}
      <footer className="border-t border-dark-600 mt-16">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-accent-tertiary">
            Anjeze Tracker Dashboard © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
