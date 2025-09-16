import { Schema, model } from "mongoose";

const programSchema = new Schema(
  {
    code: { type: String, required: true },
    name: { type: String, required: true },
    version: { type: String, required: true },
    status: { type: Number, default: 0 }
  },
  {
    timestamps: true
  }
);

export const Program = model("Program", programSchema);