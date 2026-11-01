import { fireEvent, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ChatComposer, Message, MessageGroup, MessageList, ThemeProvider, TypingIndicator } from "../src/index.ts";
import { axeViolations } from "./axe.ts";

const wrap = (ui: React.ReactNode) => render(<ThemeProvider>{ui}</ThemeProvider>);

function Conversation({ extra }: { extra?: React.ReactNode }) {
  return (
    <MessageList aria-label="Chat with Support" style={{ height: 200 }}>
      <MessageGroup author="Mina" side="start" meta="10:02">
        <Message>Hi! How can I help?</Message>
        <Message>We usually reply in minutes.</Message>
      </MessageGroup>
      <MessageGroup author="You" side="end">
        <Message status="sent">My invoice is missing.</Message>
      </MessageGroup>
      {extra}
    </MessageList>
  );
}

describe("MessageList", () => {
  it("is a named log of author groups", async () => {
    const { container } = wrap(<Conversation />);
    const log = screen.getByRole("log", { name: "Chat with Support" });
    expect(log).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("group", { name: "Mina" })).toHaveTextContent("We usually reply in minutes.");
    expect(screen.getByRole("group", { name: "You" })).toHaveAttribute("data-side", "end");
    expect(await axeViolations(container)).toEqual([]);
  });

  it("offers Jump to latest when new content arrives while scrolled up", async () => {
    const { rerender } = wrap(<Conversation />);
    const log = screen.getByRole("log");
    Object.defineProperties(log, {
      scrollHeight: { configurable: true, value: 1000 },
      clientHeight: { configurable: true, value: 200 },
    });
    log.scrollTop = 100;
    fireEvent.scroll(log);
    rerender(
      <ThemeProvider>
        <Conversation
          extra={
            <MessageGroup author="Mina">
              <Message>Found it!</Message>
            </MessageGroup>
          }
        />
      </ThemeProvider>,
    );
    const jump = screen.getByRole("button", { name: "Jump to latest" });
    await userEvent.click(jump);
    expect(log.scrollTop).toBe(1000);
    expect(screen.queryByRole("button", { name: "Jump to latest" })).not.toBeInTheDocument();
  });

  it("marks streaming messages busy and shows status text", () => {
    wrap(
      <MessageList aria-label="Assistant">
        <MessageGroup author="Assistant">
          <Message streaming>Thinking about</Message>
        </MessageGroup>
        <MessageGroup author="You" side="end">
          <Message status="error" statusLabel="Not delivered">Hello?</Message>
        </MessageGroup>
      </MessageList>,
    );
    expect(screen.getByText("Thinking about")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Not delivered")).toBeInTheDocument();
  });
});

describe("TypingIndicator", () => {
  it("announces its label as a status", () => {
    wrap(<TypingIndicator label="Mina is typing" hideLabel />);
    expect(screen.getByRole("status")).toHaveTextContent("Mina is typing");
  });
});

describe("ChatComposer", () => {
  it("sends on Enter, adds lines with Shift+Enter, and clears", async () => {
    const onSend = vi.fn();
    wrap(<ChatComposer onSend={onSend} />);
    const box = screen.getByRole("textbox", { name: "Message" });
    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();
    await userEvent.type(box, "Hello{Shift>}{Enter}{/Shift}there");
    expect(box).toHaveValue("Hello\nthere");
    await userEvent.keyboard("{Enter}");
    expect(onSend).toHaveBeenCalledWith({ text: "Hello\nthere", files: [] });
    expect(box).toHaveValue("");
    expect(box).toHaveFocus();
  });

  it("does not send while an IME is composing, and keeps the draft when onSend returns false", async () => {
    const onSend = vi.fn(() => false);
    wrap(<ChatComposer onSend={onSend} />);
    const box = screen.getByRole("textbox");
    await userEvent.type(box, "にほん");
    fireEvent.keyDown(box, { key: "Enter", isComposing: true });
    expect(onSend).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Send message" }));
    expect(onSend).toHaveBeenCalledTimes(1);
    expect(box).toHaveValue("にほん");
  });

  it("attaches and removes files, and shows Stop while generating", async () => {
    const onSend = vi.fn();
    const onStop = vi.fn();
    const { container, rerender } = wrap(<ChatComposer onSend={onSend} attachments />);
    const file = new File(["hello"], "notes.txt", { type: "text/plain" });
    await userEvent.upload(container.querySelector<HTMLInputElement>('input[type="file"]')!, file);
    expect(screen.getByText("notes.txt")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Send message" }));
    expect(onSend).toHaveBeenCalledWith({ text: "", files: [file] });
    expect(screen.queryByText("notes.txt")).not.toBeInTheDocument();

    rerender(
      <ThemeProvider>
        <ChatComposer onSend={onSend} generating onStop={onStop} />
      </ThemeProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Stop generating" }));
    expect(onStop).toHaveBeenCalled();
  });

  it("has no axe violations", async () => {
    const { container } = wrap(<ChatComposer onSend={() => {}} attachments maxLength={500} />);
    expect(await axeViolations(container)).toEqual([]);
  });
});
