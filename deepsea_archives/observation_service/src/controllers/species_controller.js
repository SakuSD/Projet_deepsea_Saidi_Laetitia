const prisma = require("../prisma");

// CREATE SPECIES
exports.createSpecies = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });

    const existing = await prisma.species.findFirst({ where: { name } });
    if (existing) return res.status(400).json({ error: "Species already exists" });

    const species = await prisma.species.create({
      data: {
        name,
        authorId: Number(req.user.id)
      }
    });

    console.log(`[SPECIES_CREATE] id=${species.id} authorId=${species.authorId} by=${req.user.id}`);
    res.status(201).json(species);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// GET ONE
exports.getSpeciesById = async (req, res) => {
  const species = await prisma.species.findUnique({
    where: { id: Number(req.params.id) }
  });

  if (!species) return res.status(404).json({ error: "Species not found" });

  res.json(species);
};

// GET ALL
exports.getAllSpecies = async (req, res) => {
  const species = await prisma.species.findMany();
  res.json(species);
};
