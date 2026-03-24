# COBOL Account Management System Test Plan

This test plan captures the current business logic and implementation behavior of the COBOL application so business stakeholders can validate expected outcomes before and during the Node.js migration.

| Test Case ID | Test Case Description | Pre-conditions | Test Steps | Expected Result | Actual Result | Status (Pass/Fail) | Comments |
|---|---|---|---|---|---|---|---|
| TC-001 | Launch application and verify menu is shown | Application is compiled successfully (`accountsystem` executable exists). | 1. Run `./accountsystem`. | Main menu is displayed with options 1-4 and prompt `Enter your choice (1-4):`. | TBD | TBD | Confirms startup flow. |
| TC-002 | View initial balance | Application is running and no prior credit/debit done in current run. | 1. Enter `1` at menu.<br>2. Observe displayed balance. | Balance is displayed as `001000.00`. | TBD | TBD | Validates default starting balance is 1000.00. |
| TC-003 | Credit account with valid amount | Application is running at main menu. | 1. Enter `2`.<br>2. Enter credit amount `200.50`.<br>3. Enter `1` to view balance. | Message confirms credit and new balance `001200.50` is shown and persisted when viewing balance. | TBD | TBD | Validates read + add + write path. |
| TC-004 | Debit account with valid amount less than balance | Application is running at main menu with balance 1000.00 (fresh run). | 1. Enter `3`.<br>2. Enter debit amount `250.25`.<br>3. Enter `1` to view balance. | Message confirms debit and new balance `000749.75` is shown and persisted when viewing balance. | TBD | TBD | Validates read + subtract + write path. |
| TC-005 | Prevent debit when funds are insufficient | Application is running at main menu with balance 1000.00 (fresh run). | 1. Enter `3`.<br>2. Enter debit amount `1000.01`.<br>3. Enter `1` to view balance. | Message `Insufficient funds for this debit.` is shown and balance remains `001000.00`. | TBD | TBD | Confirms no write occurs on insufficient funds. |
| TC-006 | Debit account with amount exactly equal to balance | Application is running at main menu with balance 1000.00 (fresh run). | 1. Enter `3`.<br>2. Enter debit amount `1000.00`.<br>3. Enter `1` to view balance. | Debit succeeds and resulting balance is `000000.00`. | TBD | TBD | Boundary case for `FINAL-BALANCE >= AMOUNT`. |
| TC-007 | Validate balance persistence across multiple operations in one run | Application is running at main menu with balance 1000.00 (fresh run). | 1. Enter `2`, credit `500.00`.<br>2. Enter `3`, debit `125.50`.<br>3. Enter `1` to view balance. | Final displayed balance is `001374.50` (1000.00 + 500.00 - 125.50). | TBD | TBD | Validates sequential state transitions. |
| TC-008 | Handle invalid menu choice | Application is running at main menu. | 1. Enter `9`.<br>2. Observe response.<br>3. Enter `1` to verify app continues. | Message `Invalid choice, please select 1-4.` appears and menu loop continues without crash. | TBD | TBD | Validates menu input guard (`WHEN OTHER`). |
| TC-009 | Exit flow | Application is running at main menu. | 1. Enter `4`. | Application exits loop and displays `Exiting the program. Goodbye!` then terminates. | TBD | TBD | Confirms graceful termination path. |
| TC-010 | Credit zero amount | Application is running at main menu with balance 1000.00 (fresh run). | 1. Enter `2`.<br>2. Enter amount `0.00`.<br>3. Enter `1` to view balance. | Credit message appears and balance remains `001000.00`. | TBD | TBD | Documents current behavior for zero-value credit. |
| TC-011 | Debit zero amount | Application is running at main menu with balance 1000.00 (fresh run). | 1. Enter `3`.<br>2. Enter amount `0.00`.<br>3. Enter `1` to view balance. | Debit message appears and balance remains `001000.00`. | TBD | TBD | Documents current behavior for zero-value debit. |
| TC-012 | Verify data reset between separate executions | One completed run has changed the balance (for example via credit). | 1. Exit app.<br>2. Launch app again.<br>3. Enter `1` to view balance. | Balance starts again at `001000.00` on a new process execution. | TBD | TBD | Current implementation stores balance in program memory only, not persistent storage. |

## Notes for Node.js Migration

- Use this plan as the baseline for parity testing between COBOL and Node.js implementations.
- Keep expected numeric formatting consistent (`PIC 9(6)V99` style outputs) unless business explicitly approves a new display format.
- Preserve current behavior for boundary and edge cases unless requirements are intentionally changed.