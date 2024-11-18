const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const CosplayModel = require("../models/cosplayModel");
const path = require("path");

const cosplayModel = new CosplayModel();
const modelPath = path.join("models", "trained-model");

/**
 * @swagger
 * tags:
 *   name: Cosplay
 *   description: API de reconnaissance de cosplay
 */

/**
 * @swagger
 * /api/recognize:
 *   post:
 *     summary: Reconnaît un cosplay à partir d'une image
 *     tags: [Cosplay]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: image
 *         type: file
 *         required: true
 *         description: Image du cosplay à analyser
 *     responses:
 *       200:
 *         description: Cosplay reconnu avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 character:
 *                   type: string
 *                   description: Nom du personnage identifié
 *                 confidence:
 *                   type: number
 *                   description: Niveau de confiance (0-1)
 *       400:
 *         description: Image manquante
 *       500:
 *         description: Erreur serveur
 */
router.post("/recognize", upload.single("image"), async (req, res) => {
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

// Initialisation du modèle au démarrage
(async () => {
  try {
    await cosplayModel.load(modelPath);
    console.log("Modèle chargé avec succès");
  } catch (error) {
    console.log("Entraînement d'un nouveau modèle...");
    await cosplayModel.train();
    await cosplayModel.save(modelPath);
  }
})();

module.exports = router;
