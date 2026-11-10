import { Toaster, type ToasterProps } from "@darkalpha/nova-ui";
import { createContext, useContext, useState, type ReactNode } from "react";

export type ToastPosition = NonNullable<ToasterProps["position"]>;

const Ctx = createContext<{ position: ToastPosition; setPosition: (p: ToastPosition) => void }>({ position: "bottom-end", setPosition: () => {} });

/** Lets the Toast page move the docs app's single <Toaster>, so its demos show every position. */
export function ToasterPositionProvider({ children }: { children: ReactNode }) {
  const [position, setPosition] = useState<ToastPosition>("bottom-end");
  return <Ctx.Provider value={{ position, setPosition }}>{children}</Ctx.Provider>;
}

export const useToasterPosition = () => useContext(Ctx);

/** The docs app's Toaster, at the position the Toast page picked. */
export function DocsToaster() {
  return <Toaster position={useToasterPosition().position} />;
}
