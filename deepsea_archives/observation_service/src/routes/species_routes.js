const express = require("express");
const router = express.Router();
const obsAuth = require("../Ob_Middleware/obs_Middleware");
const ctrl = require("../controllers/species_controller");

// Création protégée par token
router.post("/", obsAuth, ctrl.createSpecies);

// Lecture
router.get("/", ctrl.getAllSpecies);
router.get("/:id", ctrl.getSpeciesById);

module.exports = router;
