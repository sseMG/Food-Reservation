// server/src/controllers/wallets.controller.js
const RepositoryFactory = require('../repositories/repository.factory');
const ImageUploadFactory = require('../repositories/image-upload/image-upload.factory');

function safeName(name = '') {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// Public: list active wallets
exports.list = async (req, res) => {
  try {
    const walletRepo = RepositoryFactory.getWalletRepository();
    const wallets = await walletRepo.findAll({ active: true });
    console.log('[WALLET] List: returning', wallets.length, 'wallets');
    res.json({ status: 200, data: wallets });
  } catch (err) {
    console.error("[WALLET] list error:", err);
    res.status(500).json({ error: "Failed to list wallets" });
  }
};

// Public: get one by provider (e.g., "gcash", "maya")
exports.getOne = async (req, res) => {
  try {
    const provider = String(req.params.provider || '').trim().toLowerCase();
    if (!provider) {
      console.log('[WALLET] GetOne: missing provider');
      return res.status(400).json({ error: 'Missing provider' });
    }

    const walletRepo = RepositoryFactory.getWalletRepository();
    const found = await walletRepo.findOne({ provider });

    if (!found) {
      console.log('[WALLET] GetOne: wallet not found', provider);
      return res.status(404).json({ error: 'Wallet not found' });
    }
    console.log('[WALLET] GetOne: wallet found', provider);
    res.json({ status: 200, data: found });
  } catch (err) {
    console.error("[WALLET] getOne error:", err);
    res.status(500).json({ error: "Failed to get wallet" });
  }
};

// Authenticated: return current user's wallet/balance information
exports.me = async (req, res) => {
  try {
    const uid = req.user && (req.user.id || req.user._id);
    if (!uid) {
      console.log('[WALLET] Me: unauthorized');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userRepo = RepositoryFactory.getUserRepository();
    const user = await userRepo.findById(uid);
    
    if (!user) { 
      console.log('[WALLET] Me: user not found', uid);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('[WALLET] Me: returning wallet for user', uid);
    return res.json({
      status: 200,
      data: {
        balance: Number(user.balance) || 0,
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        user: user.studentId || user.sid || null,
        studentId: user.studentId || user.sid || user.student_id || null,
        phone: user.phone || user.contact || null,
        profilePictureUrl: user.profilePictureUrl || null
      }
    });
  } catch (e) {
    console.error(e);
    console.log('[WALLET] Me: failed to load wallet', e.message);
    res.status(500).json({ error: 'Failed to load wallet' });
  }
};

// Admin: add/update wallet with optional qr image (req.file provided by multer)
exports.upsert = async (req, res) => {
  try {
    const provider =
      (req.params && req.params.provider) ||
      (req.body && req.body.provider);
    if (!provider) return res.status(400).json({ error: 'Missing provider' });

    const key = String(provider).toLowerCase();

    const walletRepo = RepositoryFactory.getWalletRepository();
    const existing = await walletRepo.findOne({ provider: key });

    // Save QR file if provided
    let qrUrl = '';
    if (req.file) {
      const imageRepo = ImageUploadFactory.getRepository();
      
      // Delete old QR image if it exists
      if (existing && existing.qrImageUrl) {
        await imageRepo.delete(existing.qrImageUrl);
      }
      
      const result = await imageRepo.upload(req.file, {
        prefix: `wallet-${safeName(provider)}`,
        folder: 'wallets'
      });
      qrUrl = result.url;
    }

    const payload = {
      accountName: (req.body && req.body.accountName) || (existing && existing.accountName) || '',
      mobile: (req.body && req.body.mobile) || (existing && existing.mobile) || '',
      reference: (req.body && req.body.reference) || (existing && existing.reference) || '',
      qrImageUrl: qrUrl || (existing && existing.qrImageUrl) || '',
      active: req.body && Object.prototype.hasOwnProperty.call(req.body, 'active')
        ? (req.body.active === 'true' || req.body.active === true)
        : (existing ? existing.active : true),
    };

    const result = await walletRepo.upsertByProvider(key, payload);
    res.json(result);
  } catch (err) {
    console.error("[WALLET] upsert error:", err);
    res.status(500).json({ error: "Failed to upsert wallet" });
  }
};

// Authenticated: charge the current user's wallet for a reservation or other ref
exports.charge = async (req, res) => {
  try {
    const uid = req.user && (req.user.id || req.user._id);
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });

    const { amount, refType, refId } = req.body || {};
    const amt = Number(amount || 0);
    if (!amt || amt <= 0) return res.status(400).json({ error: 'Invalid amount' });

    const userRepo = RepositoryFactory.getUserRepository();
    const transactionRepo = RepositoryFactory.getTransactionRepository();

    // Idempotent: if a transaction already exists for this refId+refType, return it
    if (refId) {
      const exists = await transactionRepo.findOne({
        ref: String(refId),
        type: refType || 'Reservation'
      });
      if (exists) return res.json({ transaction: exists });
    }

    const user = await userRepo.findById(uid);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const balance = Number(user.balance) || 0;
    if (balance < amt) return res.status(400).json({ error: 'Insufficient balance' });

    // Deduct balance
    const updatedUser = await userRepo.decrementBalance(uid, amt);
    if (!updatedUser) return res.status(500).json({ error: 'Failed to update balance' });

    const tx = await transactionRepo.create({
      userId: user.id,
      type: refType || 'Reservation',
      amount: amt,
      ref: refId || null,
      status: 'Success',
    });

    const newBalance = Number(updatedUser.balance) || 0;
    return res.json({ transaction: tx, balance: newBalance });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to charge wallet' });
  }
};

// Add this new endpoint
exports.updateProfile = async (req, res) => {
  try {
    const uid = req.user && (req.user.id || req.user._id);
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });

    const { name, email, studentId, phone } = req.body || {};
    const userRepo = RepositoryFactory.getUserRepository();

    const user = await userRepo.findById(uid);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const update = {};
    if (name) update.name = name;
    if (email) update.email = email;
    if (studentId) update.studentId = studentId;
    if (phone) update.phone = phone;

    // Handle profile picture if provided
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
      update.profilePictureUrl = result.url;
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
        phone: updated.phone,
        profilePictureUrl: updated.profilePictureUrl
      }
    });
  } catch (err) {
    console.error('[WALLET] updateProfile failed:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// Admin: set user balance directly (after credential verification)
exports.setBalance = async (req, res) => {
  try {
    const userId = req.params.id || req.params.userId;
    const { newBalance } = req.body || {};

    if (!userId) return res.status(400).json({ error: 'Missing user ID' });
    if (newBalance === undefined || newBalance === null) {
      return res.status(400).json({ error: 'Missing new balance' });
    }

    const balanceNum = parseFloat(newBalance);
    if (isNaN(balanceNum) || balanceNum < 0) {
      return res.status(400).json({ error: 'Invalid balance amount' });
    }

    const userRepo = RepositoryFactory.getUserRepository();
    const transactionRepo = RepositoryFactory.getTransactionRepository();

    const user = await userRepo.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const oldBalance = Number(user.balance) || 0;
    const difference = balanceNum - oldBalance;

    // Update user balance
    const updated = await userRepo.update(userId, {
      balance: balanceNum
    });

    if (!updated) return res.status(500).json({ error: 'Failed to update balance' });

    // Create transaction record for audit trail
    try {
      await transactionRepo.create({
        userId: userId,
        type: 'Admin Balance Adjustment',
        amount: Math.abs(difference),
        direction: difference >= 0 ? 'credit' : 'debit',
        status: 'Success',
        ref: `ADMIN_ADJ_${Date.now()}`,
        note: `Balance adjusted from ${peso.format(oldBalance)} to ${peso.format(balanceNum)}`
      });
    } catch (err) {
      console.error('[WALLET] Failed to create transaction record:', err);
      // Continue - balance was updated
    }

    res.json({
      ok: true,
      message: 'Balance updated successfully',
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        studentId: updated.studentId,
        balance: updated.balance
      }
    });
  } catch (err) {
    console.error('[WALLET] setBalance error:', err);
    res.status(500).json({ error: 'Failed to set balance' });
  }
};
