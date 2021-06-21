import mongoose from "mongoose";

const { Schema } = mongoose;

const countriesSchema = new Schema();

export default mongoose.model("Countries", countriesSchema, "countries");
