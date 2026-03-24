const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 10000;
const ROOT = __dirname;

const MIME_TYPES = {
    ".html": "text/html; charset=UTF-8",
    ".css": "text/css; charset=UTF-8",
    ".js": "application/javascript; charset=UTF-8",
    ".json": "application/json; charset=UTF-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon"
};

function resolvePath(urlPath) {
    const cleanPath = decodeURIComponent(urlPath.split("?")[0]);
    const requested = cleanPath === "/" ? "/index.html" : cleanPath;
    const safe = path.normalize(requested).replace(/^(\.\.[/\\])+/, "");
    return path.join(ROOT, safe);
}

const server = http.createServer((req, res) => {
    const filePath = resolvePath(req.url);
    fs.readFile(filePath, (err, content) => {
        if (!err) {
            const ext = path.extname(filePath).toLowerCase();
            res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
            res.end(content);
            return;
        }

        fs.readFile(path.join(ROOT, "index.html"), (indexErr, indexContent) => {
            if (indexErr) {
                res.writeHead(500, { "Content-Type": "text/plain; charset=UTF-8" });
                res.end("Server error");
                return;
            }
            res.writeHead(200, { "Content-Type": "text/html; charset=UTF-8" });
            res.end(indexContent);
        });
    });
});

server.listen(PORT, () => {
    console.log(`Memory Card Game running on port ${PORT}`);
});
