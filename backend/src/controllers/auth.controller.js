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
    const { name, email, password, grade = "", section = "", phone } = req.body || {};
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // require phone (basic validation: digits, +, spaces, dashes, parentheses)
    if (!phone || !/^[\d+\-\s\(\)]+$/.test(String(phone).trim())) {
      return res.status(400).json({ error: "Contact number is required and must be a valid phone string" });
    }
    
    const userRepo = RepositoryFactory.getUserRepository();
    
    // Check email uniqueness
    const existingEmail = await userRepo.findOne({ email: email.trim().toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const newUser = await userRepo.create({
      name,
      email: email.trim().toLowerCase(),
      passwordHash: bcrypt.hashSync(password, 10),
      role: "student",
      grade,
      section,
      balance: 0,
      phone: String(phone).trim(),
      status: "pending",
      approvalNotes: "",
    });
    
    // Send notification to admin about new registration requiring approval
    try {
      Notifications.addNotification({
        id: "notif_" + Date.now().toString(36),
        for: "admin",
        actor: null,
        type: "student:pending-approval",
        title: `New Student Registration Pending Approval: ${name}`,
        body: `A new student registration requires approval.\n\nName: ${name}\nEmail: ${email}\nPhone: ${String(phone).trim()}\n\nPlease review and approve or reject this registration.`,
        data: {
          userId: newUser.id,
          studentName: name,
          email: email,
          phone: String(phone).trim(),
          grade: grade || "",
          section: section || "",
          status: "pending"
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

    // Check if account is archived
    if (u.isArchived) {
      return res.status(403).json({ error: "Your account has been archived. Please contact support." });
    }

    // Check if student account is approved (skip for admins)
    if (u.role === "student" && u.status !== "approved") {
      if (u.status === "pending") {
        return res.status(403).json({ error: "Your account is pending approval. Please wait for an admin to review your registration." });
      } else if (u.status === "rejected") {
        return res.status(403).json({ error: "Your registration has been rejected. Please contact support." });
      }
      return res.status(403).json({ error: "Your account is not approved. Please contact support." });
    }

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

    const { name, email, phone } = req.body || {};
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
