const express = require("express");
const { create, mine } = require("../controllers/topups.controller");
const { requireAuth } = require("../lib/auth");
const multer = require("multer");

const router = express.Router();

// Use memory storage for Cloudinary compatibility (works with both filesystem and Cloudinary)
// The image upload repository will handle saving to the appropriate storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 } // 8MB limit
});

/**
 * @swagger
 * /topups:
 *   post:
 *     summary: Create a top-up request
 *     tags: [Topups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               reference:
 *                 type: string
 *               provider:
 *                 type: string
 *               proof:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Top-up created
 *       400:
 *         description: Invalid input
 *       413:
 *         description: Uploaded file too large
 */
router.post("/", requireAuth, upload.single('proof'), create);
/**
 * @swagger
 * /topups/mine:
 *   get:
 *     summary: Get current user's top-up requests
 *     tags: [Topups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of top-ups
 *       401:
 *         description: Unauthorized
 */
router.get("/mine", requireAuth, mine);

module.exports = router;
