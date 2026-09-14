// ============================================================
// ASSIGNMENT CONFIRMATION FORM — CONSOLIDATED PROTOTYPE
// ============================================================

const ROSTER_SPREADSHEET_ID = '1bXkN49Z9rTkfXaHrZ5PaIB2uqRG9qfk4Qhc3JyORrKA';
const ASSIGNMENTS_SYNC_TAB = 'Assignments — Sync';
const FACILITATOR_LISTS_TAB = 'FacilitatorLists';
const CONFIRMATION_LOG_TAB = 'Confirmation_Input_Log';

// Assignments — Sync columns
const COL_ASSIGNMENT_ID = 1;          // A
const COL_ASSIGNMENT_TOKEN = 2;       // B
const COL_FACILITATOR_NAME = 5;       // E
const COL_ROLE = 6;                   // F
const COL_CONFIRMATION = 8;           // H
const COL_CONFIRMED_AT = 10;          // J
const COL_ASSIGNMENT_STATE = 15;      // O
const COL_PROPOSED_REPLACEMENT = 16;  // P


// ============================================================
// 1. COMMON HELPERS
// ============================================================

function getRosterSpreadsheet_() {
  return SpreadsheetApp.openById(ROSTER_SPREADSHEET_ID);
}

function getAssignmentsSheet_() {
  const sheet = getRosterSpreadsheet_().getSheetByName(ASSIGNMENTS_SYNC_TAB);

  if (!sheet) {
    throw new Error(ASSIGNMENTS_SYNC_TAB + ' tab not found.');
  }

  return sheet;
}

function getAssignmentRecord_(assignmentId) {
  const sheet = getAssignmentsSheet_();
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return null;
  }

  const rows = sheet
    .getRange(2, 1, lastRow - 1, COL_PROPOSED_REPLACEMENT)
    .getValues();

  const index = rows.findIndex(row =>
    String(row[COL_ASSIGNMENT_ID - 1]).trim() === assignmentId
  );

  if (index === -1) {
    return null;
  }

  return {
    sheet: sheet,
    rowNumber: index + 2,
    row: rows[index]
  };
}


// ============================================================
// 2. FORM BUILD / REBUILD
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
  // SECTION 1 — FACILITATION DETAILS / ROUTER
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

  const responseStageItem = form.addMultipleChoiceItem()
    .setTitle('Response Stage')
    .setRequired(true);


  // ----------------------------------------------------------
  // SECTION 2 — INITIAL RESPONSE
  // ----------------------------------------------------------

  const initialResponseSection = form.addPageBreakItem()
    .setTitle('Your Response')
    .setHelpText(
      'Please confirm your facilitation or indicate that you are seeking a replacement.'
    );

  const initialActionItem = form.addMultipleChoiceItem()
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
  // SECTION 4 — INITIAL REPLACEMENT PROPOSAL
  // ----------------------------------------------------------

  const initialReplacementSection = form.addPageBreakItem()
    .setTitle('Replacement Proposal')
    .setHelpText(
      'Select the facilitator you are approaching and record the current status.'
    );

  form.addListItem()
    .setTitle('Who are you approaching?')
    .setChoiceValues(
      getEligibleFacilitators_()
    )
    .setRequired(true);

  const initialReplacementStatus = form.addMultipleChoiceItem()
    .setTitle('Initial Replacement Status')
    .setRequired(true);


  // ----------------------------------------------------------
  // SECTION 5 — REPLACEMENT FOLLOW-UP
  // ----------------------------------------------------------

  const followUpSection = form.addPageBreakItem()
    .setTitle('Replacement Follow-Up')
    .setHelpText(
      'Review the current proposed replacement and update its status.'
    );

  form.addTextItem()
    .setTitle('Current Proposed Replacement')
    .setRequired(true);

  const followUpStatus = form.addMultipleChoiceItem()
    .setTitle('Replacement Follow-Up Status')
    .setRequired(true);


  // ----------------------------------------------------------
  // SECTION 6 — CHANGE PROPOSED REPLACEMENT
  // ----------------------------------------------------------

  const changeReplacementSection = form.addPageBreakItem()
    .setTitle('Select New Replacement')
    .setHelpText(
      'Choose the facilitator you are now approaching and record the current status.'
    );

  form.addListItem()
    .setTitle('New Proposed Replacement')
    .setChoiceValues(
      getEligibleFacilitators_()
    )
    .setRequired(true);

  const newReplacementStatus = form.addMultipleChoiceItem()
    .setTitle('New Replacement Status')
    .setRequired(true);


  // ----------------------------------------------------------
  // ROUTING: SECTION 1
  // ----------------------------------------------------------

  responseStageItem.setChoices([
    responseStageItem.createChoice(
      'Initial Response',
      initialResponseSection
    ),
    responseStageItem.createChoice(
      'Replacement Follow-Up',
      followUpSection
    )
  ]);


  // ----------------------------------------------------------
  // ROUTING: SECTION 2
  // ----------------------------------------------------------

  initialActionItem.setChoices([
    initialActionItem.createChoice(
      'Confirm',
      confirmSection
    ),
    initialActionItem.createChoice(
      'Seeking Replacement',
      initialReplacementSection
    )
  ]);


  // ----------------------------------------------------------
  // ROUTING: SECTION 4
  // ----------------------------------------------------------

  initialReplacementStatus.setChoices([
    initialReplacementStatus.createChoice(
      'Replacement Confirmed',
      FormApp.PageNavigationType.SUBMIT
    ),
    initialReplacementStatus.createChoice(
      'Still Awaiting Confirmation',
      FormApp.PageNavigationType.SUBMIT
    )
  ]);

  initialReplacementSection.setGoToPage(
    FormApp.PageNavigationType.SUBMIT
  );


  // ----------------------------------------------------------
  // ROUTING: SECTION 5
  // ----------------------------------------------------------

  followUpStatus.setChoices([
    followUpStatus.createChoice(
      'Replacement Confirmed',
      FormApp.PageNavigationType.SUBMIT
    ),
    followUpStatus.createChoice(
      'Still Awaiting Confirmation',
      FormApp.PageNavigationType.SUBMIT
    ),
    followUpStatus.createChoice(
      'Change Proposed Replacement',
      changeReplacementSection
    )
  ]);


  // ----------------------------------------------------------
  // ROUTING: SECTION 6
  // ----------------------------------------------------------

  newReplacementStatus.setChoices([
    newReplacementStatus.createChoice(
      'Replacement Confirmed',
      FormApp.PageNavigationType.SUBMIT
    ),
    newReplacementStatus.createChoice(
      'Still Awaiting Confirmation',
      FormApp.PageNavigationType.SUBMIT
    )
  ]);

  changeReplacementSection.setGoToPage(
    FormApp.PageNavigationType.SUBMIT
  );


  verifyConfirmationFormDesign_();

  Logger.log(
    'Assignment Confirmation Form rebuilt and verified successfully.'
  );
}

