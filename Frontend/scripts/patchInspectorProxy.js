/**
 * Self-healing patch for @react-native/dev-middleware InspectorProxy
 * Fixes [UNREGISTERED_DEVICE] error caused by:
 * 1. Stale deviceId across app reloads / Fast Refresh
 * 2. Race condition during Bridgeless Mode Hermes JS runtime recreation
 * 3. DevTools reconnect loops when app connection drops temporarily
 */
const fs = require('fs');
const path = require('path');

const targetFile = path.join(
  __dirname,
  '..',
  'node_modules',
  '@react-native',
  'dev-middleware',
  'dist',
  'inspector-proxy',
  'InspectorProxy.js'
);

function applyPatch() {
  if (!fs.existsSync(targetFile)) {
    return;
  }

  const content = fs.readFileSync(targetFile, 'utf8');

  // Check if already patched
  if (content.includes('// [PATCHED: Auto-heal stale or reconnecting device IDs]')) {
    return;
  }

  const needle = `      const device = deviceId ? this.#devices.get(deviceId) : undefined;
      const debuggerSessionIDs = {
        appId: device?.getApp() || null,
        deviceId,
        deviceName: device?.getName() || null,
        pageId,
      };
      try {
        if (deviceId == null || pageId == null) {
          throw new Error(INTERNAL_ERROR_MESSAGES.INCORRECT_URL);
        }
        if (device == null) {
          throw new Error(INTERNAL_ERROR_MESSAGES.UNREGISTERED_DEVICE);
        }`;

  const replacement = `      // [PATCHED: Auto-heal stale or reconnecting device IDs]
      let resolvedDeviceId = deviceId;
      let device = resolvedDeviceId ? this.#devices.get(resolvedDeviceId) : undefined;

      if (!device && resolvedDeviceId != null) {
        if (this.#devices.size === 1) {
          const [activeId, activeDevice] = Array.from(this.#devices.entries())[0];
          resolvedDeviceId = activeId;
          device = activeDevice;
        } else if (this.#devices.size === 0) {
          const waitStart = Date.now();
          while (Date.now() - waitStart < 1500 && this.#devices.size === 0) {
            await new Promise((res) => setTimeout(res, 150));
          }
          if (resolvedDeviceId && this.#devices.has(resolvedDeviceId)) {
            device = this.#devices.get(resolvedDeviceId);
          } else if (this.#devices.size === 1) {
            const [activeId, activeDevice] = Array.from(this.#devices.entries())[0];
            resolvedDeviceId = activeId;
            device = activeDevice;
          }
        }
      }

      const debuggerSessionIDs = {
        appId: device?.getApp() || null,
        deviceId: resolvedDeviceId,
        deviceName: device?.getName() || null,
        pageId,
      };
      try {
        if (resolvedDeviceId == null || pageId == null) {
          throw new Error(INTERNAL_ERROR_MESSAGES.INCORRECT_URL);
        }
        if (device == null) {
          this.#logger?.warn?.(
            \`[InspectorProxy] DevTools attempted to attach to device '\${resolvedDeviceId}', but no such device is registered. (Ensure app is running and port 8081 is reversed: adb reverse tcp:8081 tcp:8081).\`
          );
          socket.close(1000, "Device not registered");
          return;
        }`;

  if (content.includes(needle)) {
    const updated = content.replace(needle, replacement);
    fs.writeFileSync(targetFile, updated, 'utf8');
    console.log('[DevMiddleware Patch] Successfully patched InspectorProxy.js for graceful device re-registration.');
  }
}

applyPatch();
module.exports = applyPatch;

