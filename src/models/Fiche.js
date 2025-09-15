import { Schema, model } from "mongoose";

const ficheSchema = new Schema({
  number: { type: String, required: true }
});

export const Fiche = model("Fiche", ficheSchema);