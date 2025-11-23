const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto');
const Notifications = require('./notifications.controller');
const RepositoryFactory = require('../repositories/repository.factory');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
fs.ensureDirSync(UPLOAD_DIR);

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// GET /admin/users
exports.list = async (req, res) => {
  try {
    const userRepo = RepositoryFactory.getUserRepository();
    const users = await userRepo.findAll({});
    
    const safe = users.map(u => {
      const { passwordHash, password, salt, ...safeUser } = u;
      return {
        ...safeUser,
        passwordSet: !!(passwordHash || password),
      };
    });
    
    res.json({ status: 200, data: safe });
  } catch (err) {
    console.error("[ADMIN.USERS] list error:", err);
    res.status(500).json({ error: "Failed to list users" });
  }
};

// POST /admin/users/:id/reset-token  -> generate one-time reset token
exports.generateResetToken = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Missing user id" });

    // generate token
    const token = crypto.randomBytes(20).toString("hex");
    const expiresAt = Date.now() + TOKEN_TTL_MS;

    const userRepo = RepositoryFactory.getUserRepository();
    const user = await userRepo.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    await userRepo.update(id, {
      resetToken: token,
      resetTokenExpiresAt: new Date(expiresAt).toISOString()
    });

    res.json({ ok: true, token, expiresAt });
  } catch (err) {
    console.error("[ADMIN.USERS] reset token error:", err);
    res.status(500).json({ error: "Failed to generate reset token" });
  }
};

// PUT /admin/users/:id
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, studentId, phone, removePhoto, note } = req.body;

    const userRepo = RepositoryFactory.getUserRepository();
    const user = await userRepo.findById(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Validate student ID uniqueness
    if (studentId && studentId !== user.studentId) {
      const exists = await userRepo.findOne({ studentId: String(studentId) });
      if (exists && String(exists.id) !== String(id)) {
        return res.status(409).json({ error: 'Student ID already in use' });
      }
    }

    const update = {};
    if (name) update.name = name;
    if (studentId) update.studentId = studentId;
    if (phone) update.phone = phone;

    // Handle profile picture
    if (removePhoto === 'true') {
      if (user.profilePictureUrl) {
        const filePath = path.join(UPLOAD_DIR, path.basename(user.profilePictureUrl));
        try {
          await fs.unlink(filePath);
        } catch (err) {
          console.error('Failed to delete profile picture:', err);
        }
        update.profilePictureUrl = null;
      }
    } else if (req.file) {
      const ext = path.extname(req.file.originalname) || '.jpg';
      const filename = `profile-${user.id}-${Date.now()}${ext}`;
      const filePath = path.join(UPLOAD_DIR, filename);

      // Delete old photo if exists
      if (user.profilePictureUrl) {
        const oldPath = path.join(UPLOAD_DIR, path.basename(user.profilePictureUrl));
        try {
          await fs.unlink(oldPath);
        } catch (err) {
          console.error('Failed to delete old profile picture:', err);
        }
      }

      // Save new photo
      await fs.writeFile(filePath, req.file.buffer);
      update.profilePictureUrl = `/uploads/${filename}`;
    }

    const updated = await userRepo.update(id, update);
    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If admin left a note, notify the user
    if (note && String(note).trim()) {
      try {
        await Notifications.addNotification({
          id: "notif_" + Date.now().toString(36),
          for: updated.id,
          actor: req.user?.id || 'admin',
          type: 'admin:profile-note',
          title: 'Message from Admin',
          body: String(note),
          data: { note: String(note) },
          read: false,
          createdAt: new Date().toISOString()
        });
      } catch (e) {
        console.error("Failed to create admin-note notification:", e && e.message);
      }
    }

    return res.json({
      ok: true,
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        studentId: updated.studentId,
        phone: updated.phone,
        profilePictureUrl: updated.profilePictureUrl,
        role: updated.role
      }
    });
  } catch (err) {
    console.error('Update user failed:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// DELETE /admin/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Missing user id" });

    const userRepo = RepositoryFactory.getUserRepository();
    const user = await userRepo.findById(id);
    
    if (!user) return res.status(404).json({ error: "User not found" });
    if (String(user.role || '').toLowerCase() === 'admin') {
      return res.status(403).json({ error: "Cannot delete administrator accounts" });
    }
    if ((user.balance || 0) !== 0) {
      return res.status(400).json({ error: "User must have zero balance before deletion" });
    }

    const result = await userRepo.delete(id);
    if (!result) return res.status(404).json({ error: "User not found" });
    
    res.json({ ok: true });
  } catch (err) {
    console.error("[ADMIN.USERS] deleteUser error:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
};