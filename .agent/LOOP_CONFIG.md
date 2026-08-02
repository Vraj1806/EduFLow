# EDUFLOW AUTONOMOUS LOOP CONFIGURATION

**Last Updated:** 2026-08-02 07:00 UTC  
**Session:** 1 - Initial Audit

---

## LOOP PARAMETERS

### Iteration Limits
```
MAX_ITERATIONS = 20
CURRENT_ITERATION = 0
ITERATION_TIMEOUT = 30 minutes per iteration
SESSION_TIMEOUT = 8 hours total
```

### Success Criteria
Loop continues until:
- All quality gates pass OR
- Iteration limit reached OR
- Session timeout reached OR
- Unrecoverable blocker encountered

### Failure Handling
- Max retry attempts per task: 3
- If task fails 3 times: Mark as BLOCKED, document reason, move to next task
- If critical task blocked: Stop loop, generate report

---

## AUTONOMOUS LOOP WORKFLOW

```
┌─────────────────────────────────────────┐
│ START ITERATION N                        │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│ 1. UPDATE STATE.md                       │
│    - Current iteration                   │
│    - Current task                        │
│    - Last test results                   │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│ 2. INSPECT PRIORITY QUEUE                │
│    - Read BUGS.md                        │
│    - Read TODO.md                        │
│    - Read QUALITY.md                     │
│    - Identify highest priority task      │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│ 3. PLAN APPROACH                         │
│    - Understand problem                  │
│    - Identify dependencies               │
│    - Determine safest solution           │
│    - Document plan in STATE.md           │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│ 4. IMPLEMENT                             │
│    - Make code changes                   │
│    - Update tests if needed              │
│    - Commit to Git (checkpoint)          │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│ 5. BUILD & TYPECHECK                     │
│    - npm run build                       │
│    - npm run typecheck                   │
│    - Fix compilation errors              │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│ 6. RUN TESTS                             │
│    - npm test                            │
│    - Fix test failures                   │
│    - Update TEST_RESULTS.md              │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│ 7. START APPLICATION                     │
│    - npm run dev                         │
│    - Verify startup                      │
│    - Check console for errors            │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│ 8. BROWSER TEST                          │
│    - Test affected workflow              │
│    - Verify fix works                    │
│    - Check for visual issues             │
│    - Record screenshots if issues        │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│ 9. REGRESSION TEST                       │
│    - Test related workflows              │
│    - Verify no new bugs introduced       │
│    - Run full test suite                 │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│ 10. UPDATE PROJECT MEMORY                │
│     - Mark task COMPLETED in TODO.md     │
│     - Mark bug FIXED in BUGS.md          │
│     - Update QUALITY.md gates            │
│     - Update TEST_RESULTS.md             │
│     - Update STATE.md                    │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│ 11. CHECK QUALITY GATES                  │
│     - Read QUALITY.md                    │
│     - Count passed/failed gates          │
│     - Determine if production-ready      │
└───────────────┬─────────────────────────┘
                │
                ▼
        ┌───────┴───────┐
        │               │
        ▼               ▼
┌─────────────┐   ┌──────────────┐
│ ALL GATES   │   │ GATES        │
│ PASSED?     │   │ REMAINING?   │
└──────┬──────┘   └──────┬───────┘
       │ YES             │ YES
       │                 │
       ▼                 ▼
┌─────────────┐   ┌──────────────┐
│ SUCCESS!    │   │ CONTINUE     │
│ STOP LOOP   │   │ ITERATION    │
└─────────────┘   │ N+1          │
                  └──────────────┘
```

---

## AGENT ROLES

### Architect Agent (Read-Only Inspector)
**Responsibilities:**
- Inspect codebase structure
- Identify architectural issues
- Recommend solutions
- Plan features
- Identify dependencies
- Assess risk

**Tools:**
- Read files
- Grep
- Glob
- Task (delegate deep research)

**Restrictions:**
- NO modification of code
- NO running commands that change state

---

