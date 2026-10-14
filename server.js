// Student Management System - zero-dependency Node server.
// Run with:  node server.js   (no npm install needed)
// It serves the React app from /public and a small JSON API that saves to data/students.json
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_FILE = path.join(__dirname, "data", "students.json");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".jsx": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const SEED = [
  { id: 1, studentId: "100200301", name: "Thabo Mokoena", age: 20, email: "thabo.mokoena@example.com", course: "Software Engineering", enrolled: true },
  { id: 2, studentId: "100200302", name: "Lineo Ramokhele", age: 22, email: "lineo.ramokhele@example.com", course: "Information Technology", enrolled: true },
  { id: 3, studentId: "100200303", name: "Palesa Molapo", age: 19, email: "palesa.molapo@example.com", course: "Multimedia Design", enrolled: false },
];

function load() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    save(SEED);
    return SEED.slice();
  }
}
function save(list) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2));
}

function send(res, status, body) {
  res.writeHead(status, { "Content-Type": TYPES[".json"] });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1e6) req.destroy();
    });
    req.on("end", () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch (e) { reject(e); }
    });
    req.on("error", reject);
  });
}

// Server-side validation (the React form validates too, this protects the API)
function validate(s, list, ignoreId) {
  const errors = {};
  const sid = String(s.studentId || "").trim();
  if (!sid) errors.studentId = "Student ID is required";
  else if (list.some((x) => x.studentId === sid && x.id !== ignoreId)) errors.studentId = "This student ID already exists";
  if (!String(s.name || "").trim()) errors.name = "Full name is required";
  const age = Number(s.age);
  if (!Number.isInteger(age) || age < 16 || age > 100) errors.age = "Age must be a whole number from 16 to 100";
  if (!/^\S+@\S+\.\S+$/.test(String(s.email || ""))) errors.email = "Enter a valid email address";
  if (!String(s.course || "").trim()) errors.course = "Course of study is required";
  if (typeof s.enrolled !== "boolean") errors.enrolled = "Choose an enrollment status";
  return errors;
}

function clean(s, id) {
  return {
    id,
    studentId: s.studentId.trim(),
    name: s.name.trim(),
    age: Number(s.age),
    email: s.email.trim(),
    course: s.course.trim(),
    enrolled: s.enrolled,
  };
}

async function handleApi(req, res, url) {
  const m = url.pathname.match(/^\/api\/students(?:\/(\d+))?$/);
  if (!m) return send(res, 404, { error: "Not found" });
  const id = m[1] ? Number(m[1]) : null;
  const list = load();

  try {
    if (req.method === "GET" && !id) return send(res, 200, list);

    if (req.method === "POST" && !id) {
      const body = await readBody(req);
      const errors = validate(body, list, null);
      if (Object.keys(errors).length) return send(res, 400, { errors });
      const next = clean(body, list.reduce((max, s) => Math.max(max, s.id), 0) + 1);
      list.push(next);
      save(list);
      return send(res, 201, next);
    }

    if (req.method === "PUT" && id) {
      const body = await readBody(req);
      const idx = list.findIndex((s) => s.id === id);
      if (idx === -1) return send(res, 404, { error: "Student not found" });
      const errors = validate(body, list, id);
      if (Object.keys(errors).length) return send(res, 400, { errors });
      list[idx] = clean(body, id);
      save(list);
      return send(res, 200, list[idx]);
    }

    if (req.method === "DELETE" && id) {
      const idx = list.findIndex((s) => s.id === id);
      if (idx === -1) return send(res, 404, { error: "Student not found" });
      list.splice(idx, 1);
      save(list);
      return send(res, 200, { ok: true });
    }

    return send(res, 405, { error: "Method not allowed" });
  } catch {
    return send(res, 400, { error: "Invalid request body" });
  }
}

function serveStatic(req, res, url) {
  let rel = decodeURIComponent(url.pathname);
  if (rel === "/") rel = "/index.html";
  const file = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!file.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      return res.end("Not found");
    }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
    res.end(data);
  });
}

http
  .createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname.startsWith("/api/")) return handleApi(req, res, url);
    serveStatic(req, res, url);
  })
  .listen(PORT, () => console.log(`Student Management System running at http://localhost:${PORT}`));
