/**
 * Automatic ADB Reverse Forwarder for Android Development
 * Automatically detects connected Android devices and forwards port 5000
 * Keeps forwarding alive even if the phone screen locks or USB is reconnected.
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function findAdb() {
  const localAppData = process.env.LOCALAPPDATA || '';
  const standardPath = path.join(localAppData, 'Android', 'Sdk', 'platform-tools', 'adb.exe');
  if (fs.existsSync(standardPath)) {
    return standardPath;
  }
  return 'adb';
}

function syncAdbReverse() {
  try {
    const adb = findAdb();
    const list = execSync(`"${adb}" reverse --list`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    if (!list.includes('5000')) {
      execSync(`"${adb}" reverse tcp:5000 tcp:5000`, { stdio: 'ignore' });
      execSync(`"${adb}" reverse tcp:8081 tcp:8081`, { stdio: 'ignore' });
      console.log('📱 [ADB] Successfully forwarded port 5000 (Backend API) & 8081 (Metro) to connected Android device.');
    }
  } catch (err) {
    // Graceful fallback when no physical Android device is connected or ADB is inactive
  }
}

function startAdbReverseWatcher() {
  if (process.env.NODE_ENV === 'production') return;

  // Immediate initial sync
  syncAdbReverse();

  // Keepalive interval every 5 seconds in development
  const interval = setInterval(syncAdbReverse, 5000);
  interval.unref(); // Do not prevent process from exiting
}

module.exports = { startAdbReverseWatcher };

