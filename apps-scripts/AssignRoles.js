/**
 * Stage 4 — Pretty Sheet -> Assignments — Sync
 * Header-safe version — replacement capability-aware + narrow reactivation
 * + flexible source-cell move preservation, including unambiguous move + Role correction
 * + duplicate-facilitator guard within a Session.
 *
 * Key rule: the Assignments — Sync sheet is read/written by COLUMN HEADER,
 * not by hard-coded column number. Inserting display/helper columns therefore
 * cannot silently break BR-A identity matching.
 */

const BR_ASSIGN = {
  assignmentsSheet: 'Assignments — Sync',
  facMasterSheet: 'FacMaster',
  adminSheet: 'SysAdmin',

  // Pretty Sheet layouts are explicit per semester.
  // The active roster sheet determines which profile is used.
  planningProfiles: {
    'Sem1_2026': {
      publishCol: 19,        // S
      sessionIdCol: 20,      // T
      publishStateCol: 21,   // U
      facilitatorStartCol: 2, // B
      facilitatorEndCol: 5,   // E
      rowBlocks: [
        [2, 12],
        [17, 27],
        [32, 42],
      ],
    },
    'Sem2_2026': {
      publishCol: 20,        // T
      sessionIdCol: 21,      // U
      publishStateCol: 22,   // V
      facilitatorStartCol: 2, // B
      facilitatorEndCol: 9,   // I
      rowBlocks: [
        [2, 12],
        [18, 28],
        [34, 45],
      ],
    },
    'Sem1_2027': {
      publishCol: 22,         // V
      sessionIdCol: 23,       // W
      publishStateCol: 24,    // X
      facilitatorStartCol: 2, // B
      facilitatorEndCol: 11,  // K
      rowBlocks: [
        [2, 16],
        [22, 36],
        [42, 56],
      ],
    },
    'Sem2_2027': {
      publishCol: 22,         // V
      sessionIdCol: 23,       // W
      publishStateCol: 24,    // X
      facilitatorStartCol: 2, // B
      facilitatorEndCol: 11,  // K
      rowBlocks: [
        [2, 16],
        [22, 36],
        [42, 56],
      ],
    },
  },

  roleByHex: {
    '#ffd966': 'Lead / Announce',
    '#a4c2f4': 'Newcomer Support',
    '#b6d7a8': 'Facilitate',
    '#f6b26b': 'L-Plate',
    '#d5a6bd': 'L-Plate Support',
  },

  hexByRole: {
    'Lead / Announce': '#ffd966',
    'Newcomer Support': '#a4c2f4',
    'Facilitate': '#b6d7a8',
    'L-Plate': '#f6b26b',
    'L-Plate Support': '#d5a6bd',
  },

  replacementHex: '#e06666',

  activeState: 'Active',
  replacedState: 'Replaced',
  removedState: 'Removed',
  originalType: 'Original',
  replacementType: 'Replacement',
  defaultConfirmation: 'Not Requested',
  replacementFoundConfirmation: 'Replacement Found',
};


function planningProfile_(sheetName) {
  const profile = BR_ASSIGN.planningProfiles[sheetName];
  if (!profile) {
    throw new Error(
      `Assignment Preview/Publish must be run from a supported roster sheet. ` +
      `Active sheet is "${sheetName}"; supported sheets: ` +
      Object.keys(BR_ASSIGN.planningProfiles).join(', ')
    );
  }
  return profile;
}


/* ---------- PUBLIC MENU FUNCTIONS ---------- */

