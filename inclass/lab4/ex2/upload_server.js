const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = 5001;

app.use(cors());

// Absolute path to the uploads folder; create it if it is missing
const UPLOAD_DIR = path.join(__dirname, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Serve /uploads as static files so the client can view them by URL
app.use('/uploads', express.static(UPLOAD_DIR));

// Where and under which name Multer saves each file
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Only accept JPG / PNG / WEBP images
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        const error = new Error('Only image files are accepted (JPG, PNG, WEBP)!');
        error.status = 400;
        cb(error, false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB max
    fileFilter: fileFilter
});

// Build the public view + download URLs for a stored file
function buildUrls(req, filename) {
    const base = `${req.protocol}://${req.get('host')}`;
    return {
        url: `${base}/uploads/${encodeURIComponent(filename)}`,
        downloadUrl: `${base}/api/v1/download/${encodeURIComponent(filename)}`
    };
}

// Accept a single file sent in the form field named 'avatar'
app.post('/api/v1/upload-avatar', upload.single('avatar'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Please choose an image file!' });
    }
    res.json({
        success: true,
        message: 'Image uploaded successfully',
        fileInfo: {
            filename: req.file.filename,
            size: req.file.size,
            mimetype: req.file.mimetype,
            ...buildUrls(req, req.file.filename)
        }
    });
});

// ---------- Extended 1: download (browser shows a "Save As" dialog) ----------
app.get('/api/v1/download/:filename', (req, res) => {
    // basename() strips any ../ so the path cannot leave uploads/
    const safeName = path.basename(req.params.filename);
    const filePath = path.join(UPLOAD_DIR, safeName);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, message: `File "${safeName}" not found` });
    }
    res.download(filePath); // sets Content-Disposition: attachment
});

// ---------- Extended 2: list every file in uploads/ ----------
app.get('/api/v1/files', async (req, res, next) => {
    try {
        const names = await fs.promises.readdir(UPLOAD_DIR);

        const files = await Promise.all(names.map(async (name) => {
            const stats = await fs.promises.stat(path.join(UPLOAD_DIR, name));
            if (!stats.isFile()) return null; // skip sub-folders
            return {
                filename: name,
                size: stats.size,
                modifiedAt: stats.mtimeMs,
                ...buildUrls(req, name)
            };
        }));

        const data = files.filter(Boolean).sort((a, b) => b.modifiedAt - a.modifiedAt); // newest first
        res.json({ success: true, count: data.length, data });
    } catch (error) {
        next(error);
    }
});

// ---------- Extended 3: delete a file (404 if it does not exist) ----------
app.delete('/api/v1/files/:filename', async (req, res, next) => {
    const safeName = path.basename(req.params.filename);
    const filePath = path.join(UPLOAD_DIR, safeName);

    try {
        await fs.promises.unlink(filePath);
        res.json({ success: true, message: `Deleted file ${safeName}` });
    } catch (error) {
        if (error.code === 'ENOENT') {
            return res.status(404).json({ success: false, message: `File "${safeName}" not found` });
        }
        next(error);
    }
});

// Error handler: send Multer errors (file too large, wrong type) as JSON
// instead of Express's default HTML error page
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        const message = err.code === 'LIMIT_FILE_SIZE' ? 'The file is too large (max 2 MB)!' : err.message;
        return res.status(400).json({ success: false, message });
    }
    res.status(err.status || 500).json({ success: false, message: err.message });
});

app.listen(PORT, () => console.log(`Upload server running on port ${PORT}`));
