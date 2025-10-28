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
import { getOptsAction } from "./misc";

const program = new Command();

program
    .name(packageJson.name)
    .description(packageJson.description)
    .version(packageJson.version)
    .option("-S --silent", "don't output any text (except for interactive prompts, if any)")
    .option("-s --sync", "automatically accept the sync prompt")
    .option("--no-sync", "automatically decline the sync prompt");

program
    .command("init")
    .description("initializes and interactively sets up the config file")
    .option("-p --projects-path <path>", "automatically set the projects path to avoid an interactive prompt")
    .option(
        "-e --editor-path <path>",
        "automatically set the editor path to avoid launching Unity hub or an interactive prompt"
    )
    .option("--hub-only", "only try to get the editor path using Unity hub")
    .option("-n --no-hub", "don't try to launch Unity hub to get the editor path")
    .action(getOptsAction(initCommand));

program
    .command("sync")
    .description("syncs the templates that Unity uses with the custom saved templates")
    .option("-a --all", "sync for all editor versions without asking")
    .action(getOptsAction(syncCommand));

program
    .command("project")
    .description("make or update a template from a Unity project")
    .option("-p --project <project>", "specify a project path to use")
    .option(
        "-a --version-action <action>",
        'specify a version action. Use "nothing", "patch", "minor" or "major" or pass a semantic version'
    )
    .action(getOptsAction(projectCommand));

program
    .command("script")
    .description("create or edit overrides for Unity script templates")
    .option(
        "-f --files <files...>",
        "create the script templates from a space separated list of files\ninteractively select templates if no --templates option passed"
    )
    .option(
        "-t --templates <templates...>",
        "automatically select the templates from a space separated list of templates, see README.md for templates\ninteractively edit them if no --files option passed"
    )
    .action(getOptsAction(scriptCommand));

program
    .command("open-config")
    .description("opens the config path with your default application")
    .addOption(
        new Option("-f --file <file>", "specify the file (or directory) to open").choices([
            "common",
            "project",
            "script",
        ])
    )
    .action(getOptsAction(openConfigCommand));

const clear = program
    .command("clear")
    .summary("used to clear unity-templates's saved files. See unity-templates clear --help")
    .description(
        "Used to clear unity-templates's saved files, such as script or project templates and config."
    );

clear
    .command("all")
    .description("clears all of unity-templates's saved files")
    .action(getOptsAction(clearAllCommand));

clear.command("config").description("clears the config file").action(clearConfigCommand);

clear
    .command("script")
    .option("-a --all", "clears all saved script templates instead of a selection")
    .description("clears saved script templates")
    .action(getOptsAction(clearScriptTemplatesCommand));

clear
    .command("project")
    .option("-a --all", "clears all saved project templates instead of a selection")
    .description("clears saved project templates")
    .action(getOptsAction(clearProjectTemplatesCommand));

program.parse();