function previewApprovedAssignments() {
  const result = buildAssignmentPlan_();

  const lines = [
    `Checked sessions: ${result.checkedSessions}`,
    `Create: ${result.counts.create}`,
    `Update: ${result.counts.update}`,
    `Replace: ${result.counts.replace}`,
    `Remove: ${result.counts.remove}`,
    `No change: ${result.counts.nochange}`,
    `Problems: ${result.problems.length}`,
  ];

  if (result.notices.length) lines.push('', 'Notes:', ...result.notices);
  if (result.problems.length) lines.push('', 'Problems:', ...result.problems);

  const message = lines.join('\n');
  console.log(message);
  SpreadsheetApp.getUi().alert(
    'Assignment Preview',
    message,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}


function publishApprovedAssignments() {
  const lock = LockService.getDocumentLock();
  lock.waitLock(30000);

  try {
    const plan = buildAssignmentPlan_();

    if (plan.problems.length) {
      const message = [
        'No changes were written because validation problems were found.',
        '',
        ...plan.problems,
      ].join('\n');

      console.log(message);
      SpreadsheetApp.getUi().alert(
        'Assignment Publish Blocked',
        message,
        SpreadsheetApp.getUi().ButtonSet.OK
      );
      return;
    }

    applyAssignmentPlan_(plan);

    const message =
      `Created: ${plan.counts.create}; ` +
      `updated: ${plan.counts.update}; ` +
      `replacements: ${plan.counts.replace}; ` +
      `removed: ${plan.counts.remove}; ` +
      `no change: ${plan.counts.nochange}; no errors`;

    console.log(message);
    SpreadsheetApp.getUi().alert(
      'Assignment Publish Complete',
      message,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } finally {
    lock.releaseLock();
  }
}


/* ---------- PLAN BUILDING ---------- */

function buildAssignmentPlan_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const planning = ss.getActiveSheet();
  const profile = planningProfile_(planning.getName());
  const assignments = requireSheet_(ss, BR_ASSIGN.assignmentsSheet);
  const facMaster = requireSheet_(ss, BR_ASSIGN.facMasterSheet);
  const admin = requireSheet_(ss, BR_ASSIGN.adminSheet);

  // Resolve Assignments — Sync columns from its live header row.
  const cols = assignmentColumns_(assignments);

  const facMap = buildFacilitatorDirectory_(facMaster);
  const assignmentRows = readAssignments_(assignments, cols);
  const currentBySource = indexCurrentAssignmentsBySource_(assignmentRows);
  const removedBySource = indexRemovedAssignmentsBySource_(assignmentRows);
  const activeBySessionFacRole = indexActiveAssignmentsBySessionFacRole_(assignmentRows);
  const activeBySessionFac = indexActiveAssignmentsBySessionFac_(assignmentRows);

  // Pre-read the checked roster into lightweight desired-state indexes.
  // This lets the publisher distinguish a genuine removal from a facilitator
  // simply being moved to another Pretty Roster slot in the SAME Session with
  // the SAME Role. Source Cell is provenance, not assignment identity.
  const desiredMoveIndex = buildDesiredExactMoveIndex_(
    planning,
    profile,
    facMap
  );
  const desiredBySessionFac = buildDesiredSessionFacIndex_(
    planning,
    profile,
    facMap
  );
  const duplicateFacilitatorsBySession = buildDuplicateFacilitatorProblems_(
    desiredBySessionFac
  );
  const moveClaims = new Set();

  const nextNumber = readAllocatorNext_(admin, 'Assignment');

  const actions = [];
  const problems = [];
  const notices = [];
  const counts = {create: 0, update: 0, replace: 0, remove: 0, nochange: 0};
  let checkedSessions = 0;
  let pendingNextNumber = nextNumber;

  profile.rowBlocks.forEach(([startRow, endRow]) => {
    const numRows = endRow - startRow + 1;

    const rowValues = planning
      .getRange(startRow, 1, numRows, profile.publishStateCol)
      .getValues();

    const facRange = planning.getRange(
      startRow,
      profile.facilitatorStartCol,
      numRows,
      profile.facilitatorEndCol - profile.facilitatorStartCol + 1
    );

    const facValues = facRange.getDisplayValues();
    const facBackgrounds = facRange.getBackgrounds();

    for (let offset = 0; offset < numRows; offset++) {
      const sheetRow = startRow + offset;
      const row = rowValues[offset];

      const publish = row[profile.publishCol - 1] === true;
      if (!publish) continue;

      checkedSessions += 1;

      const publishState = cleanAssign_(row[profile.publishStateCol - 1]);
      if (publishState.startsWith('Excluded')) {
        problems.push(`Row ${sheetRow}: excluded from Bible Reading publication`);
        continue;
      }

      const sessionId = cleanAssign_(row[profile.sessionIdCol - 1]);
      if (!/^BR-S-\d{6}$/.test(sessionId)) {
        problems.push(`Row ${sheetRow}: missing or invalid Session ID`);
        continue;
      }

      // Ambiguity guard: one facilitator may appear only once in the desired
      // roster state for a Session. If they appear twice, do not try to guess
      // whether this is an accidental duplicate, a move-in-progress, or two
      // intended assignments. Block the whole Session until the roster is
      // unambiguous.
      const duplicateProblems = duplicateFacilitatorsBySession.get(sessionId) || [];
      if (duplicateProblems.length) {
        duplicateProblems.forEach(message => problems.push(message));
        continue;
      }

      for (
        let col = profile.facilitatorStartCol;
        col <= profile.facilitatorEndCol;
        col++
      ) {
        const localCol = col - profile.facilitatorStartCol;
        const cellA1 = planning.getRange(sheetRow, col).getA1Notation();
        const sourceKey = `${planning.getName()}|${cellA1}`;

        const displayName = cleanAssign_(facValues[offset][localCol]);
        const hex = normalizeHex_(facBackgrounds[offset][localCol]);
        const current = currentBySource.get(sourceKey) || null;

        // Blank Pretty Sheet cell: normally retire an existing active
        // assignment. But if this facilitator still appears exactly once
        // elsewhere in the SAME Session, and there is exactly one Active BR-A
        // for that facilitator in the Session, treat the blank as the old side
        // of a move. The destination cell will update Source Cell, and may also
        // correct Role if the operator changed the colour while moving.
        if (!displayName) {
          if (current && current.state === BR_ASSIGN.activeState) {
            const facKey = assignmentSessionFacKey_(
              current.sessionId,
              current.facilitatorId
            );
            const activeForFac = activeBySessionFac.get(facKey) || [];
            const desiredForFac = desiredBySessionFac.get(facKey) || [];
            const otherDestinations = desiredForFac.filter(
              d => d.sourceKey !== sourceKey
            );

            if (
              current.sessionId === sessionId &&
              activeForFac.length === 1 &&
              desiredForFac.length === 1 &&
              otherDestinations.length === 1 &&
              activeForFac[0].assignmentId === current.assignmentId
            ) {
              counts.nochange += 1;
              continue;
            }

            actions.push({
              kind: 'remove',
              rowNumber: current.rowNumber,
              assignmentId: current.assignmentId,
            });
            counts.remove += 1;
          } else {
            counts.nochange += 1;
          }
          continue;
        }

        const facilitator = facMap.get(normalizeName_(displayName));
        if (!facilitator) {
          problems.push(
            `${cellA1}: facilitator "${displayName}" was not found uniquely in FacMaster`
          );
          continue;
        }
        const facilitatorId = facilitator.id;

        // RED = explicit Replacement workflow signal, never a Role.
        if (hex === BR_ASSIGN.replacementHex) {
          if (!current || current.state !== BR_ASSIGN.activeState) {
            problems.push(
              `${cellA1}: Replacement colour requires an existing Active assignment to replace`
            );
            continue;
          }

          if (!current.role) {
            problems.push(
              `${cellA1}: existing assignment ${current.assignmentId} has no Role to compare`
            );
            continue;
          }

          const roleResolution = resolveReplacementRole_(
            current.role,
            facilitator.roles,
            displayName,
            cellA1
          );

          if (roleResolution.problem) {
            problems.push(roleResolution.problem);
            continue;
          }

          const replacementRole = roleResolution.role;
          const restoreHex = BR_ASSIGN.hexByRole[replacementRole];
          if (!restoreHex) {
            problems.push(`${cellA1}: resolved Role "${replacementRole}" has no canonical colour`);
            continue;
          }

          if (roleResolution.notice) notices.push(roleResolution.notice);

          // Recovery/idempotency case: the replacement was already published but
          // the transient red cue was left behind. Reconcile the published Role
          // against FacMaster capability, then restore the canonical Role colour.
          if (current.facilitatorId === facilitatorId) {
            if (current.type !== BR_ASSIGN.replacementType) {
              problems.push(
                `${cellA1}: Replacement colour is set but facilitator has not changed`
              );
              continue;
            }

            if (current.role !== replacementRole) {
              actions.push({
                kind: 'update',
                rowNumber: current.rowNumber,
                assignmentId: current.assignmentId,
                sessionId,
                facilitatorId,
                role: replacementRole,
                sourceSheet: planning.getName(),
                sourceCell: cellA1,
                restoreHex,
              });
              counts.update += 1;
            } else {
              actions.push({
                kind: 'recolor',
                sourceSheet: planning.getName(),
                sourceCell: cellA1,
                restoreHex,
              });
              counts.nochange += 1;
            }
            continue;
          }

          const newId = formatAssignmentId_(pendingNextNumber++);

          actions.push({
            kind: 'replace',
            oldRowNumber: current.rowNumber,
            oldAssignmentId: current.assignmentId,
            newAssignmentId: newId,
            sessionId,
            facilitatorId,
            role: replacementRole,
            sourceSheet: planning.getName(),
            sourceCell: cellA1,
            restoreHex,
          });
          counts.replace += 1;

          // Treat the new replacement as current for the remainder of this preview.
          currentBySource.set(sourceKey, {
            rowNumber: null,
            assignmentId: newId,
            sessionId,
            facilitatorId,
            role: replacementRole,
            type: BR_ASSIGN.replacementType,
            confirmation: BR_ASSIGN.defaultConfirmation,
            replacesId: current.assignmentId,
            sourceSheet: planning.getName(),
            sourceCell: cellA1,
            state: BR_ASSIGN.activeState,
          });

          continue;
        }

        const role = BR_ASSIGN.roleByHex[hex];
        if (!role) {
          problems.push(
            `${cellA1}: populated facilitator cell has unsupported role colour ${hex || '(none)'}`
          );
          continue;
        }

        // No current Active assignment at this Pretty Sheet slot.
        // First prefer a pure source-cell MOVE when the exact same assignment
        // fact (Session + Facilitator + Role) already exists Active elsewhere
        // in this roster sheet and appears in exactly one desired destination.
        // This preserves the BR-A and changes only Source Cell provenance.
        if (!current || current.state !== BR_ASSIGN.activeState) {
          const exactKey = assignmentExactKey_(
            sessionId,
            facilitatorId,
            role
          );
          const activeExact = (activeBySessionFacRole.get(exactKey) || [])
            .filter(a => a.sourceSheet === planning.getName());
          const desiredExact = desiredMoveIndex.get(exactKey) || [];

          if (
            activeExact.length === 1 &&
            desiredExact.length === 1 &&
            activeExact[0].sourceCell !== cellA1 &&
            !moveClaims.has(activeExact[0].assignmentId)
          ) {
            const moving = activeExact[0];

            actions.push({
              kind: 'update',
              rowNumber: moving.rowNumber,
              assignmentId: moving.assignmentId,
              sessionId,
              facilitatorId,
              role,
              sourceSheet: planning.getName(),
              sourceCell: cellA1,
            });
            counts.update += 1;
            notices.push(
              `${cellA1}: moving existing assignment ${moving.assignmentId} ` +
              `from ${moving.sourceCell} to ${cellA1} for ${displayName} as ${role}.`
            );
            moveClaims.add(moving.assignmentId);

            currentBySource.delete(
              `${moving.sourceSheet}|${moving.sourceCell}`
            );
            currentBySource.set(sourceKey, {
              ...moving,
              sessionId,
              facilitatorId,
              role,
              sourceSheet: planning.getName(),
              sourceCell: cellA1,
              state: BR_ASSIGN.activeState,
            });
            continue;
          }
        }

        // If the exact Role did not match, allow an unambiguous move + Role
        // correction to preserve identity. This is intentionally narrower than
        // an ordinary same-cell edit: there must be exactly ONE Active BR-A for
        // this facilitator in this Session and exactly ONE desired roster cell
        // for them in this Session. Red replacement workflow is handled earlier
        // and never reaches this branch.
        if (!current || current.state !== BR_ASSIGN.activeState) {
          const facKey = assignmentSessionFacKey_(
            sessionId,
            facilitatorId
          );
          const activeForFac = (activeBySessionFac.get(facKey) || [])
            .filter(a => a.sourceSheet === planning.getName());
          const desiredForFac = desiredBySessionFac.get(facKey) || [];

          if (
            activeForFac.length === 1 &&
            desiredForFac.length === 1 &&
            activeForFac[0].sourceCell !== cellA1 &&
            !moveClaims.has(activeForFac[0].assignmentId)
          ) {
            const moving = activeForFac[0];

            actions.push({
              kind: 'update',
              rowNumber: moving.rowNumber,
              assignmentId: moving.assignmentId,
              sessionId,
              facilitatorId,
              role,
              sourceSheet: planning.getName(),
              sourceCell: cellA1,
            });
            counts.update += 1;
            notices.push(
              `${cellA1}: moving existing assignment ${moving.assignmentId} ` +
              `from ${moving.sourceCell} to ${cellA1} for ${displayName}; ` +
              `Role ${moving.role} → ${role}.`
            );
            moveClaims.add(moving.assignmentId);

            currentBySource.delete(
              `${moving.sourceSheet}|${moving.sourceCell}`
            );
            currentBySource.set(sourceKey, {
              ...moving,
              sessionId,
              facilitatorId,
              role,
              sourceSheet: planning.getName(),
              sourceCell: cellA1,
              state: BR_ASSIGN.activeState,
            });
            continue;
          }
        }

        // No current Active assignment at this Pretty Sheet slot.
        // Next try a deliberately narrow reactivation: only the latest Removed
        // assignment at the same Source Sheet + Source Cell may be reactivated,
        // and only when Facilitator ID + Role also match exactly. A different
        // person or Role is a genuinely new assignment and must receive a new BR-A.
        if (!current || current.state !== BR_ASSIGN.activeState) {
          const removed = removedBySource.get(sourceKey) || null;

          if (
            removed &&
            removed.facilitatorId === facilitatorId &&
            removed.role === role
          ) {
            actions.push({
              kind: 'update',
              rowNumber: removed.rowNumber,
              assignmentId: removed.assignmentId,
              sessionId,
              facilitatorId,
              role,
              sourceSheet: planning.getName(),
              sourceCell: cellA1,
            });
            counts.update += 1;
            notices.push(
              `${cellA1}: reactivating Removed assignment ${removed.assignmentId} ` +
              `for ${displayName} as ${role}.`
            );

            currentBySource.set(sourceKey, {
              ...removed,
              sessionId,
              facilitatorId,
              role,
              sourceSheet: planning.getName(),
              sourceCell: cellA1,
              state: BR_ASSIGN.activeState,
            });
            continue;
          }

          const newId = formatAssignmentId_(pendingNextNumber++);

          actions.push({
            kind: 'create',
            assignmentId: newId,
            sessionId,
            facilitatorId,
            role,
            sourceSheet: planning.getName(),
            sourceCell: cellA1,
          });
          counts.create += 1;

          currentBySource.set(sourceKey, {
            rowNumber: null,
            assignmentId: newId,
            sessionId,
            facilitatorId,
            role,
            type: BR_ASSIGN.originalType,
            confirmation: BR_ASSIGN.defaultConfirmation,
            replacesId: '',
            sourceSheet: planning.getName(),
            sourceCell: cellA1,
            state: BR_ASSIGN.activeState,
          });

          continue;
        }

        // Ordinary edit: preserve the existing BR-A identity.
        const changed =
          current.sessionId !== sessionId ||
          current.facilitatorId !== facilitatorId ||
          current.role !== role ||
          current.state !== BR_ASSIGN.activeState;

        if (changed) {
          if (!current.rowNumber) {
            problems.push(
              `${cellA1}: multiple changes to a newly planned assignment in one run are not supported`
            );
            continue;
          }

          actions.push({
            kind: 'update',
            rowNumber: current.rowNumber,
            assignmentId: current.assignmentId,
            sessionId,
            facilitatorId,
            role,
            sourceSheet: planning.getName(),
            sourceCell: cellA1,
          });
          counts.update += 1;
        } else {
          counts.nochange += 1;
        }
      }
    }
  });

  return {
    assignments,
    admin,
    cols,
    actions,
    problems,
    notices,
    counts,
    checkedSessions,
    allocatorStart: nextNumber,
    allocatorEnd: pendingNextNumber,
  };
}


/* ---------- WRITES ---------- */

function applyAssignmentPlan_(plan) {
  const sheet = plan.assignments;
  const cols = plan.cols;

  // Mutate existing records first.
  plan.actions
    .filter(a => a.kind === 'remove' || a.kind === 'update' || a.kind === 'replace')
    .forEach(action => {
      if (action.kind === 'remove') {
        setByCol_(sheet, action.rowNumber, cols.state, BR_ASSIGN.removedState);
        return;
      }

      if (action.kind === 'update') {
        setByCol_(sheet, action.rowNumber, cols.sessionId, action.sessionId);
        setByCol_(sheet, action.rowNumber, cols.facilitatorId, action.facilitatorId);
        setByCol_(sheet, action.rowNumber, cols.role, action.role);
        setByCol_(sheet, action.rowNumber, cols.sourceSheet, action.sourceSheet);
        setByCol_(sheet, action.rowNumber, cols.sourceCell, action.sourceCell);
        setByCol_(sheet, action.rowNumber, cols.state, BR_ASSIGN.activeState);
        return;
      }

      if (action.kind === 'replace') {
        setByCol_(sheet, action.oldRowNumber, cols.state, BR_ASSIGN.replacedState);
        setByCol_(
          sheet,
          action.oldRowNumber,
          cols.confirmation,
          BR_ASSIGN.replacementFoundConfirmation
        );
      }
    });

  // Create new Original / Replacement records in first free Assignment ID row.
  plan.actions
    .filter(a => a.kind === 'create' || a.kind === 'replace')
    .forEach(action => {
      const targetRow = nextAssignmentWriteRow_(sheet, cols);

      const isReplacement = action.kind === 'replace';
      const assignmentId = isReplacement
        ? action.newAssignmentId
        : action.assignmentId;

      const record = {
        assignmentId,
        sessionId: action.sessionId,
        facilitatorId: action.facilitatorId,
        role: action.role,
        type: isReplacement ? BR_ASSIGN.replacementType : BR_ASSIGN.originalType,
        confirmation: BR_ASSIGN.defaultConfirmation,
        replacesId: isReplacement ? action.oldAssignmentId : '',
        sourceSheet: action.sourceSheet,
        sourceCell: action.sourceCell,
        notes: '',
        state: BR_ASSIGN.activeState,
      };

      writeAssignmentRecord_(sheet, targetRow, cols, record);
    });

  // Commit allocator only after assignment writes succeed.
  if (plan.allocatorEnd !== plan.allocatorStart) {
    writeAllocator_(
      plan.admin,
      'Assignment',
      plan.allocatorEnd,
      plan.allocatorEnd - 1
    );
  }

  // Replacement red is a transient workflow cue. Only after all register writes
  // and allocator changes succeed do we restore the Pretty Sheet cell to the
  // canonical colour of the Role actually published. This also cleans up a
  // previously published replacement whose red cue was left behind.
  plan.actions
    .filter(a => a.restoreHex && (a.kind === 'replace' || a.kind === 'update' || a.kind === 'recolor'))
    .forEach(action => {
      const rosterSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(action.sourceSheet);
      if (!rosterSheet) throw new Error(`Roster sheet not found: ${action.sourceSheet}`);
      rosterSheet.getRange(action.sourceCell).setBackground(action.restoreHex);
    });

}


/* ---------- HEADER-SAFE ASSIGNMENTS — SYNC ACCESS ---------- */

function assignmentColumns_(sheet) {
  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastCol).getDisplayValues()[0];

  const byName = new Map();
  headers.forEach((h, i) => {
    const key = cleanAssign_(h);
    if (key) byName.set(key, i + 1); // 1-based Sheets column
  });

  const required = {
    id: 'Assignment ID',
    sessionId: 'Session ID',
    facilitatorId: 'Facilitator ID',
    facilitatorName: 'Facilitator Name',
    role: 'Role',
    type: 'Assignment Type',
    confirmation: 'Confirmation',
    notificationSent: 'Notification Sent',
    confirmedAt: 'Confirmed At',
    replacesId: 'Replaces Assignment ID',
    sourceSheet: 'Source Sheet',
    sourceCell: 'Source Cell',
    notes: 'Notes',
    state: 'Assignment State',
  };

  const cols = {};
  Object.entries(required).forEach(([key, header]) => {
    const col = byName.get(header);
    if (!col) {
      throw new Error(
        `Assignments — Sync is missing required header "${header}"`
      );
    }
    cols[key] = col;
  });

  return cols;
}


