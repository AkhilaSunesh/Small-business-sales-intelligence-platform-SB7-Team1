/**
 * Unit tests — sales upload CSV row validation (Joi schema)
 */

const { rowSchema } = require("../validations/sales.validation");

describe("sales rowSchema validation", () => {
    const validRow = {
        CustomerID:      "CUST-0001",
        ProductID:       "PROD-0001",
        Quantity:        "5",
        Price:           "19.99",
        TransactionDate: "2024-01-15"
    };

    test("accepts a fully valid row", () => {
        const { error } = rowSchema.validate(validRow, { convert: true });
        expect(error).toBeUndefined();
    });

    test("rejects missing CustomerID", () => {
        const { error } = rowSchema.validate({ ...validRow, CustomerID: undefined }, { convert: true });
        expect(error).toBeDefined();
        expect(error.details[0].path).toContain("CustomerID");
    });

    test("rejects missing ProductID", () => {
        const { error } = rowSchema.validate({ ...validRow, ProductID: undefined }, { convert: true });
        expect(error).toBeDefined();
        expect(error.details[0].path).toContain("ProductID");
    });

    test("rejects zero quantity", () => {
        const { error } = rowSchema.validate({ ...validRow, Quantity: "0" }, { convert: true });
        expect(error).toBeDefined();
    });

    test("rejects negative quantity", () => {
        const { error } = rowSchema.validate({ ...validRow, Quantity: "-3" }, { convert: true });
        expect(error).toBeDefined();
    });

    test("rejects non-numeric quantity", () => {
        const { error } = rowSchema.validate({ ...validRow, Quantity: "abc" }, { convert: true });
        expect(error).toBeDefined();
    });

    test("rejects zero price", () => {
        const { error } = rowSchema.validate({ ...validRow, Price: "0" }, { convert: true });
        expect(error).toBeDefined();
    });

    test("rejects negative price", () => {
        const { error } = rowSchema.validate({ ...validRow, Price: "-1" }, { convert: true });
        expect(error).toBeDefined();
    });

    test("rejects invalid date format", () => {
        const { error } = rowSchema.validate({ ...validRow, TransactionDate: "not-a-date" }, { convert: true });
        expect(error).toBeDefined();
    });

    test("accepts optional invoiceNo when present", () => {
        const { error } = rowSchema.validate({ ...validRow, invoiceNo: "INV-001" }, { convert: true });
        expect(error).toBeUndefined();
    });

    test("accepts optional invoiceNo as empty string", () => {
        const { error } = rowSchema.validate({ ...validRow, invoiceNo: "" }, { convert: true });
        expect(error).toBeUndefined();
    });

    test("coerces string quantity to number on valid input", () => {
        const { value } = rowSchema.validate(validRow, { convert: true });
        expect(typeof value.Quantity).toBe("number");
        expect(value.Quantity).toBe(5);
    });

    test("coerces string price to number on valid input", () => {
        const { value } = rowSchema.validate(validRow, { convert: true });
        expect(typeof value.Price).toBe("number");
        expect(value.Price).toBeCloseTo(19.99);
    });
});
