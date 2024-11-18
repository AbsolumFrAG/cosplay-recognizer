const express = require("express");
const multer = require("multer");
const cors = require("cors");
const CosplayModel = require("./models/cosplayModel");
const path = require("path");

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

const cosplayModel = new CosplayModel();
const modelPath = path.join("models", "trained-model");

(async () => {
  try {
    // Tenter de charger le modèle existant
    await cosplayModel.load(modelPath);
  } catch {
    // Si le modèle n'existe pas, entraînez-en un nouveau
    console.log("Training new model...");
    await cosplayModel.train();
    await cosplayModel.save(modelPath);
    console.log("Model trained and saved");
  }
})();

app.post("/recognize", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Image manquante" });
    }
    const prediction = await cosplayModel.predict(req.file.buffer);
    res.json(prediction);
  } catch (error) {
    console.error("Erreur de reconnaissance:", error);
    res.status(500).json({ error: "Échec de la reconnaissance" });
  }
});

app.post("/train", async (req, res) => {
  try {
    await cosplayModel.train();
    await cosplayModel.save(modelPath);
    res.json({ message: "Modèle entraîné avec succès" });
  } catch (error) {
    console.error("Erreur d'entraînement:", error);
    res.status(500).json({ error: "Échec de l'entraînement" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
