declare module 'https://deno.land/std@0.177.0/http/server.ts' {
  export type DenoRequestHandler = (request: Request) => Response | Promise<Response>;

  export function serve(handler: DenoRequestHandler): void;
}

declare module 'https://deno.land/std@0.177.0/node/crypto.ts' {
  export { createHmac } from 'crypto';
}

declare module 'https://esm.sh/@supabase/supabase-js@2' {
  export * from '@supabase/supabase-js';
}