function readAssignments_(sheet, cols) {
  const maxRows = sheet.getMaxRows();
  if (maxRows < 2) return [];

  // Read only the actual assignment table width.
  const width = sheet.getLastColumn();
  const values = sheet.getRange(2, 1, maxRows - 1, width).getDisplayValues();

  const at = (row, col) => cleanAssign_(row[col - 1]);

  return values
    .map((row, i) => ({
      rowNumber: i + 2,
      assignmentId: at(row, cols.id),
      sessionId: at(row, cols.sessionId),
      facilitatorId: at(row, cols.facilitatorId),
      role: at(row, cols.role),
      type: at(row, cols.type),
      confirmation: at(row, cols.confirmation),
      replacesId: at(row, cols.replacesId),
      sourceSheet: at(row, cols.sourceSheet),
      sourceCell: at(row, cols.sourceCell),
      state: at(row, cols.state) || BR_ASSIGN.activeState,
    }))
    .filter(r => r.assignmentId);
}


function indexCurrentAssignmentsBySource_(rows) {
  const map = new Map();

  rows.forEach(row => {
    if (!row.sourceSheet || !row.sourceCell) return;
    if (row.state !== BR_ASSIGN.activeState) return;

    const key = `${row.sourceSheet}|${row.sourceCell}`;
    const prior = map.get(key);

    if (
      !prior ||
      assignmentNumber_(row.assignmentId) >
        assignmentNumber_(prior.assignmentId)
    ) {
      map.set(key, row);
    }
  });

  return map;
}


