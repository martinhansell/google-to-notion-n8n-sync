// ============================================================
// ASSIGNMENT CONFIRMATION FORM — CONSOLIDATED PROTOTYPE
// ============================================================

const ROSTER_FILE_NAME = 'SAFE Copy of Bible Facilitation Roster@20260903';
const FACILITATOR_LISTS_TAB = 'FacilitatorLists';


// ============================================================
// 1. REBUILD THE COMPLETE FORM
// ============================================================

function clearFormBranching_(form) {
  form.getItems(FormApp.ItemType.MULTIPLE_CHOICE)
    .map(item => item.asMultipleChoiceItem())
    .forEach(question => {
      question.setChoices(
        question.getChoices().map(choice =>
          question.createChoice(choice.getValue())
        )
      );
    });

  form.getItems(FormApp.ItemType.PAGE_BREAK)
    .map(item => item.asPageBreakItem())
    .forEach(section => {
      section.setGoToPage(FormApp.PageNavigationType.CONTINUE);
    });
}

function rebuildAssignmentConfirmationForm() {
  const form = FormApp.getActiveForm();

  clearFormBranching_(form);

  // Delete every existing item so we start from one known structure.
  const existingItems = form.getItems();

  for (let i = existingItems.length - 1; i >= 0; i--) {
    form.deleteItem(existingItems[i]);
  }

  form.setTitle('Assignment Confirmation Form');

  form.setDescription(
    'Please review your Bible Reading facilitation details and respond below.'
  );

  form.setConfirmationMessage(
    'Thank you. Your response has been recorded and will be validated against the current facilitation record.'
  );


  // ----------------------------------------------------------
  // INITIAL FACILITATION DATA
  // Later populated through the facilitator-specific secure link.
  // ----------------------------------------------------------

  form.addSectionHeaderItem()
    .setTitle('Your Facilitation');

  form.addTextItem()
    .setTitle('Assignment ID')
    .setRequired(true);

  form.addTextItem()
    .setTitle('Assignment Token')
    .setRequired(true);

  form.addTextItem()
    .setTitle('Facilitator')
    .setRequired(true);

  form.addTextItem()
    .setTitle('Date')
    .setRequired(true);

  form.addTextItem()
    .setTitle('Location')
    .setRequired(true);

  form.addTextItem()
    .setTitle('Reading Unit / Session')
    .setRequired(true);

  form.addTextItem()
    .setTitle('Role')
    .setRequired(true);

  form.addTextItem()
    .setTitle('Current Confirmation State')
    .setRequired(true);


  // ----------------------------------------------------------
  // SECTION 2 — INITIAL RESPONSE
  // ----------------------------------------------------------

  const responseSection = form.addPageBreakItem()
    .setTitle('Your Response')
    .setHelpText(
      'Please confirm your facilitation or indicate that you are seeking a replacement.'
    );

  const actionItem = form.addMultipleChoiceItem()
    .setTitle('What would you like to do?')
    .setRequired(true);


  // ----------------------------------------------------------
  // SECTION 3 — CONFIRM
  // ----------------------------------------------------------

  const confirmSection = form.addPageBreakItem()
    .setTitle('Confirm Facilitation')
    .setHelpText(
      'Submit this form to confirm that you will fulfil this facilitation.'
    );

  confirmSection.setGoToPage(
    FormApp.PageNavigationType.SUBMIT
  );


  // ----------------------------------------------------------
  // SECTION 4 — SEEKING REPLACEMENT
  // ----------------------------------------------------------

  const seekingSection = form.addPageBreakItem()
    .setTitle('Seeking Replacement')
    .setHelpText(
      'Select the facilitator you are currently approaching as a possible replacement.'
    );

  const seekingDropdown = form.addListItem()
    .setTitle('Who are you approaching?')
    .setChoiceValues(
      getEligibleFacilitators_()
    )
    .setRequired(true);

  seekingSection.setGoToPage(
    FormApp.PageNavigationType.SUBMIT
  );


  // ----------------------------------------------------------
  // INITIAL RESPONSE BRANCHING
  // ----------------------------------------------------------

  actionItem.setChoices([
    actionItem.createChoice(
      'Confirm',
      confirmSection
    ),

    actionItem.createChoice(
      'Seeking Replacement',
      seekingSection
    )
  ]);


  // ----------------------------------------------------------
  // SECTION 5 — REPLACEMENT FOLLOW-UP
  // This will later be reached through a follow-up secure link.
  // ----------------------------------------------------------

  const followUpSection = form.addPageBreakItem()
    .setTitle('Replacement Follow-Up')
    .setHelpText(
      'Review the current replacement status for this facilitation.'
    );

  form.addTextItem()
    .setTitle('Current Proposed Replacement')
    .setRequired(false);

  const replacementStatusItem = form.addMultipleChoiceItem()
    .setTitle('What is the current replacement status?')
    .setRequired(true);


  // ----------------------------------------------------------
  // SECTION 6 — CHANGE PROPOSED REPLACEMENT
  // ----------------------------------------------------------

  const newReplacementSection = form.addPageBreakItem()
    .setTitle('Select New Replacement')
    .setHelpText(
      'Choose the facilitator you are now approaching as the proposed replacement.'
    );

  form.addListItem()
    .setTitle('New Proposed Replacement')
    .setChoiceValues(
      getEligibleFacilitators_()
    )
    .setRequired(true);

  newReplacementSection.setGoToPage(
    FormApp.PageNavigationType.SUBMIT
  );


  // ----------------------------------------------------------
  // FOLLOW-UP BRANCHING
  // ----------------------------------------------------------

  replacementStatusItem.setChoices([
    replacementStatusItem.createChoice(
      'Replacement Confirmed',
      FormApp.PageNavigationType.SUBMIT
    ),

    replacementStatusItem.createChoice(
      'Still Awaiting Confirmation',
      FormApp.PageNavigationType.SUBMIT
    ),

    replacementStatusItem.createChoice(
      'Change Proposed Replacement',
      newReplacementSection
    )
  ]);

  Logger.log('Assignment Confirmation Form rebuilt successfully.');
}


