
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/invoice_db");

// Schema for invoice items
const itemSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true,
        min: 0
    }
}, { _id: false });

// Schema for invoices
const invoiceSchema = new mongoose.Schema({
    invoiceCode: {
        type: String,
        required: true,
        unique: true
    },
    customerName: {
        type: String,
        required: true
    },
    customerEmail: {
        type: String,
        required: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    items: {
        type: [itemSchema],
        required: true,
        validate: {
            validator: function(items) {
                return items.length > 0;
            },
            message: "An invoice must contain at least one item"
        }
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ["Cash", "CreditCard", "BankTransfer", "Momo"]
    }
});

// Create Invoice model
const Invoice = mongoose.model("Invoice", invoiceSchema);

// Read JSON, validate, and insert invoices
async function main() {
    try {
        const filePath = path.join(__dirname, "invoices.json");
        const jsonData = fs.readFileSync(filePath, "utf8");
        const invoices = JSON.parse(jsonData);

        if (!Array.isArray(invoices)) {
            throw new Error("JSON data must be an array");
        }

        console.log("Number of invoices:", invoices.length);

        // Validate all invoices before inserting
        for (const data of invoices) {
            const invoice = new Invoice(data);
            await invoice.validate();
        }

        console.log("All invoices are valid.");

        // Insert all invoices into MongoDB
        const result = await Invoice.insertMany(invoices);

        console.log("Successfully inserted", result.length, "invoices.");

        result.forEach(invoice => {
            console.log("Invoice:", invoice.invoiceCode);
        });
    } catch (error) {
        console.log("Error:", error.message);
    } finally {
        await mongoose.disconnect();
    }
}

// Start after connecting to MongoDB
mongoose.connection.once("open", main);

mongoose.connection.on("error", error => {
    console.log("MongoDB connection error:", error.message);
});
