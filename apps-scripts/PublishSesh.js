/**
 * Stage 3 â€” Planning -> Publish / Handover
 *
 * SAFE Copy only.
 *
 * Workflow:
 * 1. Planner ticks Publish? on one or more supported roster rows.
 * 2. Run publishApprovedSessions().
 * 3. New rows receive the next BR-S-xxxxxx ID from SysAdmin.
 * 4. Sessions â€” Sync is created/updated.
 * 5. Session ID + Publish State are written back to the active roster sheet.
 *
 * Re-running is safe:
 * - an already-published row keeps its Session ID;
 * - changes to Date / Location / Reading Unit update the matching Sessions â€” Sync row;
 * - no second Session ID is issued for the same published planning row.
 */

const BR_PUBLISH = {
  sessionsSheet: 'Sessions — Sync',
  adminSheet: 'SysAdmin',

  // Pretty Roster layouts are explicit per semester.
  // Run Preview/Publish from the roster tab that should be processed.
  planningProfiles: {
    'Sem1_2026': {
      dateCol: 1,
      readingUnitCol: 14,  // N
      publishCol: 19,      // S
      sessionIdCol: 20,    // T
      publishStateCol: 21, // U
      locationCol: 22,     // V
      rowBlocks: [[2, 12], [17, 27], [32, 42]],
    },
    'Sem2_2026': {
      dateCol: 1,
      readingUnitCol: 18,  // R
      publishCol: 20,      // T
      sessionIdCol: 21,    // U
      publishStateCol: 22, // V
      locationCol: 23,     // W
      rowBlocks: [[2, 12], [18, 28], [34, 45]],
    },
    'Sem1_2027': {
      dateCol: 1,
      readingUnitCol: 20,  // T
      publishCol: 22,      // V
      sessionIdCol: 23,    // W
      publishStateCol: 24, // X
      locationCol: 25,     // Y
      rowBlocks: [[2, 16], [22, 36], [42, 56]],
    },
    'Sem2_2027': {
      dateCol: 1,
      readingUnitCol: 20,  // T
      publishCol: 22,      // V
      sessionIdCol: 23,    // W
      publishStateCol: 24, // X
      locationCol: 25,     // Y
      rowBlocks: [[2, 16], [22, 36], [42, 56]],
    },
  },

  newSessionStatus: 'Scheduled',
  publishedState: 'Published',
};

function sessionPlanningProfile_(sheetName) {
  const profile = BR_PUBLISH.planningProfiles[sheetName];
  if (!profile) {
    throw new Error(
      `Session Preview/Publish must be run from a supported roster sheet. ` +
      `Active sheet is "${sheetName}"; supported sheets: ` +
      Object.keys(BR_PUBLISH.planningProfiles).join(', ')
    );
  }
  return profile;
}


/**
 * Main user action.
 * Processes every checked planning row.
 */
function publishApprovedSessions() {
  const ss = SpreadsheetApp.getActive();
  const lock = LockService.getDocumentLock();
  lock.waitLock(30000);

  try {
    const planning = ss.getActiveSheet();
    const profile = sessionPlanningProfile_(planning.getName());
    const sessions = requireSheet_(ss, BR_PUBLISH.sessionsSheet);
    const admin = requireSheet_(ss, BR_PUBLISH.adminSheet);

    const syncIndex = buildSessionSyncIndex_(sessions);
    const allocator = readSessionAllocator_(admin);

    let created = 0;
    let updated = 0;
    const errors = [];

    profile.rowBlocks.forEach(([startRow, endRow]) => {
      const numRows = endRow - startRow + 1;
      const width = profile.locationCol;

      const values = planning
        .getRange(startRow, 1, numRows, width)
        .getValues();

      values.forEach((row, offset) => {
        const sheetRow = startRow + offset;

        const publish = row[profile.publishCol - 1] === true;
        if (!publish) return; // I ADDED HERE!! ARE THE INDENTS CORRECT??
        const publishState = clean_(row[profile.publishStateCol - 1]);

        if (publishState.startsWith('Excluded')) {  
        errors.push(`Row ${sheetRow}: excluded from Bible Reading publication`);
        return;
        }

        const date = row[profile.dateCol - 1];
        const readingUnit = clean_(row[profile.readingUnitCol - 1]);
        const location = clean_(row[profile.locationCol - 1]);
        let sessionId = clean_(row[profile.sessionIdCol - 1]);

        try {
          validatePlanningRow_(sheetRow, date, location);

          if (!sessionId) {
            sessionId = formatSessionId_(allocator.nextNumber);
            allocator.nextNumber += 1;
            allocator.lastIssued = sessionId;

            const appendRow = sessions.getLastRow() + 1;
            sessions.getRange(appendRow, 1, 1, 5).setValues([[
              sessionId,
              date,
              location,
              readingUnit,
              BR_PUBLISH.newSessionStatus,
            ]]);

            syncIndex.set(sessionId, appendRow);

            planning.getRange(sheetRow, profile.sessionIdCol)
              .setValue(sessionId);
            planning.getRange(sheetRow, profile.publishStateCol)
              .setValue(BR_PUBLISH.publishedState);

            created += 1;
          } else {
            if (!/^BR-S-\d{6}$/.test(sessionId)) {
              throw new Error(`invalid Session ID "${sessionId}"`);
            }

            let syncRow = syncIndex.get(sessionId);

            if (!syncRow) {
              syncRow = sessions.getLastRow() + 1;
              sessions.getRange(syncRow, 1, 1, 5).setValues([[
                sessionId,
                date,
                location,
                readingUnit,
                BR_PUBLISH.newSessionStatus,
              ]]);
              syncIndex.set(sessionId, syncRow);
            } else {
              // Preserve current Session Status; update shared planning facts only.
              sessions.getRange(syncRow, 2, 1, 3)
                .setValues([[date, location, readingUnit]]);
            }

            planning.getRange(sheetRow, profile.publishStateCol)
              .setValue(BR_PUBLISH.publishedState);

            updated += 1;
          }
        } catch (err) {
          planning.getRange(sheetRow, profile.publishStateCol)
            .setValue(`ERROR: ${err.message}`);
          errors.push(`Row ${sheetRow}: ${err.message}`);
        }
      });
    });

    writeSessionAllocator_(admin, allocator);

    const message = errors.length
      ? `Published: ${created}; updated: ${updated}; errors: ${errors.length}`
      : `Published: ${created}; updated: ${updated}; no errors`;

    ss.toast(message, 'Publish Approved Sessions', 8);
    Logger.log(message);
    if (errors.length) Logger.log(errors.join('\n'));

  } finally {
    lock.releaseLock();
  }
}


