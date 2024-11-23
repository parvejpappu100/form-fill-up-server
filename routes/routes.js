const router = require("express").Router();
const paymentController = require("../controller/paymentController");
const middleware = require("../middleware/middleware");
const globals = require("node-global-storage");


router.post("/bkash/payment/create",middleware.bkash_auth, paymentController.payment_create);
router.get("/bkash/payment/callback",middleware.bkash_auth, paymentController.call_back);


router.post("/store-student-data", async (req, res) => {
    const { studentData } = req.body;
    // globals.set("studentData", studentData);
    globals.setValue("studentData", studentData)

    res.status(200).send({ success: true });
});



module.exports = router;