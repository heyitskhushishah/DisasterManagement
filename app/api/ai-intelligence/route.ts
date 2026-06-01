import { NextResponse } from "next/server";

import { computeRiskScores } from "@/lib/ai-intelligence/scoring";
import type { AIIntelligenceInput } from "@/lib/ai-intelligence/types";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("ai_intelligence")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("[AI-Intel] fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch analysis" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(null);
    }

    return NextResponse.json({
      id: data.id,
      disasterType: data.disaster_type,
      severity: data.severity,
      populationAffected: data.population_affected,
      floodRisk: data.flood_risk,
      hospitalOverloadRisk: data.hospital_overload_risk,
      infrastructureDamageRisk: data.infrastructure_damage_risk,
      responseDelayRisk: data.response_delay_risk,
      weatherSnapshot: data.weather_snapshot,
      facilitiesSummary: data.facilities_summary,
      createdAt: data.created_at,
    });
  } catch (error) {
    console.error("[AI-Intel] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: AIIntelligenceInput = await req.json();
    const result = computeRiskScores(body);

    const { data, error } = await supabase
      .from("ai_intelligence")
      .insert({
        user_id: user.id,
        disaster_type: body.disasterType,
        severity: body.severity,
        population_affected: body.populationAffected,
        flood_risk: result.floodRisk,
        hospital_overload_risk: result.hospitalOverloadRisk,
        infrastructure_damage_risk: result.infrastructureDamageRisk,
        response_delay_risk: result.responseDelayRisk,
        weather_snapshot: result.weatherSnapshot as Record<string, unknown> | null,
        facilities_summary: result.facilitiesSummary as Record<string, unknown> | null,
      })
      .select()
      .single();

    if (error) {
      console.error("[AI-Intel] insert error:", error);
      return NextResponse.json({ error: "Failed to save analysis" }, { status: 500 });
    }

    return NextResponse.json({
      id: data.id,
      disasterType: data.disaster_type,
      severity: data.severity,
      populationAffected: data.population_affected,
      floodRisk: data.flood_risk,
      hospitalOverloadRisk: data.hospital_overload_risk,
      infrastructureDamageRisk: data.infrastructure_damage_risk,
      responseDelayRisk: data.response_delay_risk,
      weatherSnapshot: data.weather_snapshot,
      facilitiesSummary: data.facilities_summary,
      createdAt: data.created_at,
      classifications: result.classifications,
    });
  } catch (error) {
    console.error("[AI-Intel] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
