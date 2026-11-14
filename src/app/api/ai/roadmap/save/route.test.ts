import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

import { POST } from "./route";

type DatabaseError = { message: string } | null;

function makeSupabaseMock(enrollmentError: DatabaseError = null) {
  const deleteEq = vi.fn().mockResolvedValue({ error: null });
  const journeyDelete = vi.fn(() => ({ eq: deleteEq }));
  const journeySingle = vi.fn().mockResolvedValue({
    data: { id: "journey-1" },
    error: null,
  });
  const journeySelect = vi.fn(() => ({ single: journeySingle }));
  const journeyInsert = vi.fn(() => ({ select: journeySelect }));
  const milestoneInsert = vi.fn().mockResolvedValue({ error: null });
  const enrollmentInsert = vi.fn().mockResolvedValue({ error: enrollmentError });

  const from = vi.fn((table: string) => {
    if (table === "journeys") {
      return { insert: journeyInsert, delete: journeyDelete };
    }
    if (table === "milestones") return { insert: milestoneInsert };
    if (table === "user_journeys") return { insert: enrollmentInsert };
    throw new Error(`Unexpected table: ${table}`);
  });

  return {
    client: {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
      from,
    },
    journeyDelete,
    deleteEq,
    enrollmentInsert,
  };
}

function makeRequest() {
  return new Request("http://localhost/api/ai/roadmap/save", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      roadmap: {
        title: "Python learning roadmap",
        stages: [
          {
            name: "Foundations",
            milestones: [{ title: "Learn variables" }],
          },
        ],
      },
    }),
  });
}

describe("POST /api/ai/roadmap/save", () => {
  beforeEach(() => {
    createClientMock.mockReset();
  });

  it("does not report success when user enrollment fails", async () => {
    const supabase = makeSupabaseMock({ message: "permission denied" });
    createClientMock.mockResolvedValue(supabase.client);

    const response = await POST(makeRequest());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Failed to enroll saved roadmap. Please retry.",
    });
    expect(supabase.journeyDelete).toHaveBeenCalledTimes(1);
    expect(supabase.deleteEq).toHaveBeenCalledWith("id", "journey-1");
  });

  it("returns success only after enrollment is created", async () => {
    const supabase = makeSupabaseMock();
    createClientMock.mockResolvedValue(supabase.client);

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      ok: true,
      journey_id: "journey-1",
      milestone_count: 1,
    });
    expect(supabase.journeyDelete).not.toHaveBeenCalled();
  });
});
