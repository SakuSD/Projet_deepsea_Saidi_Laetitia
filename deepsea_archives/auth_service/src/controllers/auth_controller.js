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

    if (!email || !password) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) return res.status(404).json({ error: "User not found" });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "defaultsecretkey",
      { expiresIn: "1h" }
    );

    const { password: _, ...safeUser } = user;

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

// ========================
// GET ALL USERS (admin)
// ========================
exports.getAllUsers = async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, username: true, role: true, createdAt: true }
  });

  res.json(users);
};

// ========================
// UPDATE USER ROLE (admin)
// ========================
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["USER", "ADMIN"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const updated = await prisma.user.update({
      where: { id: Number(id) },
      data: { role },
      select: { id: true, email: true, username: true, role: true }
    });

    res.json(updated);

  } catch (e) {
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
