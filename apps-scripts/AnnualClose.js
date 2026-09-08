/**
 * Bible Facilitation Roster — simple annual close
 *
 * Install this as AnnualClose.gs in the SAFE Copy's bound Apps Script project.
 * Run previewAnnualClose() first. Nothing is archived until you manually run
 * archiveAnnualClose() and confirm its final prompt.
 */

const ANNUAL_CLOSE = Object.freeze({
  year: 2026,
  freezeId: 'BR-FREEZE-2026-01',
  archiveNotBefore: '2027-02-01',
  timeZone: 'Asia/Hong_Kong',
  sourceWorkbookId: '1bXkN49Z9rTkfXaHrZ5PaIB2uqRG9qfk4Qhc3JyORrKA',
  rosterArchiveId: '12slmDBZnZ3JjVUIfSvNTxwlNxoJdiqOTVT7xq29xdv4',
  dataArchiveId: '1K2MGsgUq88QdgBHyCe63DWW54rMOFdwNvwgV2AUPbJw',
  rosterTabs: ['Sem1_2026', 'Sem2_2026', 'Easter_Retreat_2026'],
  sessionsSource: 'Sessions — Sync',
  assignmentsSource: 'Assignments — Sync',
  facilitatorsSource: 'FacMaster',
  sessionsTarget: 'Sessions 2026',
  assignmentsTarget: 'Assignments 2026',
  facilitatorsTarget: 'Facilitators 2026',
  reportTarget: 'Freeze Report 2026'
});

/** Read-only: reports what would be archived and any blockers. */
function previewAnnualClose() {
  const snapshot = collectSourceSnapshot_();
  const rosterArchive = SpreadsheetApp.openById(ANNUAL_CLOSE.rosterArchiveId);
  const dataArchive = SpreadsheetApp.openById(ANNUAL_CLOSE.dataArchiveId);
  const existing = ANNUAL_CLOSE.rosterTabs.filter(name => rosterArchive.getSheetByName(name));
  const missing = ANNUAL_CLOSE.rosterTabs.filter(name => !rosterArchive.getSheetByName(name));
  const occupiedTargets = occupiedTargets_(dataArchive);
  const previewIssues = snapshot.issues.concat(occupiedTargets.map(name => `${name} already contains archive rows`));

  const lines = [
    `Annual close preview: ${ANNUAL_CLOSE.year}`,
    '',
    `Sessions: ${snapshot.sessions.length}`,
    `Assignments: ${snapshot.assignments.length}`,
    `Referenced facilitators: ${snapshot.facilitators.length}`,
    `Existing roster tabs (will not be overwritten): ${existing.join(', ') || 'none'}`,
    `Missing roster tabs (will be created): ${missing.join(', ') || 'none'}`,
    `Archive function locked until: ${ANNUAL_CLOSE.archiveNotBefore}`,
    '',
    previewIssues.length
      ? `BLOCKED — ${previewIssues.length} issue(s):\n• ${previewIssues.join('\n• ')}`
      : 'READY — preview made no changes.'
  ];

  const result = {
    ready: previewIssues.length === 0,
    year: ANNUAL_CLOSE.year,
    sessions: snapshot.sessions.length,
    assignments: snapshot.assignments.length,
    facilitators: snapshot.facilitators.length,
    existingRosterTabs: existing,
    missingRosterTabs: missing,
    issues: previewIssues
  };

  Logger.log(JSON.stringify(result, null, 2));
  SpreadsheetApp.getUi().alert('Annual Close Preview', lines.join('\n'), SpreadsheetApp.getUi().ButtonSet.OK);
  return result;
}

/**
 * Write action: after a human confirmation, creates only missing roster archive
 * tabs, writes the three hard-value data snapshots, and produces the Freeze Report.
 */
