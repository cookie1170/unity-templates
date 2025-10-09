#!/usr/bin/env bun
import { createCLI } from "@bunli/core";
import { syncCommand } from "./commands/sync.js";

const cli = createCLI({
    name: "unity-templates",
    version: "0.1.0",
    description:
        "A simple CLI tool for managing Unity templates (both project and script!)",
});

cli.command(syncCommand);

await cli.run();
