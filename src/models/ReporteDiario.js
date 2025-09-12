import { Schema, model } from "mongoose";

const reporteDiarioSchema = new Schema({
  fechaCalificacion: { type: Date, default: Date.now },
  scheduleId: { type: Schema.Types.ObjectId, ref: "Schedule" },
  ficha: String,
  info: Schema.Types.Mixed
});

export const ReporteDiario = model("ReporteDiario", reporteDiarioSchema, "reportes_diarios");