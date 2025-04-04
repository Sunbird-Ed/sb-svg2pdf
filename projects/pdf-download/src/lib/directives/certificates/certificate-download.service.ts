import {Inject, Injectable} from '@angular/core';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from "jspdf";

@Injectable()
export class CertificateDownloadService {
  constructor(
    @Inject('DOMTOIMAGE') private domtoimageModule,
    @Inject('JSPDF') private jsPDFModule,
  ) {
  }

  async buildBlob(certificateContainer: HTMLElement, format: 'pdf' | 'png'): Promise<Blob> {
    const options = {
      width: 1060,
      height: 750,
      style: {
        left: '0',
        right: '0',
        bottom: '0',
        top: '0'
      }
    };

    if (format === 'png') {
      return htmlToImage.toBlob(certificateContainer, options);
    }

    const pngUriString: string = await htmlToImage.toPng(certificateContainer, options);

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [
        1060 * 0.352778 / 1.333, 750 * 0.352778 / 1.333
      ]
    });

    const pdfWidth = pdf.internal.pageSize.width;
    const pdfHeight = pdf.internal.pageSize.height;

    pdf.addImage(pngUriString, 'PNG', 0, 0, pdfWidth, pdfHeight);
    return pdf.output('blob') as Blob;
  }
}
