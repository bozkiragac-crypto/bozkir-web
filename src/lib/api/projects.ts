import type { Project } from '@/types/project';
import { apiGet, hasRemoteApi } from './client';

export async function getProjects(): Promise<Project[]> {
  if (!hasRemoteApi()) return [];
  try {
    return await apiGet<Project[]>('/projects', { revalidate: 300 });
  } catch {
    return [];
  }
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  if (!hasRemoteApi()) return null;
  try {
    return await apiGet<Project>(`/projects/${encodeURIComponent(slug)}`, { revalidate: 300 });
  } catch {
    return null;
  }
}
