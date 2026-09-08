Below is the architecture extraction I would use as the basis for the Master Architecture document. I have separated settled architecture, settled operational logic, edge-case rulings, naming/vocabulary, rejected approaches, and items that were deliberately left unresolved. I have also distinguished decisions from things that were merely tested or discussed.

Master Architecture — Final Technical Decisions and Logic
1. Foundational system principles
The system is a Google ↔ Notion facilitation management architecture, initially centred on the Bible Reading programme but deliberately capable of representing facilitation more broadly.
The architecture must be native-first:
use Google-native features for Google-side operations wherever possible;
use Notion-native features for Notion-side operations wherever possible;
use n8n only where cross-platform transport or genuinely missing native functionality requires it.
Google must remain capable of operating if:
Notion is disconnected;
n8n is unavailable;
the cross-platform sync is deliberately disabled.
Notion does not have to duplicate every Google feature.
Google does not have to duplicate every Notion feature.
What must be shared is the common operational truth:
facilitator identity;
session identity;
assignment identity;
roles;
lifecycle state where relevant.
The architecture therefore aims for platform independence without artificial feature symmetry.
Operator usability is a first-class design requirement:
preserve the Senior Pastor / roster operator's intuitive Pretty Roster workflow;
avoid turning the Pretty Roster into a database-looking administrative interface;
preserve free-form planning as far as it is operationally safe.
The governing operator principle accepted during testing was:
maximise operator flexibility; minimise rules.
Restrictions should be introduced only where an ambiguity is genuinely dangerous.
Edge cases should be tested before operator behaviour is prohibited.
The system should never infer semantic meaning merely from layout when a reliable semantic record can be created instead.
Historical evidence is valuable, but historical completeness is not an excuse to reconstruct low-value data for its own sake.
Privacy/minimum-necessary-data is part of the architecture:
the Bible facilitation system should not acquire unnecessary personal/contact information merely because it exists upstream.
Human-facing surfaces and system/helper surfaces should be visibly distinguishable.
Derived/helper data must never quietly become a second source of truth.
2. Canonical conceptual data model
The core conceptual chain is:
Programme / Reading Item → Session Occurrence → Facilitation Assignment.
In the Bible Reading operational stream:
a reusable reading/content item exists independently of a particular evening;
a Session is one occurrence of the operational programme;
a Facilitation Assignment is one facilitator serving in one role for one Session.
The assignment is the correct place for the per-session role.
Facilitator capability and per-session assignment are deliberately separated:
Team Member / Facilitator record = what the person is capable of doing;
Assignment = what the person is actually doing on a particular session.
Replacement is not a role:
Replacement is an Assignment Type / workflow condition;
Lead / Announce, Facilitate, L-Plate, etc. are roles.
This explicitly rejected the earlier conceptual tendency to let roster position or replacement colour act as the permanent definition of the person's role.
The Notion Facilitation Assignments database is broader than the Bible Reading Pretty Roster.
Therefore:
every Bible Reading BR-A is a Facilitation Assignment;
not every Facilitation Assignment necessarily originates in the Bible Reading roster.
Facilitator Coaching is the key accepted example of a facilitated activity that may use Facilitation Assignments without belonging on the Bible Reading Pretty Roster.
Vision Casting became the key example of a non-reading event that nevertheless does belong to the Bible Reading operational facilitation stream because it replaced normal Bible Reading evenings and used the normal facilitator team and role structure.
3. Authority model
Google is the allocation authority for portable external facilitator IDs.
Google also became the operational allocation authority for:
Session external IDs (BR-S);
Assignment external IDs (BR-A).
Notion stores these external IDs rather than inventing competing portable identifiers.
Notion may retain its own internal native IDs, but those are not the cross-system identity.
Cross-platform records should match on stable system-neutral external IDs, not titles, row positions, or display names.
The accepted external ID namespaces are:
BR-F-000001 etc. — Facilitator;
BR-S-000001 etc. — Session;
BR-A-000001 etc. — Assignment.
Once issued, BR-F, BR-S and BR-A IDs are intended to be immutable.
A normal correction to a Session or Assignment does not create a new identity merely because editable attributes change.
An Assignment's source cell is provenance, not its identity.
A Session change, however, is materially different for an Assignment: an Assignment belongs to a specific Session.
No reverse Notion → Google authority should be introduced merely to keep ID sequences aesthetically aligned.
IDs do not have to be chronological once retrospective records are appended.
Immutable identifiers take precedence over perfect numeric chronology.
4. Google workbook architecture
Development and acceptance work is done in the SAFE Copy, not directly in the live roster.
Current SAFE Copy:
SAFE Copy of Bible Facilitation Roster@20260903.
The live roster remains protected from architectural experimentation.
The live workbook should not be modified unless a tested feature is explicitly promoted.
The active Google structure evolved into:
Front Page
Sem2_2026
Sem1_2026
FacilitatorLists
FacMaster
FacIntake
Sessions — Sync
Assignments — Sync
SysAdmin
Easter_Retreat_2026
SG Min Team
historical/archive sheets as applicable.
The previous SOURCE intake/helper sheet was removed once the cleaner intake architecture was established.
The previous Facilitators_Available helper/master ambiguity was eliminated.
The accepted facilitator flow is:
Church Master → FacIntake → FacMaster → FacilitatorLists → Pretty Roster.
The Pretty Roster remains the primary human planning/operation surface.
FacMaster is the Bible-facilitation operational master for facilitator records.
FacilitatorLists is a derived helper surface, not a person master.
FacilitatorLists produces location-specific dropdown lists such as:
Tuesday;
Thursday;
Singapore.
Pretty Roster facilitator dropdowns are driven from those derived lists.
Operators should not maintain names independently inside FacilitatorLists.
A new Front Page was created deliberately as a human-readable operational guide.
The Front Page records:
system flow;
sheet responsibilities;
role-colour vocabulary;
operator rules;
source-of-truth boundaries;
the meaning of Item;
the distinction between helper and authoritative sheets.
The Front Page is intentionally a concise operating guide rather than the final full technical manual.
A fuller professional documentation layer remains desirable later.
5. Facilitator intake and master architecture
The facilitator intake mechanism must be separate from the operational master.
Upstream church data is not edited into the roster manually as the primary workflow.
New/changed facilitator source data enters through FacIntake.
FacMaster is the cleaned operational record used by Bible facilitation.
The accepted baseline/checkpoint mechanism protects intake from processing source rows that appear after the run began.
The intake script uses a document lock.
It takes a run-start checkpoint.
Rows newer than the run start are excluded from that run.
Timestamp handling was hardened to cope with:
proper Date values;
coercible timestamps;
old free-text timestamp noise.
The accepted intake script uses batch writes rather than row-at-a-time writes.
The authoritative restored intake script is the user's recovered facintake_sync_v2_complete(1).gs, not an assistant reconstruction.
The normal menu functions are:
previewFacIntakeRefresh
refreshFacIntake
Chronological backfill functions are deliberately not exposed as ordinary menu actions.
The combined Google menu is Bible Facilitation.
That menu groups:
Intake Preview/Refresh;
Session Preview/Publish;
Assignment Preview/Publish.
Sessions and Assignments scripts do not independently create their own onOpen() menus.
Facilitator source data is filtered to minimum operational need.
Personal/contact fields should not proliferate simply because the upstream church database contains them.
6. Facilitator lifecycle model
Facilitator lifecycle became explicit rather than relying on a single Boolean Active field.
Accepted lifecycle vocabulary:
Prospective
Invited
Developing
Active
Paused
Stepped Down
Left
Retired
Roster eligibility is derived from lifecycle/active state rather than deletion.
Historical facilitators are retained so old assignments remain resolvable.
Inactive facilitators should not remain in ordinary current dropdowns.
A facilitator can therefore be:
retained historically;
not currently roster-eligible.
Signup timestamp and Live Date were explicitly separated:
signup/intake time is about when information arrived;
Live Date is about operational participation.
Availability windows may be retained:
Available From
Available Until.
Current/historical facilitator records BR-F-000027 through BR-F-000032 were added to resolve 2026 history:
John Yang — Retired;
Alvin Tan — Left;
Sean Beh — Stepped Down;
Chyi Tan — Active;
Abhra Bhattacharjee — Left;
Ken Ng — Paused.
These records remain even when not current, because deleting them would break historical Assignment resolution.
7. FacMaster data structure
Final working columns include:
Facilitator External ID;
First Name;
Last Name;
Display Name;
Active?;
Sites;
Facilitation Roles;
Email;
Contact Number;
Live Date;
Review Notes;
Match Key;
Facilitator Status;
Available From;
Available Until.
Display Name is the human-facing roster value.
Match Key supports deterministic identity matching rather than fragile display-name comparisons.
Sites controls roster availability by stream.
Facilitation Roles represents capability, not a specific-session assignment.
8. Role vocabulary
Canonical structured role names are:
Lead / Announce
Newcomer Support
Facilitate
L-Plate
L-Plate Support
The helper/visual key historically used shorter labels:
Lead/Announce
Newcomers
Facilitate
L Plates
Support
Replacement
Structured sync values use the canonical role names, not the loose visual labels.
Replacement is explicitly not one of the canonical roles.
Dinner and other miscellaneous event-specific responsibilities are not being added to this facilitation-role model merely because a historical Singapore sheet happened to contain such a column.
That was explicitly rejected as premature scope expansion.
9. Role-colour semantics
Pretty Roster cell colours carry operational role meaning.
The structured Assignment publisher resolves the role represented by those colours.
Accepted role-colour contract includes:
Lead / Announce;
Newcomer Support;
Facilitate;
L-Plate;
L-Plate Support.
Replacement red has separate semantics:
red is a temporary workflow cue;
red is not the final permanent role.
After a replacement is successfully published, the cell should return to the canonical actual-role colour.
Completed sessions use grey on the Date cell only.
Completed status must not wipe out the facilitator role colours.
This explicitly rejected greying the whole session row in a way that destroys historical role evidence.
10. Session publication model
Free planning is separated from formal Session publication.
A Pretty Roster row can exist before it becomes an operational Session.
Publication turns a planning row into a first-class structured Session.
Minimum handover facts are:
Date;
Location/day stream.
Reading Item is useful but is not the identity of the Session.
A published Session gets an immutable BR-S.
Session external IDs are allocated in Google.
Session IDs use zero-padded sequential form:
BR-S-000001.
Publish? is a checkbox/gate.
Ticking the checkbox alone does not itself constitute silent publication.
Publication is a deliberate batch action through:
Preview Approved Sessions
Publish Approved Sessions.
The publisher validates before allocation.
Existing Session IDs are preserved.
Duplicate publication is blocked/avoided.
Excluded/non-operational rows do not receive IDs unless intentionally brought into scope.
Publish State records the handover status.
Historical backfill and normal prospective publishing are separate operational modes.
The permanent 2026 initial Session backfill created:
BR-S-000001 through BR-S-000060.
The next allocator after that backfill was 61.
The three Vision Casting sessions were later intentionally admitted and published as:
BR-S-000061 — 4 Aug 2026 Tuesday;
BR-S-000062 — 6 Aug 2026 Thursday;
BR-S-000063 — 13 Aug 2026 Singapore.
Existing BR-S-000001–060 were not renumbered to force Vision Casting back into chronological numeric order.
Retrospective append is acceptable; identifier immutability wins over chronology.
11. Meaning of BR-S after the Vision Casting decision
The original intuitive meaning of BR-S as “Bible Reading Session” was refined.
Final operational interpretation:
BR-S identifies a Session occupying the Bible Reading facilitation operational stream.
It does not strictly mean “a session containing a Bible reading unit”.
This allows Vision Casting to have BR-S IDs because those evenings:
replaced normal Bible Reading evenings;
occupied the same roster slot;
used the normal facilitation team;
used normal facilitation roles.
Facilitator Coaching does not automatically qualify for BR-S merely because it is facilitated.
Coaching remains outside the Bible Reading operational stream unless later deliberately brought into it.
Thus the settled distinction is:
ordinary Bible Reading → BR-S;
Vision Casting replacing ordinary Bible Reading → BR-S;
separate Facilitator Coaching → general Notion Event Instance / Facilitation Assignment, no BR-S by default.
12. Item naming decision
The Pretty Roster human-facing header was changed from Reading Unit to Item.
Item was preferred over Programme Item because it is:
shorter;
less bureaucratic;
broad enough for ordinary readings and Vision Casting.
Examples that fit naturally under Item:
Acts 27
Ruth 1:1–22
Esther 3:1–4:17
Vision Casting.
Notion may continue to use the more formal conceptual term Programme Item.
Google and Notion labels need not be identical if their semantics remain clear.
The current Session publisher was verified to read Pretty Roster column R by position, not by visible header name.
Therefore changing the visible Pretty Roster header to Item did not break Session publication.
The Assignment publisher likewise does not use the Pretty Roster Item header for its assignment logic.
Header-name sensitivity still matters in structured sync sheets such as Assignments — Sync.
Therefore structured sync-table headers should not be casually renamed without checking the script.
13. Sessions — Sync structure
Structured Session handover table columns:
Session ID
Date
Location
Reading Unit / item value
Session Status
The sync sheet is a system-facing structured layer, not the main planning surface.
It exists so automation does not have to interpret the whole visual Pretty Roster.
Session Status vocabulary includes:
Scheduled
Completed.
Historical and future rows coexist in this structured layer.
Vision Casting is now represented in the same Session structure rather than in a separate exceptional table.
14. Assignment publication model
A Facilitation Assignment is one row per:
Session;
Facilitator;
Role.
Each structured Assignment receives a BR-A.
Assignment identity is independent of Pretty Roster cell position.
Normal actions are initiated through:
Preview Approved Assignments
Publish Approved Assignments.
The normal publisher works on the active supported semester sheet only.
It does not sweep both Sem1 and Sem2 every time.
Historical chronological backfill is a separate function/process.
The initial permanent chronological 2026 backfill allocated:
BR-A-000001 through BR-A-000191.
Subsequent ordinary operations extended the namespace.
After replacement/support additions and Vision Casting, the SAFE Copy had reached at least:
BR-A-000205.
The Assignment publisher is designed to be repeat-safe/idempotent.
Clean repeat previews should show no unintended Create/Update/Remove after successful publication.
15. Assignments — Sync structure
Final working columns are:
Assignment ID
Session ID
Facilitator ID
Facilitator Name
Role
Assignment Type
Confirmation
Notification Sent
Confirmed At
Replaces Assignment ID
Source Sheet
Source Cell
Notes
Assignment State
Facilitator Name is display-oriented; identity is Facilitator ID.
Source Sheet and Source Cell are provenance.
Neither Source Sheet nor Source Cell defines Assignment identity.
Replaces Assignment ID holds the external BR-A of the replaced Assignment.
Replacement does not overwrite the original Assignment.
Old and replacement Assignment records can therefore coexist as history.
16. Assignment state vocabulary
Canonical Assignment Type:
Original
Replacement.
Canonical Assignment State:
Active
Replaced
Removed.
Canonical Confirmation/workflow values:
Not Requested
Awaiting Confirmation
Confirmed
Seeking Replacement
Replacement Found
No Response.
Earlier wording such as “Please Replace” was superseded by the more operational Seeking Replacement.
Replacement Found is a workflow outcome, not an Assignment State.
Replaced is the lifecycle state of the old Assignment after a replacement takes over.
17. Ordinary Assignment correction rule
If the same real Assignment is merely corrected:
preserve the existing BR-A.
Examples:
role colour corrected;
source cell changed;
facilitator moved to another slot within the same Session.
A correction should not be misrepresented as an entirely new historical Assignment.
This was accepted through multiple live SAFE Copy tests.
18. Assignment removal / soft archive rule
Clearing a facilitator from a previously published roster cell should not delete the BR-A record.
The Assignment is retained and marked:
Assignment State = Removed.
This preserves historical identity.
Hard deletion is not the ordinary removal behaviour.
Re-entering the exact same Assignment can reactivate the same BR-A under the accepted narrow rule.
19. Narrow reactivation rule
If an Assignment was Removed and the desired roster state later exactly restores:
same Source Sheet;
same Source Cell;
same Facilitator ID;
same Role;
same Session;
then reactivate the same BR-A.
Do not allocate a new Assignment ID for that exact restoration.
This was specifically added after an earlier script version incorrectly previewed Create: 1 for a restoration.
Material changes outside that narrow equality do not automatically use the same reactivation rule.
20. Flexible same-Session movement rule
Source Cell is not identity.
A facilitator may move within the same Session without losing BR-A identity when intent is unambiguous.
Accepted examples:
one-person move;
two-person swap;
multiple simultaneous moves;
move plus Role correction;
paired L-Plate / Support rearrangements.
The final script family evolved specifically to support this flexibility rather than imposing “never move people around.”
This was an explicit logic shift away from source-cell identity.
The guiding principle became semantic matching by:
Session;
Facilitator;
role/intent;
with source cell retained only as provenance.
21. Same-Session move + Role change
If the same facilitator remains in the same Session but moves and their role changes, the system may preserve the BR-A where the intended correspondence is unambiguous.
This behaviour was implemented in the v6 logic and retained in v7.
The correct result is an Update, not Create+Remove.
22. Duplicate facilitator ambiguity guard
One facilitator appearing in more than one desired roster cell for the same Session is treated as an ambiguity.
The publisher must not guess which cell represents the existing Assignment or whether the person has two intended roles.
Current accepted rule:
duplicate same facilitator within one Session = Problem;
no mutation for that Session until the operator resolves it.
The entire affected Session is skipped rather than partially mutating it.
The v7 publisher added this explicit duplicate guard.
This fixed a v6 behaviour that could create an extra Assignment incorrectly.
Dual-role-per-person-per-Session remains a possible future design question, but is not currently supported by inferring two cells.
The present operational rule is therefore effectively:
one facilitator once per Session.
23. Cross-Session movement boundary
Moving a facilitator from Session A to Session B is not a within-Assignment move.
Session is part of Assignment meaning.
Therefore the correct behaviour is:
old Assignment → Removed;
destination Session → new Assignment with new BR-A.
The system must not preserve BR-A across Sessions merely because the facilitator and role happen to be the same.
This was explicitly tested and accepted.
A test produced:
Create: 1
Remove: 1
Problems: 0
and this was declared correct.
24. Cross-Session accidental duplicate protection
If an operator leaves the facilitator in Session A and also introduces the same facilitator ambiguously in Session B, the destination ambiguity should block rather than create misleading state.
A test produced:
source Remove;
destination duplicate Problem.
This was treated as desirable safe behaviour.
25. Replacement workflow
A genuine replacement is materially different from an ordinary edit.
The old Assignment is retained.
The old Assignment becomes:
Assignment State = Replaced.
A new BR-A is created for the replacement person.
New Assignment:
Assignment Type = Replacement.
Replaces Assignment ID points to the original BR-A.
The old Assignment's Confirmation may become:
Replacement Found.
The red cell is a workflow trigger/cue, not the actual role.
The system checks the replacement facilitator's allowed capabilities.
If the original role is a valid capability for the replacement:
preserve that role.
If the original role is invalid but the replacement has exactly one viable role:
the publisher may resolve it deterministically.
If several valid role alternatives exist:
do not guess;
block for human resolution.
Required support is not invented.
If a replacement can serve only with support:
support must be represented as a separate explicit Assignment;
the system does not silently add a support person.
After publication:
the replacement cell should use the actual role colour, not remain permanently red.
Recovery logic was accepted so a partially/stale previously-published red replacement does not generate duplicate records.
26. L-Plate and support semantics
L-Plate and L-Plate Support are independent Assignments.
The system does not currently encode a formal “supports whom” relation.
Visual pairing may help humans but is not required for structural validity.
Pair rearrangements can occur without destroying BR-A identity where the same Session/person intention is clear.
A support Assignment must be explicitly present; it is not inferred merely because an L-Plate exists.
Specific accepted correction example:
BR-S-000053 corrected Mike G to L-Plate;
added support Assignments for Jessica and Mike G;
preview correctly showed Create: 2, Update: 1, no replacement and no problems.
27. Assignment script evolution
Important accepted versions:
v3 — replacement capability-aware;
v4 — narrow Removed Assignment reactivation;
v5 — flexible pure source-cell moves;
v6 — move + Role flexibility;
v7 — duplicate facilitator guard.
Current accepted baseline is v7.
v7 retains:
replacement handling;
capability checks;
reactivation;
same-Session moves;
move + Role correction;
multiple rearrangements.
v7 adds the per-Session duplicate-person guard.
The script should be amended from the exact current v7 source rather than reconstructed from memory.
There is no direct bound-Apps-Script connector in the architecture.
Script installation remains a user paste/deploy action.
The assistant should never claim that a bound Apps Script was directly installed remotely when it was only provided as code.
28. Stream-independence acceptance
The same Assignment logic was tested across:
Tuesday;
Thursday;
Singapore.
Accepted operational test included:
Tuesday within-row move;
Thursday Role correction;
Singapore new Assignment.
All three behaved correctly.
No separate stream-specific Assignment architecture was required.
29. Vision Casting — original treatment
Vision Casting rows originally existed on the Pretty Roster but had been deliberately excluded from Session publication.
The Session publisher explicitly blocked rows whose Publish State began with Excluded.
Therefore simply ticking Publish? while they remained Excluded would not publish them.
The issue was not absence of a Pretty Roster row.
It was the intentional exclusion state.
30. Vision Casting — final treatment
Once it was confirmed that Vision Casting:
replaced normal Bible Reading evenings;
occupied existing Pretty Roster rows;
used ordinary facilitation roles;
used the regular facilitator team;
the final decision was to bring those rows into the ordinary operational Session model.
No special Session script was written.
No separate manual Session table was created.
No one-off hard-coded IDs were manually typed.
Instead:
remove/change the exclusion state on those three rows;
use the existing Session Preview;
verify three new Sessions and zero problems;
use the ordinary publisher.
This successfully created BR-S-000061 to BR-S-000063.
Assignment publication was then tested normally against one of those Sessions.
Preview returned:
Checked sessions: 1
Create: 4
Update: 0
Replace: 0
Remove: 0
No change: 4
Problems: 0.
It was then published successfully.
The other Vision Casting rows were also published successfully.
Their final Assignment IDs include:
BR-A-000196–199 for BR-S-000061;
BR-A-000200–202 for BR-S-000062;
BR-A-000203–205 for BR-S-000063.
This proved that no special Assignment path was required either.
Final conclusion:
Vision Casting is absorbed into the ordinary BR-S / BR-A architecture;
no publisher rewrite required.
31. Explicitly rejected Vision Casting approaches
Rejected:
inventing an entirely separate Vision Casting sync model.
Rejected:
rewriting Session publication solely to support three historical rows.
Rejected:
rewriting Assignment publication solely for Vision Casting.
Rejected:
creating BR-A records without corresponding BR-S Sessions.
Rejected:
using Notion as reverse authority to create Google records simply to keep ID numbering aligned.
Rejected:
renumbering already-issued BR-S IDs to regain chronological purity.
Rejected:
blindly converting legacy Group Leads into Facilitate without evidence.
In the end those conversions became unnecessary because the Pretty Roster itself provided the actual role-colour evidence.
32. Facilitator Coaching scope decision
Facilitator Coaching is a genuine facilitated activity.
It may involve part of the facilitator team.
It does not belong on the main Bible Reading Pretty Roster merely because facilitators are involved.
It may become more regular later.
Its data should be representable in Notion through the broader Facilitation Assignment model.
It does not currently need BR-S / BR-A merely for consistency with Bible Reading.
This preserves the distinction between:
facilitation as a general domain;
Bible Reading facilitation operational stream.
33. Notion Journey Event Instances model
Journey Event Instances remains the record of what event/session actually happened or is scheduled.
Relevant fields include:
Event Instance title;
Event Date;
Category;
Instance Status;
Programme Item;
Team Location;
Session External ID;
Facilitation Assignments;
legacy Event Lead;
legacy Group Leads.
Session External ID stores the BR-S portable ID.
The Event Instance should be matched by stable Session External ID once assigned, rather than relying on date/title matching forever.
Categories include broader event types:
Bible Reading;
Prayer;
Socials;
Ministry Team Gathering;
Facilitator Coaching;
Retreat;
Vision Casting.
Category and BR-S namespace are related but not identical concepts.
An Event Instance can exist without BR-S.
Vision Casting Event Instances should now receive their new BR-S values.
Facilitator Coaching Event Instances may remain without BR-S.
34. Notion Team Members role
Notion Team Members stores the Notion-side facilitator identity/capability record.
Facilitator External ID stores BR-F.
Capability fields include:
Available;
Facilitation Roles;
Facilitator Status;
Available From;
Available Until.
Team Members should carry only the operational information Notion needs for Bible facilitation relationships/reporting.
Google remains the allocation authority for BR-F.
The relationship to Facilitation Assignments is by Notion relation, but the cross-platform match is BR-F.
Existing display names do not always exactly match Google Display Name:
e.g. Jess/Jessica, Tiff W/Tiffany W, Tim/Timothy.
Therefore BR-F is the real matching mechanism, not literal display name.
35. Notion Facilitation Assignments structure
Final properties include:
Assignment — title;
Assignment External ID;
Assignment ID — native Notion auto ID;
Assignment State;
Assignment Type;
Confirmation;
Confirmed At;
Event Instance relation;
Facilitator relation;
Notes;
Notification Sent;
Replaces Assignment ID;
Role.
Assignment External ID stores BR-A.
Native Notion Assignment ID such as FA-... is not the portable identity.
Event Instance relation is resolved through BR-S.
Facilitator relation is resolved through BR-F.
Role vocabulary mirrors the structured Google Assignment role vocabulary.
Replacement semantics mirror Google:
old Assignment remains;
replacement gets its own record;
Replaces Assignment ID preserves history.
36. One-off 2026 Notion migration decision
The initial 2026 transfer from the now-authoritative Google structured layers into Notion is to be treated as a controlled one-off migration.
It should not be used as an excuse to build the eventual n8n automation prematurely.
Migration sequence agreed:
validate current Google Sessions;
validate facilitator BR-F coverage in Notion Team Members;
ensure each BR-S maps to the correct Event Instance;
create/match 2026 BR-A Assignment records;
validate relations and replacement history.
Ongoing synchronization can then be designed against a clean aligned baseline.
The user explicitly authorised this migration work just before requesting the Master Architecture extraction.
The migration had begun with fresh reads and validation but was not completed before this architecture request.
Therefore architecture should not falsely state that the 2026 Notion Assignment migration is complete.
37. Pre-2026 Assignment history decision
Do not reconstruct all pre-2026 facilitator Assignments merely for completeness.
Assignment history before 2026 was judged relatively low-value.
Important historical backstory lives more usefully in:
Series;
Units / Items;
Sessions / Event Instances.
2026 is the practical cutover year for structured Assignment history.
Pre-2026 Assignments may be reconstructed only where a future concrete need justifies it.
This was a deliberate anti-overengineering decision.
38. Legacy Notion Event Lead / Group Leads
These properties are legacy Notion relations on Journey Event Instances.
Google-side Event Lead / Group Lead semantics are already effectively retired in the SAFE Copy.
Remaining concern is primarily Notion migration/cleanup, not redesign of the Google Pretty Roster.
Audit showed the properties are still populated in some historical/current records, including:
Bible Reading;
Facilitator Coaching;
Vision Casting.
They proved useful during discovery because they exposed the broader facilitated-event domain.
Therefore they should not be deleted prematurely.
Final rule:
retain them temporarily;
migrate/validate authoritative 2026 structured Assignments;
confirm no useful 2026 information remains stranded only in Event Lead / Group Leads;
then retire the legacy properties.
Their current existence is evidence/migration support, not an endorsement of their long-term architecture.
Final simplified Stage 5 interpretation:
Validate 2026 Notion Facilitation Assignments, then retire legacy Event Lead / Group Leads.
39. Legacy-property audit finding
Event Lead and Group Leads were not found to have obvious direct schema formulas/rollups that made them clearly indispensable.
However absence of obvious schema dependencies did not prove there were no hidden views/automation dependencies.
Stored data itself was enough reason not to delete immediately.
Therefore cleanup follows migration rather than precedes it.
40. Old Notion proof Assignment
One earlier Notion Facilitation Assignment existed as an old proof/test artefact:
title referenced BR-A-000001 · Hannah · Lead / Announce · BR-S-000044.
That ID became invalid once the permanent chronological Google backfill allocated BR-A-000001 to the first 2026 Session.
Therefore the old proof record is not authoritative.
It should not influence architecture or migration.
An earlier attempt to neutralise/delete it had ambiguous tool confirmation.
Final safe requirement:
fresh-fetch and verify its state before relying on it;
remove/neutralise it before or during authoritative migration if still present.
It must never coexist pretending to be the true BR-A-000001.
41. Pretty Roster design philosophy
The Pretty Roster remains intentionally visual.
Human operators may:
move facilitators;
swap them;
correct roles;
add support;
use replacement cues;
reorganise within a Session.
The structured layer must accommodate reasonable manipulation rather than forcing a rigid database entry process.
Visual organisation is permitted to remain “messy” if semantic publication stays reliable.
The system should not impose rules purely for aesthetic tidiness.
Human judgement remains authoritative in genuinely ambiguous cases.
42. Pretty Roster provenance
The structured Assignment layer retains:
Source Sheet;
Source Cell.
These exist for:
traceability;
debugging;
reconciliation.
They are not durable Assignment identity.
This distinction was one of the most important logic shifts made during Stage 5.
43. Duplicate and ambiguity philosophy
Deterministic flexibility is preferred over rigid layout rules.
But where more than one plausible semantic interpretation exists, the publisher should:
report a Problem;
make no guess;
require human clarification.
The duplicate-facilitator-in-one-Session case is the canonical example.
This is the general architecture principle:
automate certainty; stop at ambiguity.
44. Session vs Assignment identity boundary
Session identity can survive changes to content/Item/status where it remains the same real-world occurrence.
Assignment identity can survive:
source-cell moves;
role correction;
ordinary within-Session rearrangement.
Assignment identity cannot survive a change of Session.
Replacement person normally receives a new Assignment identity.
This gives a clean semantic boundary for future automation.
45. Historical status / role evidence
Role colours are valuable historical evidence.
Completion greying should therefore not overwrite role colours.
Historical rows should retain enough role information to reconstruct structured Assignments where required.
This was important in the Vision Casting decision: the existing Pretty Roster rows gave better role evidence than the old generic Event Lead/Group Leads fields.
46. Easter Retreat decision
Easter Retreat 2026 is a legitimate facilitated event set.
It uses a different operational sheet structure.
It consisted of:
two days;
one session per day;
two facilitator pairs;
each facilitator serving twice across the two days;
Lead/Support roles switching by day.
Passages:
Day 1: Luke 22:39–71 and Luke 23:13–49;
Day 2: 1 Kings 19:1–18 and 1 Samuel 1:1–28.
Duplicate names across days represent separate real service instances, not accidental duplicate Assignments.
The Easter Retreat sheet is retained as a special operational surface rather than forcing all events into the semester Pretty Roster layout.
47. Singapore / stream planning
Singapore is a first-class stream alongside Tuesday and Thursday.
Future location/planning areas may exist separately from the primary roster.
Planning surfaces for locations should not silently become authoritative operational records.
There must be a clear promotion path from exploratory planning into the primary roster/structured publication path.
Miscellaneous historical Singapore roles such as Dinner should not be used to broaden the facilitation-role ontology prematurely.
48. Session status and historical completion
Historical Session rows are retained.
Completed sessions remain structurally addressable by BR-S.
The operational structured layer can contain both Completed and Scheduled Sessions.
Historical rows are not deleted once complete.
49. Menu / preview-first operational safety
All important write processes are preview-first.
Users should be able to see:
Create;
Update;
Replace;
Remove;
No change;
Problems
before actual Assignment publication.
Session publication likewise previews before committing.
Intake refresh also has Preview and Refresh actions.
This preview-first pattern is an architecture standard, not a temporary convenience.
50. Idempotency
Publication must be safe to rerun.
A successful publish followed by a repeat Preview should produce a clean no-op where no user changes occurred.
Both Sem1 and Sem2 were acceptance-tested for repeat-run/idempotent behaviour after permanent backfill.
Vision Casting publication was likewise checked through normal preview/publish behaviour.
Idempotency is required before future automation is trusted.
51. SysAdmin / allocator concept
Sequential ID allocation state is held separately from Pretty Roster data.
SysAdmin is the system/helper area for allocator state and similar technical metadata.
Human operators should not have to hand-calculate the next BR-S or BR-A.
Allocators advance only through controlled publication/backfill operations.
52. Current 2026 identifier state after Vision Casting
Session namespace contains:
BR-S-000001 through BR-S-000060 for the original 2026 Bible Reading structured population;
BR-S-000061 through BR-S-000063 for retrospectively published Vision Casting.
Assignment namespace contains at least:
BR-A-000001 through BR-A-000205.
Known replacement chain:
original BR-A-000123 was replaced;
replacement BR-A-000192 points back to BR-A-000123.
This historical replacement chain must survive Notion migration intact.
53. Notion sync mapping
Google Session ID → Notion Session External ID.
Google Facilitator ID → Notion Facilitator External ID.
Google Assignment ID → Notion Assignment External ID.
Google Assignment Session ID resolves the Notion Event Instance relation.
Google Assignment Facilitator ID resolves the Notion Facilitator relation.
Role maps directly to Notion Role option.
Assignment Type maps directly.
Confirmation maps directly.
Assignment State maps directly.
Replaces Assignment ID maps as the BR-A text reference.
Notification/confirmation dates map where populated.
Source Sheet / Source Cell do not currently have equivalent required Notion properties and are principally Google provenance.
54. Notion sync direction and future automation
The 2026 initial alignment is a controlled migration.
Long-term ongoing cross-platform sync is expected to be automated later.
n8n is the likely transport/orchestration layer where required.
The architecture should not build automation before:
stable Google structures exist;
IDs exist;
Notion schemas are aligned;
migration has produced a clean baseline.
Automation should move structured facts, not scrape visual meaning from arbitrary Pretty Roster formatting where a structured sync table is available.
n8n should not become the only place business logic exists if Google or Notion can enforce it natively.
55. Explicitly rejected “single giant automation first” approach
Rejected:
trying to make n8n solve roster semantics before the native data structures were stable.
Rejected:
treating the Pretty Roster itself as the only machine-readable database.
Rejected:
synchronising vague Event Lead / Group Lead fields as if they were sufficient per-session role data.
Rejected:
automating before BR-F / BR-S / BR-A identity was settled.
56. Historical archive principles
Historical roster data must be retained year by year.
Archive is a lifecycle process, not part of routine live synchronization.
Closed years should eventually become operationally frozen/read-only.
Annual close should preserve:
Session history;
Assignment history;
facilitator reference state;
validation evidence.
Historical tabs/workbooks must remain readable after the live current-year system moves on.
57. Annual archive structure direction
Existing main roster historically carried multiple year/semester tabs.
A separate workbook was created:
Bible Facilitator Roster ARCHIVE.
Preferred direction discussed:
move closed-year tabs into an archive workbook;
retain roughly a decade before starting another archive workbook if needed.
The archive should not become the active operational workbook.
Exact final yearly archive packaging was a Stage 6 decision area and was not yet completely finalised at the point of the main Stage 5 work.
58. Annual close / freeze architecture
Annual close is preview-first and manually confirmed.
previewAnnualClose() makes no changes.
Archive execution should occur only after the close gate.
Current annual-close script direction includes a hard gate until:
2027-02-01 for the 2026 close.
Archive targets include:
Sessions 2026
Assignments 2026
Facilitators 2026
Freeze Report 2026.
Existing occupied archive targets should block overwrite rather than silently replace data.
Missing archive targets may be created.
The close should generate a permanent Freeze Report.
Freeze Report requirements agreed include:
script version;
workbook IDs;
counts;
ID ranges;
validation checks;
exceptions;
timestamps;
human sign-off.
Human authority around closing was separated into roles such as:
Operational Approver;
Technical Approver;
Controller Operator.
Ownership and operator succession should be explicit rather than assumed.
59. Correction / freeze timing
A soft-close / correction-window concept was accepted.
A proposed correction window was:
7–31 January.
Hard freeze follows the correction period rather than freezing immediately on 1 January.
Closed-year edits should be exceptional and controlled.
The exact final annual governance procedure remained part of Stage 6 completion.
60. Stage 6 deliberate deferral
The final item:
rehearse the annual close in SAFE Copy and confirm one clean Preview after closed-year material is excluded from current operation
was deliberately moved out of immediate work.
Final decision:
rehearse the whole 2026 close together in early January 2027 as part of the 2026 Close Schedule.
Stage 6 was then closed operationally with that rehearsal deferred into the future close process.
There was explicitly nothing further to execute immediately on that rehearsal at the time.
61. Documentation architecture
Documentation should exist in more than one layer:
concise operational guidance directly in the Google workbook Front Page;
design/decision documentation in Notion;
later fuller professional technical documentation.
The Google Front Page is intended to stop future operators having to rediscover:
which sheet is authoritative;
what the colours mean;
how IDs work;
what helper sheets do;
basic publication rules.
A matching Notion page was created:
Bible Facilitation Roster — Operating Notes.
The long-term documentation standard should be good enough for:
maintainability;
succession;
handover;
professional operation.
62. Notion planning-document convention
The central design page is:
🆕 Google/Notion Sync Planning.
It is the single source of truth for design/build tracking for this workflow.
Genuine design decisions, requirements and unresolved questions should be captured there rather than existing only in chat.
Before updating it, fetch the current page because the user may have edited/reformatted it manually.
User prefers compact, readable Notion sections and toggles rather than enormous uncontrolled pages.
63. Development workflow principle
Work proceeds in stages.
Stage completion requires actual acceptance evidence, not merely code being written.
Typical pattern:
design rule;
modify SAFE Copy or script;
Preview;
test targeted edge case;
Publish if clean;
repeat Preview for idempotency;
mark requirement complete.
This was intentionally preferred over endless broad rewrites.
The user explicitly identified earlier project work as inefficient when it involved:
large documents;
long conversations;
repeated wholesale code rewrites.
Future work should therefore use:
focused updates;
current exact script baseline;
small acceptance steps;
minimal re-reading/reconstruction.
64. Rejected technical/workflow patterns
Do not treat row/column position as durable semantic identity when a BR-ID exists.
Do not delete historical facilitators simply because they become inactive.
Do not infer permanent role from temporary replacement red.
Do not infer support assignments automatically.
Do not force every facilitated event into the Bible Reading Pretty Roster.
Do not force every Notion Facilitation Assignment to have BR-S/BR-A unless it belongs to the shared operational namespace.
Do not introduce Notion → Google writes merely to make number sequences look tidy.
Do not reconstruct pre-2026 Assignments for completeness alone.
Do not rename structured sync headers casually.
Do not change live Google architecture without explicit promotion from SAFE Copy.
Do not let helper sheets become manually maintained second masters.
Do not silently overwrite archive targets.
Do not guess through duplicate/ambiguous facilitator situations.
Do not make operator freedom more restrictive than the tests prove necessary.
Do not broaden the role ontology with incidental duties such as Dinner until there is a genuine system requirement.
Do not build automation simply because a one-off migration can be automated.
Do not rewrite a working script merely to accommodate an edge case that the existing model can already represent.
65. Edge cases now explicitly resolved
Same facilitator, same Session, different cell → preserve BR-A if unambiguous.
Same facilitator, same Session, role correction → preserve BR-A.
Same facilitator, same Session, move + role correction → preserve BR-A where correspondence is unambiguous.
Multiple simultaneous same-Session moves → allowed.
Two-person swap → allowed.
L-Plate / support pair reshuffling → allowed.
Removed Assignment restored exactly → reactivate same BR-A.
Same facilitator duplicated twice in one Session → block with Problem.
Facilitator moved to another Session → Remove old + Create new BR-A.
Replacement facilitator → retain old Assignment as Replaced + create new BR-A.
Replacement's capability incompatible with original role and only one valid alternative → deterministic resolution permitted.
Replacement has several plausible roles → block for human choice.
Replacement needs support → support must be explicit separate Assignment.
Vision Casting row previously Excluded but genuinely part of normal facilitation stream → remove exclusion, publish normally.
Retrospective Sessions assigned later BR-S numbers despite earlier dates → accepted.
Completed row → grey Date only, preserve role colours.
Historical inactive facilitator still referenced by old Assignment → retain BR-F and Team Member relation.
Helper list changes → derive from master; do not maintain separately.
66. Matters deliberately still open / not part of settled architecture
Whether one facilitator should eventually be allowed to hold multiple distinct roles in the same Session remains unresolved.
Current duplicate guard blocks it.
No “dual role” model has been accepted yet.
Exact long-term treatment of Facilitator Coaching IDs remains open.
Current default: Notion facilitated event without BR-S/BR-A unless brought into the shared operational stream later.
Final timing/cadence and exact mechanism of ongoing Google ↔ Notion automation remains future work.
Final deletion of Notion Event Lead / Group Leads remains pending until 2026 Assignment migration/validation is complete.
Final full technical manual is future work; the Front Page is the current concise operator guide.
Annual-close rehearsal remains scheduled conceptually for the early-2027 close process rather than already executed.
Any old obsolete Notion proof Assignment must be checked before claiming it is removed.
The 2026 one-off Notion Assignment migration had been authorised and validation had begun, but had not been completed at the point this Master Architecture extraction was requested.
67. The architecture in one final dependency chain
Upstream people:
Church Master
→ FacIntake
→ FacMaster (BR-F)
→ FacilitatorLists
→ Pretty Roster dropdowns.
Session planning:
Pretty Roster human plan
→ Preview Approved Sessions
→ Publish Approved Sessions
→ Sessions — Sync (BR-S)
→ Notion Journey Event Instance Session External ID.
Facilitation assignment:
Pretty Roster facilitator name + role colour
→ Preview Approved Assignments
→ Publish Approved Assignments
→ Assignments — Sync (BR-A, BR-S, BR-F, role, lifecycle, provenance)
→ Notion Facilitation Assignment
→ relation to Journey Event Instance by BR-S
→ relation to Team Member by BR-F.
Long-term cross-platform sync:
structured Google handover layers
↔ only the corresponding Notion structured facts
with n8n used as transport/orchestration where native tools cannot do the job
without making n8n the sole owner of business meaning.

This is the architecture I would now regard as the authoritative decision set from the conversation. The key theme running through virtually every later decision is that the visual roster remains flexible and human, while BR-F, BR-S and BR-A provide the stable semantic structure underneath it.