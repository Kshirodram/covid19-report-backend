import mongoose from "mongoose";

const { Schema } = mongoose;

const reportSchema = new Schema();

export default mongoose.model("Report", reportSchema, "report");
