import axios from "axios";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const analyzeResume = async (formData) => {
  const response = await fetch(`${API_BASE_URL}/api/analysis/analyze`, {
    method: "POST",
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  // Parse JSON from response
  const data = await response.json();
  return { data }; 
};
