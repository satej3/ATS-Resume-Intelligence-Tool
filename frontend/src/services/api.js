import axios from "axios";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const analyzeResume = async (formData) =>
  await fetch(`${API_BASE_URL}/api/analysis/analyze`, {
  method: "POST",
  body: formData,
});


