const prisma = require("../prisma");

// RULE: no two observations of same species within 5 min
async function tooSoon(speciesId, authorId) {
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);

  const recent = await prisma.observation.findFirst({
    where: {
      speciesId,
      authorId,
      createdAt: { gte: fiveMinAgo }
    }
  });

  return !!recent;
}

// CREATE OBSERVATION
exports.createObservation = async (req, res) => {
  try {
    const { speciesId, description } = req.body;

    if (!description)
      return res.status(400).json({ error: "Description required" });

    if (!speciesId)
      return res.status(400).json({ error: "speciesId required" });

    // rule: cannot submit 2 observations within 5 min
    if (await tooSoon(speciesId, req.user.id)) {
      return res.status(400).json({ error: "You must wait 5 minutes before submitting another observation for this species" });
    }

    const obs = await prisma.observation.create({
      data: {
        speciesId,
        authorId: req.user.id,
        description,
        status: "PENDING"
      }
    });

    res.status(201).json(obs);

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
};

// GET OBS BY SPECIES
exports.getObservationsBySpecies = async (req, res) => {
  const speciesId = Number(req.params.id);

  const obs = await prisma.observation.findMany({
    where: { speciesId }
  });

  res.json(obs);
};

// VALIDATE
exports.validateObservation = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const obs = await prisma.observation.findUnique({ where: { id } });

    if (!obs) return res.status(404).json({ error: "Observation not found" });

    // rule: cannot validate your own observation
    if (obs.authorId === req.user.id) {
      return res.status(400).json({ error: "You cannot validate your own observation" });
    }

    const validated = await prisma.observation.update({
      where: { id },
      data: {
        status: "VALIDATED",
        validatedBy: req.user.id,
        validatedAt: new Date()
      }
    });

    res.json(validated);

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// REJECT
exports.rejectObservation = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const obs = await prisma.observation.findUnique({ where: { id } });

    if (!obs) return res.status(404).json({ error: "Observation not found" });

    // rule: cannot reject your own observation
    if (obs.authorId === req.user.id) {
      return res.status(400).json({ error: "You cannot reject your own observation" });
    }

    const rejected = await prisma.observation.update({
      where: { id },
      data: {
        status: "REJECTED",
        validatedBy: req.user.id,
        validatedAt: new Date()
      }
    });

    res.json(rejected);

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
