// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { exportToCSV } from './exportUtils';

describe('exportToCSV Security & Formatting', () => {
  it('should escape CSV formula injection triggers (=, +, -, @)', () => {
    // Mock Blob and URL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock');
    global.URL.revokeObjectURL = vi.fn();
    
    let createdBlob = null;
    global.Blob = class MockBlob {
      constructor(content, options) {
        createdBlob = content[0];
        this.options = options;
      }
    };

    const mockAnchor = {
      setAttribute: vi.fn(),
      click: vi.fn()
    };
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});

    const maliciousRows = [
      {
        district: '=cmd|/C calc!A0',
        rate: '+12.5',
        notes: '-malicious payload',
        contact: '@admin'
      }
    ];

    exportToCSV(maliciousRows, 'test_export.csv');

    expect(createdBlob).toBeDefined();
    // Verify that single quote prefix was safely injected to neutralize formula execution
    expect(createdBlob).toContain("\"'=cmd|/C calc!A0\"");
    expect(createdBlob).toContain("\"'+12.5\"");
    expect(createdBlob).toContain("\"'-malicious payload\"");
    expect(createdBlob).toContain("\"'@admin\"");
  });
});
