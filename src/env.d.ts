/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    user: import('@/lib/auth/server').AuthUser | null;
    session: import('@/lib/auth/server').AuthSession | null;
  }
}
