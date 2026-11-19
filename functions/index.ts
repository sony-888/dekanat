import { createDatabaseClient, createSiteContext } from './_qoder/backend.mjs';
import { createApp, errorResponse } from './app.mjs';
import { createDatabaseStore } from './store.mjs';

// Application-owned login: the app reads and writes its own HttpOnly session
// cookie, so application credentials must be forwarded to this handler.
const handle = createApp({ store: createDatabaseStore(createDatabaseClient()) });

Deno.serve(async (request: Request) => {
  let context;
  try {
    context = createSiteContext(request, { forwardApplicationCredentials: true });
  } catch {
    return errorResponse(new Error('context_unavailable'));
  }
  try {
    return await handle(context?.request ?? request);
  } catch (error) {
    return errorResponse(error);
  }
});