### Builder Agent (Code Implementer)
**Responsibilities:**
- Implement approved plans
- Preserve existing functionality
- Follow project architecture
- Write maintainable code
- Reuse existing components
- Update tests

**Tools:**
- Read files
- Edit files
- Write files (new files only when necessary)
- Bash (build, typecheck)

**Restrictions:**
- MUST read ARCHITECTURE.md before modifying
- MUST read relevant existing code before implementing
- MUST NOT rewrite working functionality unnecessarily
- MUST update TODO.md after completion

---

### Tester Agent (Quality Verifier)
**Responsibilities:**
- Run test suites
- Write new tests
- Verify test coverage
- Identify test gaps
- Document test results

**Tools:**
- Read test files
- Write test files
- Bash (npm test, coverage reports)
- Edit (fix tests)

**Restrictions:**
- MUST NOT weaken tests to make them pass
- MUST NOT disable failing tests without documenting why
- MUST achieve >80% coverage target

---

### Browser QA Agent (UI/UX Tester)
**Responsibilities:**
- Test workflows in real browser
- Verify loading states
- Verify error states
- Verify empty states
- Check responsive design
- Identify visual bugs
- Capture screenshots
- Test user interactions

**Tools:**
- Playwright (when configured)
- Bash (start dev servers)
- Read (inspect pages)

**Restrictions:**
- MUST actually use the application, not just read source
- MUST document bugs with reproduction steps
- MUST capture evidence (screenshots, videos)

---

### Security Auditor Agent (Read-Only)
**Responsibilities:**
- Audit authentication
- Audit authorization
- Check for vulnerabilities
- Verify input validation
- Check for sensitive data exposure
- Review error messages
- Check dependencies

**Tools:**
- Read files
- Grep
- Bash (npm audit, security scanners)

**Restrictions:**
- NO code modification
- Only report findings in BUGS.md

---

### Performance Auditor Agent (Read-Only)
**Responsibilities:**
- Measure performance
- Identify bottlenecks
- Check bundle size
- Analyze database queries
- Check memory usage
- Recommend optimizations

**Tools:**
- Read files
- Bash (performance measurement tools)
- Grep (find slow queries)

**Restrictions:**
- NO code modification
- Only report findings in TODO.md

---

### Debugger Agent (Investigator)
**Responsibilities:**
- Reproduce bugs
- Inspect logs
- Analyze stack traces
- Determine root cause
- Propose fixes

**Tools:**
- Read files
- Grep
- Bash (run commands to reproduce)

**Restrictions:**
- MUST reproduce before proposing fix
- MUST identify root cause, not just symptoms
- MUST document findings in BUGS.md

---

## TASK PRIORITIZATION

### Priority Order
1. **CRITICAL bugs** (blocks core functionality, security, data loss)
2. **Build/compilation failures** (blocks all testing)
3. **Security vulnerabilities** (exploitable issues)
4. **Data integrity issues** (corruption, loss, inconsistency)
5. **HIGH bugs** (major features broken, difficult workarounds)
6. **Test failures** (indicates broken functionality)
7. **Integration failures** (services not communicating)
8. **Performance issues** (unacceptable slowness)
9. **MEDIUM bugs** (partial breakage, reasonable workarounds)
10. **UX issues** (confusing, frustrating user experience)
11. **Visual bugs** (layout, styling, responsiveness)
12. **LOW bugs** (minor inconveniences)
13. **Refactoring** (code quality improvements)
14. **COSMETIC bugs** (visual-only, no functional impact)

### Skip Rules
- Do NOT spend time on P3 (cosmetic) while P0-P1 (critical/high) remain
- Do NOT refactor working code while bugs exist
- Do NOT add new features while quality gates failing
- Do NOT optimize prematurely (only when performance issue documented)

---

## VERIFICATION REQUIREMENTS

### After Every Code Change
- [x] Build succeeds
- [x] Typecheck passes
- [x] Tests pass (no regressions)
- [x] Application starts
- [x] Browser test affected workflow
- [x] Regression test related workflows
- [x] Update project memory files