function archiveAnnualClose() {
  assertArchiveWindowOpen_();
  const ui = SpreadsheetApp.getUi();
  const snapshot = collectSourceSnapshot_();
  if (snapshot.issues.length) {
    throw new Error(`Annual close is blocked:\n- ${snapshot.issues.join('\n- ')}`);
  }

  const dataArchive = SpreadsheetApp.openById(ANNUAL_CLOSE.dataArchiveId);
  assertTargetsEmpty_(dataArchive);

  const response = ui.alert(
    `Archive ${ANNUAL_CLOSE.year}?`,
    'This will create missing hard-value roster tabs and write the annual data snapshots. Existing roster archive tabs will not be overwritten.',
    ui.ButtonSet.YES_NO
  );
  if (response !== ui.Button.YES) {
    ui.alert('No changes were made.');
    return {archived: false};
  }

  const source = sourceSpreadsheet_();
  const rosterArchive = SpreadsheetApp.openById(ANNUAL_CLOSE.rosterArchiveId);
  const createdTabs = [];
  const preservedTabs = [];

  ANNUAL_CLOSE.rosterTabs.forEach(name => {
    if (rosterArchive.getSheetByName(name)) {
      preservedTabs.push(name);
      return;
    }
    const sourceSheet = requireSheet_(source, name);
    const archivedSheet = sourceSheet.copyTo(rosterArchive).setName(name);
    const usedRange = archivedSheet.getDataRange();
    usedRange.setValues(usedRange.getValues()); // formulas become permanent values
    createdTabs.push(name);
  });

  const capturedAt = new Date();
  const runId = makeRunId_(capturedAt);
  writeDataSnapshots_(dataArchive, snapshot, runId, capturedAt);

  const validation = runValidation_();
  writeCompactReport_(dataArchive, validation, runId, capturedAt);

  ui.alert(
    `Annual Close ${validation.status}`,
    [
      `Created roster tabs: ${createdTabs.join(', ') || 'none'}`,
      `Preserved existing tabs: ${preservedTabs.join(', ') || 'none'}`,
      `Sessions: ${snapshot.sessions.length}`,
      `Assignments: ${snapshot.assignments.length}`,
      `Facilitators: ${snapshot.facilitators.length}`,
      `Freeze Report: ${ANNUAL_CLOSE.reportTarget}`,
      validation.issues.length ? `Issues: ${validation.issues.length}` : 'All checks passed.'
    ].join('\n'),
    ui.ButtonSet.OK
  );
  return validation;
}

/** Read/check action apart from refreshing the compact Freeze Report. */
function validateAnnualArchive() {
  const validation = runValidation_();
  const dataArchive = SpreadsheetApp.openById(ANNUAL_CLOSE.dataArchiveId);
  const checkedAt = new Date();
  writeCompactReport_(dataArchive, validation, makeRunId_(checkedAt), checkedAt);

  const message = validation.issues.length
    ? `${validation.issues.length} issue(s):\n• ${validation.issues.join('\n• ')}`
    : 'All roster and data archive checks passed.';
  SpreadsheetApp.getUi().alert(`Annual Archive ${validation.status}`, message, SpreadsheetApp.getUi().ButtonSet.OK);
  return validation;
}

// ---------- Source data ----------

