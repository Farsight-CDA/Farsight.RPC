/// <reference types="@solidjs/start/env" />

declare module "vinxi";
declare module "vinxi/dist/types/lib/vite-dev";

interface FetchEvent extends Event {
  request: Request;
  respondWith(response: Response | Promise<Response>): void;
  waitUntil?(value: Promise<unknown>): void;
}
