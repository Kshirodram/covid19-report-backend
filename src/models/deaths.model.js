import mongoose from "mongoose";

const { Schema } = mongoose;

const deathsSchema = new Schema();

export default mongoose.model("Deaths", deathsSchema, "deaths");
