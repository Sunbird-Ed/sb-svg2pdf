import {Inject, Injectable} from '@angular/core';
import {CertificateDirectivesUtility} from './certificate-directives-utility';
import * as htmlToImage from 'html-to-image';
import jsPDF from "jspdf";

@Injectable()
export class CertificateDownloadAsPdfService {

  constructor(
    @Inject('DOMTOIMAGE') private domtoimageModule,
    @Inject('JSPDF') private jsPDFModule,
  ) {
  }

  applyDirectionToTspans(svgElement): string {
    console.log('Function called with svgElement:', svgElement); // Add this line

    // Use the passed svgElement instead of querying document
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgElement, 'text/html');
    const svg = doc.querySelector('svg');

    if (!svg) {
      console.warn('SVG element not found in provided content');
      return svgElement;
    }

    console.log('SVG found:', svg); // Add this line

    const tspans = svg.querySelectorAll('tspan');
    console.log('Number of tspans found:', tspans.length); // Add this line

    tspans.forEach((tspan, index) => {
      const text = tspan.textContent?.trim() ?? '';
      const isArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);

      console.log(`Tspan ${index}:`, {
        text: text,
        isArabic: isArabic,
        element: tspan
      });

      tspan.setAttribute('direction', isArabic ? 'rtl' : 'ltr');
      tspan.setAttribute('unicode-bidi', 'embed');
      // tspan.setAttribute('text-anchor', isArabic ? 'end' : 'start');
      if (isArabic) {
        switch (index) {
          case 0:
            break;
          case 1:
            break;
          case 2:
            tspan.setAttribute('x', '-87');
            break;
          case 3:
            tspan.setAttribute('x', '202');
            break;
          case 4:
            tspan.setAttribute('x', '202');
            break;
          default:
            break;
        }
      }
    });

    return doc.documentElement.outerHTML;
  }

  async downloadPdf(template: string, handlePdfData?: (fileName: string, pdfData: Blob) => void, fileName?: string) {
    try {
      if (template.startsWith('data:image/svg+xml,')) {
        template = decodeURIComponent(template.replace(/data:image\/svg\+xml,/, '')).replace(/\<!--\s*[a-zA-Z0-9\-]*\s*--\>/g, '');
      }
      template = this.applyDirectionToTspans(template);

      const canvasElement = document.createElement('div');
      canvasElement.id = 'sbCertificateDownloadAsPdfCanvas' + Date.now();
      document.body.appendChild(canvasElement);

      canvasElement.innerHTML = template;

      const options = {
        width: 842,
        height: 596,
        style: {
          left: '0',
          right: '0',
          bottom: '0',
          top: '0',
          transform: 'scale(1)',
        }
      };
     
      const pngUriString = await htmlToImage.toPng(canvasElement, options);

      const pdf = new jsPDF('landscape', 'mm', 'a4');

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(pngUriString, 'PNG', 0, 0, pdfWidth, pdfHeight);

      fileName = fileName || CertificateDirectivesUtility.extractFileName(template);

      if (handlePdfData) {
        handlePdfData(fileName + '.pdf', pdf.output('blob'));
      } else {
        pdf.save(fileName + '.pdf');
      }

      canvasElement.remove();
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  async download(template: string, handlePdfData?: (fileName: string, pdfData: Blob) => void, fileName?: string) {
    if (template.startsWith('data:image/svg+xml,')) {
      template = decodeURIComponent(template.replace(/data:image\/svg\+xml,/, '')).replace(/\<!--\s*[a-zA-Z0-9\-]*\s*--\>/g, '');
    }
    const canvasElement = CertificateDirectivesUtility.appendGhostDiv(
      'sbCertificateDownloadAsPdfCanvas' + Date.now(),
      {
        width: 1060,
        height: 750
      }
    );

    canvasElement.innerHTML = template;

    const domtoimage = await this.domtoimageModule;

    domtoimage.toPng(canvasElement, {
      style: {
        left: '0',
        right: '0',
        bottom: '0',
        top: '0'
      }
    })
    .then(async (blob) => {
      const JsPDF = await this.jsPDFModule;
      const pdf = new JsPDF({
        orientation: 'landscape',
        unit: 'pt',
        format: [
          1060 / 1.33, 750 / 1.33
        ]
      });
      pdf.addImage(blob, 'PNG', 0, 0);

      fileName = fileName || CertificateDirectivesUtility.extractFileName(template);

      if (handlePdfData) {
        handlePdfData(fileName + '.pdf', pdf.output('blob'));
      } else {
        pdf.save(fileName + '.pdf');
      }

      canvasElement.remove();
    });
  }
}