// ============================================================
// 2. READ APPROVED FACILITATORS
// Prototype currently combines Tuesday / Thursday / Singapore.
// Later this will be filtered according to the actual facilitation.
// ============================================================

/*function getEligibleFacilitators_() {
  const files = DriveApp.getFilesByName(
    ROSTER_FILE_NAME
  );*/

  function getEligibleFacilitators_() {
  const spreadsheet = SpreadsheetApp.openById(
  '1bXkN49Z9rTkfXaHrZ5PaIB2uqRG9qfk4Qhc3JyORrKA'
  );

  /*if (!files.hasNext()) {
    throw new Error(
      'Roster spreadsheet not found: ' + ROSTER_FILE_NAME
    );
  }*/

  /*const spreadsheet = SpreadsheetApp.open(
    files.next()
  );*/

  const sheet = spreadsheet.getSheetByName(
    FACILITATOR_LISTS_TAB
  );

  if (!sheet) {
    throw new Error(
      'FacilitatorLists tab not found.'
    );
  }

  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    throw new Error(
      'No facilitator names found.'
    );
  }

  const names = sheet
    .getRange(
      2,
      3,
      lastRow - 1,
      3
    ) // Columns C:E
    .getValues()
    .flat()
    .map(value => String(value).trim())
    .filter(Boolean);

  const uniqueNames = [
    ...new Set(names)
  ].sort();

  if (uniqueNames.length === 0) {
    throw new Error(
      'No eligible facilitators found.'
    );
  }

  return uniqueNames;
}


// ============================================================
// 3. REFRESH BOTH REPLACEMENT DROPDOWNS
// ============================================================

function updateReplacementFacilitatorDropdowns() {
  const form = FormApp.getActiveForm();

  const facilitatorNames =
    getEligibleFacilitators_();

  const dropdownTitles = [
    'Who are you approaching?',
    'New Proposed Replacement'
  ];

  const dropdowns = form
    .getItems(FormApp.ItemType.LIST)
    .map(item => item.asListItem());

  dropdownTitles.forEach(title => {
    const dropdown = dropdowns.find(
      item => item.getTitle() === title
    );

    if (!dropdown) {
      throw new Error(
        'Dropdown not found: ' + title
      );
    }

    dropdown.setChoiceValues(
      facilitatorNames
    );
  });

  Logger.log(
    'Replacement dropdowns updated successfully.'
  );
}


// ============================================================
// 4. GENERATE TEST FACILITATOR LINK
// ============================================================

