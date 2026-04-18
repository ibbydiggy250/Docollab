export const CONTRIBUTION_ANALYSIS_PROMPT = `
You are helping a teacher understand collaborative writing contributions.

Given grouped Google Doc revision data, evaluate each collaborator for:
- contribution volume
- originality
- significance to the final draft
- writing quality

Return structured JSON only.
`;

// TODO: Use this prompt when replacing the deterministic mock analyzer with a real LLM call.
