import { NextResponse } from "next/server";
import { generatePracticeSet } from "@/lib/ai/agents";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Generate a practice set for a milestone and persist the session. */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const body = (await request.json()) as {
      topic?: string;
      description?: string;
      difficulty?: string;
      milestoneId?: string;
      userJourneyId?: string;
      weakTopics?: string[];
      preferred?: "groq" | "gemini";
    };

    const topic = body.topic?.trim();
    if (!topic || topic.length < 2 || topic.length > 500) {
      return NextResponse.json({ error: "topic required (2–500 chars)" }, { status: 400 });
    }

    if (body.userJourneyId) {
      const { data: uj } = await supabase
        .from("user_journeys")
        .select("id")
        .eq("id", body.userJourneyId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!uj) {
        return NextResponse.json({ error: "Journey enrollment not found" }, { status: 404 });
      }
    }

    const questions = await generatePracticeSet({
      topic,
      description: body.description,
      difficulty: body.difficulty,
      weakTopics: body.weakTopics,
      preferred: body.preferred,
    });

    const { data: session, error } = await supabase
      .from("practice_sessions")
      .insert({
        user_id: user.id,
        user_journey_id: body.userJourneyId || null,
        milestone_id: body.milestoneId || null,
        topic: topic.slice(0, 300),
        difficulty: body.difficulty || "beginner",
        questions,
        answers: {},
        max_score: questions.length,
      })
      .select("id, topic, difficulty, questions, created_at")
      .single();

    if (error || !session) {
      return NextResponse.json(
        { error: error?.message || "Failed to save practice session" },
        { status: 500 }
      );
    }

    const clientQuestions = questions.map((q) => ({
      id: q.id,
      type: q.type,
      prompt: q.prompt,
      options: q.options,
      difficulty: q.difficulty,
    }));

    return NextResponse.json({
      sessionId: session.id,
      topic: session.topic,
      difficulty: session.difficulty,
      questions: clientQuestions,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Practice generation failed";
    const status = msg.includes("No AI API keys") ? 503 : 502;
    return NextResponse.json({ error: msg }, { status });
  }
}

/** Submit answers and score a practice session. */
export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const body = (await request.json()) as {
      sessionId?: string;
      answers?: Record<string, string>;
    };

    const sessionId = body.sessionId?.trim();
    if (!sessionId || !body.answers || typeof body.answers !== "object") {
      return NextResponse.json({ error: "sessionId and answers required" }, { status: 400 });
    }

    const { data: session, error } = await supabase
      .from("practice_sessions")
      .select("id, questions, max_score, topic, milestone_id, user_journey_id")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const questions = (session.questions ?? []) as {
      id: string;
      type: string;
      correctAnswer: string;
      explanation: string;
      prompt: string;
    }[];

    let score = 0;
    const weakTopics: string[] = [];
    const results = questions.map((q) => {
      const given = String(body.answers![q.id] ?? "").trim();
      const expected = String(q.correctAnswer ?? "").trim();
      const ok =
        q.type === "multiple_choice"
          ? given.toLowerCase() === expected.toLowerCase()
          : given.length > 0 &&
            (given.toLowerCase() === expected.toLowerCase() ||
              expected.toLowerCase().includes(given.toLowerCase()) ||
              given.toLowerCase().includes(expected.toLowerCase().slice(0, 40)));
      if (ok) score += 1;
      else weakTopics.push(q.prompt.slice(0, 80));
      return {
        id: q.id,
        correct: ok,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        yourAnswer: given,
      };
    });

    const maxScore = Number(session.max_score) || questions.length;
    const ratio = maxScore > 0 ? score / maxScore : 1;

    await supabase
      .from("practice_sessions")
      .update({
        answers: body.answers,
        score,
        max_score: maxScore,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId)
      .eq("user_id", user.id);

    return NextResponse.json({
      score,
      maxScore,
      results,
      weakTopics: weakTopics.slice(0, 5),
      adaptHint:
        ratio < 0.5 && session.milestone_id && session.user_journey_id
          ? {
              shouldAdapt: true,
              message:
                "Score below 50%. You can add a remedial checkpoint to your roadmap.",
              userJourneyId: session.user_journey_id,
              milestoneId: session.milestone_id,
              topic: session.topic,
            }
          : { shouldAdapt: false },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Submit failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** List recent practice sessions for the user. */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const url = new URL(request.url);
    const milestoneId = url.searchParams.get("milestoneId");

    let q = supabase
      .from("practice_sessions")
      .select("id, topic, difficulty, score, max_score, completed_at, created_at, milestone_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (milestoneId) {
      q = q.eq("milestone_id", milestoneId);
    }

    const { data, error } = await q;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ sessions: data ?? [] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to list practice";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
