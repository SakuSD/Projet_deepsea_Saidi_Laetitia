const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Observation-service is running!");
});

app.listen(3002, () => {
  console.log("Observation service running on port 3002");
});
