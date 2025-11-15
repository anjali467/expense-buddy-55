import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get the user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error("Not authenticated");
    }

    // Check last expense date
    const { data: expenses, error: expenseError } = await supabase
      .from("expenses")
      .select("expense_date, created_at")
      .eq("user_id", user.id)
      .order("expense_date", { ascending: false })
      .limit(5);

    if (expenseError) {
      console.error("Error fetching expenses:", expenseError);
      throw expenseError;
    }

    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    
    const hasExpenseToday = expenses?.some((exp) => exp.expense_date === today);
    const hasExpenseYesterday = expenses?.some((exp) => exp.expense_date === yesterday);

    // If user has logged expenses today, no reminder needed
    if (hasExpenseToday) {
      return new Response(
        JSON.stringify({ needsReminder: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build context for AI
    const expenseDates = expenses?.map((e) => e.expense_date) || [];
    const daysSinceLastExpense = expenses && expenses.length > 0 
      ? Math.floor((Date.now() - new Date(expenses[0].expense_date).getTime()) / 86400000)
      : null;

    // Call Lovable AI for personalized reminder
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a friendly AI assistant helping users track their expenses. Generate a short, encouraging reminder message (1-2 sentences) to help them record their expenses. Be supportive and positive."
          },
          {
            role: "user",
            content: `The user hasn't recorded any expenses today. ${
              daysSinceLastExpense !== null
                ? `Their last expense was ${daysSinceLastExpense} day(s) ago.`
                : "They haven't recorded any expenses yet."
            } ${
              !hasExpenseYesterday ? "They also didn't log expenses yesterday." : ""
            } Generate a friendly reminder message.`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      // Return a fallback message if AI fails
      return new Response(
        JSON.stringify({
          needsReminder: true,
          message: "Don't forget to record your expenses for today! Keeping track helps you stay on budget.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const aiMessage = aiData.choices[0]?.message?.content || 
      "Don't forget to record your expenses for today!";

    return new Response(
      JSON.stringify({
        needsReminder: true,
        message: aiMessage,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in check-expense-reminder:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        needsReminder: false,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
