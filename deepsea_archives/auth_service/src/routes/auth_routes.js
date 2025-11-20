const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth_controller");
const authMiddleware = require("../middlewares/authMiddleware");  // Importer le middleware

// Route d'inscription
router.post("/register", authController.register);

// Route de login
router.post("/login", authController.login);

// Route protégée pour récupérer l'utilisateur connecté
router.get("/me", authMiddleware, authController.getMe);  // Ajouter le middleware pour vérifier le token

// Récupérer tous les utilisateurs
router.get("/users", authController.getAllUsers);

// Récupérer un utilisateur par son ID
router.get("/users/:id", authController.getUserById);

module.exports = router;
