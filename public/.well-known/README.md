# Digital Asset Links for Android TWA

The `assetlinks.json` file proves to Android that the LeanIQA APK
is allowed to open links to leaniqa.com in a Trusted Web Activity
(i.e. without the browser chrome). The TWA verification check reads
https://leaniqa.com/.well-known/assetlinks.json and matches the
`sha256_cert_fingerprints` against the APK's signing certificate.

## The placeholder must be replaced BEFORE the TWA works

The current file contains `REPLACE_WITH_SHA256_FROM_PLAY_CONSOLE_OR_KEYSTORE`
and will fail verification. That is expected until the first build
has been uploaded to Play Console.

## Fingerprint source: Play App Signing (recommended)

Google Play's "App Signing" feature re-signs your APK with a Google-
managed key. The fingerprint Chrome checks is that Google-managed
key's, not your local keystore's.

1. Build the TWA .aab in your Android wrapper project (Bubblewrap /
   Android Studio — separate repo, not this one).
2. Upload it to Play Console → Release → Internal testing.
3. In Play Console, go to Release → Setup → App signing.
4. Copy the SHA-256 certificate fingerprint from the
   "App signing key certificate" section.
5. Replace `REPLACE_WITH_SHA256_FROM_PLAY_CONSOLE_OR_KEYSTORE` in
   this file with that value (keep the quotes, keep the brackets).
6. Commit, push, redeploy the web.

## Fingerprint source: local keystore (not recommended)

If you choose to sign APKs yourself without Play App Signing, run:

    keytool -list -v -keystore <your-keystore.jks> -alias <alias>

and copy the SHA-256 from the "Certificate fingerprints" section.
Play App Signing is strongly preferred — losing your local keystore
means you can never update the app on Play Store.

## Verify the file is served correctly after deployment

    curl https://leaniqa.com/.well-known/assetlinks.json

Expect `application/json` content-type and the exact body. If
Vercel is serving it as HTML or 404s, check:
  - The file lives at public/.well-known/assetlinks.json (Vercel
    serves public/ at the root).
  - vercel.json does not have a rewrite that intercepts
    /.well-known/*. It should have been excluded already.

## Chrome TWA verification tool

Once the fingerprint is set and deployed, use:

    https://developers.google.com/digital-asset-links/tools/generator

to verify the link between leaniqa.com and com.leaniqa.app is
recognized. This must show green before submission.