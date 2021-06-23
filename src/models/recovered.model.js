import mongoose from "mongoose";

const { Schema } = mongoose;

const recoveredSchema = new Schema();

export default mongoose.model("Recovered", recoveredSchema, "recovered");
