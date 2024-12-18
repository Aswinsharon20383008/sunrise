import { encode } from 'js-base64';
import {
  ACCESS_TOKEN,
  CUSTOMER,
  REFRESH_TOKEN,
} from '../constants';
import config from '../../sunrise.config';
import fetch from 'isomorphic-fetch';
// import {
//   createGroup,
//   createPromiseSessionCache,
// } from './group';


const createAuth = (au) => encode(`${au.id}:${au.secret}`);
const au = {
  id: config.ct.auth.credentials.clientId,
  secret: config.ct.auth.credentials.clientSecret,
  scope: config.ct.auth.scope,
  projectKey: config.ct.auth.projectKey,
  authUrl: config.ct.auth.host,
};

const saveToken = ({ access_token, refresh_token }) => {
  access_token &&
    localStorage.setItem(ACCESS_TOKEN, access_token);
  refresh_token &&
    localStorage.setItem(REFRESH_TOKEN, refresh_token);
  return access_token;

};
export const resetToken = () => {
  localStorage.removeItem(ACCESS_TOKEN);
  localStorage.removeItem(REFRESH_TOKEN);
};
// const group = createGroup(createPromiseSessionCache());
export const group = (fn, groups = new Map(), cache = true,
  getKey = (args) => JSON.stringify(args)) => (...args) => {
    const key = getKey(args);
    const existing = groups.get(key);
    if (existing) {
      return existing;
    }
    const result = fn(...args);
    result.then(
      () => !cache && groups.delete(key),
      () => !cache && groups.delete(key),
    );
    groups.set(key, result);
    return result;
  }

const getToken = () => {
  const token = localStorage.getItem(ACCESS_TOKEN);
  if (token) {
    return Promise.resolve(token);
  }
  const scope = encodeURI(au.scope);
  const auth = createAuth(au);
  return fetch(
    `${au.authUrl}/oauth/${au.projectKey}/anonymous/token`,
    {
      headers: {
        authorization: `Basic ${auth}`,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=client_credentials&scope=${scope}`,
      method: 'POST',
    }
  )
    .then((response) =>
      response.ok
        ? response.json()
        : Promise.reject(response)
    )
    .then(saveToken)
    .catch(handleError);
};

export const handleError = (error) => {
  return Promise.reject(error);
};

export const fetchWithToken = (url, options) => {
try{
  return getToken().then((token) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        authorization: `Bearer ${token}`,
      },
    }).then(
      (response) => {
        //@todo: a change may not produce 401 for brute force token trying
        //  see how we can catch an invalid token instead
        if (response.status === 401) {
          return refreshToken({
            id: config.ct.auth.credentials.clientId,
            secret: config.ct.auth.credentials.clientSecret,
            scope: config.ct.auth.scope,
            projectKey: config.ct.auth.projectKey,
            authUrl: config.ct.auth.host,
          }).then(() => {
            return fetchWithToken(url, options);
          });
        }
        return response;
      },
      (error) => {
        console.log(error)
        resetToken();
        return Promise.reject(error);
      }
    );
  }, handleError);
}catch(e){
  console.log("error fetching token",e)
}
};
const refreshToken = (au) => {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN);
  const auth = createAuth(au);
  if (!refreshToken) {
    resetToken();
    return Promise.reject('no refresh token');
  }
  return fetch(`${au.authUrl}/oauth/token`, {
    headers: {
      authorization: `Basic ${auth}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=refresh_token&refresh_token=${refreshToken}`,
    method: 'POST',
  })
    .then((response) => response.json())
    .then((token) => {
      if (token?.error) {
        resetToken();
        return Promise.reject(token.error);
      }
      saveToken(token);
    });
};
export const loginToken = (email, password) => {
  const auth = createAuth(au);
  return fetch(
    `${au.authUrl}/oauth/${au.projectKey}/customers/token`,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        authorization: `Basic ${auth}`,
      },
      body: new URLSearchParams({
        username: email,
        password,
        grant_type: 'password',
        scope: config.ct.auth.scope,
      }),
      method: 'POST',
    }
  )
    .then((response) => response.json())
    .then((response) => {
      saveToken(response);
    });
};
export const logout = () => {
  resetToken();
  localStorage.removeItem(CUSTOMER);
};
export default fetchWithToken;

export const getAuthToken = group((error) => {
  return getToken(error, 0)
    .then((token) => {
      return `Bearer ${token}`;
    });
}, new Map(), false, () => 'getAuthToken');

