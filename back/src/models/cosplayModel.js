const tf = require("@tensorflow/tfjs-node");
const fs = require("fs");
const path = require("path");

class CosplayModel {
  constructor() {
    this.categories = fs.readdirSync("./dataset");
    this.model = this.buildModel();
  }

  // Crée l'architecture du réseau de neurones
  buildModel() {
    console.log("Catégories:", this.categories);

    // On crée un modèle où les couches se suivent les unes après les autres
    const model = tf.sequential();

    // Première couche qui analyse l'image
    // C'est comme si on passait un filtre sur l'image pour détecter les formes simples
    model.add(
      tf.layers.conv2d({
        filters: 32, // Nombre de filtres différents
        kernelSize: 3, // Taille de la "fenêtre" qui analyse l'image
        activation: "relu", // Fonction qui aide à apprendre les motifs complexes
        inputShape: [224, 224, 3], // Taille des images en entrée (224x224 pixels, 3 couleurs RGB)
      })
    );

    // On réduit la taille de l'image pour garder les informations importantes
    model.add(tf.layers.maxPooling2d({ poolSize: 2 }));

    // Deuxième couche d'analyse, plus complexe
    // Elle peut détecter des motifs plus élaborés
    model.add(
      tf.layers.conv2d({
        filters: 64, // Plus de filtres pour plus de détails
        kernelSize: 3,
        activation: "relu",
      })
    );
    // Encore une réduction de taille
    model.add(tf.layers.maxPooling2d({ poolSize: 2 }));

    // On transforme notre image en une liste de nombres
    model.add(tf.layers.flatten());

    // Couche qui combine toutes les informations
    model.add(
      tf.layers.dense({
        units: 128, // Nombre de neurones
        activation: "relu",
      })
    );

    // Couche finale qui donne les probabilités pour chaque cosplay
    model.add(
      tf.layers.dense({
        units: this.categories.length, // Un neurone par type de cosplay
        activation: "softmax", // Convertit les résultats en pourcentages
      })
    );

    // On configure comment le modèle va apprendre
    model.compile({
      optimizer: "adam", // Méthode d'apprentissage
      loss: "categoricalCrossentropy", // Comment mesurer les erreurs
      metrics: ["accuracy"], // On veut voir le pourcentage de réussite
    });

    return model;
  }

  // Fonction pour entraîner le modèle avec les images
  async train(epochs = 50) {
    const dataset = await this.loadDataset();
    const { xs, ys } = this.preprocessDataset(dataset);

    await this.model.fit(xs, ys, {
      epochs,
      batchSize: 32,
      validationSplit: 0.2,
    });
  }

  async loadDataset() {
    const allowedExtensions = [".bmp", ".jpg", ".jpeg", ".png", ".gif"];
    const dataset = [];

    for (const category of this.categories) {
      const categoryPath = path.join("./dataset", category);
      const files = fs.readdirSync(categoryPath);

      const images = files.filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return allowedExtensions.includes(ext);
      });

      for (const image of images) {
        const imagePath = path.join(categoryPath, image);
        const imageBuffer = fs.readFileSync(imagePath);
        let tensor = tf.node.decodeImage(imageBuffer);

        // Si l'image a 4 canaux, on enlève le canal alpha
        if (tensor.shape[2] === 4) {
          tensor = tensor.slice(
            [0, 0, 0],
            [tensor.shape[0], tensor.shape[1], 3]
          );
        }

        dataset.push({
          tensor: tensor,
          label: category,
        });
      }
    }
    return dataset;
  }

  preprocessDataset(dataset) {
    // Redimensionne toutes les images à la même taille et normalise les couleurs
    const xs = tf.stack(
      dataset.map((d) =>
        tf.image.resizeBilinear(d.tensor, [224, 224]).div(255.0)
      )
    );

    // Convertit les noms de catégories en format que le réseau peut comprendre
    const ys = tf.oneHot(
      dataset.map((d) => this.categories.indexOf(d.label)),
      this.categories.length
    );

    return { xs, ys };
  }

  async predict(image) {
    const tensor = tf.node
      .decodeImage(image)
      .resizeBilinear([224, 224])
      .div(255.0)
      .expandDims();

    const prediction = await this.model.predict(tensor).data();
    const maxIndex = prediction.indexOf(Math.max(...prediction));

    return {
      character: this.categories[maxIndex],
      confidence: prediction[maxIndex],
    };
  }

  async save(modelPath) {
    const dir = path.dirname(modelPath);
    await fs.promises.mkdir(dir, { recursive: true });
    await this.model.save(`file://${modelPath}`);
  }

  async load(path) {
    this.model = await tf.loadLayersModel(`file://${path}`);
  }
}

module.exports = CosplayModel;
