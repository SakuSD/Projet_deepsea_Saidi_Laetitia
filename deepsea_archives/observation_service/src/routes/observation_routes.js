const express = require("express");
const router = express.Router();
const auth = require("../Ob_Middleware/obs_Middleware");
const ctrl = require("../controllers/observation_controller");

router.post("/", auth, ctrl.createObservation);
router.get("/species/:id", auth, ctrl.getObservationsBySpecies);
router.post("/:id/validate", auth, ctrl.validateObservation);
router.post("/:id/reject", auth, ctrl.rejectObservation);

module.exports = router;
