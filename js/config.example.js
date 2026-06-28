/*
  Secure client config template for acai-cliente.
  Copy this file to js/config.js and fill the values.
  Do not commit js/config.js to source control.
*/
window.CONFIG = window.CONFIG || {};
window.CONFIG.supabase = {
    url: 'https://YOUR_PROJECT.supabase.co',
    key: 'sb_publishable_YOUR_ANON_KEY_HERE'
};

// Optional additional configuration values used by the app.
window.CONFIG.rolesMap = window.CONFIG.rolesMap || {};
