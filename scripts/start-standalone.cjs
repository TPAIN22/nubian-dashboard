/**
 * Production entry point (`npm start`).
 *
 * Runs the standalone server that `output: "standalone"` builds, instead of
 * `next start`. Measured locally against the same 360-request cold burst:
 *
 *   next start                         idle 225 MB   peak 427 MB
 *   standalone + --max-old-space-size  idle 148 MB   peak 295 MB
 *
 * The heap cap is set in package.json's start script. Node doesn't read the
 * container's memory limit, so without a cap it postpones garbage collection
 * until it is well past Render's 512 MB and the instance gets killed during a
 * traffic burst.
 *
 * The standalone server binds to process.env.HOSTNAME. Hosting platforms
 * (Render included) set HOSTNAME to the machine's own name, which can leave
 * the server listening on an interface the platform's proxy doesn't route to.
 * Always bind every interface; PORT is still taken from the platform.
 */
process.env.HOSTNAME = "0.0.0.0";

require("../.next/standalone/server.js");
