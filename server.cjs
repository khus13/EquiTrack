const http = require("http");
const fs = require("fs");
const path = require("path");

const server = http.createServer((req, res) => {
  let filePath = path.join(
    __dirname,
    "dist",
    req.url === "/" ? "index.html" : req.url,
  );
  const ext = path.extname(filePath);
  const mimeTypes = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".png": "image/png",
    ".svg": "image/svg+xml",
  };
  const contentType = mimeTypes[ext] || "application/octet-stream";

  // Handle single-page apps (SPAs) like Vite or Next.js
  if (!ext && req.url !== "/favicon.ico") {
    filePath = path.join(__dirname, "dist", "index.html");
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not Found");
    } else {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(data);
    }
  });
});

// Bind to all interfaces (not just localhost)
server.listen(51920, "0.0.0.0", () => console.log("Server on 51920"));