function generateValidationTestLinks() {
  const form = FormApp.getActiveForm();

  /*const files = DriveApp.getFilesByName(ROSTER_FILE_NAME);*/

  const spreadsheet = SpreadsheetApp.openById(
  '1bXkN49Z9rTkfXaHrZ5PaIB2uqRG9qfk4Qhc3JyORrKA'
  );

  /*if (!files.hasNext()) {
    throw new Error('Roster spreadsheet not found.');
  }*/

  const sheet = spreadsheet.getSheetByName('Assignments — Sync');

  if (!sheet) {
    throw new Error('Assignments — Sync tab not found.');
  }

  const lastRow = sheet.getLastRow();

  const rows = sheet
    .getRange(2, 1, lastRow - 1, 15)
    .getValues();

  // A = Assignment ID
  // B = Assignment Token
  // E = Facilitator Name
  // F = Role
  // H = Confirmation
  // L = Source Sheet
  // M = Source Cell
  // O = Assignment State

  const assignment = rows.find(row =>
    String(row[0]).trim() &&
    String(row[1]).trim() &&
    String(row[4]).trim()
  );

  if (!assignment) {
    throw new Error('No usable assignment row found.');
  }

  const validData = {
    assignmentId: String(assignment[0]).trim(),
    assignmentToken: String(assignment[1]).trim(),
    facilitator: String(assignment[4]).trim(),
    date: 'TEST DATE',
    location: String(assignment[11]).trim() || 'TEST LOCATION',
    readingUnit: String(assignment[12]).trim() || 'TEST SESSION',
    role: String(assignment[5]).trim(),
    confirmationState:
      String(assignment[7]).trim() ||
      String(assignment[14]).trim() ||
      'Awaiting'
  };

  const validUrl = buildPrefilledConfirmationUrl_(
    form,
    validData
  );

  const invalidData = {
    ...validData,
    assignmentToken: 'INVALID-TOKEN-TEST'
  };

  const invalidUrl = buildPrefilledConfirmationUrl_(
    form,
    invalidData
  );

  Logger.log('VALID TEST LINK:');
  Logger.log(validUrl);

  Logger.log('INVALID TOKEN TEST LINK:');
  Logger.log(invalidUrl);
}


// ============================================================
// 5. AUDIT FORM STRUCTURE AND BRANCHING
// ============================================================

function auditAssignmentConfirmationForm() {
  const form = FormApp.getActiveForm();

  Logger.log(
    'FORM: ' + form.getTitle()
  );

  Logger.log(
    'TOTAL ITEMS: ' +
    form.getItems().length
  );

  Logger.log(
    '--------------------------------'
  );

  form.getItems().forEach(item => {
    const type = item.getType();

    if (
      type === FormApp.ItemType.PAGE_BREAK
    ) {
      const section =
        item.asPageBreakItem();

      Logger.log(
        'SECTION: ' +
        section.getTitle() +
        ' | Default navigation: ' +
        section.getPageNavigationType()
      );
    }

    if (
      type === FormApp.ItemType.MULTIPLE_CHOICE
    ) {
      const question =
        item.asMultipleChoiceItem();

      Logger.log(
        'QUESTION: ' +
        question.getTitle()
      );

      question.getChoices().forEach(choice => {
        const destination =
          choice.getGotoPage();

        Logger.log(
          '  → ' +
          choice.getValue() +
          ' | ' +
          (
            destination
              ? 'Go to: ' +
                destination.getTitle()
              : 'Navigation: ' +
                choice.getPageNavigationType()
          )
        );
      });
    }

    if (
      type === FormApp.ItemType.LIST
    ) {
      const dropdown =
        item.asListItem();

      Logger.log(
        'DROPDOWN: ' +
        dropdown.getTitle()
      );

      Logger.log(
        '  Options: ' +
        dropdown
          .getChoices()
          .map(choice =>
            choice.getValue()
          )
          .join(' | ')
      );
    }

    if (
      type === FormApp.ItemType.TEXT
    ) {
      Logger.log(
        'TEXT: ' +
        item.asTextItem().getTitle()
      );
    }
  });
}

//======================================================
// Auto-confirmation logging starts here
//======================================================

function getConfirmationResponseSpreadsheet_() {
  const form = FormApp.getActiveForm();
  const destinationId = form.getDestinationId();

  if (!destinationId) {
    throw new Error(
      'This form is not linked to a response spreadsheet.'
    );
  }

  return SpreadsheetApp.openById(destinationId);
}

