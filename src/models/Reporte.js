import { Schema, model } from "mongoose";

const reporteSchema = new Schema({
  fecha: { type: Date, default: Date.now },
  scheduleId: { type: Schema.Types.ObjectId, ref: "Schedule" },
  ficha: String,
  info: Schema.Types.Mixed
});

export const Reporte = model("Reporte", reporteSchema);