import express from "express";
import dotenv from "dotenv";
import Stripe from "stripe";

dotenv.config();

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Stripe backend running ✅");
});


app.post("/create-checkout-session", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "Test Product" },
            unit_amount: 500,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: "http://localhost:4242/success",
      cancel_url: "http://localhost:4242/cancel",
    });

    res.json({ id: session.url });
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
