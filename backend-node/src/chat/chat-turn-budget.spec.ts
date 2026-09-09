import {
  AGENT_THINKING_STATUS,
  COOKING_ASSISTANT_SYSTEM_PROMPT,
  TURN_BUDGET_STOP_NOTE,
} from './chat.constants';

describe('chat turn budget policy', () => {
  it('includes TURN BUDGET guidance in the system prompt', () => {
    expect(COOKING_ASSISTANT_SYSTEM_PROMPT).toContain('TURN BUDGET');
    expect(COOKING_ASSISTANT_SYSTEM_PROMPT).toContain('ONE phase per turn only');
    expect(COOKING_ASSISTANT_SYSTEM_PROMPT).toContain('at most 3 recipes');
    expect(COOKING_ASSISTANT_SYSTEM_PROMPT).toContain('ONE planMeals call');
  });

  it('exports stop note and thinking status for graph enforcement', () => {
    expect(TURN_BUDGET_STOP_NOTE).toMatch(/Turn tool budget reached/i);
    expect(AGENT_THINKING_STATUS).toBe('Thinking…');
  });
});
