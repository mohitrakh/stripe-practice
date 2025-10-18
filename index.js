import express from "express";
import dotenv from "dotenv";
import { stripe } from "./config/stripe.js";

dotenv.config();

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Stripe backend running ✅");
});


app.post("/create-checkout-session", async (req, res) => {
    try {
        const { email, productName, amount } = req.body;
        // 1. Create a Customer (if you don't already have one)
        // this will create new customers every time even if the email already exist
        // const customer = await stripe.customers.create({ email });

        // 1️⃣ Try to find existing customer by email
        const existingCustomers = await stripe.customers.list({
            email,
            limit: 1,
        });

        let customer;
        if (existingCustomers.data.length > 0) {
            // Reuse existing customer
            customer = existingCustomers.data[0];
            console.log(`Reusing customer: ${customer.id}`);
        } else {
            // Otherwise, create new one
            customer = await stripe.customers.create({ email });
            console.log(`Created new customer: ${customer.id}`);
        }

        const session = await stripe.checkout.sessions.create(
            {
                customer: customer.id,
                payment_method_types: ["card"],
                line_items: [
                    {
                        price_data: {
                            currency: "usd",
                            product_data: { name: productName },
                            unit_amount: amount, // amount in cents
                        },
                        quantity: 1,
                    },
                ],
                mode: "payment",
                success_url: "http://localhost:4242/success",
                cancel_url: "http://localhost:4242/cancel",
            },
            {
                idempotencyKey: `${email}-${Date.now()}`,
            }
        );

        res.json({ url: session.url });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Something went wrong" });
    }
});


app.get("/success", (req, res) => res.send("Payment succeeded ✅"));
app.get("/cancel", (req, res) => res.send("Payment canceled ❌"));



app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});
