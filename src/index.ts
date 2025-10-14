import { Command } from "commander";
import { syncCommand } from "./commands/sync";
import { projectCommand } from "./commands/project";
import { scriptCommand } from "./commands/script";
import { initCommand } from "./config";
import {
    clearAllCommand,
    clearConfigCommand,
    clearProjectTemplatesCommand,
    clearScriptTemplatesCommand,
} from "./commands/clear";

const program = new Command();

program
    .name("unity-templates")
    .description("A CLI tool for managing Unity script and project templates")
    .version("0.6.0");

program
    .command("sync")
    .description("Syncs the templates that Unity uses with the custom saved templates")
    .action(syncCommand);

program
    .command("project")
    .description("Make or update a template from a Unity project")
    .option(
        "-p --project <project>",
        "Specify a project path to use. Use @PROJECTDIR to access the project dir in the config"
    )
    .action(projectCommand);

program
    .command("script")
    .description("Create or edit overrides for Unity script templates")
    .action(scriptCommand);

program
    .command("init")
    .description("Initializes and interactively sets up the config file")
    .action(initCommand);

const clear = program
    .command("clear")
    .description("Used to clear unity-templates's saved files. See clear --help");

clear.command("all").description("Clears all of unity-templates's saved files").action(clearAllCommand);
clear.command("config").description("Clears the config file").action(clearConfigCommand);
clear.command("script").description("Clears all saved script templates").action(clearScriptTemplatesCommand);
clear
    .command("project")
    .description("Clears all saved project templates")
    .action(clearProjectTemplatesCommand);

program.parse();
