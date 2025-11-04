/**
 * URL filter management utilities
 */

import { useRouter } from 'next/router';
import { useCallback } from 'react';

export type FilterState = {
  years: number[];
  project: string | null;
  subProject: string | null;
  institute: string | null;
  type: string | null;
};

/**
 * Parse filter state from URL query params
 */
export function parseFiltersFromQuery(query: Record<string, any>): FilterState {
  const years = query.years
    ? Array.isArray(query.years)
      ? query.years.map(Number).filter(Boolean)
      : [Number(query.years)].filter(Boolean)
    : [];

  return {
    years,
    project: query.project || null,
    subProject: query.subProject || null,
    institute: query.institute || null,
    type: query.type || null,
  };
}

/**
 * Convert filter state to URL query params
 */
export function filtersToQuery(filters: FilterState): Record<string, any> {
  const query: Record<string, any> = {};

  if (filters.years.length > 0) {
    query.years = filters.years.map(String);
  }
  if (filters.project) {
    query.project = filters.project;
  }
  if (filters.subProject) {
    query.subProject = filters.subProject;
  }
  if (filters.institute) {
    query.institute = filters.institute;
  }
  if (filters.type) {
    query.type = filters.type;
  }

  return query;
}

/**
 * Hook for managing URL-persisted filters
 */
export function useFilters() {
  const router = useRouter();
  const filters = parseFiltersFromQuery(router.query);

  const updateFilters = useCallback(
    (newFilters: Partial<FilterState>) => {
      const merged = { ...filters, ...newFilters };
      const query = filtersToQuery(merged);

      router.push(
        {
          pathname: router.pathname,
          query,
        },
        undefined,
        { shallow: true }
      );
    },
    [router, filters]
  );

  const clearFilters = useCallback(() => {
    router.push(
      {
        pathname: router.pathname,
        query: {},
      },
      undefined,
      { shallow: true }
    );
  }, [router]);

  return {
    filters,
    updateFilters,
    clearFilters,
  };
}

/**
 * Build Supabase query with filters
 */
export function applyFiltersToQuery(
  query: any,
  filters: FilterState
): any {
  let filtered = query;

  if (filters.years.length > 0) {
    filtered = filtered.in('year_start', filters.years);
  }
  if (filters.project) {
    filtered = filtered.eq('project', filters.project);
  }
  if (filters.subProject) {
    filtered = filtered.eq('sub_project', filters.subProject);
  }
  if (filters.institute) {
    filtered = filtered.eq('institute', filters.institute);
  }
  if (filters.type) {
    filtered = filtered.eq('type_of_institution', filters.type);
  }

  return filtered;
}
