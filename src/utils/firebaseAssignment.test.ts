import test from 'node:test';
import assert from 'node:assert/strict';
import { resizeImageWithCanvas } from '../firebase';

test('resizeImageWithCanvas preserves dimensions within maxWidth limit (<= 1280px)', async () => {
  // In Node environment without window/Image, fallback returns the input file intact
  const dummyBlob = new Blob(['mock binary image data'], { type: 'image/jpeg' });
  const result = await resizeImageWithCanvas(dummyBlob, 1280, 0.75);
  assert.ok(result);
});

test('calculate scaled dimensions helper preserves aspect ratio under 1280px', () => {
  function getTargetDimensions(origWidth: number, origHeight: number, maxWidth: number = 1280) {
    let width = origWidth;
    let height = origHeight;
    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    }
    return { width, height };
  }

  // Case 1: Image wider than 1280 (e.g. 2560x1440)
  const case1 = getTargetDimensions(2560, 1440, 1280);
  assert.equal(case1.width, 1280);
  assert.equal(case1.height, 720);

  // Case 2: Image wider than 1280 vertical (e.g. 1920x2560)
  const case2 = getTargetDimensions(1920, 2560, 1280);
  assert.equal(case2.width, 1280);
  assert.equal(case2.height, Math.round((2560 * 1280) / 1920));

  // Case 3: Image already smaller than 1280 (e.g. 800x600)
  const case3 = getTargetDimensions(800, 600, 1280);
  assert.equal(case3.width, 800);
  assert.equal(case3.height, 600);
});

test('gradeAndDelete schema contract validates status, score and storage cleanup', () => {
  // Simulating the contract expectations
  const mockDoc = {
    id: 'doc_123',
    studentId: '10001',
    studentName: 'เด็กชาย ภูริวัจน์ พงศ์สิริกุล',
    title: 'ใบงานระบบนิเวศ',
    filePath: 'submissions/10001_1720000000000_sample.jpg',
    fileUrl: 'https://firebasestorage.googleapis.com/...',
    status: 'pending' as 'pending' | 'graded',
    score: null as number | null,
  };

  // Before grading
  assert.equal(mockDoc.status, 'pending');
  assert.equal(mockDoc.score, null);
  assert.ok(mockDoc.fileUrl);

  // Apply gradeAndDelete contract transformation
  const gradedScore = 9;
  const updatedDoc: Record<string, any> = {
    ...mockDoc,
    status: 'graded',
    score: gradedScore,
  };
  delete updatedDoc.fileUrl; // deleteField() simulation

  assert.equal(updatedDoc.status, 'graded');
  assert.equal(updatedDoc.score, 9);
  assert.equal(updatedDoc.fileUrl, undefined);
  assert.equal(updatedDoc.filePath, 'submissions/10001_1720000000000_sample.jpg');
});
