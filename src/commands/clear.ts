import ora, { Ora } from "ora";
import { getConfigFolder } from "../config";
import { exists, rm } from "node:fs/promises";
import { formatPath, makeOrReaddir } from "../misc";
import { savedScriptTemplatesPath } from "./script";
import { savedProjectTemplatesPath } from "./project";
import { Choice, multiselect } from "@topcli/prompts";
import { syncPrompt } from "./sync";

export async function clearAllCommand() {
    const configFolder = getConfigFolder();
    const spinner = ora(`Removing ${formatPath(configFolder)}`).start();

    if (!(await exists(configFolder))) {
        spinner.fail("Config folder not found");
        process.exit(1);
    }

    await rm(configFolder, { recursive: true, force: true });
    spinner.succeed("Cleared config!");
}

export async function clearConfigCommand() {
    const configFolder = getConfigFolder();
    const configFile = `${configFolder}/config.json`;

    const spinner = ora(`Removing ${formatPath(configFile)}`).start();

    if (!(await exists(configFile))) {
        spinner.fail("Config file not found");
        process.exit(1);
    }

    await rm(configFile);
}

export async function clearScriptTemplatesCommand() {
    const spinner = ora(`Removing ${formatPath(savedScriptTemplatesPath)}`).start();

    if (!(await exists(savedScriptTemplatesPath))) {
        spinner.fail("Script templates path not found");
        process.exit(1);
    }

    await rm(savedScriptTemplatesPath, { recursive: true, force: true });
}

export async function clearProjectTemplatesCommand(options: any) {
    if (options.all) {
        const spinner = ora(`Removing ${formatPath(savedProjectTemplatesPath)}`).start();

        if (!(await exists(savedProjectTemplatesPath))) {
            spinner.fail("Project templates path not found");
            process.exit(1);
        }

        await rm(savedProjectTemplatesPath, { recursive: true, force: true });
        await succeed(spinner);
        return;
    }

    const templates = await makeOrReaddir(savedProjectTemplatesPath);

    if (templates.length <= 0) {
        console.log("No project templates found!");
        process.exit(0);
    }

    const templateChoices: Choice<string>[] = templates.map((template) => {
        return {
            value: template,
            label: formatTemplate(template),
        };
    });

    const selectedTemplates = await multiselect("Select project templates to remove", {
        autocomplete: true,
        choices: templateChoices,
    });

    const spinner = ora("Removing templates").start();
    for (let template of selectedTemplates) {
        spinner.text = `Removing template ${formatTemplate(template)}`;
        await rm(`${savedProjectTemplatesPath}/${template}`);
    }

    await succeed(spinner);

    async function succeed(spin: Ora) {
        spin.succeed("Done!");
        await syncPrompt();
    }
}

function formatTemplate(template: string): string {
    return template.replace("com.unity.template.custom-", "").replace(".tgz", "");
}
