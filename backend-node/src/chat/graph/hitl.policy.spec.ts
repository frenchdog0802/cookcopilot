import {
  isMutatingTool,
  requiresHitlApproval,
  summarizeToolArgs,
} from './hitl.policy';

describe('hitl.policy', () => {
  it('classifies mutating tools', () => {
    expect(isMutatingTool('createRecipe')).toBe(true);
    expect(isMutatingTool('listMyRecipes')).toBe(false);
  });

  it('requires approval only when HITL enabled and mutating', () => {
    expect(requiresHitlApproval(['createRecipe'], true)).toBe(true);
    expect(requiresHitlApproval(['createRecipe'], false)).toBe(false);
    expect(requiresHitlApproval(['listPantry'], true)).toBe(false);
  });

  it('summarizes args with truncation', () => {
    const short = summarizeToolArgs({ a: 1 });
    expect(short).toContain('a');
    const long = summarizeToolArgs({ blob: 'x'.repeat(300) });
    expect(long.endsWith('...')).toBe(true);
    expect(long.length).toBeLessThanOrEqual(160);
  });
});
