import * as across from "./across";
import * as hyphen from "./hyphen";
import * as multichain from "./multichain";
import * as relay from "./relay";
import * as meson from './meson';

export const adapters: { [key: string]: any } = {
  across: across,
  hyphen: hyphen,
  multichain: multichain,
  relay: relay,
  meson: meson
};
