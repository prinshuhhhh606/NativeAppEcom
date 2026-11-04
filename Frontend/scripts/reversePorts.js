/**
 * Comprehensive ADB Reverse & Port Forwarding Utility for React Native (Android)
 * - Automatically finds adb.exe across PATH, ANDROID_HOME, and standard SDK locations
 * - Detects all active devices and emulators
 * - Reverses port 8081 (Metro Bundler & DevTools Inspector Proxy) and 5000 (Backend API)
 * - Diagnoses zombie processes on port 8081
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const net = require('net');

function findAdb() {
  const localAppData = process.env.LOCALAPPDATA || '';
  const userProfile = process.env.USERPROFILE || '';
  const androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK || process.env.ANDROID_SDK_ROOT || '';

  const candidates = [
    // Standard environment variables
    androidHome ? path.join(androidHome, 'platform-tools', 'adb.exe') : '',
    androidHome ? path.join(androidHome, 'platform-tools', 'adb') : '',

    // Standard Windows AppData paths (case-sensitive variants)
    path.join(localAppData, 'Android', 'Sdk', 'platform-tools', 'adb.exe'),
    path.join(localAppData, 'Android', 'sdk', 'platform-tools', 'adb.exe'),
    path.join(userProfile, 'AppData', 'Local', 'Android', 'Sdk', 'platform-tools', 'adb.exe'),
    path.join(userProfile, 'AppData', 'Local', 'Android', 'sdk', 'platform-tools', 'adb.exe'),

    // Root drive Android paths
    'C:\\Android\\platform-tools\\adb.exe',
    'C:\\platform-tools\\adb.exe',
    'D:\\Android\\platform-tools\\adb.exe',
  ];

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  // Check PATH entries
  const pathEntries = (process.env.PATH || '').split(path.delimiter);
  for (const entry of pathEntries) {
    const candidate = path.join(entry, process.platform === 'win32' ? 'adb.exe' : 'adb');
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return 'adb';
}

function getConnectedDevices(adbPath) {
  try {
    const output = execSync(`"${adbPath}" devices`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    const lines = output.trim().split('\n').slice(1); // skip header
    const devices = [];
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 2 && parts[1] === 'device') {
        devices.push(parts[0]);
      }
    }
    return devices;
  } catch (err) {
    return [];
  }
}

function reversePorts() {
  const adb = findAdb();
  console.log(`[ADB] Using ADB binary: ${adb}`);

  const devices = getConnectedDevices(adb);

  if (devices.length === 0) {
    console.log('[ADB] No active Android devices/emulators detected in "device" state.');
    console.log('      To connect:');
    console.log('      1. Start an Android Emulator OR plug in a phone via USB with USB Debugging enabled.');
    console.log('      2. Run: adb devices');
    console.log('      3. If your app is already open, run: npm run reverse\n');
    return;
  }

  console.log(`[ADB] Found ${devices.length} connected device(s): ${devices.join(', ')}`);

  for (const deviceId of devices) {
    try {
      // Reverse Metro & Inspector Proxy port (8081)
      execSync(`"${adb}" -s ${deviceId} reverse tcp:8081 tcp:8081`, { stdio: 'pipe' });
      // Reverse Backend API port (5000)
      execSync(`"${adb}" -s ${deviceId} reverse tcp:5000 tcp:5000`, { stdio: 'pipe' });
      console.log(`[ADB] [${deviceId}] Successfully reversed tcp:8081 (Metro/Inspector) and tcp:5000 (Backend API).`);
    } catch (e) {
      console.warn(`[ADB] [${deviceId}] Warning setting port reverse:`, e.message);
    }
  }

  // Verify reverse bindings
  try {
    const list = execSync(`"${adb}" reverse --list`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    if (list && list.trim()) {
      console.log('[ADB] Active Reverse Tunnel Bindings:\n' + list.trim().split('\n').map(l => '      ' + l).join('\n'));
    }
  } catch (ignore) {}
}

// Auto-run port reverse
reversePorts();

// Also run InspectorProxy patch if needed
try {
  const patchScript = path.join(__dirname, 'patchInspectorProxy.js');
  if (fs.existsSync(patchScript)) {
    require(patchScript);
  }
} catch (patchErr) {
  // Gracefully continue
}
