/**
 * Bible Facilitation — Church Master → FacIntake
 * Baseline-safe version
 *
 * ARCHITECTURE
 * Church Master → Apps Script → FacIntake → human promotion → FacMaster
 *
 * IMPORTANT DESIGN RULES
 * - FacIntake is the accepted historical baseline.
 * - Historical Church Master rows are NOT re-reconciled.
 * - Only rows after SysAdmin → Intake Scan → Last Successful Scan are considered.
 * - Existing FacIntake rows are never refreshed or overwritten.
 * - Source Timestamp is used only for incremental detection/audit.
 * - New FacIntake rows receive a clean date-only Live Date.
 * - Duplicate suppression uses email first, normalized name second.
 * - Phone is copied for new records, but is NOT used for duplicate matching.
 * - The checkpoint advances only after a successful refresh.
 *
 * SOURCE WORKBOOK
 * The Journey KL - Community Database & Testimonials
 * Tab: New Database
 */

const INTAKE_CONFIG = Object.freeze({
  SOURCE_SPREADSHEET_ID: '17aeaDKS82DXvCpwcUG9WVoQoXU81z_VuewEB9nUX9qg',
  SOURCE_SHEET: 'New Database',

  INTAKE_SHEET: 'FacIntake',
  ADMIN_SHEET: 'SysAdmin',

  // 1-based source columns in "New Database"
  SOURCE: {
    TIMESTAMP: 2, // B
    FIRST: 4,     // D
    LAST: 5,      // E
    PHONE: 7,     // G
    EMAIL: 8      // H
  },

  // FacIntake receives A:E
  INTAKE_WIDTH: 5,

  ADMIN_ENTITY: 'Intake Scan',

  ADMIN_KEYS: {
    LAST_SUCCESSFUL_SCAN: 'Last Successful Scan',
    LAST_RUN_ADDED: 'Last Run Added',
    ROWS_CONSIDERED: 'Rows Considered',
    DUPLICATES_SKIPPED: 'Duplicates Skipped',
    LAST_ERROR: 'Last Error'
  }
});


/**
 * Adds a custom menu when the Sheet opens.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Bible Facilitation')

    // Facilitator Intake
    .addItem('Preview Intake Refresh', 'previewFacIntakeRefresh')
    .addItem('Refresh FacIntake Now', 'refreshFacIntake')

    .addSeparator()

    // Sessions
    .addItem('Preview Approved Sessions', 'previewApprovedSessions')
    .addItem('Publish Approved Sessions', 'publishApprovedSessions')

    .addSeparator()

    // Assignments
    .addItem('Preview Approved Assignments', 'previewApprovedAssignments')
    .addItem('Publish Approved Assignments', 'publishApprovedAssignments')

    .addToUi();
}


/**
 * SAFE PREVIEW
 *
 * Does not write anything.
 * Shows how many post-baseline rows would be considered,
 * how many would be skipped as duplicates,
 * and how many would be appended.
 */
function previewFacIntakeRefresh() {
  const result = buildIntakePlan_();

  SpreadsheetApp.getActive().toast(
    `${result.rowsToAppend.length} new member(s); ` +
    `${result.duplicatesSkipped} duplicate(s) skipped; ` +
    `${result.rowsConsidered} post-baseline row(s) considered.`,
    'FacIntake preview',
    8
  );

  Logger.log(JSON.stringify(result.summary, null, 2));

  if (result.rowsToAppend.length) {
    Logger.log('Rows that would be appended:');
    result.rowsToAppend.forEach(row => Logger.log(JSON.stringify(row)));
  }
}


/**
 * ACTUAL REFRESH
 *
 * Appends only genuinely new post-baseline members.
 * Existing FacIntake rows are never rewritten.
 */