function assignmentExactKey_(sessionId, facilitatorId, role) {
  return `${cleanAssign_(sessionId)}|${cleanAssign_(facilitatorId)}|${cleanAssign_(role)}`;
}


function assignmentSessionFacKey_(sessionId, facilitatorId) {
  return `${cleanAssign_(sessionId)}|${cleanAssign_(facilitatorId)}`;
}


function indexActiveAssignmentsBySessionFac_(rows) {
  const map = new Map();

  rows.forEach(row => {
    if (row.state !== BR_ASSIGN.activeState) return;
    if (!row.sessionId || !row.facilitatorId) return;

    const key = assignmentSessionFacKey_(
      row.sessionId,
      row.facilitatorId
    );

    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  });

  return map;
}


function indexActiveAssignmentsBySessionFacRole_(rows) {
  const map = new Map();

  rows.forEach(row => {
    if (row.state !== BR_ASSIGN.activeState) return;
    if (!row.sessionId || !row.facilitatorId || !row.role) return;

    const key = assignmentExactKey_(
      row.sessionId,
      row.facilitatorId,
      row.role
    );

    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  });

  return map;
}


function buildDuplicateFacilitatorProblems_(desiredBySessionFac) {
  const bySession = new Map();

  desiredBySessionFac.forEach((entries, facKey) => {
    if (entries.length <= 1) return;

    const sessionId = entries[0].sessionId;
    const name = entries[0].displayName || entries[0].facilitatorId;
    const cells = entries.map(e => e.sourceCell).join(', ');

    if (!bySession.has(sessionId)) bySession.set(sessionId, []);
    bySession.get(sessionId).push(
      `Duplicate facilitator in ${sessionId}: ${name} appears in ${cells}. ` +
      `Keep one roster cell for this facilitator before publishing.`
    );
  });

  return bySession;
}


