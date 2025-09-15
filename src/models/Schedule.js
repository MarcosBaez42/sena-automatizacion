import { Schema, model } from "mongoose";

const scheduleSchema = new Schema({
  // Referencia a la ficha a través de su ObjectId. Posteriormente se
  // poblará para obtener el número de ficha real.
  ficha: { type: Schema.Types.ObjectId, ref: "Fiche", required: true },
  fend: { type: Date, required: true },
  calificado: { type: Boolean, default: false },
  instructorCorreo: String,
  fechaCalificacion: Date
});

export const Schedule = model("Schedule", scheduleSchema);