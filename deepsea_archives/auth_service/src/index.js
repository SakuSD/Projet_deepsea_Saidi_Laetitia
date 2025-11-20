const express = require("express");
const app = express();

// Middleware pour parser le body en JSON
app.use(express.json());

// Importer les routes
const authRoutes = require("./routes/auth_routes");

// Utiliser les routes
app.use("/auth", authRoutes);

// Démarrer le serveur
app.listen(3001, () => {
  console.log("Auth service running on port 3001");
});