function buildDesiredSessionFacIndex_(planning, profile, facMap) {
  const map = new Map();

  profile.rowBlocks.forEach(([startRow, endRow]) => {
    const numRows = endRow - startRow + 1;

    const rowValues = planning
      .getRange(startRow, 1, numRows, profile.publishStateCol)
      .getValues();

    const facRange = planning.getRange(
      startRow,
      profile.facilitatorStartCol,
      numRows,
      profile.facilitatorEndCol - profile.facilitatorStartCol + 1
    );

    const facValues = facRange.getDisplayValues();
    const facBackgrounds = facRange.getBackgrounds();

    for (let offset = 0; offset < numRows; offset++) {
      const row = rowValues[offset];
      if (row[profile.publishCol - 1] !== true) continue;

      const publishState = cleanAssign_(row[profile.publishStateCol - 1]);
      if (publishState.startsWith('Excluded')) continue;

      const sessionId = cleanAssign_(row[profile.sessionIdCol - 1]);
      if (!/^BR-S-\d{6}$/.test(sessionId)) continue;

      const sheetRow = startRow + offset;

      for (
        let col = profile.facilitatorStartCol;
        col <= profile.facilitatorEndCol;
        col++
      ) {
        const localCol = col - profile.facilitatorStartCol;
        const displayName = cleanAssign_(facValues[offset][localCol]);
        if (!displayName) continue;

        const hex = normalizeHex_(facBackgrounds[offset][localCol]);

        // Red means replacement workflow and must not be inferred as a move.
        if (hex === BR_ASSIGN.replacementHex) continue;

        const role = BR_ASSIGN.roleByHex[hex];
        if (!role) continue;

        const facilitator = facMap.get(normalizeName_(displayName));
        if (!facilitator) continue;

        const cellA1 = planning.getRange(sheetRow, col).getA1Notation();
        const sourceKey = `${planning.getName()}|${cellA1}`;
        const facKey = assignmentSessionFacKey_(
          sessionId,
          facilitator.id
        );

        if (!map.has(facKey)) map.set(facKey, []);
        map.get(facKey).push({
          sourceKey,
          sourceSheet: planning.getName(),
          sourceCell: cellA1,
          sessionId,
          facilitatorId: facilitator.id,
          displayName,
          role,
        });
      }
    }
  });

  return map;
}


