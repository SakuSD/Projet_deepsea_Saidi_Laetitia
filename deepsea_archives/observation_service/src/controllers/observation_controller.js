const prisma = require("../prisma");

// helper: recompute rarity for a species
async function recomputeRarity(speciesId) {
  const validatedCount = await prisma.observation.count({
    where: { speciesId: Number(speciesId), status: "VALIDATED" }
  });
  const rarityScore = 1 + validatedCount / 5;
  await prisma.species.update({
    where: { id: Number(speciesId) },
    data: { rarityScore }
  });
  console.log(`[RARITY] speciesId=${speciesId} validatedCount=${validatedCount} rarity=${rarityScore}`);
}

// helper: compute reputation for one user
async function computeReputationForUser(userId) {
  const validatedCount = await prisma.observation.count({
    where: { authorId: Number(userId), status: "VALIDATED" }
  });
  const rejectedCount = await prisma.observation.count({
    where: { authorId: Number(userId), status: "REJECTED" }
  });

  // extra +1 for validations performed by experts
  const experts = await prisma.reputation.findMany({ where: { isExpert: true }, select: { userId: true } });
  const expertIds = experts.map(e => e.userId);
  let expertValidatedExtra = 0;
  if (expertIds.length > 0) {
    expertValidatedExtra = await prisma.observation.count({
      where: {
        authorId: Number(userId),
        status: "VALIDATED",
        validatedBy: { in: expertIds }
      }
    });
  }

  const reputation = validatedCount * 3 + rejectedCount * -1 + expertValidatedExtra * 1;
  const isExpert = reputation >= 10;

  await prisma.reputation.upsert({
    where: { userId: Number(userId) },
    update: { reputation, isExpert },
    create: { userId: Number(userId), reputation, isExpert }
  });

  return { reputation, isExpert };
}

// helper: recompute reputations for all authors (safe, simple)
async function recomputeAllReputations() {
  const authors = await prisma.observation.findMany({ select: { authorId: true }, distinct: ["authorId"] });
  const authorIds = authors.map(a => a.authorId);
  for (const id of authorIds) {
    await computeReputationForUser(id);
  }
}

// RULE: no two observations of same species within 5 min
async function tooSoon(speciesId, authorId) {
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);

  const recent = await prisma.observation.findFirst({
    where: {
      speciesId: Number(speciesId),
      authorId: Number(authorId),
      createdAt: { gte: fiveMinAgo }
    }
  });

  return !!recent;
}

// CREATE OBSERVATION
exports.createObservation = async (req, res) => {
  try {
    const { speciesId, description } = req.body;
    const user = req.user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    if (!speciesId || !description) return res.status(400).json({ error: "speciesId and description required" });

    const existsSpecies = await prisma.species.findUnique({ where: { id: Number(speciesId) } });
    if (!existsSpecies) return res.status(404).json({ error: "Species not found" });

    if (await tooSoon(speciesId, user.id)) {
      return res.status(429).json({ error: "Too soon to create another observation for this species" });
    }

    const obs = await prisma.observation.create({
      data: {
        speciesId: Number(speciesId),
        authorId: Number(user.id),
        description
      }
    });

    console.log(`[OBS_CREATE] id=${obs.id} speciesId=${obs.speciesId} authorId=${obs.authorId} by=${user.id}`);
    res.status(201).json(obs);
  } catch (err) {
    console.error(err);
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
    const user = req.user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const id = Number(req.params.id);
    const existing = await prisma.observation.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Observation not found" });
    if (existing.status === "VALIDATED") return res.status(400).json({ error: "Already validated" });

    const updated = await prisma.observation.update({
      where: { id },
      data: { status: "VALIDATED", validatedBy: Number(user.id), validatedAt: new Date() }
    });

    // recompute reputations and rarity
    await recomputeAllReputations();
    await recomputeRarity(updated.speciesId);

    console.log(`[OBS_VALIDATE] id=${id} by=${user.id}`);
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};

// REJECT
exports.rejectObservation = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const id = Number(req.params.id);
    const existing = await prisma.observation.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Observation not found" });
    if (existing.status === "REJECTED") return res.status(400).json({ error: "Already rejected" });

    const updated = await prisma.observation.update({
      where: { id },
      data: { status: "REJECTED", validatedBy: Number(user.id), validatedAt: new Date() }
    });

    // recompute reputations and rarity
    await recomputeAllReputations();
    await recomputeRarity(updated.speciesId);

    console.log(`[OBS_REJECT] id=${id} by=${user.id}`);
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};