function refreshFacIntake() {
  const lock = LockService.getDocumentLock();
  lock.waitLock(30000);

  const dest = SpreadsheetApp.getActiveSpreadsheet();
  const admin = dest.getSheetByName(INTAKE_CONFIG.ADMIN_SHEET);

  try {
    const plan = buildIntakePlan_();

    if (plan.rowsToAppend.length) {
      const intake = dest.getSheetByName(INTAKE_CONFIG.INTAKE_SHEET);

      if (!intake) {
        throw new Error(`Missing sheet: ${INTAKE_CONFIG.INTAKE_SHEET}`);
      }

      const startRow = intake.getLastRow() + 1;

      intake
        .getRange(
          startRow,
          1,
          plan.rowsToAppend.length,
          INTAKE_CONFIG.INTAKE_WIDTH
        )
        .setValues(plan.rowsToAppend);

      // Column E = Live Date
      intake
        .getRange(
          startRow,
          5,
          plan.rowsToAppend.length,
          1
        )
        .setNumberFormat('yyyy-mm-dd');
    }

    /**
     * IMPORTANT:
     * Use run-start time, not run-end time.
     *
     * If someone signs up while this script is executing,
     * their timestamp will still be newer than the checkpoint
     * on the next run.
     */
    setAdminValue_(
      admin,
      INTAKE_CONFIG.ADMIN_KEYS.LAST_SUCCESSFUL_SCAN,
      plan.runStartedAt
    );

    setAdminValue_(
      admin,
      INTAKE_CONFIG.ADMIN_KEYS.LAST_RUN_ADDED,
      plan.rowsToAppend.length
    );

    setAdminValue_(
      admin,
      INTAKE_CONFIG.ADMIN_KEYS.ROWS_CONSIDERED,
      plan.rowsConsidered
    );

    setAdminValue_(
      admin,
      INTAKE_CONFIG.ADMIN_KEYS.DUPLICATES_SKIPPED,
      plan.duplicatesSkipped
    );

    setAdminValue_(
      admin,
      INTAKE_CONFIG.ADMIN_KEYS.LAST_ERROR,
      ''
    );

    SpreadsheetApp.flush();

    dest.toast(
      `${plan.rowsToAppend.length} new member(s) appended to FacIntake.`,
      'FacIntake refresh complete',
      8
    );

  } catch (err) {

    if (admin) {
      try {
        setAdminValue_(
          admin,
          INTAKE_CONFIG.ADMIN_KEYS.LAST_ERROR,
          String(
            err && err.message
              ? err.message
              : err
          )
        );
      } catch (_) {}
    }

    throw err;

  } finally {
    lock.releaseLock();
  }
}


/**
 * Builds the proposed append operation.
 * Does not write to the spreadsheet.
 */
