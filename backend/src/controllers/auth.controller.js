const bcrypt = require("bcryptjs");
const { load, save } = require("../lib/db");
const { sign } = require("../lib/auth");
const Notifications = require("./notifications.controller");
const path = require("path");
const fs = require("fs-extra");
const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
fs.ensureDirSync(UPLOAD_DIR);

/**
 * Helper: are we connected to Mongo?
 */
function usingMongo() {
  return !!(mongoose && mongoose.connection && mongoose.connection.readyState === 1);
}

// Helper to save profile picture
function saveProfilePicture(file, userId) {
  if (!file || !file.buffer) return null;
  const ext = path.extname(file.originalname) || '.jpg';
  const filename = `${userId}-${Date.now()}${ext}`;
  const outPath = path.join(UPLOAD_DIR, filename);
  fs.writeFileSync(outPath, file.buffer);
  return `/uploads/${filename}`;
}

exports.me = async (req, res) => {
  try {
    const uid = req.user?.id || req.user?._id;
    if (!uid) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (usingMongo()) {
      const db = mongoose.connection.db;
      const user = await db.collection("users").findOne({ $or: [{ id: String(uid) }, { _id: ObjectId.isValid(uid) ? new ObjectId(uid) : null }] });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { passwordHash, password, ...safeUser } = user;
      return res.json({ status: 200, data: safeUser });
    }

    const db = load();
    const user = db.users.find(u => String(u.id) === String(uid));
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const { passwordHash, ...safeUser } = user;
    res.json({ status: 200, data: safeUser });
  } catch (err) {
    console.error("[AUTH] me error:", err);
    res.status(500).json({ error: "Failed to get user info" });
  }
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, grade = "", section = "", studentId, phone } = req.body || {};
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // require studentId and validate digits-only (whole number)
    if (!studentId || !/^\d+$/.test(String(studentId).trim())) {
      return res.status(400).json({ error: "studentId is required and must contain only digits" });
    }

    // require phone (basic validation: digits, +, spaces, dashes, parentheses)
    if (!phone || !/^[\d+\-\s\(\)]+$/.test(String(phone).trim())) {
      return res.status(400).json({ error: "Contact number is required and must be a valid phone string" });
    }
    
    if (usingMongo()) {
      const db = mongoose.connection.db;
      const usersCol = db.collection("users");
      
      // Check email uniqueness
      const existingEmail = await usersCol.findOne({ email: email.trim().toLowerCase() });
      if (existingEmail) {
        return res.status(409).json({ error: "Email already used" });
      }
      
      // Check studentId uniqueness
      const existingStudentId = await usersCol.findOne({ studentId: String(studentId).trim() });
      if (existingStudentId) {
        return res.status(409).json({ error: "studentId already used" });
      }

      const newUser = {
        id: "usr_" + Date.now().toString(36),
        name,
        email: email.trim().toLowerCase(),
        passwordHash: bcrypt.hashSync(password, 10),
        role: "student",
        grade,
        section,
        balance: 0,
        studentId: String(studentId).trim(),
        phone: String(phone).trim(),
        createdAt: new Date().toISOString()
      };
      
      await usersCol.insertOne(newUser);
      
      // Send notification to admin about new registration
      try {
        Notifications.addNotification({
          id: "notif_" + Date.now().toString(36),
          for: "admin",
          actor: null,
          type: "student:registered",
          title: `New Student Registration: ${name}`,
          body: `A new student account has been created.\n\nName: ${name}\nStudent ID: ${String(studentId).trim()}\nEmail: ${email}\nPhone: ${String(phone).trim()}`,
          data: {
            userId: newUser.id,
            studentName: name,
            studentId: String(studentId).trim(),
            email: email,
            phone: String(phone).trim(),
            grade: grade || "",
            section: section || ""
          },
          read: false,
          createdAt: new Date().toISOString()
        });
      } catch (err) {
        console.error('[AUTH] Failed to send admin notification:', err && err.message);
      }
      
      return res.json({ ok: true });
    }
    
    const db = load();
    
    if (db.users.some(u => u.email === email)) {
      return res.status(409).json({ error: "Email already used" });
    }
    // ensure studentId uniqueness
    if (db.users.some(u => u.studentId === String(studentId).trim())) {
      return res.status(409).json({ error: "studentId already used" });
    }

    const newUser = {
      id: "usr_" + Date.now().toString(36),
      name, email,
      passwordHash: bcrypt.hashSync(password, 10),
      role: "student",
      grade, section,
      balance: 0,
      studentId: String(studentId).trim(),
      phone: String(phone).trim(),
      createdAt: new Date().toISOString()
    };
    
    db.users.push(newUser);
    save(db);
    
    // Send notification to admin about new registration
    try {
      Notifications.addNotification({
        id: "notif_" + Date.now().toString(36),
        for: "admin",
        actor: null, // System notification
        type: "student:registered",
        title: `New Student Registration: ${name}`,
        body: `A new student account has been created.\n\nName: ${name}\nStudent ID: ${String(studentId).trim()}\nEmail: ${email}\nPhone: ${String(phone).trim()}`,
        data: {
          userId: newUser.id,
          studentName: name,
          studentId: String(studentId).trim(),
          email: email,
          phone: String(phone).trim(),
          grade: grade || "",
          section: section || ""
        },
        read: false,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('[AUTH] Failed to send admin notification:', err && err.message);
    }
    
    res.json({ ok: true });
  } catch (err) {
    console.error("[AUTH] register error:", err);
    res.status(500).json({ error: "Failed to register user" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    
    if (usingMongo()) {
      const db = mongoose.connection.db;
      const usersCol = db.collection("users");
      const u = await usersCol.findOne({ email: email.trim().toLowerCase() });
      
      if (!u) return res.status(401).json({ error: "Invalid credentials" });

      // password check
      if (u.passwordHash) {
        if (!bcrypt.compareSync(password, u.passwordHash)) {
          return res.status(401).json({ error: "Invalid credentials" });
        }
      } else if (u.password) {
        if (password !== u.password) {
          return res.status(401).json({ error: "Invalid credentials" });
        }
        // Migrate to hashed password
        await usersCol.updateOne(
          { _id: u._id },
          { $set: { passwordHash: bcrypt.hashSync(password, 10) }, $unset: { password: "" } }
        );
      } else {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = sign({ id: u.id || u._id.toString(), role: u.role });
      const user = {
        id: u.id || u._id.toString(),
        name: u.name,
        role: u.role,
        grade: u.grade || "",
        section: u.section || "",
        balance: Number(u.balance) || 0,
        studentId: u.studentId || null,
        phone: u.phone || null
      };
      return res.json({ status: 200, data: { token, user } });
    }

    const db = load();
    const u = db.users.find(x => x.email === email);
    if (!u) return res.status(401).json({ error: "Invalid credentials" });

    // password check (existing logic)
    if (u.passwordHash) {
      if (!bcrypt.compareSync(password, u.passwordHash)) return res.status(401).json({ error: "Invalid credentials" });
    } else if (u.password) {
      if (password !== u.password) return res.status(401).json({ error: "Invalid credentials" });
      u.passwordHash = bcrypt.hashSync(password, 10);
      delete u.password;
      save(db);
    } else {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = sign({ id: u.id, role: u.role });
    // include studentId and phone so frontend can auto-fill it
    const user = {
      id: u.id,
      name: u.name,
      role: u.role,
      grade: u.grade,
      section: u.section,
      balance: u.balance,
      studentId: u.studentId || null,
      phone: u.phone || null
    };
    res.json({ status: 200, data: { token, user } });
  } catch (err) {
    console.error("[AUTH] login error:", err);
    res.status(500).json({ error: "Failed to login" });
  }
};

// Add new PATCH endpoint for profile updates
exports.updateProfile = async (req, res) => {
  try {
    const uid = req.user && req.user.id;
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });

    const { name, email, studentId, phone } = req.body || {};

    if (usingMongo()) {
      const db = mongoose.connection.db;
      const usersCol = db.collection("users");
      
      const user = await usersCol.findOne({ $or: [{ id: String(uid) }, { _id: ObjectId.isValid(uid) ? new ObjectId(uid) : null }] });
      if (!user) return res.status(404).json({ error: 'User not found' });

      const update = { updatedAt: new Date().toISOString() };

      // Update fields if provided
      if (typeof name === 'string' && name.trim()) update.name = name.trim();
      if (typeof email === 'string' && email.trim()) {
        // Check email uniqueness (except self)
        const existing = await usersCol.findOne({ 
          email: email.trim().toLowerCase(),
          $nor: [{ id: String(uid) }, { _id: ObjectId.isValid(uid) ? new ObjectId(uid) : null }]
        });
        if (existing) {
          return res.status(409).json({ error: 'Email already in use' });
        }
        update.email = email.trim().toLowerCase();
      }
      if (typeof studentId === 'string' && studentId.trim()) {
        if (!/^\d+$/.test(studentId.trim())) {
          return res.status(400).json({ error: 'Student ID must contain only digits' });
        }
        // Check studentId uniqueness (except self)
        const existing = await usersCol.findOne({ 
          studentId: studentId.trim(),
          $nor: [{ id: String(uid) }, { _id: ObjectId.isValid(uid) ? new ObjectId(uid) : null }]
        });
        if (existing) {
          return res.status(409).json({ error: 'Student ID already in use' });
        }
        update.studentId = studentId.trim();
      }
      if (typeof phone === 'string' && phone.trim()) {
        if (!/^[\d+\-\s\(\)]+$/.test(phone.trim())) {
          return res.status(400).json({ error: 'Invalid phone number format' });
        }
        update.phone = phone.trim();
      }

      // Handle profile picture upload if present
      if (req.file) {
        const pictureUrl = saveProfilePicture(req.file, user.id || user._id.toString());
        if (pictureUrl) update.profilePictureUrl = pictureUrl;
      }

      await usersCol.updateOne(
        { $or: [{ id: String(uid) }, { _id: ObjectId.isValid(uid) ? new ObjectId(uid) : null }] },
        { $set: update }
      );

      const updated = await usersCol.findOne({ $or: [{ id: String(uid) }, { _id: ObjectId.isValid(uid) ? new ObjectId(uid) : null }] });
      return res.json({
        ok: true,
        user: {
          id: updated.id || updated._id.toString(),
          name: updated.name,
          email: updated.email,
          studentId: updated.studentId,
          phone: updated.phone || null,
          profilePictureUrl: updated.profilePictureUrl || null,
          updatedAt: updated.updatedAt
        }
      });
    }

    const db = load();
    const users = Array.isArray(db.users) ? db.users : [];
    const idx = users.findIndex(u => String(u.id) === String(uid));
    if (idx === -1) return res.status(404).json({ error: 'User not found' });

    const user = users[idx];

    // Update fields if provided
    if (typeof name === 'string' && name.trim()) user.name = name.trim();
    if (typeof email === 'string' && email.trim()) {
      // Check email uniqueness (except self)
      if (users.some(u => u.id !== uid && u.email === email.trim())) {
        return res.status(409).json({ error: 'Email already in use' });
      }
      user.email = email.trim();
    }
    if (typeof studentId === 'string' && studentId.trim()) {
      if (!/^\d+$/.test(studentId.trim())) {
        return res.status(400).json({ error: 'Student ID must contain only digits' });
      }
      // Check studentId uniqueness (except self)
      if (users.some(u => u.id !== uid && String(u.studentId) === studentId.trim())) {
        return res.status(409).json({ error: 'Student ID already in use' });
      }
      user.studentId = studentId.trim();
    }
    if (typeof phone === 'string' && phone.trim()) {
      if (!/^[\d+\-\s\(\)]+$/.test(phone.trim())) {
        return res.status(400).json({ error: 'Invalid phone number format' });
      }
      user.phone = phone.trim();
    }

    // Handle profile picture upload if present
    if (req.file) {
      const pictureUrl = saveProfilePicture(req.file, user.id);
      if (pictureUrl) user.profilePictureUrl = pictureUrl;
    }

    user.updatedAt = new Date().toISOString();
    users[idx] = user;
    db.users = users;
    save(db);

    return res.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        studentId: user.studentId,
        phone: user.phone || null,
        profilePictureUrl: user.profilePictureUrl || null,
        updatedAt: user.updatedAt
      }
    });
  } catch (err) {
    console.error('[AUTH] updateProfile failed:', err);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
};
