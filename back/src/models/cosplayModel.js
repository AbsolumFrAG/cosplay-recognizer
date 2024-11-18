const tf = require("@tensorflow/tfjs-node");
const fs = require("fs");
const path = require("path");

class CosplayModel {
  constructor() {
    this.categories = fs.readdirSync("./dataset");
    this.model = this.buildModel();
  }

  buildModel() {
    console.log("Catégories:", this.categories);
    const model = tf.sequential();

    model.add(
      tf.layers.conv2d({
        filters: 32,
        kernelSize: 3,
        activation: "relu",
        inputShape: [224, 224, 3],
      })
    );
    model.add(tf.layers.maxPooling2d({ poolSize: 2 }));

    model.add(
      tf.layers.conv2d({
        filters: 64,
        kernelSize: 3,
        activation: "relu",
      })
    );
    model.add(tf.layers.maxPooling2d({ poolSize: 2 }));

    model.add(tf.layers.flatten());
    model.add(tf.layers.dense({ units: 128, activation: "relu" }));
    model.add(
      tf.layers.dense({
        units: this.categories.length,
        activation: "softmax",
      })
    );

    model.compile({
      optimizer: "adam",
      loss: "categoricalCrossentropy",
      metrics: ["accuracy"],
    });

    return model;
  }

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
    const xs = tf.stack(
      dataset.map((d) =>
        tf.image.resizeBilinear(d.tensor, [224, 224]).div(255.0)
      )
    );

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
