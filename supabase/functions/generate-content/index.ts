import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateRequest {
  type: "stack" | "trainer" | "summary";
  market_id: string;
  stack_type?: "NEWS" | "HISTORY" | "LESSON";
  summary_type?: "DAILY" | "WEEKLY" | "MONTHLY";
  topic?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, market_id, stack_type, summary_type, topic } = (await req.json()) as GenerateRequest;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "stack") {
      systemPrompt = `You are a market intelligence expert creating educational content for market analysts. 
      Generate a 6-slide stack following the exact template structure.
      Each slide body MUST be under 280 characters.
      Each slide title MUST be under 6 words.
      Include credible sources for slides 1-5.
      
      For NEWS stacks:
      Slide 1: What happened
      Slide 2: Why it matters for this market
      Slide 3: Historical parallel
      Slide 4: Pro POV (label interpretations)
      Slide 5: Startup implication
      Slide 6: Reflection prompt
      
      For HISTORY stacks:
      Slide 1: What happened (past event)
      Slide 2: What people believed then
      Slide 3: What actually happened
      Slide 4: What people learned too late
      Slide 5: Why it matters today
      Slide 6: Reflection prompt
      
      For LESSON stacks:
      Slide 1: Core idea
      Slide 2: Mental model
      Slide 3: Real example
      Slide 4: Failure mode
      Slide 5: When it doesn't apply
      Slide 6: Apply to your market`;

      userPrompt = `Generate a ${stack_type} stack for the ${market_id} market${topic ? ` about: ${topic}` : ""}.
      
      Return valid JSON with this structure:
      {
        "title": "Stack title (max 6 words)",
        "slides": [
          {
            "slide_number": 1,
            "title": "Slide title",
            "body": "Slide content under 280 chars",
            "sources": [{"label": "Source Name", "url": "https://..."}]
          }
        ],
        "tags": ["tag1", "tag2"]
      }`;
    } else if (type === "trainer") {
      systemPrompt = `You are a market reasoning coach. Create challenging scenarios that test market analysis skills.
      Focus on real-world decision-making situations.
      Provide nuanced feedback that teaches mental models.
      Cite at least one source.`;

      userPrompt = `Generate a trainer scenario for the ${market_id} market.
      
      Return valid JSON:
      {
        "scenario": "Scenario description (max 600 chars)",
        "question": "What should...?",
        "options": [
          {"label": "Option A", "isCorrect": false},
          {"label": "Option B", "isCorrect": true},
          {"label": "Option C", "isCorrect": false},
          {"label": "Option D", "isCorrect": false}
        ],
        "feedback_pro_reasoning": "Pro analysis (max 500 chars)",
        "feedback_common_mistake": "One line mistake",
        "feedback_mental_model": "Mental model summary",
        "follow_up_question": "Follow-up question",
        "sources": [{"label": "Source", "url": "https://..."}],
        "tags": ["tag1", "tag2"]
      }`;
    } else if (type === "summary") {
      systemPrompt = `You are a market intelligence analyst creating concise market summaries.
      Focus on actionable insights and key developments.
      Use data-driven analysis with credible sources.`;

      userPrompt = `Generate a ${summary_type} summary for the ${market_id} market.
      
      Return valid JSON:
      {
        "title": "Summary title",
        "content": "Full summary content",
        "key_takeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3"]
      }`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI generation failed");
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content generated");
    }

    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("Invalid AI response format");
    }

    // Optionally save to database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (type === "stack" && parsedContent.slides) {
      // Create stack
      const { data: stack, error: stackError } = await supabase
        .from("stacks")
        .insert({
          market_id,
          title: parsedContent.title,
          stack_type: stack_type,
          tags: parsedContent.tags || [],
          published_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (stackError) {
        console.error("Stack insert error:", stackError);
        throw stackError;
      }

      // Create slides
      const slides = parsedContent.slides.map((slide: any) => ({
        stack_id: stack.id,
        slide_number: slide.slide_number,
        title: slide.title,
        body: slide.body,
        sources: slide.sources || [],
      }));

      const { error: slidesError } = await supabase.from("slides").insert(slides);

      if (slidesError) {
        console.error("Slides insert error:", slidesError);
      }

      parsedContent.stack_id = stack.id;
    } else if (type === "trainer") {
      const correctIndex = parsedContent.options.findIndex((o: any) => o.isCorrect);
      
      const { data: scenario, error } = await supabase
        .from("trainer_scenarios")
        .insert({
          market_id,
          scenario: parsedContent.scenario,
          question: parsedContent.question,
          options: parsedContent.options,
          correct_option_index: correctIndex,
          feedback_pro_reasoning: parsedContent.feedback_pro_reasoning,
          feedback_common_mistake: parsedContent.feedback_common_mistake,
          feedback_mental_model: parsedContent.feedback_mental_model,
          follow_up_question: parsedContent.follow_up_question,
          sources: parsedContent.sources || [],
          tags: parsedContent.tags || [],
        })
        .select()
        .single();

      if (!error) {
        parsedContent.scenario_id = scenario?.id;
      }
    } else if (type === "summary") {
      const { data: summary, error } = await supabase
        .from("summaries")
        .insert({
          market_id,
          title: parsedContent.title,
          summary_type: summary_type,
          content: parsedContent.content,
          key_takeaways: parsedContent.key_takeaways || [],
          for_date: new Date().toISOString().split("T")[0],
        })
        .select()
        .single();

      if (!error) {
        parsedContent.summary_id = summary?.id;
      }
    }

    return new Response(JSON.stringify(parsedContent), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Generate content error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
