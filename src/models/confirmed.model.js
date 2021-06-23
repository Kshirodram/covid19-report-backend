import mongoose from "mongoose";

const { Schema } = mongoose;

const confirmedSchema = new Schema();

export default mongoose.model("Confirmed", confirmedSchema, "confirmed");
