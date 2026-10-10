/**
 * ROMANTIC PROPOSAL WEB APP - GOOGLE APPS SCRIPT BACKEND
 * -------------------------------------------------------------
 * This script receives girlfriend responses from the romantic proposal website
 * and appends them to a 'Responses' tab in your Google Sheet.
 *
 * HOW TO SET UP:
 * 1. Open Google Sheets (https://sheets.new)
 * 2. Name your sheet: "My Romantic Proposal Responses"
 * 3. Go to Extensions -> Apps Script
 * 4. Delete any code inside Code.gs and PASTE THIS ENTIRE FILE
 * 5. Click "Deploy" (top right) -> "New deployment"
 * 6. Click the gear icon (Select type) -> choose "Web app"
 * 7. Description: "Proposal Receiver"
 * 8. Execute as: "Me (your email)"
 * 9. Who has access: "Anyone" (CRITICAL: must be Anyone so your website can post answers)
 * 10. Click "Deploy" -> "Authorize Access" -> choose your Google account -> "Advanced" -> "Go to (unsafe)" -> "Allow"
 * 11. Copy the "Web app URL" (starts with https://script.google.com/macros/s/...)
 * 12. Paste that URL into the Admin Dashboard Settings or your .env file!
 */

const SHEET_TAB_NAME = "Responses";

const HEADERS = [
  "Submission ID",
  "Submission Date and Time",
  "Girlfriend Name",
  "Best Memory",
  "Dream Destination",
  "Cute Habit",
  "Our Song",
  "Final Message",
  "Submission Status"
];

// Handles GET requests (for testing and ping checks)
function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({
      status: "online",
      message: "Proposal Google Apps Script Web App is active and ready to receive love notes! ❤️",
      timestamp: new Date().toISOString()
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

// Handles POST submissions
function doPost(e) {
  const lock = LockService.getScriptLock();
  
  // Wait up to 30 seconds for concurrent write safety
  try {
    lock.waitLock(30000);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        error: "Server was busy. Please retry in a few moments."
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    // 1. Parse incoming payload
    let data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        // Fallback for form-encoded or raw parameters
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    // 2. Open spreadsheet & target sheet tab
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_TAB_NAME);

    // Create and format the sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_TAB_NAME);
      sheet.appendRow(HEADERS);
      
      // Format headers: Bold, dark midnight background, neon pink text
      const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#0d0d1a");
      headerRange.setFontColor("#ff007f");
      headerRange.setFontSize(11);
      sheet.setFrozenRows(1);
      
      // Set reasonable column widths
      sheet.setColumnWidth(1, 140); // Submission ID
      sheet.setColumnWidth(2, 180); // Date & Time
      sheet.setColumnWidth(3, 160); // Name
      sheet.setColumnWidth(4, 300); // Memory
      sheet.setColumnWidth(5, 240); // Destination
      sheet.setColumnWidth(6, 240); // Cute Habit
      sheet.setColumnWidth(7, 200); // Song
      sheet.setColumnWidth(8, 400); // Final Message
      sheet.setColumnWidth(9, 140); // Status
    }

    // 3. Prepare data fields with sanitization (prevent formula injection)
    function sanitize(val) {
      if (val === undefined || val === null) return "";
      let str = String(val).trim();
      // If starts with =, +, -, @, prepend single quote so Sheets treats it as plain text
      if (/^[=+\-@]/.test(str)) {
        str = "'" + str;
      }
      return str;
    }

    const now = new Date();
    const submissionId = sanitize(data.submissionId || ("PROP-" + Utilities.getUuid().substring(0, 8).toUpperCase()));
    const submissionDate = sanitize(data.submissionDate || Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss"));
    const girlfriendName = sanitize(data.girlfriendName || "My Love");
    const bestMemory = sanitize(data.bestMemory || "");
    const dreamDestination = sanitize(data.dreamDestination || "");
    const cuteHabit = sanitize(data.cuteHabit || "");
    const ourSong = sanitize(data.ourSong || "");
    const finalMessage = sanitize(data.finalMessage || "");
    const status = sanitize(data.status || "Submitted with Love ❤️");

    // 4. Append row
    sheet.appendRow([
      submissionId,
      submissionDate,
      girlfriendName,
      bestMemory,
      dreamDestination,
      cuteHabit,
      ourSong,
      finalMessage,
      status
    ]);

    // 5. Return success JSON
    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        submissionId: submissionId,
        message: "Saved successfully to Google Sheets! 💖",
        timestamp: submissionDate
      })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        error: error.toString()
      })
    ).setMimeType(ContentService.MimeType.JSON);
  } finally {
    // Release the write lock
    lock.releaseLock();
  }
}
