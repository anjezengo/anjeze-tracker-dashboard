/**
 * URL filter management utilities
 */

import { useRouter } from 'next/router';
import { useCallback, useMemo } from 'react';

export type FilterState = {
  years: number[];
  projects: string[];
  subProjects: string[];
  institutes: string[];
  types: string[];
  causes: string[];
};

/**
 * Parse filter state from URL query params
 */
export function parseFiltersFromQuery(query: Record<string, any>): FilterState {
  const parseArray = (value: any): string[] => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  };

  const years = query.years
    ? Array.isArray(query.years)
      ? query.years.map(Number).filter(Boolean)
      : [Number(query.years)].filter(Boolean)
    : [];

  return {
    years,
    projects: parseArray(query.projects),
    subProjects: parseArray(query.subProjects),
    institutes: parseArray(query.institutes),
    types: parseArray(query.types),
    causes: parseArray(query.causes),
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
  if (filters.projects.length > 0) {
    query.projects = filters.projects;
  }
  if (filters.subProjects.length > 0) {
    query.subProjects = filters.subProjects;
  }
  if (filters.institutes.length > 0) {
    query.institutes = filters.institutes;
  }
  if (filters.types.length > 0) {
    query.types = filters.types;
  }
  if (filters.causes.length > 0) {
    query.causes = filters.causes;
  }

  return query;
}

/**
 * Hook for managing URL-persisted filters
 */
export function useFilters() {
  const router = useRouter();

  // Memoize filters to prevent infinite loops - use JSON.stringify for stable comparison
  const queryString = useMemo(
    () => JSON.stringify({
      years: router.query.years,
      projects: router.query.projects,
      subProjects: router.query.subProjects,
      institutes: router.query.institutes,
      types: router.query.types,
      causes: router.query.causes,
    }),
    [router.query.years, router.query.projects, router.query.subProjects, router.query.institutes, router.query.types, router.query.causes]
  );

  const filters = useMemo(
    () => parseFiltersFromQuery(router.query),
    [queryString]
  );

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
  if (filters.projects.length > 0) {
    filtered = filtered.in('project', filters.projects);
  }
  if (filters.subProjects.length > 0) {
    filtered = filtered.in('sub_project', filters.subProjects);
  }
  if (filters.institutes.length > 0) {
    filtered = filtered.in('institute', filters.institutes);
  }
  if (filters.types.length > 0) {
    filtered = filtered.in('type_of_institution', filters.types);
  }
  if (filters.causes.length > 0) {
    filtered = filtered.in('cause', filters.causes);
  }

  return filtered;
}
