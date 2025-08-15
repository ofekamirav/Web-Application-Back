import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";

const router = express.Router();

const base = (process.env.DOMAIN_BASE || "").replace(/\/+$/,""); 
const STORAGE_ROOT = process.env.STORAGE_DIR || path.resolve("storage");

const ALLOWED_FOLDERS = new Set(["recipes", "profile_pictures", "defaults"]);

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}
ensureDir(STORAGE_ROOT);
for (const f of ALLOWED_FOLDERS) ensureDir(path.join(STORAGE_ROOT, f));

const storage = multer.diskStorage({
  destination: function (req, _file, cb) {
    const raw = (req.query.folder as string) || (req.body.folder as string) || "recipes";
    const folder = ALLOWED_FOLDERS.has(raw) ? raw : "recipes";
    const dest = path.join(STORAGE_ROOT, folder);
    ensureDir(dest);
    cb(null, dest);
  },
  filename: function (_req, file, cb) {
    const ext = path.extname(file.originalname) || ".jpg";
    const name = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif|avif)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

router.post("/", upload.single("file"), (req, res) => {
  if (!req.file) {
    res.status(400).send({ message: "No file uploaded" });
    return;
  }
  
  const relative = "/storage/" + path.relative(STORAGE_ROOT, req.file.path).replace(/\\/g, "/");
  const url = base ? `${base}${relative}` : relative;
  console.log("POST /file:", url);
  res.status(200).send({ url });
});

export default router;