### After Every Bug Fix
- [x] Reproduce original bug
- [x] Verify fix resolves bug
- [x] Verify no new bugs introduced
- [x] Update BUGS.md (STATUS: FIXED)
- [x] Document verification steps
- [x] Mark TODO task completed

### After Every Feature Implementation
- [x] All acceptance criteria met
- [x] Tests written for new code
- [x] Edge cases handled
- [x] Error cases handled
- [x] Loading states implemented
- [x] Empty states implemented
- [x] Documentation updated

---

## ERROR RECOVERY

### Command Failure
```
IF command fails:
  1. Read error output carefully
  2. Identify root cause
  3. Fix root cause
  4. Re-run command
  5. If fails again (2nd time):
     - Document issue in BUGS.md
     - Try alternative approach
  6. If fails 3rd time:
     - Mark as BLOCKED in TODO.md
     - Document why
     - Move to next task
```

### Test Failure
```
IF test fails:
  1. Read test output
  2. Inspect test code
  3. Inspect implementation
  4. Determine root cause
  5. Fix root cause (not the test)
  6. Re-run test
  7. If still fails:
     - Debug with additional logging
     - Verify test expectations correct
  8. If test is incorrect:
     - Fix test
     - Document why test was wrong
```

### Browser Test Failure
```
IF browser test fails:
  1. Capture screenshot
  2. Inspect console errors
  3. Inspect network tab
  4. Reproduce manually
  5. Determine root cause
  6. Fix root cause
  7. Re-test in browser
  8. Document in BUGS.md if not immediately fixable
```

---

## STOPPING CONDITIONS

### Success Condition
```
IF (
  all_critical_quality_gates_passed AND
  zero_critical_bugs AND
  zero_high_bugs AND
  test_coverage >= 80%
):
  STOP LOOP
  GENERATE SUCCESS REPORT
```

### Iteration Limit Condition
```
IF current_iteration >= MAX_ITERATIONS:
  STOP LOOP
  GENERATE INCOMPLETE REPORT
  DOCUMENT REMAINING WORK
```

### Timeout Condition
```
IF session_duration >= SESSION_TIMEOUT:
  STOP LOOP
  CHECKPOINT STATE
  GENERATE PROGRESS REPORT
```

### Blocker Condition
```
IF unrecoverable_blocker_encountered:
  STOP LOOP
  DOCUMENT BLOCKER
  RECOMMEND HUMAN INTERVENTION
```

---

## REPORTING

### Progress Report (Every Iteration)
```
ITERATION: N
TASK: [Description]
STATUS: [COMPLETED | IN_PROGRESS | BLOCKED]
DURATION: [Minutes]
CHANGES: [List of files modified]
TESTS: [Pass/Fail counts]
BUGS FIXED: [Count]
BUGS DISCOVERED: [Count]
QUALITY GATES: [Passed/Total]
NEXT TASK: [Description]
```

### Final Report (Loop Complete)
```
SUMMARY:
  Total Iterations: N
  Total Duration: [Hours]
  Files Modified: [Count]
  Tests Written: [Count]
  Bugs Fixed: [Count]
  Bugs Remaining: [Count by severity]
  Quality Gates Passed: [Count/Total]
  Production Ready: [YES | NO]

COMPLETED:
  [List of completed tasks]

REMAINING:
  [List of remaining tasks by priority]

BLOCKED:
  [List of blocked tasks with reasons]

KNOWN BUGS:
  [List by severity]

RECOMMENDATIONS:
  [Next steps for human developers]
```

---

## CURRENT CONFIGURATION

**Session:** 1 - Initial Audit  
**Phase:** Infrastructure Setup (STEP 3 in progress)  
**Iteration:** 0 (not started loop yet)  
**Max Iterations:** 20  
**Timeout:** 8 hours from session start  
**Started:** 2026-08-02 06:52 UTC  
**Estimated Completion:** 2026-08-02 14:52 UTC (if full 8 hours needed)

---

## NEXT LOOP START

Loop will begin after infrastructure setup complete (STEP 6 done).

**First Task:** Run first complete audit (STEP 7-8)
