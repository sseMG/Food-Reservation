const bcrypt = require("bcryptjs");
const { sign } = require("../lib/auth");
const Notifications = require("./notifications.controller");
const RepositoryFactory = require("../repositories/repository.factory");
const ImageUploadFactory = require("../repositories/image-upload/image-upload.factory");

exports.me = async (req, res) => {
  try {
    const uid = req.user?.id || req.user?._id;
    if (!uid) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userRepo = RepositoryFactory.getUserRepository();
    const user = await userRepo.findById(uid);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const { passwordHash, password, ...safeUser } = user;
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
    
    const userRepo = RepositoryFactory.getUserRepository();
    
    // Check email uniqueness
    const existingEmail = await userRepo.findOne({ email: email.trim().toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({ error: "Email already used" });
    }
    
    // Check studentId uniqueness
    const existingStudentId = await userRepo.findOne({ studentId: String(studentId).trim() });
    if (existingStudentId) {
      return res.status(409).json({ error: "studentId already used" });
    }

    const newUser = await userRepo.create({
      name,
      email: email.trim().toLowerCase(),
      passwordHash: bcrypt.hashSync(password, 10),
      role: "student",
      grade,
      section,
      balance: 0,
      studentId: String(studentId).trim(),
      phone: String(phone).trim(),
    });
    
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
    
    res.json({ ok: true });
  } catch (err) {
    console.error("[AUTH] register error:", err);
    res.status(500).json({ error: "Failed to register user" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    
    const userRepo = RepositoryFactory.getUserRepository();
    const u = await userRepo.findOne({ email: email.trim().toLowerCase() });
    
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
      await userRepo.update(u.id, { 
        passwordHash: bcrypt.hashSync(password, 10),
        password: undefined 
      });
    } else {
      return res.status(401).json({ error: (u.role === "admin") ? "Invalid admin credentials" : "Invalid credentials" });
    }

    const token = sign({ id: u.id, role: u.role });
    const user = {
      id: u.id,
      name: u.name,
      role: u.role,
      grade: u.grade || "",
      section: u.section || "",
      balance: Number(u.balance) || 0,
      studentId: u.studentId || null,
      phone: u.phone || null
    };
    return res.json({ status: 200, data: { token, user } });
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
    const userRepo = RepositoryFactory.getUserRepository();
    
    const user = await userRepo.findById(uid);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const update = {};

    // Update fields if provided
    if (typeof name === 'string' && name.trim()) update.name = name.trim();
    if (typeof email === 'string' && email.trim()) {
      // Check email uniqueness (except self)
      const existing = await userRepo.findOne({ email: email.trim().toLowerCase() });
      if (existing && String(existing.id) !== String(uid)) {
        return res.status(409).json({ error: 'Email already in use' });
      }
      update.email = email.trim().toLowerCase();
    }
    if (typeof studentId === 'string' && studentId.trim()) {
      if (!/^\d+$/.test(studentId.trim())) {
        return res.status(400).json({ error: 'Student ID must contain only digits' });
      }
      // Check studentId uniqueness (except self)
      const existing = await userRepo.findOne({ studentId: studentId.trim() });
      if (existing && String(existing.id) !== String(uid)) {
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
      const imageRepo = ImageUploadFactory.getRepository();
      
      // Delete old profile picture if it exists
      if (user.profilePictureUrl) {
        await imageRepo.delete(user.profilePictureUrl);
      }
      
      const result = await imageRepo.upload(req.file, {
        prefix: `profile-${user.id}`,
        folder: 'profiles'
      });
      if (result && result.url) {
        update.profilePictureUrl = result.url;
      }
    }

    const updated = await userRepo.update(uid, update);
    if (!updated) return res.status(404).json({ error: 'User not found' });

    return res.json({
      ok: true,
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        studentId: updated.studentId,
        phone: updated.phone || null,
        profilePictureUrl: updated.profilePictureUrl || null,
        updatedAt: updated.updatedAt
      }
    });
  } catch (err) {
    console.error('[AUTH] updateProfile failed:', err);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
};
