import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(cleanup);

let nextUrl = 0;
Object.defineProperty(URL, "createObjectURL", {
  configurable: true,
  value: () => `blob:test-${++nextUrl}`,
});
Object.defineProperty(URL, "revokeObjectURL", {
  configurable: true,
  value: () => undefined,
});
