import { Schema, model } from "mongoose";

const scheduleSchema = new Schema({
  fiche: { type: String, required: true, alias: 'ficha' },
  fend: { type: Date, required: true },
  calificado: { type: Boolean, default: false },
  instructorCorreo: String,
  fechaCalificacion: Date
}, { toObject: { virtuals: true }, toJSON: { virtuals: true } });

export const Schedule = model("Schedule", scheduleSchema);