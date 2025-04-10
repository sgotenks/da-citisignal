/* eslint-disable import/prefer-default-export */
import * as authApi from '@dropins/storefront-auth/api.js';
import { render as authRenderer } from '@dropins/storefront-auth/render.js';
import { SignIn } from '@dropins/storefront-auth/containers/SignIn.js';
import { events } from '@dropins/tools/event-bus.js';
import { getCookie } from '../../scripts/configs.js';
import { CUSTOMER_FORGOTPASSWORD_PATH } from '../../scripts/constants.js';

function checkAndRedirect(redirections) {
  Object.entries(redirections).some(([currentPath, redirectPath]) => {
    if (window.location.pathname.includes(currentPath)) {
      window.location.href = redirectPath;
      return true;
    }
    return false;
  });
}

function renderSignIn(element) {
  authRenderer.render(SignIn, {
    onSuccessCallback: () => {},
    formSize: 'small',
    routeForgotPassword: () => CUSTOMER_FORGOTPASSWORD_PATH,
  })(element);
}

export function renderAuthDropdown() {
  const dropdownElement = document.createRange().createContextualFragment(`
 <div class="dropdown-wrapper nav-tools-wrapper">
    <button type="button" class="nav-dropdown-button" aria-haspopup="dialog" aria-expanded="false" aria-controls="login-modal"></button>
    <div class="nav-auth-modal-wrapper">
      <div class="nav-auth-menu-panel nav-tools-panel">
        <div id="auth-dropin-container"></div>
        <ul class="authenticated-user-menu">
          <li><a href="/customer/account">My Account</a></li>
            <li><button>Logout</button></li>
        </ul>
      </div>
    </div>
 </div>`);

  const topNav = document.querySelector('.header > .default-content-wrapper');
  topNav.insertBefore(dropdownElement, topNav.lastElementChild);

  let authDropDownPanel = topNav.querySelector('.nav-auth-menu-panel');
  const authDropDownMenuList = topNav.querySelector(
    '.authenticated-user-menu',
  );
  const authDropinContainer = topNav.querySelector('#auth-dropin-container');
  const loginButton = topNav.querySelector('.nav-dropdown-button');
  const logoutButtonElement = topNav.querySelector(
    '.authenticated-user-menu > li > button',
  );

  let wrapperElement = topNav.querySelector('.nav-auth-modal-wrapper');

  authDropDownPanel.addEventListener('click', (e) => e.stopPropagation());

  async function toggleDropDownAuthMenu(state) {
    authDropDownPanel = topNav.querySelector('.nav-auth-menu-panel');
    wrapperElement = topNav.querySelector('.nav-auth-modal-wrapper');
    const show = state ?? !authDropDownPanel.classList.contains('nav-tools-panel--show');
    const isAuthenticated = authDropDownPanel.classList.contains('is-authenticated');

    if (!isAuthenticated) {
      wrapperElement.classList.add('not-authenticated');
    } else {
      wrapperElement.classList.remove('not-authenticated');
    }

    authDropDownPanel.classList.toggle('nav-tools-panel--show', show);
    authDropDownPanel.setAttribute('role', 'dialog');
    authDropDownPanel.setAttribute('aria-hidden', 'false');
    authDropDownPanel.setAttribute('aria-labelledby', 'modal-title');
    authDropDownPanel.setAttribute('aria-describedby', 'modal-description');
    authDropDownPanel.focus();
  }

  loginButton.addEventListener('click', () => toggleDropDownAuthMenu());
  document.addEventListener('click', async (e) => {
    const clickOnDropDownPanel = authDropDownPanel.contains(e.target);
    const clickOnLoginButton = loginButton.contains(e.target);

    if (!clickOnDropDownPanel && !clickOnLoginButton) {
      await toggleDropDownAuthMenu(false);
      wrapperElement.classList.remove('not-authenticated');
    }
  });

  logoutButtonElement.addEventListener('click', async () => {
    await authApi.revokeCustomerToken();
    checkAndRedirect({
      '/customer': '/customer/login',
      '/order-details': '/',
    });
  });

  renderSignIn(authDropinContainer);

  const updateDropDownUI = (isAuthenticated) => {
    const getUserTokenCookie = getCookie('auth_dropin_user_token');
    const getUserNameCookie = getCookie('auth_dropin_firstname');
    const container = topNav.querySelector('.nav-auth-menu-panel');

    if (isAuthenticated || getUserTokenCookie) {
      authDropDownMenuList.style.display = 'block';
      authDropinContainer.style.display = 'none';
      loginButton.textContent = `Hi, ${getUserNameCookie}`;

      container.classList.add('is-authenticated');
    } else {
      authDropDownMenuList.style.display = 'none';
      authDropinContainer.style.display = 'block';
      container.classList.remove('is-authenticated');

      loginButton.innerHTML = `
          <svg width="16px" height="16px" viewBox="0 0 24 24" id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" fill="#ffffff" stroke="#ffffff">
              <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
              <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
              <g id="SVGRepo_iconCarrier">
                  <defs>
                      <!-- Updated stroke width -->
                      <style>.cls-1{fill:none;stroke:#fff;stroke-miterlimit:10;stroke-width:1px;}</style>
                  </defs>
                  <circle class="cls-1" cx="12" cy="7.25" r="5.73"></circle>
                  <path class="cls-1" d="M1.5,23.48l.37-2.05A10.3,10.3,0,0,1,12,13h0a10.3,10.3,0,0,1,10.13,8.45l.37,2.05"></path>
              </g>
          </svg>
         Account`;
    }
  };

  events.on('authenticated', (isAuthenticated) => {
    toggleDropDownAuthMenu(isAuthenticated);
    updateDropDownUI(isAuthenticated);
    wrapperElement.classList.remove('not-authenticated');
  });

  updateDropDownUI();
}
