// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { YouTubeReportConnection } from "../src/components/panels/YouTubeReportConnection";

const mocks = vi.hoisted(() => ({ status: vi.fn(), saveKey: vi.fn(), useSessionKey: vi.fn(), disconnect: vi.fn() }));
vi.mock("../src/utils/api", () => ({ getAPI: () => ({ youtube: mocks }) }));
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  mocks.status.mockReset().mockResolvedValue({ configured: true, secureStorage: true });
  mocks.saveKey.mockReset().mockResolvedValue({ configured: true, secureStorage: true });
  mocks.useSessionKey.mockReset().mockResolvedValue({ configured: true, secureStorage: false, sessionOnly: true });
  mocks.disconnect.mockReset().mockResolvedValue({ configured: false, secureStorage: true });
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); document.body.replaceChildren(); });
async function render(queries: string[] = [], disabled = false) {
  function Harness() {
    const [enabled, setEnabled] = React.useState(false);
    return React.createElement(YouTubeReportConnection, { queries, disabled, enabled, onEnabledChange: setEnabled });
  }
  await act(async () => root.render(React.createElement(Harness)));
}
function checkbox() { return container.querySelector<HTMLInputElement>('[aria-label="Include YouTube recommendations"]')!; }
function button(text: string) { return [...container.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent === text)!; }
it("lets a saved-key user enable recommendations when there are no weak-topic queries", async () => {
  await render(); expect(checkbox().disabled).toBe(false);
  await act(async () => checkbox().click()); expect(checkbox().checked).toBe(true);
  expect(container.textContent).toContain("this report will not search YouTube");
  expect(checkbox().getAttribute("aria-describedby")).toBeTruthy();
});
it("keeps the checkbox enabled with eligible topics and supports toggling off", async () => {
  await render(["Deadlocks tutorial"]);
  await act(async () => checkbox().click()); expect(checkbox().checked).toBe(true);
  await act(async () => checkbox().click()); expect(checkbox().checked).toBe(false);
});
it("lets the user select videos before saving a key and explains the required setup", async () => {
  mocks.status.mockResolvedValue({ configured: false, secureStorage: true }); await render();
  expect(checkbox().disabled).toBe(false); expect(container.textContent).toContain("Save your YouTube Data API key above");
  await act(async () => checkbox().closest("label")!.click()); expect(checkbox().checked).toBe(true);
  expect(mocks.saveKey).not.toHaveBeenCalled();
});
it("preserves secure-storage protection and explains it", async () => {
  mocks.status.mockResolvedValue({ configured: true, secureStorage: false }); await render();
  expect(button("Save YouTube Key").disabled).toBe(true); expect(container.textContent).toContain("Secure credential storage is unavailable");
});
it("does not let an old status response undo a successful key save", async () => {
  let resolve!: (status: { configured: boolean; secureStorage: boolean }) => void;
  mocks.status.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  await render(); expect(container.textContent).toContain("Checking YouTube connection");
  const input = container.querySelector<HTMLInputElement>('[aria-label="YouTube Data API key"]')!;
  act(() => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "test-only-personal-key-123456789"); input.dispatchEvent(new Event("input", { bubbles: true })); });
  await act(async () => button("Save YouTube Key").click());
  expect(checkbox().disabled).toBe(false);
  await act(async () => resolve({ configured: false, secureStorage: true }));
  expect(checkbox().disabled).toBe(false); expect(container.textContent).toContain("Key saved");
  await act(async () => checkbox().click()); expect(checkbox().checked).toBe(true);
});
it("refreshes saved-key availability without requiring the key again", async () => {
  mocks.status.mockResolvedValueOnce({ configured: false, secureStorage: true }); await render();
  expect(container.textContent).toContain("Not connected");
  await act(async () => button("Refresh YouTube connection").click()); expect(checkbox().disabled).toBe(false);
  expect(mocks.saveKey).not.toHaveBeenCalled();
});
it("saves a displayed autofilled key even when no React change event occurred", async () => {
  mocks.status.mockResolvedValue({ configured: false, secureStorage: true }); await render();
  const input = container.querySelector<HTMLInputElement>('[aria-label="YouTube Data API key"]')!;
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "test-only-autofilled-key-123456789");
  expect(button("Save YouTube Key").disabled).toBe(false);
  await act(async () => button("Save YouTube Key").click());
  expect(mocks.saveKey).toHaveBeenCalledWith("test-only-autofilled-key-123456789");
  expect(input.value).toBe(""); expect(container.textContent).toContain("Key saved securely");
});
it("shows a direct instruction for an empty key instead of silently ignoring Save", async () => {
  await render(); await act(async () => button("Save YouTube Key").click());
  expect(container.textContent).toContain("Enter your YouTube Data API key"); expect(mocks.saveKey).not.toHaveBeenCalled();
});
it("does not reset the checkbox when a pending connection check finishes without a key", async () => {
  let resolve!: (value: { configured: boolean; secureStorage: boolean }) => void;
  mocks.status.mockImplementation(() => new Promise(done => { resolve = done; }));
  await render(); await act(async () => checkbox().click()); expect(checkbox().checked).toBe(true);
  await act(async () => resolve({ configured: false, secureStorage: true })); expect(checkbox().checked).toBe(true);
});
it("keeps selection locked while a report is being generated", async () => {
  await render(["Deadlocks tutorial"], true); expect(checkbox().disabled).toBe(true);
  expect(container.textContent).toContain("locked while the report is generating");
  expect(container.querySelector<HTMLInputElement>('[aria-label="YouTube Data API key"]')!.disabled).toBe(false);
});
it("allows typing a key with no system keychain and activating an explicit memory-only connection", async () => {
  mocks.status.mockResolvedValue({ configured: false, secureStorage: false }); await render();
  const input = container.querySelector<HTMLInputElement>('[aria-label="YouTube Data API key"]')!;
  expect(input.disabled).toBe(false); expect(button("Save YouTube Key").disabled).toBe(true);
  act(() => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "test-only-personal-key-123456789"); input.dispatchEvent(new Event("input", { bubbles: true })); });
  await act(async () => button("Use for this session").click());
  expect(mocks.useSessionKey).toHaveBeenCalledWith("test-only-personal-key-123456789");
  expect(mocks.saveKey).not.toHaveBeenCalled(); expect(input.value).toBe("");
  expect(container.textContent).toContain("Session key active"); expect(container.textContent).toContain("only in memory");
});
it("shows the exact restart remedy when the running main process has no YouTube handlers", async () => {
  mocks.status.mockRejectedValue(new Error("Error invoking remote method 'youtube:status': Error: No handler registered for 'youtube:status'"));
  await render(); expect(container.textContent).toContain("Ctrl+C"); expect(container.textContent).toContain("npm run dev again");
  const input = container.querySelector<HTMLInputElement>('[aria-label="YouTube Data API key"]')!;
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "test-only-personal-key-123456789");
  mocks.saveKey.mockRejectedValue(new Error("No handler registered for 'youtube:saveKey'"));
  await act(async () => button("Save YouTube Key").click());
  expect(container.textContent).toContain("npm run dev again"); expect(container.textContent).not.toContain("Check its format");
});
it("saves the key on Enter and prevents the containing report form from submitting", async () => {
  await render(); const input = container.querySelector<HTMLInputElement>('[aria-label="YouTube Data API key"]')!;
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "test-only-personal-key-123456789");
  const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
  await act(async () => input.dispatchEvent(event));
  expect(event.defaultPrevented).toBe(true); expect(mocks.saveKey).toHaveBeenCalledWith("test-only-personal-key-123456789");
});
