"use strict";

const readline = require("node:readline/promises");
const { stdin: input, stdout: output } = require("node:process");

const OPERATION_CODES = Object.freeze({
  TOTAL: "TOTAL ",
  CREDIT: "CREDIT",
  DEBIT: "DEBIT ",
  READ: "READ",
  WRITE: "WRITE",
});

const MONEY_PATTERN = /^\d+(?:\.\d{1,2})?$/;
const MAX_AMOUNT = 999999.99;

// DataProgram equivalent: holds in-memory session balance and supports READ/WRITE.
function createDataProgram() {
  let storageBalance = 1000.0;

  function runDataOperation(operationCode, balance = 0) {
    if (operationCode === OPERATION_CODES.READ) {
      return storageBalance;
    }

    if (operationCode === OPERATION_CODES.WRITE) {
      storageBalance = roundToCents(balance);
      return storageBalance;
    }

    return storageBalance;
  }

  return { runDataOperation };
}

function roundToCents(value) {
  return Math.round(value * 100) / 100;
}

function formatMoney(value) {
  const [integerPart, decimalPart] = roundToCents(value).toFixed(2).split(".");
  return `${integerPart.padStart(6, "0")}.${decimalPart}`;
}

function parseAmount(rawInput) {
  const normalized = String(rawInput || "").trim();

  if (!MONEY_PATTERN.test(normalized)) {
    return { valid: false, value: 0 };
  }

  const value = Number.parseFloat(normalized);

  if (!Number.isFinite(value) || value < 0 || value > MAX_AMOUNT) {
    return { valid: false, value: 0 };
  }

  return { valid: true, value: roundToCents(value) };
}

function createOperations(dataProgram, rl, outStream = output) {
  async function runOperation(passedOperation) {
    if (passedOperation === OPERATION_CODES.TOTAL) {
      const finalBalance = dataProgram.runDataOperation(OPERATION_CODES.READ);
      outStream.write(`Current balance: ${formatMoney(finalBalance)}\n`);
      return;
    }

    if (passedOperation === OPERATION_CODES.CREDIT) {
      const amount = await askForAmount("Enter credit amount: ");
      const currentBalance = dataProgram.runDataOperation(OPERATION_CODES.READ);
      const finalBalance = roundToCents(currentBalance + amount);
      dataProgram.runDataOperation(OPERATION_CODES.WRITE, finalBalance);
      outStream.write(`Amount credited. New balance: ${formatMoney(finalBalance)}\n`);
      return;
    }

    if (passedOperation === OPERATION_CODES.DEBIT) {
      const amount = await askForAmount("Enter debit amount: ");
      const currentBalance = dataProgram.runDataOperation(OPERATION_CODES.READ);

      if (currentBalance >= amount) {
        const finalBalance = roundToCents(currentBalance - amount);
        dataProgram.runDataOperation(OPERATION_CODES.WRITE, finalBalance);
        outStream.write(`Amount debited. New balance: ${formatMoney(finalBalance)}\n`);
      } else {
        outStream.write("Insufficient funds for this debit.\n");
      }
      return;
    }
  }

  async function askForAmount(prompt) {
    while (true) {
      const response = await rl.question(prompt);
      const parsed = parseAmount(response);

      if (parsed.valid) {
        return parsed.value;
      }

      outStream.write("Invalid amount. Enter a non-negative number up to 999999.99 with up to 2 decimals.\n");
    }
  }

  return { runOperation };
}

function printMenu(outStream = output) {
  outStream.write("--------------------------------\n");
  outStream.write("Account Management System\n");
  outStream.write("1. View Balance\n");
  outStream.write("2. Credit Account\n");
  outStream.write("3. Debit Account\n");
  outStream.write("4. Exit\n");
  outStream.write("--------------------------------\n");
}

async function main({ inStream = input, outStream = output, interfaceFactory = readline.createInterface } = {}) {
  const rl = interfaceFactory({ input: inStream, output: outStream });
  const dataProgram = createDataProgram();
  const operations = createOperations(dataProgram, rl, outStream);
  let continueFlag = "YES";

  try {
    while (continueFlag !== "NO") {
      printMenu(outStream);
      const choiceRaw = await rl.question("Enter your choice (1-4): ");
      const choice = Number.parseInt(choiceRaw, 10);

      switch (choice) {
        case 1:
          await operations.runOperation(OPERATION_CODES.TOTAL);
          break;
        case 2:
          await operations.runOperation(OPERATION_CODES.CREDIT);
          break;
        case 3:
          await operations.runOperation(OPERATION_CODES.DEBIT);
          break;
        case 4:
          continueFlag = "NO";
          break;
        default:
          outStream.write("Invalid choice, please select 1-4.\n");
      }
    }

    outStream.write("Exiting the program. Goodbye!\n");
  } finally {
    rl.close();
  }
}

module.exports = {
  OPERATION_CODES,
  createDataProgram,
  createOperations,
  formatMoney,
  main,
  parseAmount,
  printMenu,
  roundToCents,
};

if (require.main === module) {
  main().catch((error) => {
    console.error("Unexpected application error:", error);
    process.exitCode = 1;
  });
}
