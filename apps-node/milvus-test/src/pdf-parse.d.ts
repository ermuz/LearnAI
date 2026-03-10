declare module "pdf-parse" {
  interface PdfParseResult {
    numpages: number;
    text: string;
    info?: unknown;
  }
  function pdfParse(dataBuffer: Buffer): Promise<PdfParseResult>;
  export default pdfParse;
}
