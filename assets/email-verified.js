// This page is only ever reached when the Universal Link did not hand off
// to the app directly. Verification already succeeded by the time it
// renders, so there is nothing here for the user to act on — bounce
// straight back into Coff instead of making them read a banner and tap
// "Coff Circle'ı aç". The button stays as the fallback for when the scheme is
// unhandled (app not installed), which is also why we don't hide it.
// iOS only: on a desktop browser, or anywhere Coff cannot be installed, a
// custom-scheme navigation raises a "cannot open the page" system alert,
// which is a worse result than the page the user is already looking at.
(function () {
  if (!/iPhone|iPad|iPod/.test(navigator.userAgent)) return;
  try {
    window.location.href = 'coff://email-verified';
  } catch (e) {
    /* Fall through to the visible button. */
  }
})();
