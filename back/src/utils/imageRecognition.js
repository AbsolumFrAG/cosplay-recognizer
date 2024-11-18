const tf = require("@tensorflow/tfjs-node");
const sharp = require("sharp");

class ImageRecognition {
  constructor(modelPath) {
    this.model = null;
    this.modelPath = modelPath;
  }

  async initialize() {
    this.model = await tf.loadLayersModel(`file://${this.modelPath}`);
  }

  async preprocessImage(imageBuffer) {
    const processedImage = await sharp(imageBuffer).resize(224, 224).toBuffer();

    const tensor = tf.node.decodeImage(processedImage).div(255.0).expandDims();

    return tensor;
  }

  async augmentImage(tensor) {
    return tf.tidy(() => {
      const augmented = [];

      augmented.push(tf.image.rotateWithOffset(tensor, Math.PI / 6));
      augmented.push(tf.image.flipLeftRight(tensor));

      return augmented;
    });
  }

  async recognize(imageBuffer) {
    const tensor = await this.preprocessImage(imageBuffer);
    const predictions = await this.model.predict(tensor).data();
    return this.formatPredictions(predictions);
  }

  formatPredictions(predictions) {
    const maxIndex = predictions.index(Math.max(...predictions));
    return {
      character: this.categories[maxIndex],
      confidence: predictions[maxIndex],
      timestamp: new Date().toISOString(),
    };
  }

  async saveModel(savePath) {
    await this.model.save(`file://${savePath}`);
  }
}

module.exports = ImageRecognition;
