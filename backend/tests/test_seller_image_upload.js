/**
 * Test Suite: Seller Product Image Gallery Picker & Upload Workflow
 */
const path = require('path');
const fs = require('fs');
const assert = require('assert');
const { upload } = require('../src/middleware/uploadMiddleware');
const sellerProductController = require('../src/controllers/seller/sellerProductController');

async function runTests() {
  console.log('--- Starting Seller Product Image Upload Tests ---');

  // Test 1: Upload middleware mime filter
  console.log('1. Testing allowed vs forbidden MIME types in uploadMiddleware...');
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const disallowed = ['application/pdf', 'application/zip', 'text/javascript'];

  const fileFilter = upload.fileFilter;
  for (const mime of allowed) {
    fileFilter({}, { mimetype: mime }, (err, accept) => {
      assert.strictEqual(err, null);
      assert.strictEqual(accept, true);
    });
  }
  for (const mime of disallowed) {
    fileFilter({}, { mimetype: mime }, (err, accept) => {
      assert(err !== null, `Expected rejection for mime: ${mime}`);
      assert.strictEqual(accept, false);
    });
  }
  console.log('   ✓ MIME type whitelist correctly enforces JPEG, JPG, PNG, WEBP.');

  // Test 2: Reject empty image upload
  console.log('2. Testing empty upload validation in uploadProductImages...');
  let status1 = null;
  let body1 = null;
  const res1 = {
    status(c) { status1 = c; return this; },
    json(d) { body1 = d; return this; }
  };
  await sellerProductController.uploadProductImages({ files: [] }, res1, () => {});
  assert.strictEqual(status1, 400);
  assert.strictEqual(body1.success, false);
  console.log('   ✓ Rejected empty upload with status 400.');

  // Test 3: Upload files and generate URLs
  console.log('3. Testing multipart file upload and full URL generation...');
  const uploadDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const tempFile1 = path.join(uploadDir, `test-img-${Date.now()}-1.png`);
  const tempFile2 = path.join(uploadDir, `test-img-${Date.now()}-2.webp`);
  fs.writeFileSync(tempFile1, 'mock png');
  fs.writeFileSync(tempFile2, 'mock webp');

  let status2 = null;
  let body2 = null;
  const req2 = {
    protocol: 'http',
    get: (h) => (h === 'host' ? '10.29.182.95:5000' : ''),
    files: [
      { path: tempFile1, originalname: 'product-front.png', mimetype: 'image/png' },
      { path: tempFile2, originalname: 'product-side.webp', mimetype: 'image/webp' },
    ]
  };
  const res2 = {
    status(c) { status2 = c; return this; },
    json(d) { body2 = d; return this; }
  };

  await sellerProductController.uploadProductImages(req2, res2, () => {});
  assert.strictEqual(status2, 201);
  assert.strictEqual(body2.success, true);
  assert(Array.isArray(body2.data.urls));
  assert.strictEqual(body2.data.urls.length, 2);
  assert(body2.data.urls[0].includes('http://10.29.182.95:5000/uploads/'));
  assert(body2.data.urls[1].includes('http://10.29.182.95:5000/uploads/'));

  console.log('   ✓ Successfully generated complete accessible URLs:');
  body2.data.urls.forEach((u, i) => console.log(`     [${i + 1}] ${u}`));

  // Cleanup temp files
  if (fs.existsSync(tempFile1)) fs.unlinkSync(tempFile1);
  if (fs.existsSync(tempFile2)) fs.unlinkSync(tempFile2);

  console.log('\n--- ALL SELLER PRODUCT IMAGE TESTS PASSED (3/3) ---');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});