function verifyConfirmationFormDesign_() {
  const form = FormApp.getActiveForm();

  const requiredSections = [
    'Your Response',
    'Confirm Facilitation',
    'Replacement Proposal',
    'Replacement Follow-Up',
    'Select New Replacement'
  ];

  const actualSections = form
    .getItems(FormApp.ItemType.PAGE_BREAK)
    .map(item =>
      item.asPageBreakItem().getTitle()
    );

  requiredSections.forEach(title => {
    if (!actualSections.includes(title)) {
      throw new Error(
        'Form verification failed: missing section "' +
        title +
        '".'
      );
    }
  });

  const questionTitles = form
    .getItems()
    .map(item =>
      item.getTitle()
    );

  const requiredQuestions = [
    'Response Stage',
    'What would you like to do?',
    'Who are you approaching?',
    'Initial Replacement Status',
    'Current Proposed Replacement',
    'Replacement Follow-Up Status',
    'New Proposed Replacement',
    'New Replacement Status'
  ];

  requiredQuestions.forEach(title => {
    if (!questionTitles.includes(title)) {
      throw new Error(
        'Form verification failed: missing question "' +
        title +
        '".'
      );
    }
  });

  Logger.log(
    'FORM DESIGN CHECK: all required sections and questions present.'
  );
}


// ============================================================
// 3. FACILITATOR DROPDOWNS
// ============================================================