/**
 * Optional preview: reports what would be processed without writing anything.
 */
function previewApprovedSessions() {
  const ss = SpreadsheetApp.getActive();
  const planning = ss.getActiveSheet();
  const profile = sessionPlanningProfile_(planning.getName());

  let checked = 0;
  let newSessions = 0;
  let existingSessions = 0;
  const problems = [];

  profile.rowBlocks.forEach(([startRow, endRow]) => {
    const numRows = endRow - startRow + 1;
    const values = planning
      .getRange(startRow, 1, numRows, profile.locationCol)
      .getValues();

    values.forEach((row, offset) => {
      if (row[profile.publishCol - 1] !== true) return;

      checked += 1;

      const sheetRow = startRow + offset;
      const publishState = clean_(row[profile.publishStateCol - 1]);

      if (publishState.startsWith('Excluded')) {
        problems.push(`Row ${sheetRow}: excluded from Bible Reading publication`);
        return;
      }

      const date = row[profile.dateCol - 1];
      const location = clean_(row[profile.locationCol - 1]);
      const sessionId = clean_(row[profile.sessionIdCol - 1]);

      try {
        validatePlanningRow_(sheetRow, date, location);
        if (sessionId) {
          if (!/^BR-S-\d{6}$/.test(sessionId)) {
            throw new Error(`invalid Session ID "${sessionId}"`);
          }
          existingSessions += 1;
        } else {
          newSessions += 1;
        }
      } catch (err) {
        problems.push(`Row ${sheetRow}: ${err.message}`);
      }
    });
  });

  const message =
    `Checked: ${checked}; new: ${newSessions}; existing: ${existingSessions}; problems: ${problems.length}`;

  ss.toast(message, 'Preview Approved Sessions', 8);
  Logger.log(message);
  if (problems.length) Logger.log(problems.join('\n'));
}


function buildSessionSyncIndex_(sheet) {
  const map = new Map();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return map;

  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues();
  ids.forEach((row, i) => {
    const id = clean_(row[0]);
    if (!id) return;
    if (map.has(id)) {
      throw new Error(`Duplicate Session ID in Sessions â€” Sync: ${id}`);
    }
    map.set(id, i + 2);
  });
  return map;
}


function readSessionAllocator_(admin) {
  const lastRow = admin.getLastRow();
  const values = admin.getRange(2, 1, Math.max(lastRow - 1, 1), 6).getValues();

  for (let i = 0; i < values.length; i++) {
    if (clean_(values[i][0]) === 'Session') {
      const nextNumber = Number(values[i][3]);
      if (!Number.isInteger(nextNumber) || nextNumber < 1) {
        throw new Error('SysAdmin Session Next Number is invalid.');
      }
      return {
        row: i + 2,
        prefix: clean_(values[i][1]) || 'BR-S-',
        width: Number(values[i][2]) || 6,
        nextNumber,
        lastIssued: clean_(values[i][4]),
      };
    }
  }

  throw new Error('Session allocator row not found in SysAdmin.');
}


function writeSessionAllocator_(admin, allocator) {
  admin.getRange(allocator.row, 4).setValue(allocator.nextNumber);
  admin.getRange(allocator.row, 5).setValue(allocator.lastIssued);
}


function validatePlanningRow_(rowNumber, date, location) {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error('Date is required and must be valid.');
  }

  if (!['Tuesday', 'Thursday', 'Singapore'].includes(location)) {
    throw new Error(`Location is required; got "${location || 'blank'}".`);
  }
}


function formatSessionId_(number) {
  return 'BR-S-' + String(number).padStart(6, '0');
}


function requireSheet_(ss, name) {
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error(`Sheet not found: ${name}`);
  return sheet;
}


function clean_(value) {
  return String(value ?? '').trim();
}
