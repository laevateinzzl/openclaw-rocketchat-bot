import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-entry-contract";
import { rocketchatPlugin } from "./plugin.js";

export default defineSetupPluginEntry(rocketchatPlugin);
