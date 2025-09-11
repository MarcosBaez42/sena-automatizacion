import { Schema, model } from "mongoose";

const scheduleSchema = new Schema({
  ficha: { type: String, required: true },
  fend: { type: Date, required: true },
  calificado: { type: Boolean, default: false },
  instructorCorreo: String,
  fechaCalificacion: Date
});

export const Schedule = model("Schedule", scheduleSchema);