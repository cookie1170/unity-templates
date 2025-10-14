import { Command } from "commander";
import { syncCommand } from "./commands/sync";
import { projectCommand } from "./commands/project";
import { scriptCommand } from "./commands/script";

const program = new Command();

program
    .name("unity-templates")
    .description("A CLI tool for managing Unity script and project templates")
    .version("0.3.0");

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

program.parse();