function setupConfirmationInputLog() {
  const spreadsheet = getConfirmationResponseSpreadsheet_();
  const sheetName = 'Confirmation_Input_Log';

  let sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }

  const headers = [
    'Log Timestamp',
    'Form Response ID',
    'Form Submission Timestamp',
    'Assignment ID',
    'Assignment Token',
    'Facilitator',
    'Current Confirmation State',
    'Initial Action',
    'Proposed Replacement',
    'Replacement Follow-Up Status',
    'Current Proposed Replacement',
    'New Proposed Replacement',
    'Validation Status',
    'Validation Message'
  ];

  sheet.clear();

  sheet
    .getRange(1, 1, 1, headers.length)
    .setValues([headers]);

  Logger.log(
    'Confirmation_Input_Log created in: ' +
    spreadsheet.getName()
  );
}

function installConfirmationSubmitTrigger() {
  const form = FormApp.getActiveForm();

  ScriptApp.getProjectTriggers()
    .filter(trigger =>
      trigger.getHandlerFunction() ===
      'handleConfirmationSubmission'
    )
    .forEach(trigger =>
      ScriptApp.deleteTrigger(trigger)
    );

  ScriptApp
    .newTrigger('handleConfirmationSubmission')
    .forForm(form)
    .onFormSubmit()
    .create();

  Logger.log(
    'Confirmation submission trigger installed.'
  );
}

function handleConfirmationSubmission(e) {
  const response = e.response;
  const answers = {};

  response.getItemResponses().forEach(itemResponse => {
    answers[itemResponse.getItem().getTitle()] =
      itemResponse.getResponse();
  });

  const validation =
    validateConfirmationSubmission_(answers);

  const spreadsheet =
    getConfirmationResponseSpreadsheet_();

  const sheet =
    spreadsheet.getSheetByName(
      'Confirmation_Input_Log'
    );

  if (!sheet) {
    throw new Error(
      'Confirmation_Input_Log does not exist.'
    );
  }

  sheet.appendRow([
    new Date(),
    response.getId(),
    response.getTimestamp(),
    answers['Assignment ID'] || '',
    answers['Assignment Token'] || '',
    answers['Facilitator'] || '',
    answers['Current Confirmation State'] || '',
    answers['What would you like to do?'] || '',
    answers['Who are you approaching?'] || '',
    answers['What is the current replacement status?'] || '',
    answers['Current Proposed Replacement'] || '',
    answers['New Proposed Replacement'] || '',
    validation.status,
    validation.message
  ]);
}

