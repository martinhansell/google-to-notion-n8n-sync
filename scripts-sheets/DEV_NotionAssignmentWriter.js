/**
 * DEV Notion -> Google assignment writer.
 * Install ONLY in the DEV workbook-bound Apps Script project.
 * Intended to be called by a trusted bridge (not a public unauthenticated endpoint).
 */
const DEV_NOTION_WRITER = Object.freeze({
  spreadsheetId: '1bXkN49Z9rTkfXaHrZ5PaIB2uqRG9qfk4Qhc3JyORrKA',
  assignmentsTab: 'Assignments — Sync',
  adminTab: 'SysAdmin',
  pageIdHeader: 'Notion Assignment Page ID',
  roles: ['Lead / Announce', 'Newcomer Support', 'Facilitate', 'L-Plate', 'L-Plate Support'],
  types: ['Original', 'Replacement'],
  confirmations: ['Not Requested', 'Awaiting Confirmation', 'Confirmed', 'Seeking Replacement', 'Replacement Found', 'No Response'],
  states: ['Active', 'Replaced', 'Removed']
});

/**
 * @param {{notionAssignmentPageId:string,facilitatorId:string,sessionId:string,
 * role:string,assignmentType:string,confirmation?:string,assignmentState?:string,
 * replacesAssignmentId?:string,notes?:string}} input
 */
function devWriteNotionAssignment(input) {
  const C = DEV_NOTION_WRITER;
  if (!input || typeof input !== 'object') throw new Error('Assignment object required');
  const normPage = v => String(v || '').replace(/-/g, '').toLowerCase().trim();
  const pageId = String(input.notionAssignmentPageId || '').trim();
  const facilitatorId = String(input.facilitatorId || '').trim();
  const sessionId = String(input.sessionId || '').trim();
  const role = String(input.role || '').trim();
  const type = String(input.assignmentType || '').trim();
  const confirmation = String(input.confirmation || 'Not Requested').trim();
  const state = String(input.assignmentState || 'Active').trim();
  const replaces = String(input.replacesAssignmentId || '').trim();
  const notes = String(input.notes || '').trim();

  if (!/^[0-9a-f]{32}$/.test(normPage(pageId))) throw new Error('Invalid Notion Page ID');
  if (!/^BR-F-\d{6}$/.test(facilitatorId)) throw new Error('Invalid Facilitator External ID');
  if (!/^BR-S-\d{6}$/.test(sessionId)) throw new Error('Invalid Session External ID');
  if (!C.roles.includes(role)) throw new Error('Unrecognised canonical Role');
  if (!C.types.includes(type)) throw new Error('Invalid Assignment Type');
  if (!C.confirmations.includes(confirmation)) throw new Error('Invalid Confirmation state');
  if (!C.states.includes(state)) throw new Error('Invalid Assignment State');
  if (type === 'Replacement' && !/^BR-A-\d{6}$/.test(replaces))
    throw new Error('Replacement requires Replaces Assignment ID');
  if (type === 'Original' && replaces)
    throw new Error('Original must not have Replaces Assignment ID');

  const lock = LockService.getDocumentLock();
  if (!lock) throw new Error('Document lock unavailable; use bound DEV project');
  lock.waitLock(30000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss || ss.getId() !== C.spreadsheetId) throw new Error('STOP: wrong workbook');
    const sheet = ss.getSheetByName(C.assignmentsTab);
    const admin = ss.getSheetByName(C.adminTab);
    if (!sheet || !admin) throw new Error('Missing DEV sheet');
    if (sheet.getRange('Q1').getDisplayValue() !== C.pageIdHeader)
      throw new Error('Unexpected column Q header');
    if (!sheet.getRange('E2').getFormula().includes('ARRAYFORMULA'))
      throw new Error('Facilitator Name array formula missing');

    const rowCount = sheet.getMaxRows();
    if (rowCount < 2) throw new Error('No assignment data rows');
    const records = sheet.getRange(2, 1, rowCount - 1, 17).getValues();
    const allocator = admin.getRange('A4:E4').getValues()[0];
    if (allocator[0] !== 'Assignment' || allocator[1] !== 'BR-A-' ||
        Number(allocator[2]) !== 6) throw new Error('Unexpected allocator configuration');
    const next = Number(allocator[3]);
    if (!Number.isSafeInteger(next) || next < 1) throw new Error('Invalid Next Number');

    const matches = records.map((r, i) => ({r, row: i + 2}))
      .filter(x => normPage(x.r[16]) === normPage(pageId));
    if (matches.length > 1) throw new Error('Duplicate Notion Page ID in Google');
    if (matches.length === 1) {
      const found = matches[0];
      const id = String(found.r[0] || '').trim();
      if (!/^BR-A-\d{6}$/.test(id)) throw new Error('Page ID exists but Assignment ID missing');
      if (String(found.r[2]) !== sessionId || String(found.r[3]) !== facilitatorId ||
          String(found.r[5]) !== role || String(found.r[6]) !== type)
        throw new Error('Existing assignment identity differs; manual review required');
      // Recovery when Google row was committed but counter advancement failed.
      const issued = Number(id.slice(5));
      if (next <= issued) {
        admin.getRange('D4:E4').setValues([[issued + 1, id]]);
        SpreadsheetApp.flush();
      }
      return {status:'ALREADY_EXISTS', assignmentId:id, row:found.row, notionPageId:pageId};
    }

    const assignmentId = 'BR-A-' + String(next).padStart(6, '0');
    if (records.some(r => String(r[0]).trim() === assignmentId))
      throw new Error('Proposed ID already exists; allocator needs review');
    const index = records.findIndex(r => !String(r[0] || '').trim());
    if (index < 0) throw new Error('No free assignment row');
    const row = index + 2;
    // Intentionally leave column E to its ARRAYFORMULA.
    sheet.getRange(row, 1, 1, 4).setValues([[
      assignmentId, Utilities.getUuid(), sessionId, facilitatorId
    ]]);
    sheet.getRange(row, 6, 1, 12).setValues([[
      role, type, confirmation, '', '', replaces, '', '', notes, state, '', pageId
    ]]);
    SpreadsheetApp.flush();
    admin.getRange('D4:E4').setValues([[next + 1, assignmentId]]);
    SpreadsheetApp.flush();
    return {status:'CREATED', assignmentId, row, notionPageId:pageId};
  } finally {
    lock.releaseLock();
  }
}
