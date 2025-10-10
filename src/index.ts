// import { program } from "commander";
// import { syncCommand } from "./commands/sync";
import { projectCommand } from "./commands/project";

// program
//     .name("unity-templates")
//     .description("A CLI tool for managing Unity script and project templates")
//     .version("0.1.0")
//     .command("sync")
//     .description(
//         "Syncs the templates that Unity uses with the custom saved templates"
//     )
//     .action(syncCommand)
//     .command("project")
//     .description("Make or update a template from a Unity project")
//     .action(projectCommand)
//     .parse();

projectCommand();
