/**
 * Smoke test verifying that @react-three/fiber, @react-three/drei, and three
 * imports resolve without errors (WO-023).
 *
 * These tests import from each package and assert that named exports exist.
 * They do NOT render any 3D components — that requires WebGL which JSDOM
 * does not provide.
 */
import { describe, it, expect } from "vitest";

describe("R3F dependencies resolve (WO-023)", () => {
  it("@react-three/fiber exports Canvas", async () => {
    const module = await import("@react-three/fiber");
    expect(module.Canvas).toBeDefined();
  });

  it("@react-three/fiber exports useFrame", async () => {
    const module = await import("@react-three/fiber");
    expect(module.useFrame).toBeDefined();
  });

  it("@react-three/drei exports OrbitControls", async () => {
    const module = await import("@react-three/drei");
    expect(module.OrbitControls).toBeDefined();
  });

  it("three exports Scene", async () => {
    const module = await import("three");
    expect(module.Scene).toBeDefined();
  });

  it("three exports BoxGeometry", async () => {
    const module = await import("three");
    expect(module.BoxGeometry).toBeDefined();
  });

  it("three exports MeshStandardMaterial", async () => {
    const module = await import("three");
    expect(module.MeshStandardMaterial).toBeDefined();
  });
});
