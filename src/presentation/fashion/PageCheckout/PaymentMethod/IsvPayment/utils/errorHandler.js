import { Constants } from "../Constants";

export function handleError(statusCode, loading, error) {
  loading = false;
  if (Constants.NUMBER_FIVE_ZERO_TWO === statusCode) {
    error = Constants.ERROR_MSG_FIVE_ZERO_TWO;
  } else if (Constants.NUMBER_FIVE_ZERO_FOUR === statusCode) {
    error = Constants.ERROR_MSG_FIVE_ZERO_FOUR;
  } else {
    error = Constants.ERROR_MSG_SUNRISE;
  }
  return {loading,error}
}
