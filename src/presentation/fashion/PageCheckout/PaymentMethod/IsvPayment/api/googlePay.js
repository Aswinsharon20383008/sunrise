/*eslint-disable no-console*/
/* eslint-disable no-unused-vars */

import { Constants } from "../Constants";
var currencyCode;

const googlePayResponse = {
  onGooglePayLoaded(currencyCodeData) {
    var thisContext = this;
    currencyCode = currencyCodeData;
    try {
      console.log(
        "line 35Window.mycontext",
        window.mycontext,
        window.mycontext.getGooglePaymentsClient()
      );
      const paymentsClient = window.mycontext.getGooglePaymentsClient();
      paymentsClient
        .isReadyToPay(window.mycontext.getGoogleIsReadyToPayRequest())
        .then(function (response) {
          if (response.result) {
            thisContext.addGooglePayButton();
            thisContext.prefetchGooglePaymentData();
          } else {
            window.mycontext.error = Constants.ERROR_MSG_GOOGLE_PAY;
          }
        })
        .catch(function (error) {
          window.mycontext.error = Constants.ERROR_MSG_GOOGLE_PAY_LOADING;
        });
    } catch (err) {
      console.log(err);
    }
  },
  addGooglePayButton() {
    var thisContext = this;
    var googlePayButton = document.getElementById("container");
    if (googlePayButton.hasChildNodes()) {
      googlePayButton.removeChild(googlePayButton.firstChild);
    }
    const paymentsClient = window.mycontext.getGooglePaymentsClient();
    const button = paymentsClient.createButton({
      onClick: this.onGooglePaymentButtonClicked,
    });
    document.getElementById("container").appendChild(button);
  },
  async prefetchGooglePaymentData() {
    const paymentDataRequest = await window.mycontext.getGooglePaymentDataRequest();
    paymentDataRequest.transactionInfo = {
      totalPriceStatus: Constants.GOOGLE_PAY_TOTAL_PRICE_STATUS_UNKNOWN,
      currencyCode: currencyCode,
    };
    const paymentsClient = window.mycontext.getGooglePaymentsClient();
    paymentsClient.prefetchPaymentData(paymentDataRequest);
  },
  async onGooglePaymentButtonClicked() {

    const paymentDataRequest = await window.mycontext.getGooglePaymentDataRequest();
    console.log('paymentDataRequest', JSON.stringify(paymentDataRequest, null, 2))
    const paymentsClient = window.mycontext.getGooglePaymentsClient();
    paymentsClient.loadPaymentData(paymentDataRequest);
  }, //TODO: FIX removed gpay func
};
export default googlePayResponse;
