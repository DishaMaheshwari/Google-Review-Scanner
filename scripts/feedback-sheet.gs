/**
 * Google Apps Script — appends one row per feedback submission to the
 * Sheet this script is bound to.
 *
 * Setup:
 *  1. Open (or create) a Google Sheet to collect feedback in.
 *  2. Extensions → Apps Script. Delete any starter code and paste this file.
 *  3. Deploy → New deployment → type "Web app".
 *       Execute as: Me
 *       Who has access: Anyone
 *     (This URL is a write-only secret: nobody without it can post rows, and
 *     it grants no read access to your Sheet or Google account.)
 *  4. Copy the deployment URL into FEEDBACK_SHEET_URL in your environment.
 *  5. Redeploy the app after adding the environment variable.
 *
 * Every edit to this script requires a new "New deployment" (or "Manage
 * deployments" → edit → new version) for the change to take effect — saving
 * the file alone does not update a live deployment.
 */
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Received at", "Rating", "Message"]);
  }

  const body = JSON.parse(e.postData.contents);
  sheet.appendRow([body.at || new Date().toISOString(), body.rating, body.message]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
