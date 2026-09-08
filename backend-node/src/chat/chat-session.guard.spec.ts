import { ChatSessionGuard } from './chat-session.guard';

describe('ChatSessionGuard', () => {
  it('allows different sessions for the same user', () => {
    const guard = new ChatSessionGuard();
    expect(guard.tryAcquire('u1', 's1')).toBe(true);
    expect(guard.tryAcquire('u1', 's2')).toBe(true);
    expect(guard.tryAcquire('u1', 's1')).toBe(false);
    guard.release('u1', 's1');
    expect(guard.tryAcquire('u1', 's1')).toBe(true);
  });
});
