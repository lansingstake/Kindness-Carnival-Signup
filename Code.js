// Run this function manually in the Google Apps Script editor (click 'Run')
// This forces Google to prompt you for the necessary email permissions.
function setupAuthorization() {
  MailApp.sendEmail(Session.getActiveUser().getEmail(), "Authorization Successful", "Your Kindness Carnival script is now authorized to send emails!");
}

// Setup CORS headers
function buildHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

// Handle OPTIONS requests for CORS preflight
function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders(buildHeaders());
}

function doGet(e) {
  try {
    const sheetName = "Sign Ups";
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Sheet not found" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = sheet.getDataRange().getValues();
    
    let count1 = 0; // 2:55 (Col A - index 0)
    let count2 = 0; // 4:00 (Col D - index 3)
    let count3 = 0; // 5:00 (Col G - index 6)
    
    // Start at row 3 to skip two header rows (0-indexed array, so i=2 is row 3)
    for (let i = 2; i < data.length; i++) {
      if (data[i][0]) count1++;
      if (data[i][3]) count2++;
      if (data[i][6]) count3++;
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      counts: {
        "act-1": count1,
        "act-2": count2,
        "clean": count3
      }
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    // Parse the incoming JSON data
    let body;
    if (e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    } else {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "No data received" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const { name, email, phone, slot } = body;
    if (!name || !email || !slot) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Missing required fields" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const sheetName = "Sign Ups";
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Sheet not found" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Determine target column based on the slot string
    // "Help with an Activity 2:55-4:00pm" -> Col A=1, B=2, C=3
    // "Help with an Activity 4:00-5:00pm" -> Col D=4, E=5, F=6
    // "Cleanup 5:00-6:00pm" -> Col G=7, H=8, I=9
    let targetCol = 0;
    if (slot.includes("2:55")) {
      targetCol = 1; // Column A
    } else if (slot.includes("4:00")) {
      targetCol = 4; // Column D
    } else if (slot.includes("Cleanup") || slot.includes("5:00")) {
      targetCol = 7; // Column G
    } else {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Invalid slot selected" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Find the next empty row in the target column
    const columnData = sheet.getRange(1, targetCol, sheet.getMaxRows(), 1).getValues();
    let nextRow = 1;
    for (let i = 0; i < columnData.length; i++) {
      if (columnData[i][0] === "") {
        nextRow = i + 1;
        break;
      }
    }
    
    // If the column is full and max rows exceeded
    if (nextRow > sheet.getMaxRows()) {
       sheet.insertRowAfter(sheet.getMaxRows());
    }

    // Write to the sheet: Name (targetCol), Email (targetCol+1), Phone (targetCol+2)
    sheet.getRange(nextRow, targetCol).setValue(name);
    sheet.getRange(nextRow, targetCol + 1).setValue(email);
    if (phone) {
      sheet.getRange(nextRow, targetCol + 2).setValue(phone);
    }

    // Send Confirmation Email
    try {
      console.log(`Attempting to send confirmation email to: ${email} for user: ${name}`);
      const firstName = name.split(' ')[0];
      const subject = "Kindness Carnival - Sign Up Confirmation";
      const bodyText = `Hi ${firstName},\n\nThank you for signing up to help with the Kindness Carnival!\n\nYou have successfully signed up for:\n${slot}\n\nLocation: Stake Center\n431 E Saginaw St, East Lansing, MI 48823.\n\n*** Please add this to your personal calendar** \nIf you need to make a change, please reach out to Stephanie Farero at stefarero@gmail.com \n\nWe appreciate your willingness to serve and help make this a success. See you there!\n\nBest,\nThe Kindness Carnival Team`;
      
      MailApp.sendEmail(email, subject, bodyText);
      console.log(`Successfully sent confirmation email to: ${email}`);
    } catch (emailError) {
      // If email fails, we continue anyway since the signup was recorded
      console.error(`ERROR: Failed to send email to ${email}. Exception details: ${emailError.toString()}`);
    }

    // Return success response
    const response = { status: "success", message: "Sign up recorded!" };
    
    // ContentService does not support .setHeaders() natively for CORS in the same way,
    // but the fetch request in the browser will handle it via JSONP or no-cors if configured.
    // However, Google Apps Script automatically handles CORS for ContentService.
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
