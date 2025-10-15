import ora, { Ora } from "ora";
import { config, getConfigFolder } from "../config";
import { exists, readdir, rm } from "node:fs/promises";
import { formatPath, makeOrReaddir } from "../misc";
import { savedScriptTemplatesPath } from "./script";
import { savedProjectTemplatesPath } from "./project";
import { Choice, multiselect } from "@topcli/prompts";
import { syncPrompt } from "./sync";
import { getTemplateFromValue } from "../scriptTemplates";
import path from "node:path";

export async function clearAllCommand() {
    const configFolder = getConfigFolder();

    if (!(await exists(configFolder))) {
        console.log("Config folder not found");
        process.exit(1);
    }

    await clearScriptTemplatesCommand({ all: true });
    await clearProjectTemplatesCommand({ all: true });

    await syncPrompt();
    clearConfigCommand();
}

export function clearConfigCommand() {
    config.clear();
}

export async function clearScriptTemplatesCommand(options: any) {
    if (options.all) {
        const spinner = ora(`Removing ${formatPath(savedScriptTemplatesPath)}`).start();

        if (!(await exists(savedScriptTemplatesPath))) {
            spinner.fail("No script templates present");
            return;
        }

        await rm(savedScriptTemplatesPath, { recursive: true, force: true });

        spinner.succeed("Cleared all script templates!");
        await syncPrompt();
        return;
    }

    const templates = await makeOrReaddir(savedScriptTemplatesPath);

    if (templates.length <= 0) {
        console.log("No script templates found!");
        return;
    }

    const templateChoices: Choice<string>[] = templates.map((template) => {
        return {
            value: template,
            label: getTemplateFromValue(template).displayName,
        };
    });

    const selectedTemplates = await multiselect("Select script templates to remove", {
        autocomplete: true,
        choices: templateChoices,
    });

    const spinner = ora("Removing templates").start();
    for (let template of selectedTemplates) {
        spinner.text = `Removing template ${getTemplateFromValue(template).displayName}`;
        await rm(path.join(savedScriptTemplatesPath, template));
    }

    spinner.succeed("Done!");
    await syncPrompt();
}

export async function clearProjectTemplatesCommand(options: any) {
    if (options.all) {
        const spinner = ora(`Removing ${formatPath(savedProjectTemplatesPath)}`).start();

        if (!(await exists(savedProjectTemplatesPath))) {
            spinner.fail("No project templates present");
            return;
        }

        await rm(savedProjectTemplatesPath, { recursive: true, force: true });

        spinner.succeed("Cleared all project templates!");
        await syncPrompt();
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
        await rm(path.join(savedProjectTemplatesPath, template));
    }

    spinner.succeed("Done!");
    await syncPrompt();
}

function formatTemplate(template: string): string {
    return template.replace("com.unity.template.custom-", "").replace(".tgz", "");
}
