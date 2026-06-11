import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import multer from "multer";
import * as XLSX from "xlsx";
import PDFDocument from "pdfkit";
import * as pdflib from 'pdf-lib';
const { PDFDocument: PDFLib, StandardFonts, rgb } = pdflib;
import cron from "node-cron";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "default_secret_key_for_local_dms";
const PORT = 3000;

// Initialize Database
const dbPath = process.env.DATABASE_PATH || "archive.db";
const dbDir = path.dirname(dbPath);
if (dbDir && dbDir !== "." && !fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const db = new Database(dbPath);

// Create Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
    department TEXT DEFAULT 'General',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  );

  -- Initial data
  INSERT OR IGNORE INTO departments (name) VALUES ('Général'), ('Logistique'), ('Finance'), ('Juridique'), ('RH');
  INSERT OR IGNORE INTO categories (name) VALUES ('Général'), ('Factures'), ('Contrats'), ('Personnel'), ('Taxes');

  CREATE TABLE IF NOT EXISTS folders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    parentPath TEXT DEFAULT '/',
    type TEXT NOT NULL CHECK (type IN ('digital', 'warehouse')),
    trackingCode TEXT UNIQUE,
    UNIQUE(name, parentPath, type)
  );

  -- Migration for existing folders table
  PRAGMA table_info(folders); -- Just to be sure
  
  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    trackingCode TEXT UNIQUE,
    uploadDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    ocrContent TEXT,
    digitalPath TEXT,
    category TEXT DEFAULT 'General',
    department TEXT DEFAULT 'General',
    folderId INTEGER,
    scannerSignature TEXT,
    status TEXT NOT NULL CHECK (status IN ('Archived', 'Checked-out', 'Destroyed')),
    authorId INTEGER,
    aisle TEXT,
    rack TEXT,
    shelf TEXT,
    box TEXT,
    boxTrackingCode TEXT,
    FOREIGN KEY (authorId) REFERENCES users(id),
    FOREIGN KEY (folderId) REFERENCES folders(id)
  );
