const prisma = require("../prisma");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");  // Importer jsonwebtoken

// ========================
//   CREATE USER (REGISTER)
// ========================
exports.register = async (req, res) => {
  console.log("=== BODY RECU PAR LE SERVEUR ===");
  console.log(req.body);

  try {
    const { email, username, password, role } = req.body;

    // Vérification des champs
    if (!email || !username || !password) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: "Email already used" });
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Création dans la DB
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        role: role || "USER"
      }
    });

    // Retirer le mot de passe avant de renvoyer
    delete user.password;

    res.status(201).json(user);

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
};

// ========================
//      GET ALL USERS
// ========================
exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true
      }
    });

    res.json(users);

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
};

// ========================
//      LOGIN USER
// ========================
exports.login = async (req, res) => {
  console.log("=== BODY RECU PAR LE SERVEUR (LOGIN) ===");
  console.log(req.body);

  try {
    const { email, password } = req.body;

    // Vérifier que l'email et le mot de passe sont présents
    if (!email || !password) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // Vérifier si l'utilisateur existe dans la base de données
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Comparer le mot de passe envoyé avec le mot de passe stocké (hashé)
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // Retirer le mot de passe avant de renvoyer l'utilisateur
    delete user.password;

    // Générer un token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "defaultsecretkey",  // Utiliser une clé secrète, remplace "defaultsecretkey" par une clé plus sécurisée
      { expiresIn: "1h" }  // Le token expire après 1 heure
    );

    // Si tout est bon, on renvoie l'utilisateur et le token
    res.status(200).json({
      user,
      token  // Ajout du token dans la réponse
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
};

// ========================
//      GET USER BY ID
// ========================
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;  // Récupérer l'ID depuis les paramètres de l'URL

    // Vérifie si l'ID est un nombre valide
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    // Utiliser l'ID correctement converti
    const user = await prisma.user.findUnique({
      where: { id: userId },  // Assure-toi que 'id' est un nombre valide
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);  // Retourner les informations de l'utilisateur
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
};

// ========================
//      GET CURRENT USER (ME)
// ========================
exports.getMe = async (req, res) => {
  try {
    const user = req.user;  // Récupérer les données de l'utilisateur depuis le middleware

    // Renvoi des informations de l'utilisateur
    res.status(200).json({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
};
