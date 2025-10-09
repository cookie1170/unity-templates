import { defineCommand, option } from "@bunli/core";
import { z } from "zod";
import { getConfig } from "../config";

export const syncCommand = defineCommand({
    name: "sync",
    description: "Add all the templates to installed Unity versions",
    options: {},
    handler: async ({ flags, colors }) => {
        const config = await getConfig();
        console.log(`Editor at ${config.editorPath}`);
    },
});
