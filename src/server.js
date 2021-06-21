import express from "express";
import mongoose from "mongoose";
import compression from "compression";
import cors from "cors";

// Import all the routes
import prepareDataRoutes from "./routes/prepareData.routes";
import reportRoutes from "./routes/report.routes";
import countriesRoutes from "./routes/countries.routes";

const PORT = process.env.PORT || 3001;

mongoose.Promise = global.Promise;

mongoose
  .connect(
    `mongodb+srv://admin:welcome%40123@cluster0-e6ksx.mongodb.net/covid19?authSource=admin&replicaSet=Cluster0-shard-0&readPreference=primary&appname=MongoDB%20Compass%20Community&ssl=true`,
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then((db) => {
    console.log(
      `Connected to Mongo! Database name: "${db.connections[0].name}"`
    );

    const app = express();
    app.use(compression());
    app.use(cors());
  
    // register routes
    prepareDataRoutes(app);
    reportRoutes(app);
    countriesRoutes(app);
    
    app.listen(PORT, () => {
      console.log(`App is running on localhost:${PORT}`);
    });
    
  })
  .catch((err) => {
    console.error("Error connecting to mongo", err);
  });