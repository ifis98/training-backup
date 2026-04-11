import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.39.3/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { caseId, patientName } = await req.json();
    if (!caseId || !patientName) {
      return new Response(JSON.stringify({ error: "Missing caseId or patientName" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get the case and assigned staff
    const { data: caseData } = await supabase
      .from("cases")
      .select("*, practice_id")
      .eq("id", caseId)
      .single();

    if (!caseData?.practice_id) {
      return new Response(JSON.stringify({ message: "Case not found or no practice" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all staff profiles for this practice to notify
    const { data: staffProfiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .eq("practice_id", caseData.practice_id);

    // Log the notification (email sending requires email domain setup)
    console.log(`Follow-up notification for case ${caseId} (${patientName}). Staff to notify: ${staffProfiles?.length || 0}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Follow-up notification logged for ${patientName}`,
        staffCount: staffProfiles?.length || 0,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