function collectSourceSnapshot_() {
  const source = sourceSpreadsheet_();
  const sessionsTable = readTable_(source, ANNUAL_CLOSE.sessionsSource, 1);
  const assignmentsTable = readTable_(source, ANNUAL_CLOSE.assignmentsSource, 1);
  const facilitatorsTable = readTable_(source, ANNUAL_CLOSE.facilitatorsSource, 1);
  const issues = [];

  ANNUAL_CLOSE.rosterTabs.forEach(name => requireSheet_(source, name));

  const sessions = sessionsTable.rows.filter(row =>
    yearOf_(row.value('Date')) === ANNUAL_CLOSE.year && String(row.value('Session ID')).trim()
  );
  const sessionIds = new Set(sessions.map(row => String(row.value('Session ID')).trim()));
  const assignments = assignmentsTable.rows.filter(row =>
    sessionIds.has(String(row.value('Session ID')).trim()) && String(row.value('Assignment ID')).trim()
  );
  const facilitatorIds = new Set(assignments.map(row => String(row.value('Facilitator ID')).trim()).filter(Boolean));
  const facilitatorById = new Map();
  facilitatorsTable.rows.forEach(row => {
    const id = String(row.value('Facilitator External ID')).trim();
    if (id) facilitatorById.set(id, row);
  });
  const facilitators = Array.from(facilitatorIds).sort().map(id => facilitatorById.get(id)).filter(Boolean);

  issues.push(...duplicateIssues_(sessions, 'Session ID', 'session'));
  issues.push(...duplicateIssues_(assignments, 'Assignment ID', 'assignment'));
  sessions.forEach(row => {
    const id = String(row.value('Session ID')).trim();
    if (!/^BR-S-\d{6}$/.test(id)) issues.push(`Invalid Session ID: ${id || '(blank)'}`);
  });
  assignments.forEach(row => {
    const assignmentId = String(row.value('Assignment ID')).trim();
    const sessionId = String(row.value('Session ID')).trim();
    const facilitatorId = String(row.value('Facilitator ID')).trim();
    if (!/^BR-A-\d{6}$/.test(assignmentId)) issues.push(`Invalid Assignment ID: ${assignmentId || '(blank)'}`);
    if (!sessionIds.has(sessionId)) issues.push(`${assignmentId} refers to missing session ${sessionId}`);
    if (!facilitatorById.has(facilitatorId)) issues.push(`${assignmentId} refers to missing facilitator ${facilitatorId}`);
  });

  return {source, sessionsTable, assignmentsTable, facilitatorsTable, sessions, assignments, facilitators, facilitatorById, issues};
}

function sourceSpreadsheet_() {
  const source = SpreadsheetApp.getActiveSpreadsheet();
  if (!source || source.getId() !== ANNUAL_CLOSE.sourceWorkbookId) {
    throw new Error('Safety stop: run this only from the designated SAFE Copy workbook.');
  }
  return source;
}

function readTable_(spreadsheet, sheetName, headerRow) {
  const sheet = requireSheet_(spreadsheet, sheetName);
  const values = sheet.getDataRange().getValues();
  const headers = values[headerRow - 1].map(value => String(value).trim());
  const index = {};
  headers.forEach((header, column) => { if (header) index[header] = column; });
  const rows = values.slice(headerRow).map((rowValues, offset) => ({
    rowNumber: headerRow + offset + 1,
    values: rowValues,
    value: header => index[header] === undefined ? '' : rowValues[index[header]]
  })).filter(row => row.values.some(value => value !== '' && value !== null));
  return {sheet, headers, index, rows};
}

function duplicateIssues_(rows, header, label) {
  const seen = new Set();
  const duplicates = new Set();
  rows.forEach(row => {
    const id = String(row.value(header)).trim();
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  });
  return Array.from(duplicates).map(id => `Duplicate ${label} ID: ${id}`);
}

function yearOf_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value)) return value.getFullYear();
  const match = String(value).match(/\b(20\d{2})\b/);
  return match ? Number(match[1]) : null;
}

// ---------- Archive writing ----------

function assertTargetsEmpty_(dataArchive) {
  const occupied = occupiedTargets_(dataArchive);
  if (occupied.length) throw new Error(`Safety stop: ${occupied.join(', ')} already contains archive rows. Nothing was overwritten.`);
}

function occupiedTargets_(dataArchive) {
  return [ANNUAL_CLOSE.sessionsTarget, ANNUAL_CLOSE.assignmentsTarget, ANNUAL_CLOSE.facilitatorsTarget].filter(name => {
    const sheet = requireSheet_(dataArchive, name);
    if (sheet.getLastRow() < 4) return false;
    const values = sheet.getRange(4, 1, sheet.getLastRow() - 3, Math.max(1, sheet.getLastColumn())).getValues();
    return values.some(row => row.some(value => value !== '' && value !== null));
  });
}

