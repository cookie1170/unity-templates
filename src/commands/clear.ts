import ora from "ora";
import { config, getConfigFolder } from "../config";
import { readdir, rm } from "node:fs/promises";
import { exists, formatPath, formatPlural, makeOrReaddir } from "../misc";
import { savedScriptTemplatesPath } from "./script";
import { savedProjectTemplatesPath } from "./project";
import { Choice, multiselect, required } from "@topcli/prompts";
import { syncPrompt } from "./sync";
import { getTemplateFromValue } from "../scriptTemplates";
import path from "node:path";
import { getEditorPathOrUndefined } from "unity-helper";

export async function clearAllCommand(options: any) {
    const spinner = ora({ text: "Clearing all config", isSilent: options.silent });
    const configFolder = getConfigFolder();

    if (!(await exists(configFolder))) {
        spinner.text = "Config folder not found";
        process.exit(1);
    }

    await clearScriptTemplatesCommand({ all: true, sync: false });
    await clearProjectTemplatesCommand({ all: true, sync: false });

    if (getEditorPathOrUndefined !== undefined) await syncPrompt(options.sync, options.silent);
    clearConfigCommand();
}

export function clearConfigCommand() {
    config.clear();
}

export async function clearScriptTemplatesCommand(options: any) {
    if (options.all) {
        const spinner = ora({
            text: `Removing ${formatPath(savedScriptTemplatesPath)}`,
            isSilent: options.silent,
        }).start();

        if (!(await exists(savedScriptTemplatesPath))) {
            spinner.fail("No script templates present");
            return;
        }

        const count: number = (await readdir(savedScriptTemplatesPath)).length;

        if (count <= 0) {
            spinner.fail("No script templates present");
            return;
        }

        await rm(savedScriptTemplatesPath, { recursive: true, force: true });

        spinner.succeed(`Cleared ${count} script ${formatPlural("template", count)}!`);
        await syncPrompt(options.sync, options.silent);
        return;
    }

    const templates = await makeOrReaddir(savedScriptTemplatesPath);

    if (templates.length <= 0) {
        if (!options.silent) console.log("No script templates found");
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
        validators: [required()],
    });

    const spinner = ora({ text: "Removing templates", isSilent: options.silent }).start();
    for (let template of selectedTemplates) {
        spinner.text = `Removing template ${getTemplateFromValue(template).displayName}`;
        await rm(path.join(savedScriptTemplatesPath, template));
    }

    spinner.succeed(
        `Cleared ${selectedTemplates.length} script ${formatPlural("template", selectedTemplates.length)}!`
    );
    await syncPrompt(options.sync, options.silent);
}

export async function clearProjectTemplatesCommand(options: any) {
    if (options.all) {
        const spinner = ora({
            text: `Removing ${formatPath(savedProjectTemplatesPath)}`,
            isSilent: options.silent,
        }).start();

        if (!(await exists(savedProjectTemplatesPath))) {
            spinner.fail("No project templates present");
            return;
        }

        const count: number = (await readdir(savedProjectTemplatesPath)).length;

        if (count <= 0) {
            spinner.fail("No project templates present");
            return;
        }

        await rm(savedProjectTemplatesPath, { recursive: true, force: true });

        spinner.succeed(`Cleared ${count} project ${formatPlural("template", count)}!`);
        await syncPrompt(options.sync, options.silent);
        return;
    }

    const templates = await makeOrReaddir(savedProjectTemplatesPath);

    if (templates.length <= 0) {
        if (!options.silent) console.log("No project templates found!");
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
        validators: [required()],
    });

    const spinner = ora({ text: "Removing templates", isSilent: options.silent }).start();
    for (let template of selectedTemplates) {
        spinner.text = `Removing template ${formatTemplate(template)}`;
        await rm(path.join(savedProjectTemplatesPath, template));
    }

    spinner.succeed(
        `Cleared ${selectedTemplates.length} project ${formatPlural("template", selectedTemplates.length)}!`
    );
    await syncPrompt(options.sync, options.silent);
}

function formatTemplate(template: string): string {
    return template.replace("com.unity.template.custom-", "").replace(".tgz", "");
}
