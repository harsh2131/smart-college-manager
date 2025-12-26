const express = require('express');
const upload = require('../config/multer.config');
const authMiddleware = require('../middleware/auth.middleware');
const path = require('path');

const router = express.Router();

/**
 * @route   POST /api/upload
 * @desc    Upload a single file
 * @access  Authenticated users
 */
router.post('/', authMiddleware, upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const fileUrl = `/uploads/${req.file.filename}`;

        res.json({
            success: true,
            message: 'File uploaded successfully',
            file: {
                url: fileUrl,
                originalName: req.file.originalname,
                filename: req.file.filename,
                size: req.file.size,
                mimetype: req.file.mimetype
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ success: false, message: 'Upload failed' });
    }
});

/**
 * @route   POST /api/upload/multiple
 * @desc    Upload multiple files (max 5)
 * @access  Authenticated users
 */
router.post('/multiple', authMiddleware, upload.array('files', 5), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: 'No files uploaded' });
        }

        const files = req.files.map(file => ({
            url: `/uploads/${file.filename}`,
            originalName: file.originalname,
            filename: file.filename,
            size: file.size,
            mimetype: file.mimetype
        }));

        res.json({
            success: true,
            message: `${files.length} file(s) uploaded successfully`,
            files
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ success: false, message: 'Upload failed' });
    }
});

// Error handling for multer
router.use((error, req, res, next) => {
    if (error instanceof require('multer').MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ success: false, message: 'File too large. Max 10MB allowed.' });
        }
        return res.status(400).json({ success: false, message: error.message });
    }
    if (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
    next();
});

module.exports = router;
