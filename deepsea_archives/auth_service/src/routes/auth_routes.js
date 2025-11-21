const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth_controller");
const { authMiddleware, requireAdmin } = require("../middlewares/authMiddleware");

// Register / Login
router.post("/register", authController.register);
router.post("/login", authController.login);

// USER CONNECTÉ (token obligatoire)
router.get("/me", authMiddleware, authController.getMe);

// ADMIN
router.get("/admin/users", authMiddleware, requireAdmin, authController.getAllUsers);

router.patch("/admin/users/:id/role", authMiddleware, requireAdmin, authController.updateUserRole);


router.get("/users", authMiddleware, requireAdmin, authController.getAllUsers);

// Public : get user by ID
router.get("/users/:id", authController.getUserById);

module.exports = router;
