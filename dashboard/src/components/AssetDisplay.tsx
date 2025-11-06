/**
 * Display asset (image + description) for selected sub-project
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFilters } from '@/lib/filters';
import { AssetRow } from '@/lib/supabase';

export function AssetDisplay() {
  const { filters } = useFilters();
  const [asset, setAsset] = useState<AssetRow | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Show asset when exactly one sub-project is selected
  const selectedSubProject = filters.subProjects.length === 1 ? filters.subProjects[0] : null;

  useEffect(() => {
    async function fetchAsset() {
      if (!selectedSubProject) {
        setAsset(null);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/assets?subProject=${encodeURIComponent(selectedSubProject)}`
        );
        const result = await response.json();

        if (result.success && result.data) {
          setAsset(result.data);
        } else {
          setAsset(null);
        }
      } catch (error) {
        console.error('Error fetching asset:', error);
        setAsset(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAsset();
  }, [selectedSubProject]);

  if (!selectedSubProject) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="glass-effect rounded-xl p-6"
        >
          <div className="shimmer h-8 w-48 rounded mb-4"></div>
          <div className="shimmer h-48 rounded mb-4"></div>
          <div className="shimmer h-20 rounded"></div>
        </motion.div>
      ) : asset ? (
        <motion.div
          key="asset"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="glass-effect rounded-xl p-6 overflow-hidden"
        >
          <h3 className="text-xl font-semibold text-accent-primary mb-4">
            {selectedSubProject}
          </h3>

          {asset.image_url && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative h-64 mb-4 rounded-lg overflow-hidden bg-dark-800"
            >
              <img
                src={asset.image_url}
                alt={asset.sub_project_canon}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </motion.div>
          )}

          {asset.description && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <p className="text-accent-secondary leading-relaxed">
                {asset.description}
              </p>
            </motion.div>
          )}

          {!asset.image_url && !asset.description && (
            <p className="text-accent-tertiary italic">
              No additional information available.
            </p>
          )}
        </motion.div>
      ) : (
        <motion.div
          key="no-asset"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="glass-effect rounded-xl p-6"
        >
          <h3 className="text-xl font-semibold text-accent-primary mb-4">
            {selectedSubProject}
          </h3>
          <p className="text-accent-secondary">
            No asset information found for this sub-project.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
