import { useRouter } from 'next/router';
import { useCallback, useMemo } from 'react';

export type FilterState = {
  years: number[];
  projects: string[];
  subProjects: string[];
  institutes: string[];
  types: string[];
  initiatives: string[];
};

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
    initiatives: parseArray(query.initiatives),
  };
}

export function filtersToQuery(filters: FilterState): Record<string, any> {
  const query: Record<string, any> = {};
  if (filters.years.length > 0) query.years = filters.years.map(String);
  if (filters.projects.length > 0) query.projects = filters.projects;
  if (filters.subProjects.length > 0) query.subProjects = filters.subProjects;
  if (filters.institutes.length > 0) query.institutes = filters.institutes;
  if (filters.types.length > 0) query.types = filters.types;
  if (filters.initiatives.length > 0) query.initiatives = filters.initiatives;
  return query;
}

export function useFilters() {
  const router = useRouter();

  const queryString = useMemo(
    () => JSON.stringify({
      years: router.query.years,
      projects: router.query.projects,
      subProjects: router.query.subProjects,
      institutes: router.query.institutes,
      types: router.query.types,
      initiatives: router.query.initiatives,
    }),
    [router.query.years, router.query.projects, router.query.subProjects,
      router.query.institutes, router.query.types, router.query.initiatives]
  );

  const filters = useMemo(() => parseFiltersFromQuery(router.query), [queryString]);

  const updateFilters = useCallback(
    (newFilters: Partial<FilterState>) => {
      const merged = { ...filters, ...newFilters };
      router.push({ pathname: router.pathname, query: filtersToQuery(merged) }, undefined, { shallow: true });
    },
    [router, filters]
  );

  const clearFilters = useCallback(() => {
    router.push({ pathname: router.pathname, query: {} }, undefined, { shallow: true });
  }, [router]);

  return { filters, updateFilters, clearFilters };
}

export function buildSqlFilters(filters: FilterState): { clause: string; params: any[] } {
  const conditions: string[] = [];
  const params: any[] = [];

  if (filters.years.length > 0) {
    params.push(filters.years);
    conditions.push(`year_start = ANY($${params.length}::int[])`);
  }
  if (filters.projects.length > 0) {
    params.push(filters.projects);
    conditions.push(`project = ANY($${params.length})`);
  }
  if (filters.subProjects.length > 0) {
    params.push(filters.subProjects);
    conditions.push(`sub_project = ANY($${params.length})`);
  }
  if (filters.institutes.length > 0) {
    params.push(filters.institutes);
    conditions.push(`institute = ANY($${params.length})`);
  }
  if (filters.types.length > 0) {
    params.push(filters.types);
    conditions.push(`type_of_institution = ANY($${params.length})`);
  }
  if (filters.initiatives.length > 0) {
    params.push(filters.initiatives);
    conditions.push(`initiatives = ANY($${params.length})`);
  }

  return {
    clause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
}
