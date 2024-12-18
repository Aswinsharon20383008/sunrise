import None from "./None/None.vue";

let Payment = None;
if (process.env.VUE_APP_USE_ADYEN) {
  Payment = require("./Adyen/Adyen.vue").default;
} else if ("true" == process.env.VUE_APP_USE_ISV_PAYMENT) {
  Payment = require("./IsvPayment/IsvPayment.vue").default;
}
export default Payment;
