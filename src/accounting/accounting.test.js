"use strict";

const {
  OPERATION_CODES,
  createDataProgram,
  createOperations,
  main,
} = require("./index");

function createMockOutput() {
  let text = "";

  return {
    write(chunk) {
      text += String(chunk);
    },
    getText() {
      return text;
    },
  };
}

function createMockReadline(answers) {
  const queue = [...answers];

  return {
    async question() {
      if (queue.length === 0) {
        throw new Error("No more mocked answers available for question prompt.");
      }
      return String(queue.shift());
    },
    close: jest.fn(),
  };
}

function createOperationsHarness(answers = []) {
  const out = createMockOutput();
  const rl = createMockReadline(answers);
  const dataProgram = createDataProgram();
  const operations = createOperations(dataProgram, rl, out);

  return { out, rl, dataProgram, operations };
}

async function runMainSession(answers) {
  const out = createMockOutput();
  const rl = createMockReadline(answers);

  await main({
    outStream: out,
    interfaceFactory: () => rl,
  });

  return { out, rl };
}

describe("COBOL parity scenarios", () => {
  test("TC-001: shows menu on launch", async () => {
    const { out } = await runMainSession(["4"]);

    expect(out.getText()).toContain("Account Management System");
    expect(out.getText()).toContain("1. View Balance");
    expect(out.getText()).toContain("2. Credit Account");
    expect(out.getText()).toContain("3. Debit Account");
    expect(out.getText()).toContain("4. Exit");
  });

  test("TC-002: shows initial balance", async () => {
    const { out, operations } = createOperationsHarness();

    await operations.runOperation(OPERATION_CODES.TOTAL);

    expect(out.getText()).toContain("Current balance: 001000.00");
  });

  test("TC-003: credits account and persists in current run", async () => {
    const { out, operations } = createOperationsHarness(["200.50"]);

    await operations.runOperation(OPERATION_CODES.CREDIT);
    await operations.runOperation(OPERATION_CODES.TOTAL);

    expect(out.getText()).toContain("Amount credited. New balance: 001200.50");
    expect(out.getText()).toContain("Current balance: 001200.50");
  });

  test("TC-004: debits account with valid amount and persists in current run", async () => {
    const { out, operations } = createOperationsHarness(["250.25"]);

    await operations.runOperation(OPERATION_CODES.DEBIT);
    await operations.runOperation(OPERATION_CODES.TOTAL);

    expect(out.getText()).toContain("Amount debited. New balance: 000749.75");
    expect(out.getText()).toContain("Current balance: 000749.75");
  });

  test("TC-005: blocks debit when funds are insufficient", async () => {
    const { out, operations } = createOperationsHarness(["1000.01"]);

    await operations.runOperation(OPERATION_CODES.DEBIT);
    await operations.runOperation(OPERATION_CODES.TOTAL);

    expect(out.getText()).toContain("Insufficient funds for this debit.");
    expect(out.getText()).toContain("Current balance: 001000.00");
  });

  test("TC-006: allows debit equal to full balance", async () => {
    const { out, operations } = createOperationsHarness(["1000.00"]);

    await operations.runOperation(OPERATION_CODES.DEBIT);
    await operations.runOperation(OPERATION_CODES.TOTAL);

    expect(out.getText()).toContain("Amount debited. New balance: 000000.00");
    expect(out.getText()).toContain("Current balance: 000000.00");
  });

  test("TC-007: preserves balance across multiple operations in one run", async () => {
    const { out, operations } = createOperationsHarness(["500.00", "125.50"]);

    await operations.runOperation(OPERATION_CODES.CREDIT);
    await operations.runOperation(OPERATION_CODES.DEBIT);
    await operations.runOperation(OPERATION_CODES.TOTAL);

    expect(out.getText()).toContain("Amount credited. New balance: 001500.00");
    expect(out.getText()).toContain("Amount debited. New balance: 001374.50");
    expect(out.getText()).toContain("Current balance: 001374.50");
  });

  test("TC-008: handles invalid menu choice and continues", async () => {
    const { out } = await runMainSession(["9", "1", "4"]);

    expect(out.getText()).toContain("Invalid choice, please select 1-4.");
    expect(out.getText()).toContain("Current balance: 001000.00");
  });

  test("TC-009: exits gracefully", async () => {
    const { out } = await runMainSession(["4"]);

    expect(out.getText()).toContain("Exiting the program. Goodbye!");
  });

  test("TC-010: crediting zero keeps balance unchanged", async () => {
    const { out, operations } = createOperationsHarness(["0.00"]);

    await operations.runOperation(OPERATION_CODES.CREDIT);
    await operations.runOperation(OPERATION_CODES.TOTAL);

    expect(out.getText()).toContain("Amount credited. New balance: 001000.00");
    expect(out.getText()).toContain("Current balance: 001000.00");
  });

  test("TC-011: debiting zero keeps balance unchanged", async () => {
    const { out, operations } = createOperationsHarness(["0.00"]);

    await operations.runOperation(OPERATION_CODES.DEBIT);
    await operations.runOperation(OPERATION_CODES.TOTAL);

    expect(out.getText()).toContain("Amount debited. New balance: 001000.00");
    expect(out.getText()).toContain("Current balance: 001000.00");
  });

  test("TC-012: balance resets on new process execution", async () => {
    const firstRun = await runMainSession(["2", "100.00", "4"]);
    const secondRun = await runMainSession(["1", "4"]);

    expect(firstRun.out.getText()).toContain("Amount credited. New balance: 001100.00");
    expect(secondRun.out.getText()).toContain("Current balance: 001000.00");
  });
});
