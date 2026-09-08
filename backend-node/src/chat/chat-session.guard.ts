import { Injectable } from '@nestjs/common';

/**
 * Ensures only one chat turn runs per (userId, sessionId) at a time.
 */
@Injectable()
export class ChatSessionGuard {
  private readonly permits = new Map<string, number>();

  private key(userId: string, sessionId: string): string {
    return `${userId}:${sessionId}`;
  }

  tryAcquire(userId: string, sessionId: string): boolean {
    const key = this.key(userId, sessionId);
    const current = this.permits.get(key) ?? 0;
    if (current > 0) {
      return false;
    }
    this.permits.set(key, 1);
    return true;
  }

  release(userId: string, sessionId: string): void {
    const key = this.key(userId, sessionId);
    const current = this.permits.get(key) ?? 0;
    if (current <= 0) {
      return;
    }
    this.permits.set(key, 0);
  }
}
