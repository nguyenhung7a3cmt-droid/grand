import { getDB } from './database.js';
import { makeImagePermanent } from './imageUploader.js';

async function batchMigrate() {
  const db = getDB();
  console.log('[BatchMigrate] Starting proof migration...');

  const rows = db.prepare(`
    SELECT id, order_number, proof_screenshot 
    FROM proofs 
    WHERE proof_screenshot LIKE '%cdn.discordapp.com%' 
       OR proof_screenshot LIKE '%media.discordapp.net%'
  `).all();

  console.log(`[BatchMigrate] Found ${rows.length} proofs with Discord CDN attachments to process.`);

  let succeeded = 0;
  let failed = 0;
  let skipped = 0;

  const updateStmt = db.prepare(`
    UPDATE proofs SET proof_screenshot = ? WHERE id = ?
  `);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const orderNum = row.order_number || `order_${row.id}`;
    
    try {
      const permUrl = await makeImagePermanent(row.proof_screenshot, orderNum);
      if (permUrl && permUrl !== row.proof_screenshot) {
        updateStmt.run(permUrl, row.id);
        succeeded++;
      } else if (permUrl === row.proof_screenshot) {
        skipped++;
      } else {
        failed++;
        console.warn(`[BatchMigrate] Could not fetch proof for ${orderNum}`);
      }
    } catch (err) {
      failed++;
      console.error(`[BatchMigrate] Error on ${orderNum}:`, err.message);
    }

    if ((i + 1) % 20 === 0 || i === rows.length - 1) {
      console.log(`[BatchMigrate] Progress: ${i + 1}/${rows.length} (Success: ${succeeded}, Failed: ${failed}, Skipped: ${skipped})`);
    }
  }

  console.log(`[BatchMigrate] Completed! Total Succeeded: ${succeeded}, Failed: ${failed}, Skipped: ${skipped}`);
}

batchMigrate().catch(console.error);
