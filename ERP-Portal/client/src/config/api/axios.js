import axios from "axios";

export default axios.create({
  baseURL: "http://localhost:3500",
  headers: { "Content-Type": "application/json" },
});

// Function to download IA marks as PDF
export const downloadIAmarksPDF = async (paperId) => {
  try {
    const response = await axios.get(`/internal/download-pdf/${paperId}`, {
      responseType: "blob", // important for downloading files
    });
    // Create a link element to trigger the file download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "IA_Marks.pdf"); // Name the file
    document.body.appendChild(link);
    link.click();
  } catch (error) {
    console.error("Error downloading PDF", error);
  }
};
