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
          callbackURL: "https://form-fill-up-server.vercel.app/api/bkash/payment/callback",
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
        `https://form-fill-up-f743f.web.app/paymentError?message=${status}`
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
            name: studentData.name,
            board_roll: studentData.board_roll,
            registration: studentData.registration,
            image: studentData.image,
            semester: studentData.semester,
            shift: studentData.shift,
            section: studentData.section,
            phone: studentData.phone,
            father_name: studentData.father_name,
            mother_name: studentData.mother_name,
            session: studentData.session,
            regulation: studentData.regulation,
            examinee_type: studentData.examinee_type,
            department: studentData.department,
            technology_code: "85",
            paymentID,
            trxID: data.trxID,
          };

          const paymentsCollection = db.paymentsCollection();
          const result = await paymentsCollection.insertOne(paymentData);
          if (result.insertedId) {
            const redirectURL = `https://form-fill-up-f743f.web.app/paymentSuccess?payment=${JSON.stringify(
              data.trxID
            )}`;

            return res.redirect(redirectURL);
          } else {
            return res.redirect(
              `https://form-fill-up-f743f.web.app/paymentError?message=Failed to save database`
            );
          }
        } else {
          return res.redirect(
            `https://form-fill-up-f743f.web.app/paymentError?message=${data.statusMessage}`
          );
        }
      } catch (error) {
        return res.redirect(
          `https://form-fill-up-f743f.web.app/paymentError?message=${error.message}`
        );
      }
    }
  };
}

module.exports = new paymentController();
