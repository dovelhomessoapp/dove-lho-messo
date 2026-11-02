/* Android distribution context. This is presentation routing, never an entitlement. */
(() => {
  'use strict';
  const packageId = 'it.dovelhomesso.app';
  let fromAndroid = false;
  try {
    const referrer = new URL(document.referrer);
    fromAndroid = referrer.protocol === 'android-app:' && referrer.hostname === packageId;
  } catch (_) {}
  let play = fromAndroid || new URL(location.href).searchParams.get('distribution') === 'google-play';
  try {
    play = play || sessionStorage.getItem('dlm-distribution') === 'google-play';
    if (play) sessionStorage.setItem('dlm-distribution', 'google-play');
  } catch (_) {}
  Object.defineProperty(window, 'dlmStoreDistribution', {
    value: play ? 'google-play' : 'web', writable: false, configurable: false
  });
  if (play) document.documentElement.dataset.distribution = 'google-play';
})();
