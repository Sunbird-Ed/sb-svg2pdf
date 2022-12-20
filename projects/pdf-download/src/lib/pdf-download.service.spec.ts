import { TestBed } from '@angular/core/testing';

import { PdfDownloadService } from './pdf-download.service';

describe('PdfDownloadService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: PdfDownloadService = TestBed.get(PdfDownloadService);
    expect(service).toBeTruthy();
  });
});
