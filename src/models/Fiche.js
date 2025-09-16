import { Schema, model } from "mongoose";

const ficheSchema = new Schema(
  {
    number: { type: String, required: true },
    program: { type: Schema.Types.ObjectId, ref: "Program" },
    status: { type: Number, default: 0 }
  },
  {
    timestamps: true
  }
);

export const Fiche = model("Fiche", ficheSchema);