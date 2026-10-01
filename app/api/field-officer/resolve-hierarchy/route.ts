import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { DEMO_WELFARE_CENTERS, DEMO_GOV_PROJECTS, DEMO_NGOS, GovernmentWelfareProject } from '@/lib/demo-data';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const centerIds: string[] = Array.isArray(body?.centerIds) ? body.centerIds : [];
    const projectIds: string[] = Array.isArray(body?.projectIds) ? body.projectIds : [];
    const ngoIds: string[] = Array.isArray(body?.ngoIds) ? body.ngoIds : [];

    const supabase = getSupabaseAdminClient();

    if (supabase) {
      const [centersRes, projectsRes, ngosRes] = await Promise.all([
        centerIds.length > 0
          ? supabase.from('welfare_centers').select('*').in('id', centerIds)
          : Promise.resolve({ data: [] }),
        projectIds.length > 0
          ? supabase.from('government_welfare_projects').select('*').in('id', projectIds)
          : Promise.resolve({ data: [] }),
        ngoIds.length > 0
          ? supabase.from('ngos').select('*').in('id', ngoIds)
          : Promise.resolve({ data: [] }),
      ]);

      const centers = centersRes.data && centersRes.data.length > 0
        ? centersRes.data
        : DEMO_WELFARE_CENTERS.filter((c) => centerIds.includes(c.id)).map((c) => ({
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
          }));

      const projects = projectsRes.data && projectsRes.data.length > 0
        ? projectsRes.data
        : DEMO_GOV_PROJECTS.filter((p: GovernmentWelfareProject) => projectIds.includes(p.id)).map((p: GovernmentWelfareProject) => ({
            id: p.id,
            project_code: p.projectCode,
            scheme_name: p.schemeName,
            service_type: p.serviceType,
            financial_year: p.financialYear,
            ngo_id: p.ngoId,
          }));

      const ngos = ngosRes.data && ngosRes.data.length > 0
        ? ngosRes.data
        : DEMO_NGOS.filter((n) => ngoIds.includes(n.id)).map((n) => ({
            id: n.id,
            name: n.name,
            darpan_reg_no: n.darpanRegNo,
          }));

      return NextResponse.json({
        success: true,
        source: 'supabase',
        centers,
        projects,
        ngos,
      });
    }

    // Fallback if Supabase admin is not configured
    const centers = DEMO_WELFARE_CENTERS.filter((c) => centerIds.includes(c.id)).map((c) => ({
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
    }));

    const projects = DEMO_GOV_PROJECTS.filter((p: GovernmentWelfareProject) => projectIds.includes(p.id)).map((p: GovernmentWelfareProject) => ({
      id: p.id,
      project_code: p.projectCode,
      scheme_name: p.schemeName,
      service_type: p.serviceType,
      financial_year: p.financialYear,
      ngo_id: p.ngoId,
    }));

    const ngos = DEMO_NGOS.filter((n) => ngoIds.includes(n.id)).map((n) => ({
      id: n.id,
      name: n.name,
      darpan_reg_no: n.darpanRegNo,
    }));

    return NextResponse.json({
      success: true,
      source: 'demo_fallback',
      centers,
      projects,
      ngos,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error resolving hierarchy';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