`);

// Migration for existing tables
try {
  db.exec("ALTER TABLE folders ADD COLUMN trackingCode TEXT UNIQUE");
} catch (e) {}
try {
  db.prepare("ALTER TABLE documents ADD COLUMN trackingCode TEXT UNIQUE").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE documents ADD COLUMN boxTrackingCode TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE documents ADD COLUMN notes TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE documents ADD COLUMN client TEXT").run();
} catch (e) {}

// Bootstrap Admin User
const adminExists = db.prepare("SELECT * FROM users WHERE username = ?").get("direction@ym-transit.com");
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync("admin", 10);
  db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run(
    "direction@ym-transit.com",
    hashedPassword,
    "admin"
  );
  console.log("Admin user bootstrapped: direction@ym-transit.com / admin");
}

async function startServer() {
  const app = express();
  
  app.use(express.json());
  app.use(cookieParser());

  // Configure Multer for structured storage
  const storage = multer.diskStorage({
    destination: (req: any, file, cb) => {
      const { department = 'General', category = 'General' } = req.query;
      const now = new Date();
      const year = now.getFullYear().toString();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      
      const uploadPath = path.join(process.cwd(), 'uploads', department as string, category as string, year, month);
      
      fs.mkdirSync(uploadPath, { recursive: true });
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + '-' + file.originalname);
    }
  });

  const upload = multer({ storage });

  // Serve uploads statically
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.cookies.token;
    if (!token) {
      console.log('>>> [AUTH] No token found in cookies');
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      console.log('>>> [AUTH] Invalid token:', err instanceof Error ? err.message : String(err));
      res.status(401).json({ error: "Invalid token" });
    }
  };

  const authorize = (roles: string[]) => (req: any, res: any, next: any) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };

  // --- API Routes ---
  
  // Get documents by box tracking code (for QR scanning)
  app.get("/api/boxes/:boxCode", authenticate, (req, res) => {
    const { boxCode } = req.params;
    const docs = db.prepare(`
      SELECT d.*, u.username as authorName, f.name as folderName
      FROM documents d 
      JOIN users u ON d.authorId = u.id
      LEFT JOIN folders f ON d.folderId = f.id
      WHERE d.boxTrackingCode = ?
    `).all(boxCode);
    
    res.json(docs.map((d: any) => ({
      id: d.id,
      filename: d.filename,
      trackingCode: d.trackingCode,
      uploadDate: d.uploadDate,
      ocrContent: d.ocrContent,
      digitalPath: d.digitalPath,
      category: d.category,
      department: d.department,
      folderId: d.folderId,
      folderName: d.folderName,
      scannerSignature: d.scannerSignature,
      status: d.status,
      authorUid: d.authorId.toString(),
      authorName: d.authorName,
      notes: d.notes,
      client: d.client,
      physicalLocation: {
        aisle: d.aisle,
        rack: d.rack,
        shelf: d.shelf,
        box: d.box,
        boxTrackingCode: d.boxTrackingCode
      }
    })));
  });

  // Update location for all documents in a box
  app.patch("/api/boxes/:boxCode/location", authenticate, authorize(["admin", "editor"]), (req, res) => {
    const { boxCode } = req.params;
    const { aisle, rack, shelf } = req.body;

    try {
      db.prepare(`
        UPDATE documents 
        SET aisle = ?, rack = ?, shelf = ?
        WHERE boxTrackingCode = ?
      `).run(aisle, rack, shelf, boxCode);

      res.json({ success: true });
    } catch (err) {
      console.error('Failed to update box location:', err);
      res.status(500).json({ error: "Erreur lors de la mise à jour de la boîte" });
    }
  });

  app.get("/api/ping", (req, res) => {
    console.log('>>> [DEBUG] Ping received');
    res.send("pong");
  });

  // Export Documents to PDF with Filters (using pdf-lib for reliability)
  app.get("/api/documents/export", authenticate, async (req, res) => {
    console.log('>>> [DEBUG] Export request received:', req.query);
    try {
      const { startDate, endDate, category, department, client, search } = req.query;
      
      let query = `
        SELECT d.*, u.username as authorName, f.name as folderName
        FROM documents d 
        JOIN users u ON d.authorId = u.id
        LEFT JOIN folders f ON d.folderId = f.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (startDate) {
        query += " AND d.uploadDate >= ?";
        params.push(`${startDate} 00:00:00`);
      }
      if (endDate) {
        query += " AND d.uploadDate <= ?";
        params.push(`${endDate} 23:59:59`);
      }
      if (category && category !== 'all') {
        query += " AND d.category = ?";
        params.push(category);
      }
      if (department && department !== 'all') {
        query += " AND d.department = ?";
        params.push(department);
      }
      if (client) {
        query += " AND d.client LIKE ?";
        params.push(`%${client}%`);
      }
      if (search) {
        query += " AND (d.filename LIKE ? OR d.ocrContent LIKE ? OR d.trackingCode LIKE ? OR d.notes LIKE ?)";
        const searchParam = `%${search}%`;
        params.push(searchParam, searchParam, searchParam, searchParam);
      }

      console.log('>>> [DEBUG] Executing export query:', query, params);
      const docs = db.prepare(query).all(...params);
      console.log(`>>> [DEBUG] Found ${docs.length} documents for export`);

      if (docs.length === 0) {
        console.log('>>> [DEBUG] No documents found for export criteria');
        return res.status(404).json({ error: "Aucun document trouvé pour ces critères" });
      }

      console.log('>>> [DEBUG] Starting PDF generation with pdf-lib...');
      const pdfDoc = await PDFLib.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      let page = pdfDoc.addPage([595.28, 841.89]); // A4
      const { width, height } = page.getSize();
      let y = height - 50;

      // Header
      page.drawText('RAPPORT D\'ARCHIVAGE DOCUMENTAIRE', {
        x: 50,
        y: y,
        size: 20,
        font: boldFont,
        color: rgb(0.1, 0.1, 0.1),
      });
      y -= 25;
      
      page.drawText(`Genere le: ${new Date().toLocaleString()}`, {
        x: 50,
        y: y,
        size: 10,
        font: font,
        color: rgb(0.4, 0.4, 0.4),
      });
      y -= 40;

      // Filter Summary
      page.drawText('Criteres de selection:', { x: 50, y: y, size: 12, font: boldFont });
      y -= 15;
      page.drawText(`Periode: ${startDate || 'Debut'} au ${endDate || 'Fin'} | Dept: ${department || 'Tous'} | Cat: ${category || 'Toutes'}`, { x: 50, y: y, size: 10, font: font });
      y -= 15;
      page.drawText(`Client: ${client || 'Tous'} | Total: ${docs.length} documents`, { x: 50, y: y, size: 10, font: font });
      y -= 30;

      page.drawLine({ start: { x: 50, y: y }, end: { x: 550, y: y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
      y -= 30;

      // Helper to sanitize text for Helvetica (WinAnsi)
      const sanitize = (text: any) => {
        if (text === null || text === undefined) return '';
        return String(text).replace(/[^\x20-\x7E\xA0-\xFF]/g, '?');
      };

      // Document List
      (docs as any[]).forEach((d, index) => {
        try {
          if (y < 100) {
            page = pdfDoc.addPage([595.28, 841.89]);
            y = height - 50;
          }

          page.drawText(`${index + 1}. ${sanitize(d.filename) || 'Sans nom'}`, { x: 50, y: y, size: 12, font: boldFont, color: rgb(0.31, 0.27, 0.9) });
          y -= 15;
          page.drawText(`ID: ${d.id} | Tracabilite: ${sanitize(d.trackingCode) || 'N/A'}`, { x: 50, y: y, size: 9, font: font, color: rgb(0.4, 0.45, 0.55) });
          y -= 15;
          
          const details = `Client: ${sanitize(d.client) || 'N/A'} | Date: ${sanitize(d.uploadDate) || 'N/A'} | Statut: ${sanitize(d.status) || 'N/A'}`;
          page.drawText(details, { x: 50, y: y, size: 9, font: font });
          y -= 12;
          
          const loc = `Localisation: Allee ${sanitize(d.aisle) || '-'}, Rayon ${sanitize(d.rack) || '-'}, Etagere ${sanitize(d.shelf) || '-'}, Boite ${sanitize(d.box) || '-'}`;
          page.drawText(loc, { x: 50, y: y, size: 9, font: font });
          y -= 12;
          
          const sys = `Dept: ${sanitize(d.department) || 'N/A'} | Cat: ${sanitize(d.category) || 'N/A'} | Dossier: ${sanitize(d.folderName) || 'Racine'}`;
          page.drawText(sys, { x: 50, y: y, size: 9, font: font });
          y -= 15;

          if (d.notes) {
            const notesText = `Notes: ${sanitize(String(d.notes).substring(0, 200))}${String(d.notes).length > 200 ? '...' : ''}`;
            page.drawText(notesText, { x: 50, y: y, size: 9, font: font, color: rgb(0.2, 0.5, 0.3) });
            y -= 15;
          }

          page.drawLine({ start: { x: 50, y: y }, end: { x: 550, y: y }, thickness: 0.5, color: rgb(0.9, 0.9, 0.9) });
          y -= 25;
        } catch (docErr) {
          console.error(`>>> [DEBUG] Error drawing document ${index}:`, docErr);
        }
      });

      console.log('>>> [DEBUG] Saving PDF...');
      const pdfBytes = await pdfDoc.save();
      console.log(`>>> [DEBUG] PDF saved, size: ${pdfBytes.length} bytes`);
      const filename = `rapport_archivage_${Date.now()}.pdf`;

      console.log('>>> [DEBUG] Sending PDF headers and content...');
      const pdfBuffer = Buffer.from(pdfBytes);
      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=${filename}`,
        'Content-Length': pdfBuffer.length,
        'Cache-Control': 'no-cache'
      });
      res.end(pdfBuffer);
      console.log('>>> [DEBUG] PDF sent to client successfully');
    } catch (error) {
      console.error('>>> [DEBUG] Export error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Echec de la generation du PDF", details: error instanceof Error ? error.message : String(error) });
      }
    }
  });

  // File Upload Endpoint
  app.post("/api/upload", authenticate, upload.single('file'), (req: any, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    
    // Return the relative path for storage in DB
    const relativePath = path.relative(process.cwd(), req.file.path);
    res.json({ path: relativePath });
  });

  // Auth Endpoints
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    const user: any = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role, department: user.department }, JWT_SECRET, { expiresIn: "24h" });
    res.cookie("token", token, { httpOnly: true, sameSite: "strict" });
    res.json({ id: user.id, username: user.username, role: user.role, department: user.department });
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ success: true });
  });

  app.get("/api/auth/me", authenticate, (req: any, res) => {
    res.json(req.user);
  });

  // User Management (Admin Only)
  app.get("/api/users", authenticate, authorize(["admin"]), (req, res) => {
    const users = db.prepare("SELECT id, username, role, createdAt FROM users").all();
    res.json(users);
  });

  app.post("/api/users", authenticate, authorize(["admin"]), (req, res) => {
    const { username, password, role } = req.body;
    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run(username, hashedPassword, role);
      res.status(201).json({ success: true });
    } catch (err) {
      res.status(400).json({ error: "Username already exists" });
    }
  });

  // Folder Management
  app.get("/api/folders", authenticate, (req, res) => {
    const folders = db.prepare("SELECT * FROM folders").all();
    res.json(folders);
  });

  app.post("/api/folders", authenticate, authorize(["admin"]), (req, res) => {
    const { name, parentPath, type } = req.body;
    const trackingCode = `FLD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    try {
      db.prepare("INSERT INTO folders (name, parentPath, type, trackingCode) VALUES (?, ?, ?, ?)").run(name, parentPath || '/', type, trackingCode);
      res.status(201).json({ success: true, trackingCode });
    } catch (err) {
      res.status(400).json({ error: "Folder already exists in this path" });
    }
  });

  // Department Endpoints
  app.get("/api/departments", authenticate, (req, res) => {
    const depts = db.prepare("SELECT * FROM departments").all();
    res.json(depts);
  });

  app.post("/api/departments", authenticate, authorize(["admin"]), (req, res) => {
    const { name } = req.body;
    try {
      db.prepare("INSERT INTO departments (name) VALUES (?)").run(name);
      res.status(201).json({ success: true });
    } catch (err) {
      res.status(400).json({ error: "Department already exists" });
    }
  });

  app.delete("/api/departments/:id", authenticate, authorize(["admin"]), (req, res) => {
    db.prepare("DELETE FROM departments WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Category Endpoints
  app.get("/api/categories", authenticate, (req, res) => {
    const cats = db.prepare("SELECT * FROM categories").all();
    res.json(cats);
  });

  app.post("/api/categories", authenticate, authorize(["admin"]), (req, res) => {
    const { name } = req.body;
    try {
      db.prepare("INSERT INTO categories (name) VALUES (?)").run(name);
      res.status(201).json({ success: true });
    } catch (err) {
      res.status(400).json({ error: "Category already exists" });
    }
  });

  app.delete("/api/categories/:id", authenticate, authorize(["admin"]), (req, res) => {
    db.prepare("DELETE FROM categories WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Monitoring Stats
  app.get("/api/monitoring", authenticate, (req, res) => {
    const stats = db.prepare(`
      SELECT department, COUNT(*) as count 
      FROM documents 
      GROUP BY department
    `).all();
    const total = db.prepare("SELECT COUNT(*) as count FROM documents").get() as { count: number };
    res.json({ departments: stats, total: total.count });
  });

  // Document Endpoints
  app.get("/api/documents", authenticate, (req, res) => {
    const docs = db.prepare(`
      SELECT d.*, u.username as authorName, f.name as folderName
      FROM documents d 
      JOIN users u ON d.authorId = u.id
      LEFT JOIN folders f ON d.folderId = f.id
    `).all();
    res.json(docs.map((d: any) => ({
      id: d.id,
      filename: d.filename,
      trackingCode: d.trackingCode,
      uploadDate: d.uploadDate,
      ocrContent: d.ocrContent,
      digitalPath: d.digitalPath,
      category: d.category,
      department: d.department,
      folderId: d.folderId,
      folderName: d.folderName,
      scannerSignature: d.scannerSignature,
      status: d.status,
      authorUid: d.authorId.toString(),
      authorName: d.authorName,
      notes: d.notes,
      client: d.client,
      physicalLocation: {
        aisle: d.aisle,
        rack: d.rack,
        shelf: d.shelf,
        box: d.box,
        boxTrackingCode: d.boxTrackingCode
      }
    })));
  });

  app.post("/api/documents", authenticate, authorize(["admin", "editor"]), (req: any, res) => {
    const { filename, ocrContent, digitalPath, category, department, folderId, scannerSignature, status, physicalLocation, notes, client } = req.body;
    const { aisle, rack, shelf, box } = physicalLocation;
    
    // Generate tracking code based on physical location: A[aisle]-R[rack]-S[shelf]-B[box]-[random]
    const locPrefix = `${aisle || 'X'}${rack || 'X'}${shelf || 'X'}${box || 'X'}`.toUpperCase().replace(/\s+/g, '');
    const trackingCode = `DOC-${locPrefix}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const boxTrackingCode = box ? `BOX-${box.toUpperCase().replace(/\s+/g, '')}-${Math.random().toString(36).substring(2, 5).toUpperCase()}` : null;

    const result = db.prepare(`
      INSERT INTO documents (filename, trackingCode, ocrContent, digitalPath, category, department, folderId, scannerSignature, status, authorId, aisle, rack, shelf, box, boxTrackingCode, notes, client)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      filename, 
      trackingCode,
      ocrContent, 
      digitalPath, 
      category || 'General', 
      department || req.user.department || 'General',
      folderId || null,
      scannerSignature || req.user.username,
      status, 
      req.user.id, 
      aisle, 
      rack, 
      shelf, 
      box,
      boxTrackingCode,
      notes || null,
      client || null
    );
    
    res.status(201).json({ id: result.lastInsertRowid, trackingCode, boxTrackingCode });
  });

  app.patch("/api/documents/:id/location", authenticate, authorize(["admin", "editor"]), (req, res) => {
    const { aisle, rack, shelf, box } = req.body;
    const { id } = req.params;

    try {
      // We might want to update the tracking code too if the location changes
      // but usually tracking codes are immutable once assigned. 
      // For now, let's just update the location fields.
      db.prepare(`
        UPDATE documents 
        SET aisle = ?, rack = ?, shelf = ?, box = ?
        WHERE id = ?
      `).run(aisle, rack, shelf, box, id);

      res.json({ success: true });
    } catch (err) {
      console.error('Failed to update document location:', err);
      res.status(500).json({ error: "Erreur lors de la mise à jour de la localisation" });
    }
  });

  app.delete("/api/documents/:id", authenticate, authorize(["admin"]), (req, res) => {
    db.prepare("DELETE FROM documents WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Daily export at midnight in PDF format
  cron.schedule('0 0 * * *', () => {
    try {
      const docs = db.prepare(`
        SELECT d.*, u.username as authorName, f.name as folderName
        FROM documents d 
        JOIN users u ON d.authorId = u.id
        LEFT JOIN folders f ON d.folderId = f.id
      `).all();

      const exportDir = path.join(process.cwd(), 'exports');
      if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir);

      const dateStr = new Date().toISOString().split('T')[0];
      const filePath = path.join(exportDir, `daily_export_${dateStr}.pdf`);
      
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text('RAPPORT QUOTIDIEN D\'ARCHIVAGE', { align: 'center' });
      doc.fontSize(10).text(`Date: ${dateStr}`, { align: 'center' });
      doc.moveDown(2);

      docs.forEach((d: any, index: number) => {
        if (doc.y > 700) doc.addPage();
        doc.fontSize(10).font('Helvetica-Bold').text(`${index + 1}. ${d.filename}`);
        doc.fontSize(8).font('Helvetica').text(`ID: ${d.id} | Client: ${d.client || 'N/A'} | Date: ${d.uploadDate} | Statut: ${d.status}`);
        doc.moveDown(0.5);
      });

      doc.end();
      console.log(`Daily PDF export generated: ${filePath}`);
    } catch (err) {
      console.error('Daily PDF export failed:', err);
    }
  });

  // --- Vite / Static Files ---

  const isProduction = process.env.NODE_ENV === "production";
  const distPath = path.join(process.cwd(), "dist");
  const hasDist = fs.existsSync(distPath);

  if (!isProduction || !hasDist) {
    if (isProduction && !hasDist) {
      console.warn(">>> [WARN] Production mode requested but 'dist' directory not found. Falling back to Vite dev server.");
    }
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        host: true // Allow network access for Vite
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🚀 Server is running!`);
    console.log(`🏠 Local:    http://localhost:${PORT}`);
    console.log(`🌐 Network:  http://0.0.0.0:${PORT} (Use your computer's IP address)\n`);
  });
}

startServer();
