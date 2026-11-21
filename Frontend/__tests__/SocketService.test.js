/**
 * SocketService Comprehensive Lifecycle & Teardown Unit Tests
 * Tests connection lifecycle, failover timer cleanup, subscription management,
 * and concurrent connection deduplication.
 */
import { socketService } from '../src/services/socketService';

describe('SocketService Lifecycle & Resource Cleanup', () => {
  beforeEach(() => {
    socketService.disconnect();
  });

  afterEach(() => {
    socketService.disconnect();
  });

  test('connects and returns active socket instance', async () => {
    const socket = await socketService.connect();
    expect(socket).toBeDefined();
    await new Promise((resolve) => process.nextTick(resolve));
    expect(socketService.isSocketConnected()).toBe(true);
  });

  test('deduplicates concurrent connect calls to the same socket instance', async () => {
    const p1 = socketService.connect();
    const p2 = socketService.connect();
    const p3 = socketService.getSocket();

    const [s1, s2, s3] = await Promise.all([p1, p2, p3]);
    expect(s1).toBe(s2);
    expect(s2).toBe(s3);
  });

  test('disconnect clears all active subscriptions and cancels failover timer', async () => {
    await socketService.connect();

    const mockCallback = jest.fn();
    await socketService.subscribeToOrder('BBIN-123456', { onLocation: mockCallback });
    expect(socketService.activeSubscriptions.has('BBIN-123456')).toBe(true);

    // Simulate an active failover timer
    socketService.failoverTimer = setTimeout(() => {}, 10000);

    socketService.disconnect();

    expect(socketService.activeSubscriptions.size).toBe(0);
    expect(socketService.failoverTimer).toBeNull();
    expect(socketService.socket).toBeNull();
    expect(socketService.isConnected).toBe(false);
    expect(socketService.isExplicitlyDisconnected).toBe(true);
  });

  test('subscribeToOrder registers primary order and multiple aliases', async () => {
    await socketService.connect();

    const callbacks = {
      onLocation: jest.fn(),
      onStatus: jest.fn(),
      onEta: jest.fn(),
    };

    await socketService.subscribeToOrder(['ORD-999', 'ORD-ALIAS-1'], callbacks);

    expect(socketService.activeSubscriptions.has('ORD-999')).toBe(true);
    expect(socketService.activeSubscriptions.has('ORD-ALIAS-1')).toBe(true);

    // Unsubscribe cleans up all targets
    socketService.unsubscribeFromOrder(['ORD-999', 'ORD-ALIAS-1']);
    expect(socketService.activeSubscriptions.has('ORD-999')).toBe(false);
    expect(socketService.activeSubscriptions.has('ORD-ALIAS-1')).toBe(false);
  });

  test('notifies connection state listeners on state transition', async () => {
    const listener = jest.fn();
    const unsub = socketService.onConnectionChange(listener);

    await socketService.connect();
    await new Promise((resolve) => process.nextTick(resolve));
    expect(listener).toHaveBeenCalledWith(true);

    socketService.disconnect();
    expect(listener).toHaveBeenCalledWith(false);

    unsub();
  });
});