function buildIntakePlan_() {
  const runStartedAt = new Date();

  const dest = SpreadsheetApp.getActiveSpreadsheet();

  const intake = dest.getSheetByName(
    INTAKE_CONFIG.INTAKE_SHEET
  );

  const admin = dest.getSheetByName(
    INTAKE_CONFIG.ADMIN_SHEET
  );

  if (!intake) {
    throw new Error(
      `Missing sheet: ${INTAKE_CONFIG.INTAKE_SHEET}`
    );
  }

  if (!admin) {
    throw new Error(
      `Missing sheet: ${INTAKE_CONFIG.ADMIN_SHEET}`
    );
  }


  /**
   * HISTORICAL BASELINE RULE
   *
   * The checkpoint must already exist.
   * If it is blank, the script deliberately stops.
   *
   * This prevents accidental full-history reconciliation
   * against messy legacy data.
   */
  const lastSuccessfulScan = getAdminDate_(
    admin,
    INTAKE_CONFIG.ADMIN_KEYS.LAST_SUCCESSFUL_SCAN
  );

  if (!lastSuccessfulScan) {
    throw new Error(
      'FacIntake baseline checkpoint is blank. ' +
      'Set SysAdmin → Intake Scan → Last Successful Scan before running.'
    );
  }


  const sourceSs = SpreadsheetApp.openById(
    INTAKE_CONFIG.SOURCE_SPREADSHEET_ID
  );

  const source = sourceSs.getSheetByName(
    INTAKE_CONFIG.SOURCE_SHEET
  );

  if (!source) {
    throw new Error(
      `Missing source sheet: ${INTAKE_CONFIG.SOURCE_SHEET}`
    );
  }


  const sourceLastRow = source.getLastRow();

  if (sourceLastRow < 2) {
    return makePlan_(
      runStartedAt,
      [],
      0,
      0,
      lastSuccessfulScan
    );
  }


  /**
   * Read A:H because Timestamp/First/Last/Phone/Email
   * are all contained within those columns.
   */
  const sourceValues = source
    .getRange(
      2,
      1,
      sourceLastRow - 1,
      8
    )
    .getValues();


  /**
   * Existing Intake identity index.
   *
   * Phone is deliberately excluded from identity matching.
   */
  const existing = readExistingIntakeKeys_(intake);


  const rowsToAppend = [];

  let rowsConsidered = 0;
  let duplicatesSkipped = 0;


  sourceValues.forEach(row => {

    const timestamp = coerceSourceTimestamp_(
      row[INTAKE_CONFIG.SOURCE.TIMESTAMP - 1]
    );


    // Ignore blank/unusable legacy timestamps.
    if (!timestamp) {
      return;
    }


    /**
     * Only genuinely post-baseline rows are candidates.
     */
    if (timestamp <= lastSuccessfulScan) {
      return;
    }


    /**
     * Do not process anything timestamped after this run began.
     *
     * This avoids advancing the checkpoint beyond a row
     * that appeared while the script was already executing.
     */
    if (timestamp > runStartedAt) {
      return;
    }


    rowsConsidered++;


    const first = cleanText_(
      row[INTAKE_CONFIG.SOURCE.FIRST - 1]
    );

    const last = cleanText_(
      row[INTAKE_CONFIG.SOURCE.LAST - 1]
    );

    const phone = cleanText_(
      row[INTAKE_CONFIG.SOURCE.PHONE - 1]
    );

    const email = cleanText_(
      row[INTAKE_CONFIG.SOURCE.EMAIL - 1]
    );


    // Skip unusable rows with no usable name.
    if (!first && !last) {
      return;
    }


    /**
     * New Intake operational date.
     *
     * Raw source timestamp stays upstream.
     * FacIntake receives date-only Live Date.
     */
    const liveDate = dateOnly_(timestamp);


    /**
     * Duplicate identity:
     * 1. Email
     * 2. Normalized First + Last
     *
     * Phone deliberately excluded.
     */
    const keys = candidateKeys_(
      first,
      last,
      email
    );


    if (isDuplicate_(existing, keys)) {
      duplicatesSkipped++;
      return;
    }


    /**
     * FacIntake A:E
     *
     * A First Name
     * B Last Name
     * C Phone
     * D Email
     * E Live Date
     */
    rowsToAppend.push([
      first,
      last,
      phone,
      email,
      liveDate
    ]);


    /**
     * Add this candidate to the in-memory index
     * so two duplicate new rows in the same run
     * cannot both be appended.
     */
    addKeys_(existing, keys);
  });


  return makePlan_(
    runStartedAt,
    rowsToAppend,
    rowsConsidered,
    duplicatesSkipped,
    lastSuccessfulScan
  );
}


/**
 * Reads the existing FacIntake identity index.
 *
 * Uses:
 * - Email
 * - Normalized name
 *
 * Does NOT use phone.
 */
function readExistingIntakeKeys_(sheet) {
  const state = {
    emails: new Set(),
    names: new Set()
  };


  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return state;
  }


  const rows = sheet
    .getRange(
      2,
      1,
      lastRow - 1,
      5
    )
    .getValues();


  rows.forEach(row => {

    const keys = candidateKeys_(
      row[0], // First
      row[1], // Last
      row[3]  // Email
    );

    addKeys_(state, keys);
  });


  return state;
}


/**
 * Creates normalized duplicate keys.
 */
function candidateKeys_(first, last, email) {
  const nFirst = normalizeText_(first);
  const nLast = normalizeText_(last);
  const nEmail = normalizeText_(email);

  return {
    email: nEmail,
    name: `${nFirst}|${nLast}`
  };
}


/**
 * Returns true if a candidate already exists.
 */
function isDuplicate_(state, keys) {

  if (
    keys.email &&
    state.emails.has(keys.email)
  ) {
    return true;
  }


  if (
    keys.name !== '|' &&
    state.names.has(keys.name)
  ) {
    return true;
  }


  return false;
}


