/* eslint-disable no-shadow */
/* eslint-disable no-return-assign */
/* eslint-disable no-console */
/* eslint-disable no-param-reassign */
import { withToken, fetchJson, makeConfig, baseUrl } from "../../../../../../api/api";
import { Constants } from "../Constants";

const myCustomer = {
  getCustomer: withToken((id, accessToken) =>
    fetchJson(`${baseUrl}/customers/${id}`, {
      ...makeConfig(accessToken),
      method: Constants.HTTP_METHOD_GET,
    })
  ),
  updateCustomerToken: withToken(({ version, body, newExpiryMonth, newExpiryYear, isv_tokenAction }, accessToken) =>
    fetchJson(`${baseUrl}/me`, {
      ...makeConfig(accessToken),
      method: Constants.HTTP_METHOD_POST,
      body: JSON.stringify({
        version: version,
        actions: [
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_TOKENS,
            value: [JSON.stringify(body)]
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_CARD_NEW_EXPIRY_MONTH,
            value: newExpiryMonth
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_CARD_NEW_EXPIRY_YEAR,
            value: newExpiryYear
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_TOKEN_ACTION,
            value: isv_tokenAction
          }
        ],
      }),
    })
  ),
  update: withToken(({ version }, accessToken) =>
    fetchJson(`${baseUrl}/me`, {
      ...makeConfig(accessToken),
      method: Constants.HTTP_METHOD_POST,
      body: JSON.stringify({
        version: version,
        actions: [
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_TOKEN_CAPTURE_CONTEXT,
            value: Constants.EMPTY_STRING
          }
        ],
      }),
    })
  ),
  updateWithCustomData: withToken(({ version }, accessToken) =>
    fetchJson(`${baseUrl}/me`, {
      ...makeConfig(accessToken),
      method: Constants.HTTP_METHOD_POST,
      body: JSON.stringify({
        version: version,
        actions: [
          {
            action: Constants.SET_CUSTOM_TYPE,
            type: {
              key: Constants.ISV_PAYMENTS_CUSTOMER_TOKENS,
              typeId: Constants.STRING_TYPE,
            },
            fields: {
              isv_tokenCaptureContextSignature: Constants.EMPTY_STRING,
            },
          }
        ],
      }),
    })
  ),
  updateAddress: withToken(({ version, address }, accessToken) =>
    fetchJson(`${baseUrl}/me`, {
      ...makeConfig(accessToken),
      method: Constants.HTTP_METHOD_POST,
      body: JSON.stringify({
        version: version,
        actions: [
          {
            action: Constants.STRING_ADD_ADDRESS,
            address: address,
            fields: null,
          },
        ],
      }),
    })
  ),
  updateNewAddressUC: withToken(({ version, address }, accessToken) =>
    fetchJson(`${baseUrl}/me`, {
      ...makeConfig(accessToken),
      method: Constants.HTTP_METHOD_POST,
      body: JSON.stringify({
        version: version,
        actions: [
          {
            action: Constants.STRING_ADD_ADDRESS,
            address: address,
          },
        ],
      }),
    })
  ),

  resetTokenFlag: withToken(({ version, addressId, body, tokenAlias }, accessToken) =>
    fetchJson(`${baseUrl}/me`, {
      ...makeConfig(accessToken),
      method: Constants.HTTP_METHOD_POST,
      body: JSON.stringify({
        version: version,
        actions: [
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_ADDRESS_ID,
            value: addressId,
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_TOKEN,
            value: body.isv_token,
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_MASKED_PAN,
            value: body.isv_maskedPan,
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_CARD_TYPE,
            value: body.isv_cardType,
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_CARD_EXPIRY_MONTH,
            value: body.isv_cardExpiryMonth,
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_CARD_EXPIRY_YEAR,
            value: body.isv_cardExpiryYear,
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_TOKEN_ALIAS,
            value: tokenAlias,
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_CURRENCY_CODE,
            value: body.isv_currencyCode,
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_DEVICE_FINGERPRINT_ID,
            value: body.isv_deviceFingerprintId,
          },
        ],
      }),
    })
  ),

  updateAddressId: withToken(({ version, addressId, body, tokenAlias }, accessToken) =>
    fetchJson(`${baseUrl}/me`, {
      ...makeConfig(accessToken),
      method: Constants.HTTP_METHOD_POST,
      body: JSON.stringify({
        version: version,
        actions: [
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_ADDRESS_ID,
            value: addressId,
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_TOKEN,
            value: body.isv_token,
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_MASKED_PAN,
            value: body.isv_maskedPan,
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_CARD_TYPE,
            value: body.isv_cardType,
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_CARD_EXPIRY_MONTH,
            value: body.isv_cardExpiryMonth,
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_CARD_EXPIRY_YEAR,
            value: body.isv_cardExpiryYear,
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_TOKEN_ALIAS,
            value: tokenAlias,
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_CURRENCY_CODE,
            value: body.isv_currencyCode,
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_DEVICE_FINGERPRINT_ID,
            value: body.isv_deviceFingerprintId,
          },
        ],
      }),
    })
  ),
  updateAddressIdWithTokens: withToken(({ version, addressId, body, tokenAlias }, accessToken) =>
    fetchJson(`${baseUrl}/me`, {
      ...makeConfig(accessToken),
      method: Constants.HTTP_METHOD_POST,
      body: JSON.stringify({
        version: version,
        actions: [
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_ADDRESS_ID,
            value: addressId,
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_TOKENS,
            value: body.isv_tokens,
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_TOKEN,
            value: body.isv_token,
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_MASKED_PAN,
            value: body.isv_maskedPan,
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_CARD_TYPE,
            value: body.isv_cardType,
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_CARD_EXPIRY_MONTH,
            value: body.isv_cardExpiryMonth,
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_CARD_EXPIRY_YEAR,
            value: body.isv_cardExpiryYear,
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_TOKEN_ALIAS,
            value: tokenAlias,
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_CURRENCY_CODE,
            value: body.isv_currencyCode,
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_DEVICE_FINGERPRINT_ID,
            value: body.isv_deviceFingerprintId,
          },
        ],
      }),
    })
  ),
  updateAddressIdUCWithCustomType: withToken(({ version, addressId, tokenAlias, body }, accessToken) =>
    fetchJson(`${baseUrl}/me`, {
      ...makeConfig(accessToken),
      method: Constants.HTTP_METHOD_POST,
      body: JSON.stringify({
        version: version,
        actions: [
          {
            action: Constants.SET_CUSTOM_TYPE,
            type: {
              key: Constants.ISV_PAYMENTS_CUSTOMER_TOKENS,
              typeId: Constants.STRING_TYPE,
            },
            fields: {
              isv_addressId: addressId,
              isv_token: body.isv_token,
              isv_maskedPan: body.isv_maskedPan,
              isv_cardType: body.isv_cardType,
              isv_cardExpiryMonth: body.isv_cardExpiryMonth,
              isv_cardExpiryYear: body.isv_cardExpiryYear,
              isv_tokenAlias: tokenAlias,
              isv_deviceFingerprintId: body.isv_deviceFingerprintId,
            },
          }
        ],
      }),
    })
  ),

  updateAddressIdUCWithCustomTypeWithTokens: withToken(({ version, addressId, tokenAlias, body }, accessToken) =>
    fetchJson(`${baseUrl}/me`, {
      ...makeConfig(accessToken),
      method: Constants.HTTP_METHOD_POST,
      body: JSON.stringify({
        version: version,
        actions: [
          {
            action: Constants.SET_CUSTOM_TYPE,
            type: {
              key: Constants.ISV_PAYMENTS_CUSTOMER_TOKENS,
              typeId: Constants.STRING_TYPE,
            },
            fields: {
              isv_addressId: addressId,
              isv_token: body.isv_token,
              isv_maskedPan: body.isv_maskedPan,
              isv_cardType: body.isv_cardType,
              isv_cardExpiryMonth: body.isv_cardExpiryMonth,
              isv_cardExpiryYear: body.isv_cardExpiryYear,
              isv_tokenAlias: tokenAlias,
              isv_deviceFingerprintId: body.isv_deviceFingerprintId,
              isv_tokens: body.isv_tokens
            },
          }
        ],
      }),
    })
  ),

  newCustomFunction: withToken(({ version, addressId, tokenAlias, customPresent, body }, accessToken) => {
    var response;
    console.log("INSIDE CUSTOM FUNCTION");
    if (customPresent) {
      console.log("CUSTOM FIELD PRESENT");
      if (body?.isv_tokens && body?.isv_failedTokens) {
        console.log("ONE");
        response = fetchJson(`${baseUrl}/me`, {
          ...makeConfig(accessToken),
          method: Constants.HTTP_METHOD_POST,
          body: JSON.stringify({
            version: version,
            actions: [
              {
                action: Constants.SET_CUSTOM_FIELD,
                name: Constants.ISV_ADDRESS_ID,
                value: addressId,
              },
              {
                action: Constants.SET_CUSTOM_FIELD,
                name: Constants.ISV_TOKEN,
                value: body.isv_token,
              },
              {
                action: Constants.SET_CUSTOM_FIELD,
                name: Constants.ISV_MASKED_PAN,
                value: body.isv_maskedPan,
              },
              {
                action: Constants.SET_CUSTOM_FIELD,
                name: Constants.ISV_CARD_TYPE,
                value: body.isv_cardType,
              },
              {
                action: Constants.SET_CUSTOM_FIELD,
                name: Constants.ISV_CARD_EXPIRY_MONTH,
                value: body.isv_cardExpiryMonth,
              },
              {
                action: Constants.SET_CUSTOM_FIELD,
                name: Constants.ISV_CARD_EXPIRY_YEAR,
                value: body.isv_cardExpiryYear,
              },
              {
                action: Constants.SET_CUSTOM_FIELD,
                name: Constants.ISV_TOKEN_ALIAS,
                value: tokenAlias,
              },
              {
                action: Constants.SET_CUSTOM_FIELD,
                name: Constants.ISV_DEVICE_FINGERPRINT_ID,
                value: body.isv_deviceFingerprintId,
              },
              {
                action: Constants.SET_CUSTOM_FIELD,
                name: Constants.ISV_CURRENCY_CODE,
                value: body.isv_currencyCode,
              },
              {
                action: Constants.SET_CUSTOM_FIELD,
                name: Constants.ISV_TOKENS,
                value: body.isv_tokens,
              },
              {
                action: Constants.SET_CUSTOM_FIELD,
                name: Constants.ISV_FAILED_TOKENS,
                value: body.isv_failedTokens,
              }
            ],
          }),
        })
      } else if (body?.isv_tokens && !body?.isv_failedTokens) {
        console.log("TWO");
        response = fetchJson(`${baseUrl}/me`, {
          ...makeConfig(accessToken),
          method: Constants.HTTP_METHOD_POST,
          body: JSON.stringify({
            version: version,
            actions: [
              {
                action: Constants.SET_CUSTOM_FIELD,
                name: Constants.ISV_ADDRESS_ID,
                value: addressId,
              },
              {
                action: Constants.SET_CUSTOM_FIELD,
                name: Constants.ISV_TOKEN,
                value: body.isv_token,
              },
              {
                action: Constants.SET_CUSTOM_FIELD,
                name: Constants.ISV_MASKED_PAN,
                value: body.isv_maskedPan,
              },
              {
                action: Constants.SET_CUSTOM_FIELD,
                name: Constants.ISV_CARD_TYPE,
                value: body.isv_cardType,
              },
              {
                action: Constants.SET_CUSTOM_FIELD,
                name: Constants.ISV_CARD_EXPIRY_MONTH,
                value: body.isv_cardExpiryMonth,
              },
              {
                action: Constants.SET_CUSTOM_FIELD,
                name: Constants.ISV_CARD_EXPIRY_YEAR,
                value: body.isv_cardExpiryYear,
              },
              {
                action: Constants.SET_CUSTOM_FIELD,
                name: Constants.ISV_TOKEN_ALIAS,
                value: tokenAlias,
              },
              {
                action: Constants.SET_CUSTOM_FIELD,
                name: Constants.ISV_DEVICE_FINGERPRINT_ID,
                value: body.isv_deviceFingerprintId,
              },
              {
                action: Constants.SET_CUSTOM_FIELD,
                name: Constants.ISV_CURRENCY_CODE,
                value: body.isv_currencyCode,
              },
              {
                action: Constants.SET_CUSTOM_FIELD,
                name: Constants.ISV_TOKENS,
                value: body.isv_tokens,
              }
            ],
          }),
        })
      } else if (!body?.isv_tokens && body?.isv_failedTokens) {
        console.log("THREE");
        response = fetchJson(`${baseUrl}/me`, {
          ...makeConfig(accessToken),
          method: Constants.HTTP_METHOD_POST,
          body: JSON.stringify({
            version: version,
            actions: [
              {
                action: Constants.SET_CUSTOM_FIELD,
                name: Constants.ISV_ADDRESS_ID,
                value: addressId,
              },
              {
                action: Constants.SET_CUSTOM_FIELD,
                name: Constants.ISV_TOKEN,
                value: body.isv_token,
              },
              {
                action: Constants.SET_CUSTOM_FIELD,
                name: Constants.ISV_MASKED_PAN,
                value: body.isv_maskedPan,
              },
              {
                action: Constants.SET_CUSTOM_FIELD,
                name: Constants.ISV_CARD_TYPE,
                value: body.isv_cardType,
              },
              {
                action: Constants.SET_CUSTOM_FIELD,
                name: Constants.ISV_CARD_EXPIRY_MONTH,
                value: body.isv_cardExpiryMonth,
              },
              {
                action: Constants.SET_CUSTOM_FIELD,
                name: Constants.ISV_CARD_EXPIRY_YEAR,
                value: body.isv_cardExpiryYear,
              },
              {
                action: Constants.SET_CUSTOM_FIELD,
                name: Constants.ISV_TOKEN_ALIAS,
                value: tokenAlias,
              },
              {
                action: Constants.SET_CUSTOM_FIELD,
                name: Constants.ISV_DEVICE_FINGERPRINT_ID,
                value: body.isv_deviceFingerprintId,
              },
              {
                action: Constants.SET_CUSTOM_FIELD,
                name: Constants.ISV_CURRENCY_CODE,
                value: body.isv_currencyCode,
              },
              {
                action: Constants.SET_CUSTOM_FIELD,
                name: Constants.ISV_FAILED_TOKENS,
                value: body.isv_failedTokens,
              }
            ],
          }),
        })
      } else {
        console.log("FOUR");
        response = fetchJson(`${baseUrl}/me`, {
          ...makeConfig(accessToken),
          method: Constants.HTTP_METHOD_POST,
          body: JSON.stringify({
            version: version,
            actions: [
              {
                action: Constants.SET_CUSTOM_FIELD,
                name: Constants.ISV_ADDRESS_ID,
                value: addressId,
              },
              {
                action: Constants.SET_CUSTOM_FIELD,
                name: Constants.ISV_TOKEN,
                value: body.isv_token,
              },
              {
                action: Constants.SET_CUSTOM_FIELD,
                name: Constants.ISV_MASKED_PAN,
                value: body.isv_maskedPan,
              },
              {
                action: Constants.SET_CUSTOM_FIELD,
                name: Constants.ISV_CARD_TYPE,
                value: body.isv_cardType,
              },
              {
                action: Constants.SET_CUSTOM_FIELD,
                name: Constants.ISV_CARD_EXPIRY_MONTH,
                value: body.isv_cardExpiryMonth,
              },
              {
                action: Constants.SET_CUSTOM_FIELD,
                name: Constants.ISV_CARD_EXPIRY_YEAR,
                value: body.isv_cardExpiryYear,
              },
              {
                action: Constants.SET_CUSTOM_FIELD,
                name: Constants.ISV_TOKEN_ALIAS,
                value: tokenAlias,
              },
              {
                action: Constants.SET_CUSTOM_FIELD,
                name: Constants.ISV_DEVICE_FINGERPRINT_ID,
                value: body.isv_deviceFingerprintId,
              },
              {
                action: Constants.SET_CUSTOM_FIELD,
                name: Constants.ISV_CURRENCY_CODE,
                value: body.isv_currencyCode,
              }
            ],
          }),
        })
      }
    } else {
      console.log("CUSTOM FIELD NOT PRESENT");
      if (body?.isv_tokens && body?.isv_failedTokens) {
        console.log("ONE");
        response = fetchJson(`${baseUrl}/me`, {
          ...makeConfig(accessToken),
          method: Constants.HTTP_METHOD_POST,
          body: JSON.stringify({
            version: version,
            actions: [
              {
                action: Constants.SET_CUSTOM_TYPE,
                type: {
                  key: Constants.ISV_PAYMENTS_CUSTOMER_TOKENS,
                  typeId: Constants.STRING_TYPE,
                },
                fields: {
                  isv_addressId: addressId,
                  isv_token: body.isv_token,
                  isv_maskedPan: body.isv_maskedPan,
                  isv_cardType: body.isv_cardType,
                  isv_cardExpiryMonth: body.isv_cardExpiryMonth,
                  isv_cardExpiryYear: body.isv_cardExpiryYear,
                  isv_tokenAlias: tokenAlias,
                  isv_deviceFingerprintId: body.isv_deviceFingerprintId,
                  isv_tokens: body.isv_tokens,
                  isv_failedTokens: body.isv_failedTokens,
                  isv_currencyCode: body.isv_currencyCode,
                },
              }
            ],
          }),
        })
      } else if (body?.isv_tokens && !body?.isv_failedTokens) {
        console.log("TWO");
        response = fetchJson(`${baseUrl}/me`, {
          ...makeConfig(accessToken),
          method: Constants.HTTP_METHOD_POST,
          body: JSON.stringify({
            version: version,
            actions: [
              {
                action: Constants.SET_CUSTOM_TYPE,
                type: {
                  key: Constants.ISV_PAYMENTS_CUSTOMER_TOKENS,
                  typeId: Constants.STRING_TYPE,
                },
                fields: {
                  isv_addressId: addressId,
                  isv_token: body.isv_token,
                  isv_maskedPan: body.isv_maskedPan,
                  isv_cardType: body.isv_cardType,
                  isv_cardExpiryMonth: body.isv_cardExpiryMonth,
                  isv_cardExpiryYear: body.isv_cardExpiryYear,
                  isv_tokenAlias: tokenAlias,
                  isv_deviceFingerprintId: body.isv_deviceFingerprintId,
                  isv_tokens: body.isv_tokens,
                  isv_currencyCode: body.isv_currencyCode,
                },
              }
            ],
          }),
        })
      } else if (!body?.isv_tokens && body?.isv_failedTokens) {
        console.log("THREE");
        response = fetchJson(`${baseUrl}/me`, {
          ...makeConfig(accessToken),
          method: Constants.HTTP_METHOD_POST,
          body: JSON.stringify({
            version: version,
            actions: [
              {
                action: Constants.SET_CUSTOM_TYPE,
                type: {
                  key: Constants.ISV_PAYMENTS_CUSTOMER_TOKENS,
                  typeId: Constants.STRING_TYPE,
                },
                fields: {
                  isv_addressId: addressId,
                  isv_token: body.isv_token,
                  isv_maskedPan: body.isv_maskedPan,
                  isv_cardType: body.isv_cardType,
                  isv_cardExpiryMonth: body.isv_cardExpiryMonth,
                  isv_cardExpiryYear: body.isv_cardExpiryYear,
                  isv_tokenAlias: tokenAlias,
                  isv_deviceFingerprintId: body.isv_deviceFingerprintId,
                  isv_failedTokens: body.isv_failedTokens,
                  isv_currencyCode: body.isv_currencyCode,
                },
              }
            ],
          }),
        })
      } else {
        console.log("FOUR");
        response = fetchJson(`${baseUrl}/me`, {
          ...makeConfig(accessToken),
          method: Constants.HTTP_METHOD_POST,
          body: JSON.stringify({
            version: version,
            actions: [
              {
                action: Constants.SET_CUSTOM_TYPE,
                type: {
                  key: Constants.ISV_PAYMENTS_CUSTOMER_TOKENS,
                  typeId: Constants.STRING_TYPE,
                },
                fields: {
                  isv_addressId: addressId,
                  isv_token: body.isv_token,
                  isv_maskedPan: body.isv_maskedPan,
                  isv_cardType: body.isv_cardType,
                  isv_cardExpiryMonth: body.isv_cardExpiryMonth,
                  isv_cardExpiryYear: body.isv_cardExpiryYear,
                  isv_tokenAlias: tokenAlias,
                  isv_deviceFingerprintId: body.isv_deviceFingerprintId,
                  isv_currencyCode: body.isv_currencyCode,
                },
              }
            ],
          }),
        })
      }
    }


    return response;
  }


  ),

  updateAddressIdWithUC: withToken(({ version, isv_tokens }, accessToken) =>
    fetchJson(`${baseUrl}/me`, {
      ...makeConfig(accessToken),
      method: Constants.HTTP_METHOD_POST,
      body: JSON.stringify({
        version: version,
        actions: [
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_TOKENS,
            value: isv_tokens,
          }
        ],
      }),
    })
  ),
  deleteCustomerToken: withToken(({ version, body, isv_tokenAction }, accessToken) =>
    fetchJson(`${baseUrl}/me`, {
      ...makeConfig(accessToken),
      method: Constants.HTTP_METHOD_POST,
      body: JSON.stringify({
        version: version,
        actions: [
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_TOKENS,
            value: [JSON.stringify(body)]
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_TOKEN_ACTION,
            value: isv_tokenAction
          }
        ],
      }),
    })
  ),
};


export default myCustomer;
