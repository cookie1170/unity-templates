import { Command, Option } from "commander";
import { syncCommand } from "./commands/sync";
import { projectCommand } from "./commands/project";
import { scriptCommand } from "./commands/script";
import { initCommand } from "./commands/init";
import {
    clearAllCommand,
    clearConfigCommand,
    clearProjectTemplatesCommand,
    clearScriptTemplatesCommand,
} from "./commands/clear";
import packageJson from "../package.json";
import { openConfigCommand } from "./commands/openConfig";
import exitHook from "exit-hook";
import { cleanupTemporary } from "./misc";

exitHook(cleanupTemporary);

const program = new Command();

program
    .name("unity-templates")
    .description("A CLI tool for managing Unity script and project templates")
    .version(packageJson.version);

program
    .command("sync")
    .description("Syncs the templates that Unity uses with the custom saved templates")
    .option("-S --silent", "Don't output any text (except for interactive prompts, if any)")
    .action(syncCommand);

program
    .command("project")
    .description("Make or update a template from a Unity project")
    .option(
        "-p --project <project>",
        "Specify a project path to use. Use @projects to access the project dir in the config"
    )
    .option(
        "-v --version-action <action>",
        'Specify a version action. Use "nothing", "patch", "minor" or "major" or pass a semantic version'
    )
    .option("-s --sync", "Automatically accept the sync prompt")
    .option("--no-sync", "Automatically decline the sync prompt")
    .option("-S --silent", "Don't output any text (except for interactive prompts, if any)")
    .action(projectCommand);

program
    .command("script")
    .description("Create or edit overrides for Unity script templates")
    .option("-s --sync", "Automatically accept the sync prompt")
    .option("--no-sync", "Automatically decline the sync prompt")
    .option("-S --silent", "Don't output any text (except for interactive prompts, if any)")
    .action(scriptCommand);

program
    .command("init")
    .description("Initializes and interactively sets up the config file")
    .option("-S --silent", "Don't output any text (except for interactive prompts, if any)")
    .action(initCommand);

program
    .command("open-config")
    .description("Opens the config path with your default application")
    .addOption(
        new Option("-f --file <file>", "Specify the file (or directory) to open").choices([
            "common",
            "project",
            "script",
        ])
    )
    .action(openConfigCommand);

const clear = program
    .command("clear")
    .description("Used to clear unity-templates's saved files. See clear --help");

clear
    .command("all")
    .option("-s --sync", "Automatically accept the sync prompt")
    .option("--no-sync", "Automatically decline the sync prompt")
    .option("-S --silent", "Don't output any text (except for interactive prompts, if any)")
    .description("Clears all of unity-templates's saved files")
    .action(clearAllCommand);
clear.command("config").description("Clears the config file").action(clearConfigCommand);

clear
    .command("script")
    .option("-a --all", "Clears all saved script templates instead of a selection")
    .option("-s --sync", "Automatically accept the sync prompt")
    .option("--no-sync", "Automatically decline the sync prompt")
    .option("-S --silent", "Don't output any text (except for interactive prompts, if any)")
    .description("Clears saved script templates")
    .action(clearScriptTemplatesCommand);

clear
    .command("project")
    .option("-a --all", "Clears all saved project templates instead of a selection")
    .option("-s --sync", "Automatically accept the sync prompt")
    .option("--no-sync", "Automatically decline the sync prompt")
    .option("-S --silent", "Don't output any text (except for interactive prompts, if any)")
    .description("Clears saved project templates")
    .action(clearProjectTemplatesCommand);

program.parse();