function writeDataSnapshots_(dataArchive, snapshot, runId, capturedAt) {
  const sessionHeaders = ['Freeze ID', 'Run ID', 'Session ID', 'Date', 'Location', 'Reading Unit', 'Session Status', 'Source Workbook ID', 'Source Sheet', 'Source Row', 'Captured At'];
  const assignmentHeaders = ['Freeze ID', 'Run ID', 'Assignment ID', 'Session ID', 'Facilitator ID', 'Facilitator Name', 'Role', 'Assignment Type', 'Confirmation', 'Confirmed At', 'Replaces Assignment ID', 'Source Sheet', 'Source Cell', 'Notes', 'Assignment State', 'Captured At'];
  const facilitatorHeaders = ['Freeze ID', 'Run ID', 'Facilitator ID', 'Display Name', 'Referenced Assignment Count', 'Identity Source', 'Captured At', 'Notes'];

  const sessionRows = snapshot.sessions.map(row => [
    ANNUAL_CLOSE.freezeId, runId, row.value('Session ID'), row.value('Date'), row.value('Location'),
    row.value('Reading Unit'), row.value('Session Status'), ANNUAL_CLOSE.sourceWorkbookId,
    ANNUAL_CLOSE.sessionsSource, row.rowNumber, capturedAt
  ]);
  const assignmentRows = snapshot.assignments.map(row => [
    ANNUAL_CLOSE.freezeId, runId, row.value('Assignment ID'), row.value('Session ID'),
    row.value('Facilitator ID'), row.value('Facilitator Name'), row.value('Role'),
    row.value('Assignment Type'), row.value('Confirmation'), row.value('Confirmed At'),
    row.value('Replaces Assignment ID'), row.value('Source Sheet'), row.value('Source Cell'),
    row.value('Notes'), row.value('Assignment State'), capturedAt
  ]);
  const assignmentCount = {};
  snapshot.assignments.forEach(row => {
    const id = String(row.value('Facilitator ID')).trim();
    assignmentCount[id] = (assignmentCount[id] || 0) + 1;
  });
  const facilitatorRows = [];
  Object.keys(assignmentCount).sort().forEach(id => {
    const person = snapshot.facilitatorById.get(id);
    facilitatorRows.push([
      ANNUAL_CLOSE.freezeId, runId, id, person ? person.value('Display Name') : '',
      assignmentCount[id], ANNUAL_CLOSE.facilitatorsSource, capturedAt, ''
    ]);
  });

  writeSnapshotSheet_(requireSheet_(dataArchive, ANNUAL_CLOSE.sessionsTarget), `SESSIONS ${ANNUAL_CLOSE.year}`, sessionHeaders, sessionRows);
  writeSnapshotSheet_(requireSheet_(dataArchive, ANNUAL_CLOSE.assignmentsTarget), `ASSIGNMENTS ${ANNUAL_CLOSE.year}`, assignmentHeaders, assignmentRows);
  writeSnapshotSheet_(requireSheet_(dataArchive, ANNUAL_CLOSE.facilitatorsTarget), `FACILITATORS ${ANNUAL_CLOSE.year}`, facilitatorHeaders, facilitatorRows);
}

function writeSnapshotSheet_(sheet, title, headers, rows) {
  sheet.clearContents();
  ensureSize_(sheet, Math.max(4, rows.length + 3), headers.length);
  sheet.getRange(1, 1).setValue(title);
  sheet.getRange(2, 1).setValue(`Hard-value annual snapshot. Freeze ID: ${ANNUAL_CLOSE.freezeId}`);
  sheet.getRange(3, 1, 1, headers.length).setValues([headers]);
  if (rows.length) sheet.getRange(4, 1, rows.length, headers.length).setValues(rows);
  sheet.setFrozenRows(3);
  sheet.getRange(3, 1, 1, headers.length).setFontWeight('bold');
}

