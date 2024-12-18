/* eslint-disable no-shadow */
/* eslint-disable no-return-assign */
/* eslint-disable no-param-reassign */
/*eslint-disable no-console*/
import {
  withToken,
  fetchJson,
  makeConfig,
  baseUrl,
} from "../../../../../../api/api";
import { Constants } from "../Constants";

const myShippings = {
  queryShippingMethods: withToken((accessToken) =>
    fetchJson(`${baseUrl}/shipping-methods`, {
      ...makeConfig(accessToken),
      method: Constants.HTTP_METHOD_GET,
    })
  ),
}

export default myShippings;