/*eslint-disable no-console*/
/* eslint-disable no-unused-vars */

import { Constants } from "../Constants";
var currencyCode;

const googlePayResponse = {
    onGooglePayLoaded(currencyCodeData) {
        var thisContext = this;
        currencyCode = currencyCodeData;
        try {
            const paymentsClient = window.mycontext.getGooglePaymentsClient();
            paymentsClient.isReadyToPay(window.mycontext.getGoogleIsReadyToPayRequest())
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
        var googlePayButton = document.getElementById('container');
        if (googlePayButton.hasChildNodes()) {
            googlePayButton.removeChild(googlePayButton.firstChild);
        }
        const paymentsClient = window.mycontext.getGooglePaymentsClient();
        const button =
            paymentsClient.createButton({
                onClick: this.onGooglePaymentButtonClicked
            });
        document.getElementById('container').appendChild(button);
    },
    prefetchGooglePaymentData() {
        const paymentDataRequest = window.mycontext.getGooglePaymentDataRequest();
        paymentDataRequest.transactionInfo = {
            totalPriceStatus: Constants.GOOGLE_PAY_TOTAL_PRICE_STATUS_UNKNOWN,
            currencyCode: currencyCode
        }
        const paymentsClient = window.mycontext.getGooglePaymentsClient();
        paymentsClient.prefetchPaymentData(paymentDataRequest);
    },

    onGooglePaymentButtonClicked() {
        const paymentDataRequest = window.mycontext.getGooglePaymentDataRequest();
        paymentDataRequest.transactionInfo = window.mycontext.getGoogleTransactionInfo();
        const paymentsClient = window.mycontext.getGooglePaymentsClient();
        paymentsClient.loadPaymentData(paymentDataRequest);
    },
}
export default googlePayResponse;       