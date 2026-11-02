/** The shape of `virtual:nova-api`, shared by the extractor (Node) and the docs (browser). */

export interface PropInfo {
  name: string;
  type: string;
  default?: string;
  required: boolean;
  description: string;
}

export interface ComponentApi {
  name: string;
  description: string;
  props: PropInfo[];
  /** The DOM element whose attributes are also accepted, e.g. "div". */
  element?: string;
}

export type ApiData = Record<string, ComponentApi>;