function validateConfirmationSubmission_(answers) {
  const assignmentId = String(
    answers['Assignment ID'] || ''
  ).trim();

  const submittedToken = String(
    answers['Assignment Token'] || ''
  ).trim();

  const submittedFacilitator = String(
    answers['Facilitator'] || ''
  ).trim();

  if (!assignmentId) {
    return {
      status: 'Rejected',
      message: 'Missing Assignment ID'
    };
  }

  if (!submittedToken) {
    return {
      status: 'Rejected',
      message: 'Missing Assignment Token'
    };
  }

  if (!submittedFacilitator) {
    return {
      status: 'Rejected',
      message: 'Missing Facilitator'
    };
  }

  /*const files = DriveApp.getFilesByName(ROSTER_FILE_NAME);
  const spreadsheet = SpreadsheetApp.open(files.next());*/

  const spreadsheet = SpreadsheetApp.openById(
  '1bXkN49Z9rTkfXaHrZ5PaIB2uqRG9qfk4Qhc3JyORrKA'
  );
  const sheet = spreadsheet.getSheetByName('Assignments — Sync');

  if (!sheet) {
    throw new Error('Assignments — Sync tab not found.');
  }

  const lastRow = sheet.getLastRow();

  const rows = sheet
    .getRange(2, 1, lastRow - 1, 15)
    .getValues();

  // A = Assignment ID
  // B = Assignment Token
  // E = Facilitator Name
  // H = Confirmation
  // O = Assignment State

  const assignment = rows.find(row =>
    String(row[0]).trim() === assignmentId
  );

  if (!assignment) {
    return {
      status: 'Rejected',
      message: 'Assignment ID not found'
    };
  }

  const canonicalToken = String(assignment[1]).trim();
  const canonicalFacilitator = String(assignment[4]).trim();
  const canonicalConfirmation = String(assignment[7]).trim();
  Logger.log(
  'DEBUG Assignment ' +
  assignmentId +
  ' | Canonical Confirmation = "' +
  canonicalConfirmation +
  '"'
);
  const canonicalAssignmentState = String(assignment[14]).trim();

  if (submittedToken !== canonicalToken) {
    return {
      status: 'Rejected',
      message: 'Assignment Token does not match'
    };
  }

  if (submittedFacilitator !== canonicalFacilitator) {
    return {
      status: 'Rejected',
      message: 'Facilitator does not match assignment'
    };
  }

  const initialAction =
    String(answers['What would you like to do?'] || '').trim();

  const followUp =
    String(
      answers['What is the current replacement status?'] || ''
    ).trim();

  // Initial response is only valid while still awaiting response.
  if (initialAction) {
    if (
      canonicalConfirmation &&
      canonicalConfirmation !== 'Awaiting' &&
      canonicalConfirmation !== 'Not Requested'
    ) {
      return {
        status: 'Rejected',
        message:
          'Initial response is stale; current confirmation state is ' +
          canonicalConfirmation
      };
    }

    if (
      initialAction === 'Seeking Replacement' &&
      !answers['Who are you approaching?']
    ) {
      return {
        status: 'Rejected',
        message: 'Replacement facilitator not selected'
      };
    }
  }

  // Follow-up is only valid when canonical state is Seeking Replacement.
  if (followUp) {
    if (canonicalConfirmation !== 'Seeking Replacement') {
      return {
        status: 'Rejected',
        message:
          'Replacement follow-up is stale; current confirmation state is ' +
          (canonicalConfirmation || '(blank)')
      };
    }

    if (
      followUp === 'Change Proposed Replacement' &&
      !answers['New Proposed Replacement']
    ) {
      return {
        status: 'Rejected',
        message: 'New replacement not selected'
      };
    }
  }

/*
  return {
    status: 'Accepted',
    message:
      'Identity and state transition validated' +
      (canonicalAssignmentState
        ? ' | Assignment State: ' + canonicalAssignmentState
        : '')
  };
} 
*/

return {
  status: 'Accepted',
  message:
    'Canonical Confirmation read = "' +
    canonicalConfirmation +
    '"'
};
}


function ensureAssignmentTokens() {
  /*const files = DriveApp.getFilesByName(ROSTER_FILE_NAME);*/

  const spreadsheet = SpreadsheetApp.openById(
  '1bXkN49Z9rTkfXaHrZ5PaIB2uqRG9qfk4Qhc3JyORrKA'
  );

  /*if (!files.hasNext()) {
    throw new Error('Roster spreadsheet not found.');
  }*/

  /*const spreadsheet = SpreadsheetApp.open(files.next());*/

  const sheet = spreadsheet.getSheetByName('Assignments — Sync');

  if (!sheet) {
    throw new Error('Assignments — Sync tab not found.');
  }

  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    throw new Error('No assignment rows found.');
  }

  // Column A = Assignment ID
  // Column B = Assignment Token
  const values = sheet.getRange(2, 1, lastRow - 1, 2).getValues();

  const tokenValues = values.map(row => {
    const assignmentId = String(row[0]).trim();
    const existingToken = String(row[1]).trim();

    if (!assignmentId) {
      return [''];
    }

    if (existingToken) {
      return [existingToken];
    }

    return [Utilities.getUuid()];
  });

sheet
  .getRange(2, 2, tokenValues.length, 1)
  .clearDataValidations();

  sheet.getRange(2, 2, tokenValues.length, 1).setValues(tokenValues);

  Logger.log('Missing assignment tokens generated successfully.');
}

function buildPrefilledConfirmationUrl_(form, data) {
  const valuesByTitle = {
    'Assignment ID': data.assignmentId,
    'Assignment Token': data.assignmentToken,
    'Facilitator': data.facilitator,
    'Date': data.date,
    'Location': data.location,
    'Reading Unit / Session': data.readingUnit,
    'Role': data.role,
    'Current Confirmation State': data.confirmationState
  };

  const response = form.createResponse();

  form
    .getItems(FormApp.ItemType.TEXT)
    .map(item => item.asTextItem())
    .forEach(item => {
      const value = valuesByTitle[item.getTitle()];

      if (value !== undefined) {
        response.withItemResponse(
          item.createResponse(value)
        );
      }
    });

  return response.toPrefilledUrl();
}


