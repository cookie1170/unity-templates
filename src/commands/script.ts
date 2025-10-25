import { Choice, multiselect, required, select } from "@topcli/prompts";
import { getConfigFolder } from "../config";
import ora from "ora";
import { syncPrompt } from "./sync";
import open from "open";
import { getTemplateFromShortName, getTemplateFromValue, scriptTemplates } from "../scriptTemplates";
import { cleanupTemporary, exists, formatPlural, makeTemporary } from "../misc";
import path from "node:path";
import { cp, readFile, writeFile } from "node:fs/promises";
import exitHook from "exit-hook";
import { EditorVersion } from "unity-helper";

export const savedScriptTemplatesPath: string = path.join(getConfigFolder(), "script-templates");
const editorScriptTemplatesPath: string = path.join("Editor", "Data", "Resources", "ScriptTemplates");

export async function scriptCommand(options: any) {
    exitHook(() => {
        cleanupTemporary(options.silent);
    });

    const chosenTemplates: string[] = await getChosenTemplates();

    const tmpDir: string = await makeTemporary();

    for (let i = 0; i < chosenTemplates.length; i++) {
        const template = chosenTemplates[i];

        const templatePath: string = path.join(tmpDir, formatScriptTemplateForHighlighting(template));
        const savedTemplateFile = path.join(savedScriptTemplatesPath, template);

        if (i < options.files?.length) {
            await cp(options.files[i], templatePath);
            continue;
        }

        if (!(await exists(savedTemplateFile))) {
            const templateText = getTemplateFromValue(template).defaultValue;
            await writeFile(templatePath, templateText);
        } else {
            const savedTemplateContents = await readFile(savedTemplateFile, { encoding: "utf8" });
            await writeFile(templatePath, savedTemplateContents);
        }

        await open(templatePath);
        if (i < chosenTemplates.length - 1) {
            const choices: Choice<string>[] = [
                {
                    value: "next",
                    label: `Next (${getTemplateFromValue(chosenTemplates[i + 1]).displayName})`,
                },
                { value: "cancel", label: `Cancel the operation` },
                { value: "openAgain", label: "Open again" },
            ];

            if (i > 0)
                choices.push({
                    value: "back",
                    label: `Go back (${getTemplateFromValue(chosenTemplates[i - 1]).displayName})`,
                });

            const selected = await select("Select action", {
                choices: choices,
            });

            switch (selected) {
                case "openAgain": {
                    i--;
                    break;
                }

                case "back": {
                    i -= 2;
                    break;
                }

                case "cancel": {
                    process.exit(1);
                }
            }
        }
    }

    await syncPrompt(options.sync, options.silent, async () => {
        const spinner = ora("Copying templates").start();

        for (const template of chosenTemplates) {
            spinner.text = `Copying template ${getTemplateFromValue(template)}`;
            await cp(
                path.join(tmpDir, formatScriptTemplateForHighlighting(template)),
                path.join(savedScriptTemplatesPath, template)
            );
        }

        spinner.succeed(`Copied ${chosenTemplates.length} templates`);
    });

    async function getChosenTemplates(): Promise<string[]> {
        if (options.templates?.length > 0) {
            return options.templates.map((template: string) => getTemplateFromShortName(template).value);
        }

        const choices: Choice<string>[] = scriptTemplates.map((template) => {
            return {
                label: template.displayName,
                value: template.value,
            };
        });

        const chosenTemplates: string[] = await multiselect("Select templates to edit", {
            choices: choices,
            validators: [required()],
        });

        return chosenTemplates;
    }
}

export async function syncScripts(version: EditorVersion, silent: boolean) {
    const spinner = ora({
        text: `Syncing script templates for version ${version.version}`,
        isSilent: silent,
    });

    if (!silent) spinner.start();

    let templateCount: number = 0;

    for (const template of scriptTemplates) {
        const editorTemplateFile = path.join(version.path, editorScriptTemplatesPath, template.value);
        spinner.text = `Resetting template ${template.displayName}`;
        await writeFile(editorTemplateFile, template.defaultValue);

        const savedTemplateFile = path.join(savedScriptTemplatesPath, template.value);
        if (!(await exists(savedTemplateFile))) continue;

        spinner.text = `Copying template ${template.displayName}`;
        await writeFile(editorTemplateFile, await readFile(savedTemplateFile));
        templateCount++;
    }

    spinner.succeed(
        `Synced ${templateCount} script ${formatPlural("template", templateCount)} for version ${
            version.version
        }`
    );
}

function formatScriptTemplateForHighlighting(template: string): string {
    const noTxt = template.replace(".txt", "");

    return noTxt;
}
