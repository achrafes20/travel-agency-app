import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
const root = process.cwd();
const types = {".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".css":"text/css; charset=utf-8", ".png":"image/png", ".jpg":"image/jpeg"};
http.createServer(async (req, res) => {
 try {
  let file = path.resolve(root, "." + decodeURIComponent(new URL(req.url, "http://localhost").pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
  if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
  const body = await readFile(file);
  res.writeHead(200, {"Content-Type": types[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store"}); res.end(body);
 } catch { res.writeHead(404); res.end("Introuvable"); }
}).listen(Number(process.env.FRONTEND_PORT || 5500), "127.0.0.1", () => console.log("Frontend : http://127.0.0.1:5500/frontend/accueil.html"));

