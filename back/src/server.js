const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");
const cosplayRoutes = require("./routes/cosplay.routes");

const app = express();

// Configuration Swagger
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API de Reconnaissance de Cosplay",
      version: "1.0.0",
      description: "API pour reconnaître des cosplays à partir d'images",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Serveur de développement",
      },
    ],
  },
  apis: ["./src/routes/*.js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

app.use(cors());
app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use("/api", cosplayRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  console.log(
    `Documentation Swagger disponible sur http://localhost:${PORT}/api-docs`
  );
});
