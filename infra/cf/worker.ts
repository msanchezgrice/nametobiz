function getContentType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'html': return 'text/html';
    case 'css': return 'text/css';
    case 'js': return 'application/javascript';
    case 'json': return 'application/json';
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'gif': return 'image/gif';
    case 'svg': return 'image/svg+xml';
    case 'ico': return 'image/x-icon';
    case 'woff': return 'font/woff';
    case 'woff2': return 'font/woff2';
    case 'ttf': return 'font/ttf';
    case 'otf': return 'font/otf';
    case 'pdf': return 'application/pdf';
    case 'txt': return 'text/plain';
    default: return 'application/octet-stream';
  }
}

export default {
  async fetch(req: Request, env: any): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname.startsWith("/site/")) {
      const key = url.pathname.replace("/site/", "");
      const obj = await env.BUNDLES.get(key, { cacheTtl: 31536000 });
      if (!obj) return new Response("404", { status: 404 });
      
      const contentType = getContentType(key);
      let body = obj.body;
      
      // Fix absolute paths in HTML files to be relative
      if (contentType === 'text/html') {
        const text = await obj.text();
        const fixedHtml = text
          .replace(/href="\/([^"]+)"/g, 'href="$1"')     // Fix navigation links
          .replace(/src="\/([^"]+)"/g, 'src="$1"')       // Fix asset links
          .replace(/action="\/([^"]+)"/g, 'action="$1"') // Fix form actions
          .replace(/window\.location\.href\s*=\s*['"]\/([^'"]+)['"]/g, 'window.location.href="$1"'); // Fix JS redirects
        body = fixedHtml;
      }
      
      return new Response(body, {
        headers: { 
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    return new Response("Bad route", { status: 404 });
  }
}; 