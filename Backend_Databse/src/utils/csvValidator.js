/**
 * csvValidator.js
 *
 * Two sets of validation helpers:
 *
 *  1. Legacy API (invoice_no / customer_id snake_case)
 *     Used by tests/csvValidator.test.js — kept unchanged.
 *
 *  2. Kaggle-column API (CustomerID / ProductID PascalCase)
 *     Used by the sales upload pipeline.
 */

// ─── Legacy snake_case API (original columns) ─────────────────────────────────

const LEGACY_REQUIRED_COLUMNS = [
    "invoice_no",
    "customer_id",
    "product_id",
    "quantity",
    "amount",
    "date"
];

function validateColumns(headers) {
    for (const column of LEGACY_REQUIRED_COLUMNS) {
        if (!headers.includes(column)) {
            return { valid: false, missing: column };
        }
    }
    return { valid: true };
}

function validateRow(row) {
    const errors = [];

    if (!row.invoice_no || row.invoice_no.trim() === "")
        errors.push("invoice_no is missing");

    if (!row.customer_id || row.customer_id.trim() === "")
        errors.push("customer_id is missing");

    if (!row.product_id || row.product_id.trim() === "")
        errors.push("product_id is missing");

    if (!row.quantity || isNaN(row.quantity) || Number(row.quantity) <= 0)
        errors.push("quantity must be a positive number");

    if (!row.amount || isNaN(row.amount) || Number(row.amount) <= 0)
        errors.push("amount must be a positive number");

    if (!row.date)
        errors.push("date is missing");

    return errors;
}

// ─── Kaggle / upload API (CustomerID / ProductID PascalCase) ──────────────────

const KAGGLE_REQUIRED_COLUMNS = [
    "CustomerID",
    "ProductID",
    "Quantity",
    "Price",
    "TransactionDate"
];

/**
 * Validate that all required Kaggle CSV headers are present.
 * @param {string[]} headers
 * @returns {{ valid: boolean, missing?: string }}
 */
function validateKaggleColumns(headers) {
    for (const col of KAGGLE_REQUIRED_COLUMNS) {
        if (!headers.includes(col)) {
            return { valid: false, missing: col };
        }
    }
    return { valid: true };
}

/**
 * Validate a single Kaggle CSV row for missing / invalid values.
 * Returns an array of human-readable error strings (empty = valid).
 * @param {object} row  — raw CSV row object from csv-parser
 * @returns {string[]}
 */
function validateKaggleRow(row) {
    const errors = [];

    if (!row.CustomerID || String(row.CustomerID).trim() === "")
        errors.push("CustomerID is missing");

    if (!row.ProductID || String(row.ProductID).trim() === "")
        errors.push("ProductID is missing");

    if (!row.Quantity || isNaN(row.Quantity) || Number(row.Quantity) <= 0)
        errors.push("Quantity must be a positive number");

    if (!row.Price || isNaN(row.Price) || Number(row.Price) <= 0)
        errors.push("Price must be a positive number");

    if (!row.TransactionDate || row.TransactionDate.trim() === "")
        errors.push("TransactionDate is missing");

    return errors;
}

module.exports = {
    // Legacy API
    validateColumns,
    validateRow,
    // Kaggle / upload API
    validateKaggleColumns,
    validateKaggleRow,
    KAGGLE_REQUIRED_COLUMNS,
    LEGACY_REQUIRED_COLUMNS
};
