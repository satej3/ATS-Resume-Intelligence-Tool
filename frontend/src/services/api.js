import axios from "axios";

export const analyzeResume = (formData) =>
  axios.post("http://localhost:5000/api/analysis/analyze", formData);
