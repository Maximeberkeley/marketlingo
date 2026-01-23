import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CurriculumDay {
  day: number;
  type: string;
  pattern: string;
  slides: string[];
  sources: string[];
}

function parseMarkdownCurriculum(markdown: string): CurriculumDay[] {
  const days: CurriculumDay[] = [];
  const dayBlocks = markdown.split(/---\s*\n/).filter(block => block.trim());

  for (const block of dayBlocks) {
    const dayMatch = block.match(/## Day (\d+) — (\w+)/);
    if (!dayMatch) continue;

    const day = parseInt(dayMatch[1]);
    const type = dayMatch[2];
    
    const patternMatch = block.match(/\*\*Pattern:\*\* (.+)/);
    const pattern = patternMatch ? patternMatch[1].trim() : "";

    // Extract numbered slides (1. through 8.)
    const slideMatches = block.match(/^\d+\.\s+.+$/gm) || [];
    const slides = slideMatches.map(s => s.replace(/^\d+\.\s+/, "").trim());

    // Extract sources
    const sourceMatches = block.match(/- https?:\/\/[^\s]+/g) || [];
    const sources = sourceMatches.map(s => s.replace(/^- /, "").trim());

    days.push({ day, type, pattern, slides, sources });
  }

  return days;
}

function mapTypeToStackType(type: string): string {
  const mapping: Record<string, string> = {
    "DAILY_GAME": "NEWS",
    "MICRO_LESSON": "LESSON",
    "TRAINER": "LESSON",
    "BOOK_SNAPSHOT": "HISTORY",
    "MONTH_REVIEW_GAME": "NEWS",
  };
  return mapping[type] || "LESSON";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { market_id, content } = await req.json();

    if (!market_id || !content) {
      return new Response(
        JSON.stringify({ error: "market_id and content are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const days = parseMarkdownCurriculum(content);
    console.log(`Parsed ${days.length} days of curriculum`);

    const results = {
      stacks_created: 0,
      slides_created: 0,
      trainer_scenarios_created: 0,
      errors: [] as string[],
    };

    for (const day of days) {
      try {
        // Handle TRAINER type separately
        if (day.type === "TRAINER") {
          // Parse trainer scenario from slides
          const scenarioText = day.slides[0] || day.pattern;
          const questionText = day.slides[1] || `What is the key insight about: ${day.pattern}?`;
          
          // Extract options (look for A) B) C) D) pattern)
          const options = [];
          let correctIndex = 0;
          
          for (let i = 0; i < day.slides.length; i++) {
            const slide = day.slides[i];
            const optionMatch = slide.match(/^([A-D])\)\s*(.+)/);
            if (optionMatch) {
              options.push({ label: optionMatch[2], isCorrect: false });
            }
            if (slide.toLowerCase().includes("correct:")) {
              const correctMatch = slide.match(/correct:\s*([A-D])/i);
              if (correctMatch) {
                correctIndex = correctMatch[1].charCodeAt(0) - 65; // A=0, B=1, etc.
              }
            }
          }

          // Set correct option
          if (options.length > 0 && correctIndex < options.length) {
            options[correctIndex].isCorrect = true;
          }

          // Fill in if no options found
          if (options.length === 0) {
            options.push(
              { label: "Option A", isCorrect: false },
              { label: "Option B", isCorrect: true },
              { label: "Option C", isCorrect: false },
              { label: "Option D", isCorrect: false }
            );
          }

          // Get lesson/feedback from remaining slides
          const feedbackSlide = day.slides.find(s => s.toLowerCase().includes("lesson:"));
          const feedback = feedbackSlide ? feedbackSlide.replace(/lesson:\s*/i, "") : day.pattern;

          const { error } = await supabase
            .from("trainer_scenarios")
            .insert({
              market_id,
              scenario: scenarioText,
              question: questionText,
              options: options,
              correct_option_index: correctIndex,
              feedback_pro_reasoning: feedback,
              feedback_common_mistake: `Missing the pattern: ${day.pattern}`,
              feedback_mental_model: day.pattern,
              sources: day.sources.map(url => ({ label: "Source", url })),
              tags: [day.pattern, `day-${day.day}`, "month-1"],
            });

          if (error) {
            console.error(`Trainer insert error day ${day.day}:`, error);
            results.errors.push(`Day ${day.day} trainer: ${error.message}`);
          } else {
            results.trainer_scenarios_created++;
          }
        }

        // Create stack for all types (including TRAINER for slide view)
        const stackType = mapTypeToStackType(day.type);
        
        const { data: stack, error: stackError } = await supabase
          .from("stacks")
          .insert({
            market_id,
            title: day.pattern,
            stack_type: stackType,
            tags: [day.type, `day-${day.day}`, "month-1", "foundations"],
            published_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (stackError) {
          console.error(`Stack insert error day ${day.day}:`, stackError);
          results.errors.push(`Day ${day.day} stack: ${stackError.message}`);
          continue;
        }

        results.stacks_created++;

        // Create slides (max 6)
        const slidesToCreate = day.slides.slice(0, 6);
        const slideInserts = slidesToCreate.map((body, index) => ({
          stack_id: stack.id,
          slide_number: index + 1,
          title: index === 0 ? day.pattern : `Slide ${index + 1}`,
          body: body.substring(0, 280), // Enforce 280 char limit
          sources: index < day.sources.length 
            ? [{ label: "Source", url: day.sources[index] || day.sources[0] }]
            : [],
        }));

        const { error: slidesError } = await supabase
          .from("slides")
          .insert(slideInserts);

        if (slidesError) {
          console.error(`Slides insert error day ${day.day}:`, slidesError);
          results.errors.push(`Day ${day.day} slides: ${slidesError.message}`);
        } else {
          results.slides_created += slideInserts.length;
        }

      } catch (dayError) {
        console.error(`Error processing day ${day.day}:`, dayError);
        results.errors.push(`Day ${day.day}: ${dayError}`);
      }
    }

    console.log("Import results:", results);

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Import curriculum error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
