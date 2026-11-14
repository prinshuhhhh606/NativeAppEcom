const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 8080;
const APK_DIR = path.join(__dirname, 'Ready_APKs');

// Find local Wi-Fi / LAN IP
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);

  // If requesting root, show APK download webpage
  if (urlPath === '/' || urlPath === '/index.html') {
    const files = fs.existsSync(APK_DIR)
      ? fs.readdirSync(APK_DIR).filter((f) => f.endsWith('.apk'))
      : [];

    const fileCards = files
      .map((file) => {
        const fullPath = path.join(APK_DIR, file);
        const stats = fs.statSync(fullPath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);
        const time = stats.mtime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        let icon = '📦';
        let color = '#2563EB';
        if (file.toLowerCase().includes('delivery')) {
          icon = '🛵';
          color = '#0D9488';
        } else if (file.toLowerCase().includes('seller')) {
          icon = '🏪';
          color = '#E11D48';
        } else if (file.toLowerCase().includes('customer')) {
          icon = '🛍️';
          color = '#4F46E5';
        } else if (file.toLowerCase().includes('admin')) {
          icon = '👑';
          color = '#D97706';
        }

        return `
        <div style="background: white; border-radius: 18px; padding: 20px; margin-bottom: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.06); border: 1px solid #E2E8F0; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div style="font-size: 32px; background: #F1F5F9; border-radius: 14px; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center;">
              ${icon}
            </div>
            <div>
              <div style="font-weight: 800; font-size: 16px; color: #0F172A;">${file}</div>
              <div style="font-size: 13px; color: #64748B; margin-top: 4px;">Size: <b>${sizeMB} MB</b> • Updated: ${time}</div>
            </div>
          </div>
          <a href="/download/${encodeURIComponent(file)}" style="background: ${color}; color: white; text-decoration: none; padding: 12px 22px; border-radius: 12px; font-weight: 800; font-size: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
            ⬇️ Download
          </a>
        </div>
      `;
      })
      .join('');

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>BharatBazaar APK Downloads</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #F8FAFC;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            padding: 20px 0;
          }
          h1 {
            color: #0F172A;
            font-size: 24px;
            margin-bottom: 6px;
          }
          p {
            color: #64748B;
            font-size: 14px;
            margin: 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📲 BharatBazaar APK Downloads</h1>
            <p>Direct download on same Wi-Fi network</p>
          </div>
          ${fileCards || '<p style="text-align:center;">No APK files found.</p>'}
        </div>
      </body>
      </html>
    `;

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(html);
  }

  // File download route
  if (urlPath.startsWith('/download/')) {
    const filename = path.basename(urlPath.replace('/download/', ''));
    const filePath = path.join(APK_DIR, filename);

    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      res.writeHead(200, {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': stat.size,
      });

      const stream = fs.createReadStream(filePath);
      return stream.pipe(res);
    }
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('File not found');
});

const localIp = getLocalIp();

server.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚀 BharatBazaar APK Server is RUNNING!`);
  console.log(`📱 Mobile phone me yeh link open karein:`);
  console.log(`   👉 http://${localIp}:${PORT}`);
  console.log(`====================================================`);
});

