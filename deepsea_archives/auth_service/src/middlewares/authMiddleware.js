const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];  // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  // Vérifier et décoder le token
  jwt.verify(token, process.env.JWT_SECRET || "defaultsecretkey", (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Ajouter les données de l'utilisateur au request object
    req.user = decoded;
    next();
  });
};

module.exports = authMiddleware;
