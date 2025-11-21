const express = require("express");
const app = express();
app.use(express.json());

// require filenames corrigés (matchent species_routes.js et observation_routes.js)
const speciesRoutes = require("./routes/species_routes");
const observationRoutes = require("./routes/observation_routes");

app.use("/species", speciesRoutes);
app.use("/observations", observationRoutes);

app.listen(3002, () => console.log("Observation service running on 3002"));