function buildDesiredExactMoveIndex_(planning, profile, facMap) {
  const map = new Map();

  profile.rowBlocks.forEach(([startRow, endRow]) => {
    const numRows = endRow - startRow + 1;

    const rowValues = planning
      .getRange(startRow, 1, numRows, profile.publishStateCol)
      .getValues();

    const facRange = planning.getRange(
      startRow,
      profile.facilitatorStartCol,
      numRows,
      profile.facilitatorEndCol - profile.facilitatorStartCol + 1
    );

    const facValues = facRange.getDisplayValues();
    const facBackgrounds = facRange.getBackgrounds();

    for (let offset = 0; offset < numRows; offset++) {
      const row = rowValues[offset];
      if (row[profile.publishCol - 1] !== true) continue;

      const publishState = cleanAssign_(row[profile.publishStateCol - 1]);
      if (publishState.startsWith('Excluded')) continue;

      const sessionId = cleanAssign_(row[profile.sessionIdCol - 1]);
      if (!/^BR-S-\d{6}$/.test(sessionId)) continue;

      const sheetRow = startRow + offset;

      for (
        let col = profile.facilitatorStartCol;
        col <= profile.facilitatorEndCol;
        col++
      ) {
        const localCol = col - profile.facilitatorStartCol;
        const displayName = cleanAssign_(facValues[offset][localCol]);
        if (!displayName) continue;

        const hex = normalizeHex_(facBackgrounds[offset][localCol]);

        // Red is replacement workflow, not a stable Role, so it is deliberately
        // excluded from exact-move inference.
        if (hex === BR_ASSIGN.replacementHex) continue;

        const role = BR_ASSIGN.roleByHex[hex];
        if (!role) continue;

        const facilitator = facMap.get(normalizeName_(displayName));
        if (!facilitator) continue;

        const cellA1 = planning.getRange(sheetRow, col).getA1Notation();
        const sourceKey = `${planning.getName()}|${cellA1}`;
        const exactKey = assignmentExactKey_(
          sessionId,
          facilitator.id,
          role
        );

        if (!map.has(exactKey)) map.set(exactKey, []);
        map.get(exactKey).push({
          sourceKey,
          sourceSheet: planning.getName(),
          sourceCell: cellA1,
          sessionId,
          facilitatorId: facilitator.id,
          role,
        });
      }
    }
  });

  return map;
}



