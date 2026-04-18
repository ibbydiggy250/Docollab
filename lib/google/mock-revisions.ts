import type { RevisionChunk } from "@/types/revision";

export const mockRevisions: RevisionChunk[] = [
  {
    id: "rev_001",
    docId: "mock-doc",
    contributorName: "Maya Chen",
    contributorEmail: "maya@example.edu",
    timestamp: "2026-03-02T14:08:00.000Z",
    textAdded:
      "Our group chose urban heat islands because they show how city design can affect public health, energy use, and neighborhood comfort during summer months."
  },
  {
    id: "rev_002",
    docId: "mock-doc",
    contributorName: "Jordan Rivera",
    contributorEmail: "jordan@example.edu",
    timestamp: "2026-03-02T14:22:00.000Z",
    textAdded:
      "Dark pavement and rooftops absorb more sunlight than trees, parks, and lighter surfaces. This means some blocks stay warmer even after sunset."
  },
  {
    id: "rev_003",
    docId: "mock-doc",
    contributorName: "Sam Patel",
    contributorEmail: "sam@example.edu",
    timestamp: "2026-03-02T15:11:00.000Z",
    textAdded:
      "The introduction should explain the term first, then connect it to why the issue matters for people who live in dense neighborhoods.",
    textDeleted: "This is about hot cities."
  },
  {
    id: "rev_004",
    docId: "mock-doc",
    contributorName: "Maya Chen",
    contributorEmail: "maya@example.edu",
    timestamp: "2026-03-03T16:03:00.000Z",
    textAdded:
      "One solution is increasing the tree canopy. Trees cool sidewalks through shade and through evapotranspiration, which releases water vapor into the air."
  },
  {
    id: "rev_005",
    docId: "mock-doc",
    contributorName: "Avery Brooks",
    contributorEmail: "avery@example.edu",
    timestamp: "2026-03-03T16:45:00.000Z",
    textAdded:
      "A second solution is using cool roofs. Reflective roof materials can lower building temperatures and reduce the need for air conditioning."
  },
  {
    id: "rev_006",
    docId: "mock-doc",
    contributorName: "Jordan Rivera",
    contributorEmail: "jordan@example.edu",
    timestamp: "2026-03-04T10:15:00.000Z",
    textAdded:
      "The strongest evidence in our draft is the comparison between shaded streets and streets with wide asphalt surfaces because it gives readers a clear visual contrast."
  },
  {
    id: "rev_007",
    docId: "mock-doc",
    contributorName: "Sam Patel",
    contributorEmail: "sam@example.edu",
    timestamp: "2026-03-04T11:02:00.000Z",
    textAdded:
      "I revised the conclusion so it returns to the main claim: cities can reduce heat risk when planners choose materials and public spaces carefully.",
    textDeleted: "Cities should fix this."
  },
  {
    id: "rev_008",
    docId: "mock-doc",
    contributorName: "Maya Chen",
    contributorEmail: "maya@example.edu",
    timestamp: "2026-03-04T12:38:00.000Z",
    textAdded:
      "We should acknowledge that tree planting is not equally available in every neighborhood, so funding decisions can make the heat problem better or worse."
  },
  {
    id: "rev_009",
    docId: "mock-doc",
    contributorName: "Avery Brooks",
    contributorEmail: "avery@example.edu",
    timestamp: "2026-03-04T13:04:00.000Z",
    textAdded:
      "I added transitions between the solution paragraphs so the essay moves from causes to possible responses without feeling like a list."
  },
  {
    id: "rev_010",
    docId: "mock-doc",
    contributorName: "Jordan Rivera",
    contributorEmail: "jordan@example.edu",
    timestamp: "2026-03-05T09:26:00.000Z",
    textAdded:
      "For the final paragraph, we can say that reducing heat islands is both an environmental design challenge and a fairness issue."
  }
];
