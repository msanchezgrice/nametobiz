const http = require('http');
const path = require('path');
const fs = require('fs');

const server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>NametoBiz - Test Deployment</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .container { max-width: 800px; margin: 0 auto; }
            .success { color: green; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🎉 NametoBiz Deployment Success!</h1>
            <p class="success">✅ Server is running successfully without pnpm!</p>
            <p>This deployment used npm exclusively and bypassed all pnpm detection issues.</p>
            <p>Time: ${new Date().toISOString()}</p>
            <p>Node.js version: ${process.version}</p>
            <p>Environment: ${process.env.NODE_ENV || 'development'}</p>
            
            <h2>Next Steps:</h2>
            <ul>
              <li>✅ Deployment working</li>
              <li>🔄 Can now build Next.js properly</li>
              <li>🚀 Job processing should work</li>
            </ul>
          </div>
        </body>
      </html>
    `);
  } else if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }));
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`✅ Successfully deployed with npm (no pnpm)`);
}); 