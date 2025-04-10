// Added to check if doc or xwalk.
import { getMetadata } from './aem.js';

const aemxwalk = getMetadata('aemxwalk');
/* eslint-disable-next-line no-console */
console.log(`Are we delivering from crosswalk? ${aemxwalk}`);

const ALLOWED_CONFIGS = ['prod', 'stage', 'dev'];

/**
 * This function calculates the environment in which the site is running based on the URL.
 * It defaults to 'prod'. In non 'prod' environments, the value can be overwritten using
 * the 'environment' key in sessionStorage.
 *
 * @returns {string} - environment identifier (dev, stage or prod'.
 */
export const calcEnvironment = () => {
  const { host, href } = window.location;
  let environment = 'prod';
  if (href.includes('.aem.page') || host.includes('staging') || host.includes('.hlx.page')) {
    environment = 'stage';
  }
  if (href.includes('localhost')) {
    environment = 'dev';
  }

  const environmentFromConfig = window.sessionStorage.getItem('environment');
  if (
    environmentFromConfig
    && ALLOWED_CONFIGS.includes(environmentFromConfig)
    && environment !== 'prod'
  ) {
    return environmentFromConfig;
  }

  return environment;
};

function buildConfigURL(environment) {
  const env = environment || calcEnvironment();
  let fileName = 'configs.json';

  if (aemxwalk === 'false') {
    fileName = 'configs.json?sheet=prod';
  }

  if (env !== 'prod') {
    fileName = `configs-${env}.json`;
  }
  /* eslint-disable-next-line no-use-before-define */
  if (getAemAuthorEnv()) {
    // eslint-disable-next-line no-use-before-define
    const aemContentPath = getAemContentPath();
    return new URL(`${window.location.origin}${aemContentPath}/${fileName}`);
  }
  const configURL = new URL(`${window.location.origin}/${fileName}`);
  return configURL;
}

const getConfigForEnvironment = async (environment) => {
  const env = environment || calcEnvironment();

  try {
    const configJSON = window.sessionStorage.getItem(`config:${env}`);
    if (!configJSON) {
      throw new Error('No config in session storage');
    }

    const parsedConfig = JSON.parse(configJSON);
    if (!parsedConfig[':expiry'] || parsedConfig[':expiry'] < Math.round(Date.now() / 1000)) {
      throw new Error('Config expired');
    }

    return parsedConfig;
  } catch (e) {
    let configJSON = await fetch(buildConfigURL(env));
    if (!configJSON.ok) {
      throw new Error(`Failed to fetch config for ${env}`);
    }
    configJSON = await configJSON.json();
    configJSON[':expiry'] = Math.round(Date.now() / 1000) + 7200;
    window.sessionStorage.setItem(`config:${env}`, JSON.stringify(configJSON));
    return configJSON;
  }
};

/**
 * This function retrieves a configuration value for a given environment.
 *
 * @param {string} configParam - The configuration parameter to retrieve.
 * @param {string} [environment] - Optional, overwrite the current environment.
 * @returns {Promise<string|undefined>} - The value of the configuration parameter, or undefined.
 */
export const getConfigValue = async (configParam, environment) => {
  const env = environment || calcEnvironment();
  const config = await getConfigForEnvironment(env);
  const configElements = config.data || config[env].data;
  return configElements.find((c) => c.key === configParam)?.value;
};

/**
 * Retrieves headers from config entries like commerce.headers.pdp.my-header, etc and
 * returns as object of all headers like { my-header: value, ... }
*/
export const getHeaders = async (scope, environment) => {
  const env = environment || calcEnvironment();
  const config = await getConfigForEnvironment(env);
  const envConfig = config.data || config[env].data;
  const configElements = envConfig.filter((el) => el?.key.includes(`headers.${scope}`));

  return configElements.reduce((obj, item) => {
    let { key } = item;
    if (key.includes(`commerce.headers.${scope}.`)) {
      key = key.replace(`commerce.headers.${scope}.`, '');
    }
    return { ...obj, [key]: item.value };
  }, {});
};

export const getCookie = (cookieName) => {
  const cookies = document.cookie.split(';');
  let foundValue;

  cookies.forEach((cookie) => {
    const [name, value] = cookie.trim().split('=');
    if (name === cookieName) {
      foundValue = decodeURIComponent(value);
    }
  });

  return foundValue;
};

export const checkIsAuthenticated = () => !!getCookie('auth_dropin_user_token') ?? false;

export const getAemContentPath = () => {
  let authorContentPath = '/content';
  if (window.hlx && window.hlx.codeBasePath) {
    /* eslint-disable-next-line prefer-destructuring */
    authorContentPath = window.hlx.codeBasePath.match(/^[^.]+/)[0];
    /* eslint-disable-next-line no-console */
    console.log(`In configs.js, is in AEM author env, so determine content path via hlx: ${authorContentPath}`);
  } else if (window.location && window.location.pathname) {
    let pathComponents = window.location.pathname.split('/');
    pathComponents = pathComponents.filter((component) => component !== '');
    const firstTwoElements = pathComponents.slice(0, 2).join('/');
    authorContentPath = `/${firstTwoElements}`;
    /* eslint-disable-next-line no-console */
    console.log(`In configs.js, is in AEM author env, so determine content path via location: ${authorContentPath}`);
  }
  return authorContentPath;
};

export const getAemAuthorEnv = () => {
  const { href } = window.location;
  const aemEnvReg = /https?:\/\/author-(p\d{3,8})-(e\d{3,8}).+/i;
  const isAemAuthorEnv = aemEnvReg.test(href);
  /* eslint-disable-next-line no-console */
  console.log(`In configs.js, is in AEM author env: ${isAemAuthorEnv}`);
  return isAemAuthorEnv;
};
