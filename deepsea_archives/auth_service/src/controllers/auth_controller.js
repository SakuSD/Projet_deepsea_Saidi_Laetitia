const prisma = require("../prisma");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// ========================
//   REGISTER
// ========================
exports.register = async (req, res) => {
  try {
    const { email, username, password, role } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already used" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        role: role || "USER"
      }
    });

    const { password: _, ...safeUser } = user;

    res.status(201).json(safeUser);

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
};

// ========================
// LOGIN
// ========================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log(`[LOGIN][ATTEMPT] email=${email} - IP: ${req.ip} - Time: ${new Date().toISOString()}`);

    if (!email || !password) {
      console.log(`[LOGIN][FAIL] Missing fields - IP: ${req.ip} - Time: ${new Date().toISOString()}`);
      return res.status(400).json({ error: "Missing fields" });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    console.log(`[LOGIN][LOOKUP] email=${email} found=${!!user} - IP: ${req.ip} - Time: ${new Date().toISOString()}`);

    if (!user) {
      console.log(`[LOGIN][FAIL] User not found for email=${email} - IP: ${req.ip} - Time: ${new Date().toISOString()}`);
      return res.status(404).json({ error: "User not found" });
    }

    console.log(`[LOGIN][ROLE] email=${email} role=${user.role}`);

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log(`[LOGIN][FAIL] Invalid password for email=${email} role=${user.role} - IP: ${req.ip} - Time: ${new Date().toISOString()}`);
      return res.status(401).json({ error: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "defaultsecretkey",
      { expiresIn: "1h" }
    );

    const { password: _, ...safeUser } = user;

    if (user.role === "ADMIN") {
      console.log(`[LOGIN][ADMIN][SUCCESS] id=${user.id} email=${user.email} role=${user.role} - IP: ${req.ip} - Time: ${new Date().toISOString()}`);
    } else {
      console.log(`[LOGIN][SUCCESS] id=${user.id} email=${user.email} role=${user.role} - IP: ${req.ip} - Time: ${new Date().toISOString()}`);
    }

    res.status(200).json({ user: safeUser, token });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
};

// ========================
//  GET ME
// ========================
exports.getMe = async (req, res) => {
  res.json(req.user);
};

// GET ALL USERS (ADMIN)
exports.getAllUsers = async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, username: true, role: true, createdAt: true }
  });

  res.json(users);
};

// CHANGE USER ROLE (ADMIN)
exports.updateUserRole = async (req, res) => {
  try {
    const requester = req.user; // middleware d'auth doit peupler req.user
    if (!requester) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (requester.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden: admin only" });
    }

    const { id } = req.params;
    const targetId = Number(id);
    if (Number.isNaN(targetId)) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    // Empêcher l'admin de changer son propre rôle
    if (targetId === Number(requester.id)) {
      return res.status(403).json({ error: "You cannot change your own role" });
    }

    const { role } = req.body;
    if (!["USER", "ADMIN"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const existing = await prisma.user.findUnique({ where: { id: targetId } });
    if (!existing) {
      return res.status(404).json({ error: "User not found" });
    }

    const updated = await prisma.user.update({
      where: { id: targetId },
      data: { role },
      select: { id: true, email: true, username: true, role: true }
    });

    // Log explicite indiquant que le rôle a été modifié pour l'utilisateur avec son id
    console.log(`[USER_ROLE_UPDATED] userId=${targetId} newRole=${role} updatedByAdmin=${requester.id} time=${new Date().toISOString()}`);

    res.json(updated);
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: "Server error" });
  }
};

// ========================
// GET USER BY ID (public)
// ========================
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      select: { id: true, email: true, username: true, role: true, createdAt: true }
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user);
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: "Server error" });
  }
};
