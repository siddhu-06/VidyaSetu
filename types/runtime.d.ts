declare module 'next-pwa' {
  import type { NextConfig } from 'next';

  interface NextPwaOptions {
    dest: string;
    disable?: boolean;
    register?: boolean;
    skipWaiting?: boolean;
  }

  export default function withPWAInit(options: NextPwaOptions): (config: NextConfig) => NextConfig;
}

declare module 'https://deno.land/std@0.224.0/http/server.ts' {
  export function serve(handler: (request: Request) => Response | Promise<Response>): void;
}

declare module 'https://esm.sh/@supabase/supabase-js@2.49.1' {
  export * from '@supabase/supabase-js';
}

declare module 'npm:twilio@5.9.0' {
  import twilio from 'twilio';

  export default twilio;
}

declare const Deno: {
  env: {
    get(name: string): string | undefined;
  };
};

