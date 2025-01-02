const globals = require("node-global-storage");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const db = require("../database/db");

class paymentController {
  bkash_headers = async () => {
    return {
      "content-Type": "application/json",
      accept: "application/json",
      authorization: globals.getValue("id_token"),
      "x-app-key": process.env.bkash_api_key,
    };
  };

  payment_create = async (req, res) => {
    const { amount } = req.body;

    try {
      const { data } = await axios.post(
        process.env.bkash_create_payment_url,
        {
          mode: "0011",
          payerReference: " ",
          callbackURL: "http://localhost:5000/api/bkash/payment/callback",
          amount: amount,
          currency: "BDT",
          intent: "sale",
          merchantInvoiceNumber: "Inv" + uuidv4().substring(0, 5),
        },
        {
          headers: await this.bkash_headers(),
        }
      );
      return res.status(200).json({ bkashURL: data.bkashURL });
    } catch (error) {
      return res.status(401).json({ error: error.message });
    }
  };

  call_back = async (req, res) => {
    const { paymentID, status } = req.query;
    const studentData = globals.getValue("studentData");

    if (status === "cancel" || status === "failure") {
      return res.redirect(
        `http://localhost:5173/paymentError?message=${status}`
      );
    }
    if (status === "success") {
      try {
        const { data } = await axios.post(
          process.env.bkash_execute_payment_url,
          { paymentID },
          {
            headers: await this.bkash_headers(),
          }
        );

        if (data && data.statusCode === "0000") {
          const paymentData = {
            board_roll: studentData.board_roll,
            paymentID,
            trxID: data.trxID,
          };

          const paymentsCollection = db.paymentsCollection();
          const result = await paymentsCollection.insertOne(paymentData);
          if (result.insertedId) {
            const redirectURL = `http://localhost:5173/paymentSuccess?payment=${JSON.stringify(
              data.trxID
            )}`;

            return res.redirect(redirectURL);
          } else {
            return res.redirect(
              `http://localhost:5173/paymentError?message=Failed to save database`
            );
          }
        } else {
          return res.redirect(
            `http://localhost:5173/paymentError?message=${data.statusMessage}`
          );
        }
      } catch (error) {
        return res.redirect(
          `http://localhost:5173/paymentError?message=${error.message}`
        );
      }
    }
  };
}

module.exports = new paymentController();
