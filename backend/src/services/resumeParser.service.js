const PDFParser = require('pdf2json');
const mammoth = require("mammoth");

async function parseResume(file) {
  try {
    if (file.mimetype === "application/pdf") {
      // Use pdf2json to extract text from PDF
      return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser();
        
        pdfParser.on('pdfParser_dataError', (errData) => {
          reject(new Error(`PDF parsing error: ${errData.parserError}`));
        });
        
        pdfParser.on('pdfParser_dataReady', (pdfData) => {
          try {
            // Extract text from all pages
            let fullText = '';
            
            if (pdfData.Pages && pdfData.Pages.length > 0) {
              pdfData.Pages.forEach(page => {
                if (page.Texts && page.Texts.length > 0) {
                  page.Texts.forEach(text => {
                    if (text.R && text.R.length > 0) {
                      text.R.forEach(textRun => {
                        if (textRun.T) {
                          try {
                            // Try to decode URI component, fallback to raw text if it fails
                            fullText += decodeURIComponent(textRun.T) + ' ';
                          } catch (e) {
                            // If decoding fails, use the raw text
                            fullText += textRun.T + ' ';
                          }
                        }
                      });
                    }
                  });
                  fullText += '\n';
                }
              });
            }
            
            resolve(fullText.trim() || 'No text found in PDF');
          } catch (parseError) {
            reject(new Error(`Error processing PDF data: ${parseError.message}`));
          }
        });
        
        // Parse the PDF buffer
        pdfParser.parseBuffer(file.buffer);
      });
    }

    if (
      file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      return result.value;
    }

    throw new Error("Unsupported file format. Please use PDF or DOCX files.");
  } catch (error) {
    console.error("Parse error:", error);
    throw error;
  }
}

module.exports = { parseResume };
