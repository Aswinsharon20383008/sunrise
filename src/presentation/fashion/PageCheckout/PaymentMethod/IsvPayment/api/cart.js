/* eslint-disable no-shadow */
/* eslint-disable no-return-assign */
/* eslint-disable no-param-reassign */
import {
  withToken,
  fetchJson,
  makeConfig,
  baseUrl,
} from "../../../../../../api/api";
import { Constants } from "../Constants";

const myCart = {
  get: withToken((id, accessToken) =>
    fetchJson(`${baseUrl}/me/carts/${id}`, {
      ...makeConfig(accessToken),
      method: Constants.HTTP_METHOD_GET,
    })
  ),
  update: withToken((id, version, language, accessToken) =>
    fetchJson(`${baseUrl}/me/carts/${id}`, {
      ...makeConfig(accessToken),
      method: Constants.HTTP_METHOD_POST,
      body: JSON.stringify({
        version: version,
        actions: [{
          action: Constants.STRING_SET_LOCALE,
          locale: language,
        }]
      })
    })
  ),
  getCart: withToken((id, accessToken) =>
    fetchJson(`${baseUrl}/carts/${id}`, {
      ...makeConfig(accessToken),
      method: Constants.HTTP_METHOD_GET,
    })
  ),
  addShippingMethod: withToken(({ id, version, updateActions }, accessToken) =>
    fetchJson(`${baseUrl}/carts/${id}`, {
      ...makeConfig(accessToken),
      method: Constants.HTTP_METHOD_POST,
      body: JSON.stringify({
        version: version,
        actions: updateActions
      })
    })
  ),
  setBillingAddress: withToken(({ id, version, body }, accessToken) =>
    fetchJson(`${baseUrl}/carts/${id}`, {
      ...makeConfig(accessToken),
      method: Constants.HTTP_METHOD_POST,
      body: JSON.stringify({
        version: version,
        actions: [{
          action: "setBillingAddress",
          address: {
            firstName: body.firstName,
            lastName: body.lastName,
            streetName: body.streetName,
            postalCode: body.postalCode,
            city: body.city,
            region: body.region,
            country: body.country,
            email: body.email,
            phone: body.phone
          }
        }]
      })
    })
  ),
  setLineItemShippingDetails: withToken(({ id, version, updateActions }, accessToken) =>
    fetchJson(`${baseUrl}/carts/${id}`, {
      ...makeConfig(accessToken),
      method: Constants.HTTP_METHOD_POST,
      body: JSON.stringify({
        version: version,
        actions: updateActions
      })
    })
  ),
  addItemShippingAddress: withToken(({ id, version, updateActions }, accessToken) =>
    fetchJson(`${baseUrl}/carts/${id}`, {
      ...makeConfig(accessToken),
      method: Constants.HTTP_METHOD_POST,
      body: JSON.stringify({
        version: version,
        actions: updateActions
      })
    })
  ),
};

export default myCart;
