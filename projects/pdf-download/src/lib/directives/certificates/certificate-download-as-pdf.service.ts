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
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgElement, 'text/html');
    const svg = doc.querySelector('svg');

    if (!svg) {
      console.warn('SVG element not found in provided content');
      return svgElement;
    }

    const tspans = svg.querySelectorAll('tspan');
    const totalTspans = tspans.length;

    tspans.forEach((tspan, index) => {
      const text = tspan.textContent?.trim() ?? '';
      const isRTLLang = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);

      tspan.setAttribute('direction', isRTLLang ? 'rtl' : 'ltr');
      tspan.setAttribute('unicode-bidi', 'embed');
      if (isRTLLang) {
        const xMap = {
          4: { 1: '-87', 2: '200', 3: '200' },
          5: { 2: '-87', 3: '200', 4: '200' }
        };
        
        const xValue = xMap[totalTspans]?.[index];
        if (xValue !== undefined) {
          tspan.setAttribute('x', xValue);
        }
      }

    });

    return doc.documentElement.outerHTML;
  }

  async download(template: string, handlePdfData?: (fileName: string, pdfData: Blob) => void, fileName?: string) {
    if (template.startsWith('data:image/svg+xml,')) {
      template = decodeURIComponent(template.replace(/data:image\/svg\+xml,/, '')).replace(/\<!--\s*[a-zA-Z0-9\-]*\s*--\>/g, '');
    }

    template = this.applyDirectionToTspans(template);

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