// ---------- Validation and compact report ----------

function runValidation_() {
  const sourceSnapshot = collectSourceSnapshot_();
  const dataArchive = SpreadsheetApp.openById(ANNUAL_CLOSE.dataArchiveId);
  const rosterArchive = SpreadsheetApp.openById(ANNUAL_CLOSE.rosterArchiveId);
  const archivedSessions = readTable_(dataArchive, ANNUAL_CLOSE.sessionsTarget, 3).rows;
  const archivedAssignments = readTable_(dataArchive, ANNUAL_CLOSE.assignmentsTarget, 3).rows;
  const archivedFacilitators = readTable_(dataArchive, ANNUAL_CLOSE.facilitatorsTarget, 3).rows;
  const issues = sourceSnapshot.issues.slice();
  const checks = [];

  checkCount_('Sessions', sourceSnapshot.sessions.length, archivedSessions.length, checks, issues);
  checkCount_('Assignments', sourceSnapshot.assignments.length, archivedAssignments.length, checks, issues);
  checkCount_('Facilitators', sourceSnapshot.facilitators.length, archivedFacilitators.length, checks, issues);

  const archivedSessionIds = new Set(archivedSessions.map(row => String(row.value('Session ID')).trim()));
  const archivedFacilitatorIds = new Set(archivedFacilitators.map(row => String(row.value('Facilitator ID')).trim()));
  archivedAssignments.forEach(row => {
    const id = String(row.value('Assignment ID')).trim();
    const sessionId = String(row.value('Session ID')).trim();
    const facilitatorId = String(row.value('Facilitator ID')).trim();
    if (!archivedSessionIds.has(sessionId)) issues.push(`${id} has unresolved archived session ${sessionId}`);
    if (!archivedFacilitatorIds.has(facilitatorId)) issues.push(`${id} has unresolved archived facilitator ${facilitatorId}`);
  });
  checks.push(['Assignment relationships', issues.some(item => /unresolved archived/.test(item)) ? 'FAIL' : 'PASS', 'All assignments must resolve to an archived session and facilitator']);

  ANNUAL_CLOSE.rosterTabs.forEach(name => {
    const sourceSheet = requireSheet_(sourceSnapshot.source, name);
    const archiveSheet = rosterArchive.getSheetByName(name);
    if (!archiveSheet) {
      issues.push(`Missing roster archive tab: ${name}`);
      checks.push([`Roster tab: ${name}`, 'FAIL', 'Missing']);
      return;
    }
    const archiveRange = archiveSheet.getDataRange();
    const formulaCount = archiveRange.getFormulas().reduce((sum, row) => sum + row.filter(Boolean).length, 0);
    const errorCount = archiveRange.getDisplayValues().reduce((sum, row) =>
      sum + row.filter(value => /^#(?:REF!|VALUE!|N\/A|DIV\/0!|NAME\?|NUM!|NULL!)$/.test(String(value).trim())).length, 0);
    const matches = displayValuesMatch_(sourceSheet, archiveSheet);
    if (formulaCount) issues.push(`${name} still contains ${formulaCount} formula(s)`);
    if (errorCount) issues.push(`${name} contains ${errorCount} formula error(s)`);
    if (!matches) issues.push(`${name} values do not match the source tab`);
    checks.push([`Roster tab: ${name}`, !formulaCount && !errorCount && matches ? 'PASS' : 'FAIL', `${formulaCount} formulas; ${errorCount} errors; values ${matches ? 'match' : 'differ'}`]);
  });

  return {
    status: issues.length ? 'FAIL' : 'PASS',
    year: ANNUAL_CLOSE.year,
    sourceCounts: {sessions: sourceSnapshot.sessions.length, assignments: sourceSnapshot.assignments.length, facilitators: sourceSnapshot.facilitators.length},
    archiveCounts: {sessions: archivedSessions.length, assignments: archivedAssignments.length, facilitators: archivedFacilitators.length},
    checks,
    issues
  };
}

function checkCount_(label, sourceCount, archiveCount, checks, issues) {
  const pass = sourceCount === archiveCount;
  checks.push([`${label} count`, pass ? 'PASS' : 'FAIL', `Source ${sourceCount}; archive ${archiveCount}`]);
  if (!pass) issues.push(`${label} count differs: source ${sourceCount}, archive ${archiveCount}`);
}

function displayValuesMatch_(sourceSheet, archiveSheet) {
  const sourceValues = sourceSheet.getDataRange().getDisplayValues();
  if (archiveSheet.getMaxRows() < sourceValues.length || archiveSheet.getMaxColumns() < sourceValues[0].length) return false;
  const archiveValues = archiveSheet.getRange(1, 1, sourceValues.length, sourceValues[0].length).getDisplayValues();
  return sourceValues.every((row, r) => row.every((value, c) => value === archiveValues[r][c]));
}

function writeCompactReport_(dataArchive, validation, runId, checkedAt) {
  const sheet = requireSheet_(dataArchive, ANNUAL_CLOSE.reportTarget);
  sheet.clear();
  const operator = Session.getActiveUser().getEmail() || 'Unavailable';
  const summary = [
    ['ANNUAL FREEZE REPORT', validation.status, ''],
    ['Year', ANNUAL_CLOSE.year, ''],
    ['Freeze ID', ANNUAL_CLOSE.freezeId, ''],
    ['Run ID', runId, ''],
    ['Checked at', checkedAt, ''],
    ['Checked by', operator, ''],
    ['Source workbook ID', ANNUAL_CLOSE.sourceWorkbookId, ''],
    ['Roster Archive ID', ANNUAL_CLOSE.rosterArchiveId, ''],
    ['DATA ARCHIVE ID', ANNUAL_CLOSE.dataArchiveId, ''],
    ['', '', ''],
    ['CHECK', 'STATUS', 'DETAIL']
  ].concat(validation.checks);
  if (validation.issues.length) {
    summary.push(['', '', ''], ['EXCEPTIONS', '', '']);
    validation.issues.forEach(issue => summary.push([issue, 'OPEN', '']));
  }
  ensureSize_(sheet, summary.length, 3);
  sheet.getRange(1, 1, summary.length, 3).setValues(summary);
  sheet.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground(validation.status === 'PASS' ? '#d9ead3' : '#f4cccc');
  sheet.getRange(11, 1, 1, 3).setFontWeight('bold').setBackground('#d9eaf7');
  sheet.getDataRange().setWrap(true).setVerticalAlignment('top');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, 3);
}

// ---------- Small utilities ----------

function requireSheet_(spreadsheet, name) {
  const sheet = spreadsheet.getSheetByName(name);
  if (!sheet) throw new Error(`Missing required sheet: ${name}`);
  return sheet;
}

function ensureSize_(sheet, rows, columns) {
  if (sheet.getMaxRows() < rows) sheet.insertRowsAfter(sheet.getMaxRows(), rows - sheet.getMaxRows());
  if (sheet.getMaxColumns() < columns) sheet.insertColumnsAfter(sheet.getMaxColumns(), columns - sheet.getMaxColumns());
}

function makeRunId_(date) {
  const stamp = Utilities.formatDate(date, ANNUAL_CLOSE.timeZone, 'yyyyMMdd-HHmmss');
  return `BR-CLOSE-${ANNUAL_CLOSE.year}-${stamp}`;
}

function assertArchiveWindowOpen_() {
  const today = Utilities.formatDate(new Date(), ANNUAL_CLOSE.timeZone, 'yyyy-MM-dd');
  if (today < ANNUAL_CLOSE.archiveNotBefore) {
    throw new Error(
      `Safety stop: this is a preview-only period. archiveAnnualClose() is locked until ${ANNUAL_CLOSE.archiveNotBefore}.`
    );
  }
}