/**
 * Adds duplicate keys to the in-memory identity index.
 */
function addKeys_(state, keys) {

  if (keys.email) {
    state.emails.add(keys.email);
  }


  if (keys.name !== '|') {
    state.names.add(keys.name);
  }
}


/**
 * Reads a SysAdmin value and converts it to Date.
 */
function getAdminDate_(sheet, key) {

  const value = getAdminValue_(
    sheet,
    key
  );


  if (
    value instanceof Date &&
    !isNaN(value)
  ) {
    return value;
  }


  if (!value) {
    return null;
  }


  const parsed = new Date(value);

  return isNaN(parsed)
    ? null
    : parsed;
}


/**
 * Reads SysAdmin column D for the matching control row.
 */
function getAdminValue_(sheet, key) {

  const row = findAdminRow_(
    sheet,
    key
  );

  return sheet
    .getRange(row, 4)
    .getValue();
}


/**
 * Writes SysAdmin column D for the matching control row.
 */
function setAdminValue_(sheet, key, value) {

  const row = findAdminRow_(
    sheet,
    key
  );

  const cell = sheet.getRange(
    row,
    4
  );

  cell.setValue(value);


  if (value instanceof Date) {
    cell.setNumberFormat(
      'yyyy-mm-dd hh:mm:ss'
    );
  }
}


/**
 * Finds a SysAdmin control row using:
 *
 * Column A = Entity Type
 * Column B = Control Name
 */
function findAdminRow_(sheet, key) {

  const lastRow = sheet.getLastRow();


  const values = sheet
    .getRange(
      1,
      1,
      Math.max(lastRow, 1),
      2
    )
    .getDisplayValues();


  for (
    let i = 0;
    i < values.length;
    i++
  ) {

    if (
      values[i][0] === INTAKE_CONFIG.ADMIN_ENTITY &&
      values[i][1] === key
    ) {
      return i + 1;
    }
  }


  throw new Error(
    `SysAdmin control not found: ` +
    `${INTAKE_CONFIG.ADMIN_ENTITY} / ${key}`
  );
}


/**
 * Converts source Timestamp values into JavaScript Date.
 *
 * Handles:
 * - true Date cell values
 * - d/m/yyyy h:mm
 * - d/m/yyyy h:mm:ss
 *
 * Legacy free-text values such as:
 * "Sun, July 17 - evening"
 * are intentionally ignored.
 */
function coerceSourceTimestamp_(value) {

  if (
    value instanceof Date &&
    !isNaN(value)
  ) {
    return value;
  }


  if (
    value === null ||
    value === ''
  ) {
    return null;
  }


  const text = String(value).trim();


  const match = text.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/
  );


  if (match) {
    return new Date(
      Number(match[3]),
      Number(match[2]) - 1,
      Number(match[1]),
      Number(match[4] || 0),
      Number(match[5] || 0),
      Number(match[6] || 0)
    );
  }


  /**
   * Fallback for other genuinely parseable
   * date/time strings.
   */
  const fallback = new Date(text);

  return isNaN(fallback)
    ? null
    : fallback;
}


/**
 * Removes time component.
 */
function dateOnly_(date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
}


/**
 * Cleans ordinary source text.
 */
function cleanText_(value) {

  return (
    value === null ||
    value === undefined
  )
    ? ''
    : String(value).trim();
}


/**
 * Normalizes values for duplicate comparison.
 */
function normalizeText_(value) {

  return cleanText_(value)
    .toLowerCase()
    .replace(/\s+/g, ' ');
}


/**
 * Creates the preview/refresh result object.
 */
function makePlan_(
  runStartedAt,
  rowsToAppend,
  rowsConsidered,
  duplicatesSkipped,
  lastSuccessfulScan
) {

  return {
    runStartedAt,
    lastSuccessfulScan,
    rowsToAppend,
    rowsConsidered,
    duplicatesSkipped,

    summary: {
      runStartedAt:
        runStartedAt.toISOString(),

      lastSuccessfulScan:
        lastSuccessfulScan.toISOString(),

      rowsConsidered,

      duplicatesSkipped,

      rowsToAppend:
        rowsToAppend.length
    }
  };
}