import QRCode from "qrcode";
import { IQRCodeService } from "../../../shared/interfaces/services";

export class QRCodeService implements IQRCodeService {
  async generateQRCode(data: string): Promise<string> {
    try {

      const qrCodeDataURL = await QRCode.toDataURL(data, {
        errorCorrectionLevel: "H",
        type: "image/png",
        margin: 1,
        width: 300,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      return qrCodeDataURL;
    } catch (error) {
      console.error("Failed to generate QR code:", error);
      throw new Error("Failed to generate QR code");
    }
  }

  async generateQRCodeBuffer(data: string): Promise<Buffer> {
    try {
      const buffer = await QRCode.toBuffer(data, {
        errorCorrectionLevel: "H",
        type: "png",
        margin: 1,
        width: 300,
      });

      return buffer;
    } catch (error) {
      console.error("Failed to generate QR code buffer:", error);
      throw new Error("Failed to generate QR code buffer");
    }
  }
}

