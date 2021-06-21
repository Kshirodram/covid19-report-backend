import { default as Countries } from "../models/countries.model";

export default (app) => {
  app.get("/api/countries", async (req, res) => {
    const data = await Countries.find();
    res.send(data);
  });
};