function indexRemovedAssignmentsBySource_(rows) {
  const map = new Map();

  rows.forEach(row => {
    if (!row.sourceSheet || !row.sourceCell) return;
    if (row.state !== BR_ASSIGN.removedState) return;

    const key = `${row.sourceSheet}|${row.sourceCell}`;
    const prior = map.get(key);

    // If a slot has been removed more than once over its lifetime, only the
    // most recently issued Removed BR-A is eligible for exact restoration.
    if (
      !prior ||
      assignmentNumber_(row.assignmentId) >
        assignmentNumber_(prior.assignmentId)
    ) {
      map.set(key, row);
    }
  });

  return map;
}


function nextAssignmentWriteRow_(sheet, cols) {
  const values = sheet
    .getRange(2, cols.id, sheet.getMaxRows() - 1, 1)
    .getDisplayValues();

  for (let i = 0; i < values.length; i++) {
    if (!cleanAssign_(values[i][0])) return i + 2;
  }

  sheet.insertRowAfter(sheet.getMaxRows());
  return sheet.getMaxRows();
}


function writeAssignmentRecord_(sheet, row, cols, record) {
  // Deliberately DO NOT write Facilitator Name; that is display-only formula data.
  setByCol_(sheet, row, cols.id, record.assignmentId);
  setByCol_(sheet, row, cols.sessionId, record.sessionId);
  setByCol_(sheet, row, cols.facilitatorId, record.facilitatorId);
  setByCol_(sheet, row, cols.role, record.role);
  setByCol_(sheet, row, cols.type, record.type);
  setByCol_(sheet, row, cols.confirmation, record.confirmation);
  setByCol_(sheet, row, cols.notificationSent, '');
  setByCol_(sheet, row, cols.confirmedAt, '');
  setByCol_(sheet, row, cols.replacesId, record.replacesId);
  setByCol_(sheet, row, cols.sourceSheet, record.sourceSheet);
  setByCol_(sheet, row, cols.sourceCell, record.sourceCell);
  setByCol_(sheet, row, cols.notes, record.notes);
  setByCol_(sheet, row, cols.state, record.state);
}


function setByCol_(sheet, row, col, value) {
  sheet.getRange(row, col).setValue(value);
}


/* ---------- FACILITATOR LOOKUP ---------- */

function buildFacilitatorDirectory_(facMaster) {
  const lastRow = facMaster.getLastRow();
  if (lastRow < 2) return new Map();

  // A:G = External ID ... Facilitation Roles.
  const values = facMaster.getRange(2, 1, lastRow - 1, 7).getDisplayValues();
  const map = new Map();
  const duplicates = new Set();

  values.forEach(row => {
    const id = cleanAssign_(row[0]);
    const display = cleanAssign_(row[3]);
    if (!id || !display) return;

    const roles = parseFacilitatorRoles_(row[6]);
    const key = normalizeName_(display);

    if (map.has(key) && map.get(key).id !== id) duplicates.add(key);
    map.set(key, {id, display, roles});
  });

  duplicates.forEach(k => map.delete(k));
  return map;
}


function parseFacilitatorRoles_(value) {
  return cleanAssign_(value)
    .split(',')
    .map(v => cleanAssign_(v))
    .filter(Boolean);
}


function resolveReplacementRole_(originalRole, allowedRoles, displayName, cellA1) {
  const roles = [...new Set((allowedRoles || []).map(cleanAssign_).filter(Boolean))];

  if (!roles.length) {
    return {
      problem:
        `${cellA1}: replacement facilitator "${displayName}" has no Facilitation Roles in FacMaster; ` +
        `set their capability before publishing the replacement`,
    };
  }

  // Best case: replacement is qualified to perform the original assignment Role.
  if (roles.includes(originalRole)) {
    return {role: originalRole, notice: ''};
  }

  // If capability is unambiguous, use the replacement facilitator's actual Role.
  // This is Jessica's case: original = Facilitate, Jessica = L-Plate.
  if (roles.length === 1) {
    return {
      role: roles[0],
      notice:
        `${cellA1}: "${displayName}" cannot inherit ${originalRole}; ` +
        `replacement Role resolved from FacMaster as ${roles[0]}. ` +
        `Add any required support assignment manually before publishing.`,
    };
  }

  // Multiple alternative capabilities require human judgement; the system must
  // not invent which Role the replacement will perform.
  return {
    problem:
      `${cellA1}: "${displayName}" cannot inherit ${originalRole} and has multiple allowed Roles ` +
      `[${roles.join(', ')}]. Choose the operational Role before publishing; ` +
      `add any required support assignment manually.`,
  };
}


/* ---------- ALLOCATOR ---------- */

function readAllocatorNext_(admin, entityType) {
  const lastRow = admin.getLastRow();
  const values = admin
    .getRange(2, 1, Math.max(1, lastRow - 1), 6)
    .getValues();

  for (let i = 0; i < values.length; i++) {
    if (cleanAssign_(values[i][0]) === entityType) {
      const next = Number(values[i][3]);

      if (!Number.isInteger(next) || next < 1) {
        throw new Error(`${entityType} allocator Next Number is invalid`);
      }

      return next;
    }
  }

  throw new Error(`${entityType} allocator row not found in SysAdmin`);
}