function getEligibleFacilitators_() {
  const spreadsheet = getRosterSpreadsheet_();

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
    )
    .getValues()
    .flat()
    .map(value =>
      String(value).trim()
    )
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
    .map(item =>
      item.asListItem()
    );

  dropdownTitles.forEach(title => {

    const dropdown = dropdowns.find(
      item =>
        item.getTitle() === title
    );

    if (!dropdown) {
      throw new Error(
        'Dropdown not found: ' +
        title
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
// 4. ASSIGNMENT TOKENS
// ============================================================

function ensureAssignmentTokens() {
  const sheet = getAssignmentsSheet_();

  const lastRow =
    sheet.getLastRow();

  if (lastRow < 2) {
    throw new Error(
      'No assignment rows found.'
    );
  }

  const values = sheet
    .getRange(
      2,
      COL_ASSIGNMENT_ID,
      lastRow - 1,
      2
    )
    .getValues();

  const tokenValues =
    values.map(row => {

      const assignmentId =
        String(row[0]).trim();

      const existingToken =
        String(row[1]).trim();

      if (!assignmentId) {
        return [''];
      }

      if (existingToken) {
        return [existingToken];
      }

      return [
        Utilities.getUuid()
      ];
    });

  sheet
    .getRange(
      2,
      COL_ASSIGNMENT_TOKEN,
      tokenValues.length,
      1
    )
    .clearDataValidations();

  sheet
    .getRange(
      2,
      COL_ASSIGNMENT_TOKEN,
      tokenValues.length,
      1
    )
    .setValues(tokenValues);

  Logger.log(
    'Missing assignment tokens generated successfully.'
  );
}


// ============================================================
// 5. PREFILLED LINK HELPERS
// ============================================================

function deriveResponseStage_(confirmation) {

  if (
    confirmation === 'Not Requested' ||
    confirmation === 'Awaiting Confirmation'
  ) {
    return 'Initial Response';
  }

  if (
    confirmation === 'Seeking Replacement'
  ) {
    return 'Replacement Follow-Up';
  }

  return '';
}

function buildPrefilledConfirmationUrl_(form, data) {

  const response =
    form.createResponse();

  const textValues = {

    'Assignment ID':
      data.assignmentId,

    'Assignment Token':
      data.assignmentToken,

    'Facilitator':
      data.facilitator,

    'Date':
      data.date,

    'Location':
      data.location,

    'Reading Unit / Session':
      data.readingUnit,

    'Role':
      data.role,

    'Current Confirmation State':
      data.confirmationState,

    'Current Proposed Replacement':
      data.currentProposedReplacement

  };

  form
    .getItems(FormApp.ItemType.TEXT)
    .map(item =>
      item.asTextItem()
    )
    .forEach(item => {

      const value =
        textValues[
          item.getTitle()
        ];

      if (
        value !== undefined &&
        value !== ''
      ) {
        response.withItemResponse(
          item.createResponse(value)
        );
      }
    });

  const responseStageItem =
    form
      .getItems(
        FormApp.ItemType.MULTIPLE_CHOICE
      )
      .map(item =>
        item.asMultipleChoiceItem()
      )
      .find(item =>
        item.getTitle() ===
        'Response Stage'
      );

  if (!responseStageItem) {
    throw new Error(
      'Response Stage question not found.'
    );
  }

  response.withItemResponse(
    responseStageItem.createResponse(
      data.responseStage
    )
  );

  return response.toPrefilledUrl();
}


// ============================================================
// 6. TEST LINK GENERATOR
// ============================================================

function generateValidationTestLinks() {

  const form =
    FormApp.getActiveForm();

  const sheet =
    getAssignmentsSheet_();

  const lastRow =
    sheet.getLastRow();

  if (lastRow < 2) {
    throw new Error(
      'No assignment rows found.'
    );
  }

  const rows = sheet
    .getRange(
      2,
      1,
      lastRow - 1,
      COL_PROPOSED_REPLACEMENT
    )
    .getValues();

    const TEST_ASSIGNMENT_ID = 'BR-A-000007';

    const assignment =
      rows.find(row =>
        String(
          row[
            COL_ASSIGNMENT_ID - 1
          ]
        ).trim() === TEST_ASSIGNMENT_ID
      );

  if (!assignment) {
    throw new Error(
      'No usable assignment row found.'
    );
  }

  const confirmation =
    String(
      assignment[
        COL_CONFIRMATION - 1
      ] || ''
    ).trim();

  const responseStage =
    deriveResponseStage_(
      confirmation
    );

  const validData = {

    assignmentId:
      String(
        assignment[
          COL_ASSIGNMENT_ID - 1
        ]
      ).trim(),

    assignmentToken:
      String(
        assignment[
          COL_ASSIGNMENT_TOKEN - 1
        ]
      ).trim(),

    facilitator:
      String(
        assignment[
          COL_FACILITATOR_NAME - 1
        ]
      ).trim(),

    date:
      'TEST DATE',

    location:
      'TEST LOCATION',

    readingUnit:
      'TEST READING UNIT',

    role:
      String(
        assignment[
          COL_ROLE - 1
        ]
      ).trim(),

    confirmationState:
      confirmation,

    responseStage:
      responseStage,

    currentProposedReplacement:
      String(
        assignment[
          COL_PROPOSED_REPLACEMENT - 1
        ] || ''
      ).trim()

  };

  if (
    responseStage ===
      'Replacement Follow-Up' &&
    !validData.currentProposedReplacement
  ) {
    throw new Error(
      'Test assignment is Seeking Replacement but Proposed Replacement is blank.'
    );
  }

  const validUrl =
    buildPrefilledConfirmationUrl_(
      form,
      validData
    );

  Logger.log(
    'VALID TEST LINK:'
  );

  Logger.log(
    validUrl
  );
}


// ============================================================
// 7. FORM AUDIT
// ============================================================

function auditAssignmentConfirmationForm() {

  const form =
    FormApp.getActiveForm();

  Logger.log(
    'FORM: ' +
    form.getTitle()
  );

  Logger.log(
    'TOTAL ITEMS: ' +
    form.getItems().length
  );

  Logger.log(
    '--------------------------------'
  );

  form.getItems().forEach(item => {

    const type =
      item.getType();

    if (
      type ===
      FormApp.ItemType.PAGE_BREAK
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
      type ===
      FormApp.ItemType.MULTIPLE_CHOICE
    ) {

      const question =
        item.asMultipleChoiceItem();

      Logger.log(
        'QUESTION: ' +
        question.getTitle()
      );

      question
        .getChoices()
        .forEach(choice => {

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
      type ===
      FormApp.ItemType.LIST
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
      type ===
      FormApp.ItemType.TEXT
    ) {

      Logger.log(
        'TEXT: ' +
        item
          .asTextItem()
          .getTitle()
      );
    }
  });
}


// ============================================================
// 8. RESPONSE LOGGING
// ============================================================

function getConfirmationResponseSpreadsheet_() {

  const form =
    FormApp.getActiveForm();

  const destinationId =
    form.getDestinationId();

  if (!destinationId) {
    throw new Error(
      'This form is not linked to a response spreadsheet.'
    );
  }

  return SpreadsheetApp.openById(
    destinationId
  );
}

function setupConfirmationInputLog() {

  const spreadsheet =
    getConfirmationResponseSpreadsheet_();

  const sheetName =
    CONFIRMATION_LOG_TAB;

  let sheet =
    spreadsheet.getSheetByName(
      sheetName
    );

  if (!sheet) {
    sheet =
      spreadsheet.insertSheet(
        sheetName
      );
  }

  const headers = [
    'Log Timestamp',
    'Form Response ID',
    'Form Submission Timestamp',
    'Assignment ID',
    'Assignment Token',
    'Facilitator',
    'Current Confirmation State',
    'Response Stage',
    'Initial Action',
    'Proposed Replacement',
    'Initial Replacement Status',
    'Replacement Follow-Up Status',
    'Current Proposed Replacement',
    'New Proposed Replacement',
    'New Replacement Status',
    'Validation Status',
    'Validation Message',
    'Write-Back Status',
    'Write-Back Message'
  ];

  sheet.clear();

  sheet
    .getRange(
      1,
      1,
      1,
      headers.length
    )
    .setValues([
      headers
    ]);

  Logger.log(
    'Confirmation_Input_Log created in: ' +
    spreadsheet.getName()
  );
}

function installConfirmationSubmitTrigger() {

  const form =
    FormApp.getActiveForm();

  ScriptApp
    .getProjectTriggers()
    .filter(trigger =>
      trigger.getHandlerFunction() ===
      'handleConfirmationSubmission'
    )
    .forEach(trigger =>
      ScriptApp.deleteTrigger(
        trigger
      )
    );

  ScriptApp
    .newTrigger(
      'handleConfirmationSubmission'
    )
    .forForm(form)
    .onFormSubmit()
    .create();

  Logger.log(
    'Confirmation submission trigger installed.'
  );
}


// ============================================================
// 9. SUBMISSION HANDLER
// ============================================================

function handleConfirmationSubmission(e) {

  const response =
    e.response;

  const answers = {};

  response
    .getItemResponses()
    .forEach(itemResponse => {

      answers[
        itemResponse
          .getItem()
          .getTitle()
      ] =
        itemResponse
          .getResponse();

    });

  const validation =
    validateConfirmationSubmission_(
      answers
    );

  let writeBackStatus =
    'Not Attempted';

  let writeBackMessage =
    '';

  if (
    validation.status ===
    'Accepted'
  ) {

    try {

      const writeBack =
        processAcceptedSubmission_(
          answers,
          response.getTimestamp()
        );

      writeBackStatus =
        writeBack.status;

      writeBackMessage =
        writeBack.message;

    } catch (error) {

      writeBackStatus =
        'Needs Review';

      writeBackMessage =
        String(
          error &&
          error.message
            ? error.message
            : error
        );
    }
  }

  const spreadsheet =
    getConfirmationResponseSpreadsheet_();

  const sheet =
    spreadsheet.getSheetByName(
      CONFIRMATION_LOG_TAB
    );

  if (!sheet) {
    throw new Error(
      CONFIRMATION_LOG_TAB +
      ' does not exist.'
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
    answers['Response Stage'] || '',
    answers['What would you like to do?'] || '',
    answers['Who are you approaching?'] || '',
    answers['Initial Replacement Status'] || '',
    answers['Replacement Follow-Up Status'] || '',
    answers['Current Proposed Replacement'] || '',
    answers['New Proposed Replacement'] || '',
    answers['New Replacement Status'] || '',
    validation.status,
    validation.message,
    writeBackStatus,
    writeBackMessage
  ]);
}


// ============================================================
// 10. VALIDATION
// ============================================================

function validateConfirmationSubmission_(answers) {

  const assignmentId =
    String(
      answers[
        'Assignment ID'
      ] || ''
    ).trim();

  const submittedToken =
    String(
      answers[
        'Assignment Token'
      ] || ''
    ).trim();

  const submittedFacilitator =
    String(
      answers[
        'Facilitator'
      ] || ''
    ).trim();

  if (!assignmentId) {
    return {
      status: 'Rejected',
      message:
        'Missing Assignment ID'
    };
  }

  if (!submittedToken) {
    return {
      status: 'Rejected',
      message:
        'Missing Assignment Token'
    };
  }

  if (!submittedFacilitator) {
    return {
      status: 'Rejected',
      message:
        'Missing Facilitator'
    };
  }

  const record =
    getAssignmentRecord_(
      assignmentId
    );

  if (!record) {
    return {
      status: 'Rejected',
      message:
        'Assignment ID not found'
    };
  }

  const assignment =
    record.row;

  const canonicalToken =
    String(
      assignment[
        COL_ASSIGNMENT_TOKEN - 1
      ]
    ).trim();

  const canonicalFacilitator =
    String(
      assignment[
        COL_FACILITATOR_NAME - 1
      ]
    ).trim();

  const canonicalConfirmation =
    String(
      assignment[
        COL_CONFIRMATION - 1
      ]
    ).trim();

  const canonicalAssignmentState =
    String(
      assignment[
        COL_ASSIGNMENT_STATE - 1
      ] || ''
    ).trim();

  const canonicalProposedReplacement =
    String(
      assignment[
        COL_PROPOSED_REPLACEMENT - 1
      ] || ''
    ).trim();

  if (
    submittedToken !==
    canonicalToken
  ) {

    return {
      status: 'Rejected',
      message:
        'Assignment Token does not match'
    };
  }

  if (
    submittedFacilitator !==
    canonicalFacilitator
  ) {

    return {
      status: 'Rejected',
      message:
        'Facilitator does not match assignment'
    };
  }

  const responseStage =
    String(
      answers[
        'Response Stage'
      ] || ''
    ).trim();

  const initialAction =
    String(
      answers[
        'What would you like to do?'
      ] || ''
    ).trim();

  const proposedReplacement =
    String(
      answers[
        'Who are you approaching?'
      ] || ''
    ).trim();

  const initialReplacementStatus =
    String(
      answers[
        'Initial Replacement Status'
      ] || ''
    ).trim();

  const currentProposedReplacement =
    String(
      answers[
        'Current Proposed Replacement'
      ] || ''
    ).trim();

  const followUpStatus =
    String(
      answers[
        'Replacement Follow-Up Status'
      ] || ''
    ).trim();

  const newProposedReplacement =
    String(
      answers[
        'New Proposed Replacement'
      ] || ''
    ).trim();

  const newReplacementStatus =
    String(
      answers[
        'New Replacement Status'
      ] || ''
    ).trim();


  // ----------------------------------------------------------
  // INITIAL RESPONSE
  // ----------------------------------------------------------

  if (
    responseStage ===
    'Initial Response'
  ) {

    if (
      canonicalConfirmation !==
        'Awaiting Confirmation' &&
      canonicalConfirmation !==
        'Not Requested'
    ) {

      return {
        status: 'Rejected',

        message:
          'Initial response is stale; current confirmation state is ' +
          canonicalConfirmation
      };
    }

    if (
      initialAction !==
        'Confirm' &&
      initialAction !==
        'Seeking Replacement'
    ) {

      return {
        status: 'Rejected',
        message:
          'Initial response action missing or invalid'
      };
    }

    if (
      initialAction ===
      'Seeking Replacement'
    ) {

      if (
        !proposedReplacement
      ) {

        return {
          status: 'Rejected',
          message:
            'Replacement facilitator not selected'
        };
      }

      if (
        initialReplacementStatus !==
          'Replacement Confirmed' &&
        initialReplacementStatus !==
          'Still Awaiting Confirmation'
      ) {

        return {
          status: 'Rejected',
          message:
            'Initial replacement status missing or invalid'
        };
      }
    }
  }


  // ----------------------------------------------------------
  // REPLACEMENT FOLLOW-UP
  // ----------------------------------------------------------

  else if (
    responseStage ===
    'Replacement Follow-Up'
  ) {

    if (
      canonicalConfirmation !==
      'Seeking Replacement'
    ) {

      return {
        status: 'Rejected',

        message:
          'Replacement follow-up is stale; current confirmation state is ' +
          canonicalConfirmation
      };
    }

    if (
      !canonicalProposedReplacement
    ) {

      return {
        status: 'Rejected',
        message:
          'Canonical proposed replacement is missing'
      };
    }

    if (
      !currentProposedReplacement ||
      currentProposedReplacement !==
      canonicalProposedReplacement
    ) {

      return {
        status: 'Rejected',

        message:
          'Current proposed replacement does not match canonical record'
      };
    }

    if (
      followUpStatus !==
        'Replacement Confirmed' &&
      followUpStatus !==
        'Still Awaiting Confirmation' &&
      followUpStatus !==
        'Change Proposed Replacement'
    ) {

      return {
        status: 'Rejected',
        message:
          'Replacement follow-up status missing or invalid'
      };
    }

    if (
      followUpStatus ===
      'Change Proposed Replacement'
    ) {

      if (
        !newProposedReplacement
      ) {

        return {
          status: 'Rejected',
          message:
            'New replacement not selected'
        };
      }

      if (
        newReplacementStatus !==
          'Replacement Confirmed' &&
        newReplacementStatus !==
          'Still Awaiting Confirmation'
      ) {

        return {
          status: 'Rejected',
          message:
            'New replacement status missing or invalid'
        };
      }
    }
  }

  else {

    return {
      status: 'Rejected',
      message:
        'Invalid or missing Response Stage'
    };
  }

  return {

    status:
      'Accepted',

    message:
      'Identity and state transition validated' +
      (
        canonicalAssignmentState
          ? ' | Assignment State: ' +
            canonicalAssignmentState
          : ''
      )
  };
}


// ============================================================
// 11. ACCEPTED SUBMISSION ROUTING / WRITE-BACK
// ============================================================

function processAcceptedSubmission_(
  answers,
  responseTimestamp
) {

  const responseStage =
    String(
      answers[
        'Response Stage'
      ] || ''
    ).trim();


  // ----------------------------------------------------------
  // INITIAL RESPONSE
  // ----------------------------------------------------------

  if (
    responseStage ===
    'Initial Response'
  ) {

    const action =
      String(
        answers[
          'What would you like to do?'
        ] || ''
      ).trim();

    if (
      action ===
      'Confirm'
    ) {

      writeConfirmedAssignment_(
        answers,
        responseTimestamp
      );

      return {
        status:
          'Success',

        message:
          'Confirmed write-back completed'
      };
    }

    if (
      action ===
      'Seeking Replacement'
    ) {

      const replacementStatus =
        String(
          answers[
            'Initial Replacement Status'
          ] || ''
        ).trim();

      writeInitialReplacementResponse_(
        answers,
        replacementStatus,
        responseTimestamp
      );

      return {

        status:
          'Success',

        message:
          replacementStatus ===
          'Replacement Confirmed'
            ? 'Replacement Found write-back completed'
            : 'Seeking Replacement write-back completed'
      };
    }
  }


  // ----------------------------------------------------------
  // REPLACEMENT FOLLOW-UP
  // ----------------------------------------------------------

  if (
    responseStage ===
    'Replacement Follow-Up'
  ) {

    const followUpStatus =
      String(
        answers[
          'Replacement Follow-Up Status'
        ] || ''
      ).trim();


    if (
      followUpStatus ===
      'Replacement Confirmed'
    ) {

      writeReplacementFound_(
        answers,

        String(
          answers[
            'Current Proposed Replacement'
          ] || ''
        ).trim(),

        responseTimestamp
      );

      return {
        status:
          'Success',

        message:
          'Replacement Found write-back completed'
      };
    }


    if (
      followUpStatus ===
      'Still Awaiting Confirmation'
    ) {

      writeReplacementAwaiting_(
        answers,

        String(
          answers[
            'Current Proposed Replacement'
          ] || ''
        ).trim()
      );

      return {
        status:
          'Success',

        message:
          'Seeking Replacement retained'
      };
    }


    if (
      followUpStatus ===
      'Change Proposed Replacement'
    ) {

      const newReplacement =
        String(
          answers[
            'New Proposed Replacement'
          ] || ''
        ).trim();

      const newReplacementStatus =
        String(
          answers[
            'New Replacement Status'
          ] || ''
        ).trim();


      if (
        newReplacementStatus ===
        'Replacement Confirmed'
      ) {

        writeReplacementFound_(
          answers,
          newReplacement,
          responseTimestamp
        );

        return {
          status:
            'Success',

          message:
            'New proposed replacement recorded and Replacement Found'
        };
      }


      if (
        newReplacementStatus ===
        'Still Awaiting Confirmation'
      ) {

        writeReplacementAwaiting_(
          answers,
          newReplacement
        );

        return {
          status:
            'Success',

          message:
            'New proposed replacement recorded; still awaiting confirmation'
        };
      }
    }
  }

  throw new Error(
    'Accepted submission has no supported write-back route.'
  );
}


// ============================================================
// 12. WRITE-BACK HELPERS
// ============================================================

function writeConfirmedAssignment_(
  answers,
  responseTimestamp
) {

  const assignmentId =
    String(
      answers[
        'Assignment ID'
      ] || ''
    ).trim();

  const record =
    getAssignmentRecord_(
      assignmentId
    );

  if (!record) {
    throw new Error(
      'Assignment ID not found during write-back: ' +
      assignmentId
    );
  }

  record.sheet
    .getRange(
      record.rowNumber,
      COL_CONFIRMATION
    )
    .setValue(
      'Confirmed'
    );

  record.sheet
    .getRange(
      record.rowNumber,
      COL_CONFIRMED_AT
    )
    .setValue(
      responseTimestamp
    );
}


function writeInitialReplacementResponse_(
  answers,
  replacementStatus,
  responseTimestamp
) {

  const proposedReplacement =
    String(
      answers[
        'Who are you approaching?'
      ] || ''
    ).trim();

  if (
    !proposedReplacement
  ) {

    throw new Error(
      'Proposed replacement missing during write-back'
    );
  }


  if (
    replacementStatus ===
    'Replacement Confirmed'
  ) {

    writeReplacementFound_(
      answers,
      proposedReplacement,
      responseTimestamp
    );

    return;
  }


  if (
    replacementStatus ===
    'Still Awaiting Confirmation'
  ) {

    writeReplacementAwaiting_(
      answers,
      proposedReplacement
    );

    return;
  }

  throw new Error(
    'Unsupported initial replacement status: ' +
    replacementStatus
  );
}


function writeReplacementAwaiting_(
  answers,
  proposedReplacement
) {

  const assignmentId =
    String(
      answers[
        'Assignment ID'
      ] || ''
    ).trim();

  const record =
    getAssignmentRecord_(
      assignmentId
    );

  if (!record) {

    throw new Error(
      'Assignment ID not found during replacement write-back: ' +
      assignmentId
    );
  }

  if (
    !proposedReplacement
  ) {

    throw new Error(
      'Proposed replacement missing during replacement write-back'
    );
  }

  record.sheet
    .getRange(
      record.rowNumber,
      COL_CONFIRMATION
    )
    .setValue(
      'Seeking Replacement'
    );

  record.sheet
    .getRange(
      record.rowNumber,
      COL_PROPOSED_REPLACEMENT
    )
    .setValue(
      proposedReplacement
    );

  record.sheet
    .getRange(
      record.rowNumber,
      COL_CONFIRMED_AT
    )
    .clearContent();
}


function writeReplacementFound_(
  answers,
  confirmedReplacement,
  responseTimestamp
) {

  const assignmentId =
    String(
      answers[
        'Assignment ID'
      ] || ''
    ).trim();

  const record =
    getAssignmentRecord_(
      assignmentId
    );

  if (!record) {
    throw new Error(
      'Assignment ID not found during replacement confirmation write-back: ' +
      assignmentId
    );
  }

  if (!confirmedReplacement) {
    throw new Error(
      'Confirmed replacement missing during write-back'
    );
  }


  // ==========================================================
  // 1. UPDATE ORIGINAL ASSIGNMENT
  // ==========================================================

  record.sheet
    .getRange(
      record.rowNumber,
      COL_CONFIRMATION
    )
    .setValue(
      'Replacement Found'
    );

  record.sheet
    .getRange(
      record.rowNumber,
      COL_PROPOSED_REPLACEMENT
    )
    .setValue(
      confirmedReplacement
    );

  record.sheet
    .getRange(
      record.rowNumber,
      COL_CONFIRMED_AT
    )
    .setValue(
      responseTimestamp
    );


  // ==========================================================
  // 2. CREATE REPLACEMENT ASSIGNMENT
  // ==========================================================

  createReplacementAssignment_(
    record,
    confirmedReplacement,
    responseTimestamp
  );
}


function createReplacementAssignment_(
  originalRecord,
  replacementName,
  responseTimestamp
) {

  const sheet =
    originalRecord.sheet;

  const original =
    originalRecord.row;

  const originalAssignmentId =
    String(
      original[0]
    ).trim();

  const sessionId =
    String(
      original[2] || ''
    ).trim();

  const role =
    String(
      original[5] || ''
    ).trim();

  const sourceSheet =
    String(
      original[11] || ''
    ).trim();

  const sourceCell =
    String(
      original[12] || ''
    ).trim();


  // ----------------------------------------------------------
  // Prevent duplicate replacement assignments
  // ----------------------------------------------------------

  const lastRow =
    sheet.getLastRow();

  if (lastRow >= 2) {

    const existingRows =
      sheet
        .getRange(
          2,
          1,
          lastRow - 1,
          16
        )
        .getValues();

    const existingReplacement =
      existingRows.find(row =>

        String(
          row[10] || ''
        ).trim() ===
          originalAssignmentId &&

        String(
          row[6] || ''
        ).trim() ===
          'Replacement' &&

        String(
          row[14] || ''
        ).trim() ===
          'Active'
      );

    if (existingReplacement) {
      throw new Error(
        'Active replacement assignment already exists for ' +
        originalAssignmentId
      );
    }
  }


  // ----------------------------------------------------------
  // Find replacement facilitator ID
  // ----------------------------------------------------------

  const replacementFacilitatorId =
    findFacilitatorIdByName_(
      replacementName
    );


  // ----------------------------------------------------------
  // Generate ID and token
  // ----------------------------------------------------------

  const newAssignmentId =
    generateNextAssignmentId_();

  const newAssignmentToken =
    Utilities.getUuid();


  // ----------------------------------------------------------
  // Find first available assignment row
  // based on blank Assignment ID in column A
  // ----------------------------------------------------------

  const assignmentIds =
    sheet
      .getRange(
        2,
        COL_ASSIGNMENT_ID,
        Math.max(
          sheet.getMaxRows() - 1,
          1
        ),
        1
      )
      .getValues();

  let targetRow = null;

  for (
    let i = 0;
    i < assignmentIds.length;
    i++
  ) {

    if (
      !String(
        assignmentIds[i][0] || ''
      ).trim()
    ) {

      targetRow =
        i + 2;

      break;
    }
  }

  if (!targetRow) {

    sheet.insertRowAfter(
      sheet.getMaxRows()
    );

    targetRow =
      sheet.getMaxRows();
  }


  // ----------------------------------------------------------
  // Write A:D
  // Column E deliberately untouched:
  // array formula supplies Facilitator Name.
  // ----------------------------------------------------------

  sheet
    .getRange(
      targetRow,
      1,
      1,
      4
    )
    .setValues([[
      newAssignmentId,          // A Assignment ID
      newAssignmentToken,       // B Assignment Token
      sessionId,                // C Session ID
      replacementFacilitatorId  // D Facilitator ID
    ]]);


  // ----------------------------------------------------------
  // Write F:P
  // ----------------------------------------------------------

  sheet
    .getRange(
      targetRow,
      6,
      1,
      11
    )
    .setValues([[
      role,                     // F Role
      'Replacement',            // G Assignment Type
      'Confirmed',              // H Confirmation
      '',                       // I Notification Sent
      responseTimestamp,        // J Confirmed At
      originalAssignmentId,     // K Replaces Assignment ID
      sourceSheet,              // L Source Sheet
      sourceCell,               // M Source Cell
      '',                       // N Notes
      'Active',                 // O Assignment State
      ''                        // P Proposed Replacement
    ]]);


  SpreadsheetApp.flush();

  Logger.log(
    'Replacement assignment created: ' +
    newAssignmentId +
    ' in row ' +
    targetRow
  );
}


function findFacilitatorIdByName_(
  facilitatorName
) {

  const sheet =
    getAssignmentsSheet_();

  const lastRow =
    sheet.getLastRow();

  if (lastRow < 2) {
    throw new Error(
      'No assignments available for facilitator ID lookup.'
    );
  }

  const rows =
    sheet
      .getRange(
        2,
        1,
        lastRow - 1,
        5
      )
      .getValues();

  const match =
    rows.find(row =>
      String(
        row[4] || ''
      ).trim() ===
        facilitatorName &&
      String(
        row[3] || ''
      ).trim()
    );

  if (!match) {
    throw new Error(
      'Facilitator ID not found for replacement: ' +
      facilitatorName
    );
  }

  return String(
    match[3]
  ).trim();
}


function generateNextAssignmentId_() {

  const sheet =
    getAssignmentsSheet_();

  const lastRow =
    sheet.getLastRow();

  if (lastRow < 2) {
    return 'BR-A-000001';
  }

  const ids =
    sheet
      .getRange(
        2,
        COL_ASSIGNMENT_ID,
        lastRow - 1,
        1
      )
      .getValues()
      .flat()
      .map(value =>
        String(value).trim()
      )
      .filter(value =>
        /^BR-A-\d+$/.test(value)
      );

  let highestNumber = 0;

  ids.forEach(id => {

    const number =
      Number(
        id.replace(
          'BR-A-',
          ''
        )
      );

    if (number > highestNumber) {
      highestNumber = number;
    }
  });

  const nextNumber =
    highestNumber + 1;

  return (
    'BR-A-' +
    String(nextNumber)
      .padStart(6, '0')
  );
}