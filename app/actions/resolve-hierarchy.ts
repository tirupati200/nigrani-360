'use server';

import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { DEMO_WELFARE_CENTERS, DEMO_GOV_PROJECTS, DEMO_NGOS } from '@/lib/demo-data';

export interface ResolvedCenter {
  id: string;
  code: string;
  name: string;
  district: string;
  state: string;
  address: string;
  latitude: number;
  longitude: number;
  geofence_radius_meters: number;
  beneficiary_capacity?: number;
  cctv_camera_count?: number;
  cctv_stream_status?: string;
  status?: string;
  project_id: string;
  ngo_id: string;
}

export interface ResolvedProject {
  id: string;
  project_code: string;
  scheme_name: string;
  service_type: string;
  financial_year: string;
  ngo_id: string;
}

export interface ResolvedNGO {
  id: string;
  name: string;
  darpan_reg_no: string;
}

export interface HierarchyResolutionResult {
  source: 'supabase' | 'demo_fallback';
  centers: Record<string, ResolvedCenter>;
  projects: Record<string, ResolvedProject>;
  ngos: Record<string, ResolvedNGO>;
}

export async function resolveInspectionHierarchyAction(
  centerIds: string[],
  projectIds: string[],
  ngoIds: string[]
): Promise<HierarchyResolutionResult> {
  const cleanCenterIds = Array.from(new Set(centerIds.filter(Boolean)));
  const cleanProjectIds = Array.from(new Set(projectIds.filter(Boolean)));
  const cleanNgoIds = Array.from(new Set(ngoIds.filter(Boolean)));

  const supabase = getSupabaseAdminClient();

  const centersMap: Record<string, ResolvedCenter> = {};
  const projectsMap: Record<string, ResolvedProject> = {};
  const ngosMap: Record<string, ResolvedNGO> = {};

  if (supabase) {
    try {
      const [centersRes, projectsRes, ngosRes] = await Promise.all([
        cleanCenterIds.length > 0
          ? supabase.from('welfare_centers').select('*').in('id', cleanCenterIds)
          : Promise.resolve({ data: [] }),
        cleanProjectIds.length > 0
          ? supabase.from('government_welfare_projects').select('*').in('id', cleanProjectIds)
          : Promise.resolve({ data: [] }),
        cleanNgoIds.length > 0
          ? supabase.from('ngos').select('*').in('id', cleanNgoIds)
          : Promise.resolve({ data: [] }),
      ]);

      if (centersRes.data && centersRes.data.length > 0) {
        for (const c of centersRes.data) {
          centersMap[c.id] = {
            id: c.id,
            code: c.code,
            name: c.name,
            district: c.district,
            state: c.state,
            address: c.address,
            latitude: c.latitude,
            longitude: c.longitude,
            geofence_radius_meters: c.geofence_radius_meters,
            beneficiary_capacity: c.beneficiary_capacity,
            cctv_camera_count: c.cctv_camera_count,
            cctv_stream_status: c.cctv_stream_status,
            status: c.status,
            project_id: c.project_id,
            ngo_id: c.ngo_id,
          };
        }
      }

      if (projectsRes.data && projectsRes.data.length > 0) {
        for (const p of projectsRes.data) {
          projectsMap[p.id] = {
            id: p.id,
            project_code: p.project_code,
            scheme_name: p.scheme_name,
            service_type: p.service_type,
            financial_year: p.financial_year,
            ngo_id: p.ngo_id,
          };
        }
      }

      if (ngosRes.data && ngosRes.data.length > 0) {
        for (const n of ngosRes.data) {
          ngosMap[n.id] = {
            id: n.id,
            name: n.name,
            darpan_reg_no: n.darpan_reg_no,
          };
        }
      }

      return {
        source: 'supabase',
        centers: centersMap,
        projects: projectsMap,
        ngos: ngosMap,
      };
    } catch (err) {
      console.error('Error fetching hierarchy from Supabase:', err);
    }
  }

  // Fallback for any unresolved IDs
  for (const c of DEMO_WELFARE_CENTERS) {
    if (cleanCenterIds.includes(c.id) && !centersMap[c.id]) {
      centersMap[c.id] = {
        id: c.id,
        code: c.code,
        name: c.name,
        district: c.district,
        state: c.state,
        address: c.address,
        latitude: c.coordinates.lat,
        longitude: c.coordinates.lng,
        geofence_radius_meters: c.geofenceRadiusMeters,
        beneficiary_capacity: c.beneficiaryCapacity,
        cctv_camera_count: c.cctvCameraCount,
        cctv_stream_status: c.cctvStreamStatus,
        status: c.status,
        project_id: c.projectId,
        ngo_id: c.ngoId,
      };
    }
  }

  for (const p of DEMO_GOV_PROJECTS) {
    if (cleanProjectIds.includes(p.id) && !projectsMap[p.id]) {
      projectsMap[p.id] = {
        id: p.id,
        project_code: p.projectCode,
        scheme_name: p.schemeName,
        service_type: p.serviceType,
        financial_year: p.financialYear,
        ngo_id: p.ngoId,
      };
    }
  }

  for (const n of DEMO_NGOS) {
    if (cleanNgoIds.includes(n.id) && !ngosMap[n.id]) {
      ngosMap[n.id] = {
        id: n.id,
        name: n.name,
        darpan_reg_no: n.darpanRegNo,
      };
    }
  }

  return {
    source: supabase ? 'supabase' : 'demo_fallback',
    centers: centersMap,
    projects: projectsMap,
    ngos: ngosMap,
  };
}