function writeAllocator_(admin, entityType, nextNumber, lastIssuedNumber) {
  const lastRow = admin.getLastRow();
  const values = admin
    .getRange(2, 1, Math.max(1, lastRow - 1), 6)
    .getValues();

  for (let i = 0; i < values.length; i++) {
    if (cleanAssign_(values[i][0]) === entityType) {
      const row = i + 2;
      admin.getRange(row, 4).setValue(nextNumber);
      admin.getRange(row, 5).setValue(formatAssignmentId_(lastIssuedNumber));
      return;
    }
  }

  throw new Error(`${entityType} allocator row not found in SysAdmin`);
}


/* ---------- GENERAL HELPERS ---------- */

function formatAssignmentId_(n) {
  return `BR-A-${String(n).padStart(6, '0')}`;
}


function assignmentNumber_(id) {
  const m = /^BR-A-(\d{6})$/.exec(cleanAssign_(id));
  return m ? Number(m[1]) : -1;
}


function normalizeHex_(value) {
  return cleanAssign_(value).toLowerCase();
}


function normalizeName_(value) {
  return cleanAssign_(value)
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/\s+/g, ' ');
}


function cleanAssign_(value) {
  return value == null ? '' : String(value).trim();
}


function requireSheet_(ss, name) {
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error(`Required sheet not found: ${name}`);
  return sheet;
}

/* ---------- ROLE KEY CELL BUTTONS ---------- */

const BR_ROLE_BUTTONS = Object.freeze({
  sheets: {
    'Sem2_2026': {keyRows: [14, 30]},
    'Sem1_2027': {keyRows: [18, 38]},
    'Sem2_2027': {keyRows: [18, 38]},
  },
  hexByLabel: {
    'Lead/Announce': '#ffd966',
    'Newcomers': '#a4c2f4',
    'Facilitate': '#b6d7a8',
    'L Plates': '#f6b26b',
    'Support': '#d5a6bd',
    'Replacement': '#e06666',
  },
  targetSheetProperty: 'BR_ROLE_TARGET_SHEET',
  targetRangeProperty: 'BR_ROLE_TARGET_RANGE',
});

/**
 * Turns the existing role-key cells into buttons.
 * 1. Select one or more facilitator cells within a single location block.
 * 2. Click a role-key cell.
 * 3. The selected cells receive that canonical Role colour.
 *
 * Reload the spreadsheet once after installing this trigger.
 */
function onSelectionChange(e) {
  if (!e || !e.range) return;

  try {
    const clicked = e.range;
    const sheet = clicked.getSheet();
    const sheetName = sheet.getName();
    const profile = BR_ASSIGN.planningProfiles[sheetName];
    const buttonProfile = BR_ROLE_BUTTONS.sheets[sheetName];
    if (!profile || !buttonProfile) return;

    const props = PropertiesService.getUserProperties();
    const isSingleCell =
      clicked.getNumRows() === 1 && clicked.getNumColumns() === 1;
    const isButtonRow = buttonProfile.keyRows.includes(clicked.getRow());

    if (isSingleCell && isButtonRow) {
      const label = cleanAssign_(clicked.getDisplayValue());
      const roleHex = BR_ROLE_BUTTONS.hexByLabel[label];
      if (!roleHex) return;

      const targetSheetName = props.getProperty(
        BR_ROLE_BUTTONS.targetSheetProperty
      );
      const targetA1 = props.getProperty(
        BR_ROLE_BUTTONS.targetRangeProperty
      );

      if (targetSheetName !== sheetName || !targetA1) {
        SpreadsheetApp.getActive().toast(
          'Select facilitator cells first, then click a Role button.',
          'Role Buttons',
          5
        );
        return;
      }

      const target = sheet.getRange(targetA1);
      if (!isFacilitatorSelection_(target, profile)) {
        clearRoleButtonTarget_(props);
        SpreadsheetApp.getActive().toast(
          'The remembered selection is no longer a valid facilitator range.',
          'Role Buttons',
          5
        );
        return;
      }

      target.setBackground(roleHex);
      target.activate();
      SpreadsheetApp.flush();
      return;
    }

    if (isFacilitatorSelection_(clicked, profile)) {
      props.setProperty(BR_ROLE_BUTTONS.targetSheetProperty, sheetName);
      props.setProperty(BR_ROLE_BUTTONS.targetRangeProperty, clicked.getA1Notation());
    }
  } catch (err) {
    SpreadsheetApp.getActive().toast(
      `Role button error: ${err.message}`,
      'Role Buttons',
      6
    );
  }
}

function isFacilitatorSelection_(range, profile) {
  const startCol = range.getColumn();
  const endCol = range.getLastColumn();
  if (
    startCol < profile.facilitatorStartCol ||
    endCol > profile.facilitatorEndCol
  ) return false;

  const startRow = range.getRow();
  const endRow = range.getLastRow();
  return profile.rowBlocks.some(
    ([blockStart, blockEnd]) =>
      startRow >= blockStart && endRow <= blockEnd
  );
}

function clearRoleButtonTarget_(props) {
  props.deleteProperty(BR_ROLE_BUTTONS.targetSheetProperty);
  props.deleteProperty(BR_ROLE_BUTTONS.targetRangeProperty);
}
