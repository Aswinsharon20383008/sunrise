/*eslint-disable no-console*/
// import { Constants } from "../Constants";
// import { fetchJson } from "../../../../../api/api";
import axios from "axios";
// const GetIpAddressURL = Constants.IP_ADDRESS_URL;
const getIpAddress = async function () {
    // const response = await fetchJson(GetIpAddressURL, {
    //     method: Constants.HTTP_METHOD_GET,//todo:remove commen
    // })
    return '192.168.1.1';
}
const getCaptureContext = async (cartId, merchantId, country, locale, currencyCode) => {
    let response;
    const getCaptureContextURL = process.env.VUE_APP_USE_DESTINATION_URL;
    const headerValue = process.env.VUE_APP_USE_EXTENSION_HEADER_VALUE;
    const headers = {
        "Content-Type": "application/json",
        authorization: `Bearer ${headerValue}`,
    }
    if (cartId && merchantId) {
        console.log('under 1');
        response = await axios.post(getCaptureContextURL + '/captureContext', JSON.stringify({
            cartId: cartId,
            merchantId: merchantId
        }), { headers });
    } else if (cartId && !merchantId) { // to test this case, pass merchantId field as null from IvPayments.js file
        console.log('under 2');
        response = await axios.post(getCaptureContextURL + '/captureContext', JSON.stringify({
            cartId: cartId,
        }), { headers })
    } else {
        response = await axios.post(getCaptureContextURL + '/captureContext', JSON.stringify({
            cartId: cartId,
            country: country,
            locale: locale,
            currency: currencyCode
        }), { headers })
    }
    console.log(response);
    return response.data;
}

//TODO:Paypal
const createOrder = async (merchantId, cardId, paymentType) => {
    let response;
    // const getSessionUrl = process.env.VUE_APP_USE_DESTINATION_URL + '/createOrder';
    const getSessionUrl = 'http://localhost:3000/createOrder'
    const headerValue = process.env.VUE_APP_USE_EXTENSION_HEADER_VALUE;
    const saleFlagEnabled = process.env.VUE_APP_USE_SALE;
    const headers = {
        "Content-Type": "application/json",
        authorization: `Bearer ${headerValue}`,
    }
    if (cardId && merchantId) {
        response = await axios.post(getSessionUrl, JSON.stringify({
            cardId: cardId,
            merchantId: merchantId,
            paymentType: paymentType,
            isSale: saleFlagEnabled
        }), { headers });
    } else if (cardId && !merchantId) { // to test this case, pass merchantId field as null from IvPayments.js file
        response = await axios.post(getSessionUrl, JSON.stringify({
            cartId: cardId,
            paymentType: paymentType,
            isSale: saleFlagEnabled
        }), { headers })
    }
    console.log(response);
    return response.data;
}


export default { getIpAddress, getCaptureContext, createOrder }