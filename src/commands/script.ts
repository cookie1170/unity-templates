import { Choice, multiselect, confirm, required, select } from "@topcli/prompts";
import { getConfigFolder } from "../config";
import ora from "ora";
import { syncPrompt } from "./sync";
import open from "open";
import { getTemplateFromValue, scriptTemplates } from "../scriptTemplates";
import { EditorVersion } from "../misc";
import path from "node:path";

export const savedScriptTemplatesPath: string = path.join(getConfigFolder(), "script-template");
const editorScriptTemplatesPath: string = path.join("Editor", "Data", "Resources", "ScriptTemplates");

export async function scriptCommand() {
    const choices: Choice<string>[] = scriptTemplates.map((template) => {
        return {
            label: template.displayName,
            value: template.value,
        };
    });

    const chosenTemplates: string[] = await multiselect("Select templates to edit", {
        choices: choices,
        autocomplete: true,
        validators: [required()],
    });

    for (let i = 0; i < chosenTemplates.length; i++) {
        const chosenTemplate = chosenTemplates[i];

        const templatePath: string = path.join(savedScriptTemplatesPath, chosenTemplate);
        const templateFile = Bun.file(templatePath);
        if (!(await templateFile.exists())) {
            const templateText = getTemplateFromValue(chosenTemplate).defaultValue;

            await Bun.file(templatePath).write(templateText);
        }

        await open(templatePath, { wait: true });
        if (i < chosenTemplates.length - 1) {
            const choices: Choice<string>[] = [
                {
                    value: "next",
                    label: `Next (${getTemplateFromValue(chosenTemplates[i + 1]).displayName})`,
                },
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
            }
        }
    }

    await syncPrompt();
}

export async function syncScripts(version: EditorVersion) {
    const spinner = ora(`Syncing script templates for version ${version.version}`);

    let templateCount: number = 0;

    for (const template of scriptTemplates) {
        const editorTemplateFile = Bun.file(
            path.join(version.path, editorScriptTemplatesPath, template.value)
        );
        spinner.text = `Resetting template ${template.displayName}`;
        await Bun.write(editorTemplateFile, template.defaultValue);

        const savedTemplateFile = Bun.file(path.join(savedScriptTemplatesPath, template.value));
        if (!(await savedTemplateFile.exists())) continue;

        spinner.text = `Copying template ${template.displayName}`;
        await Bun.write(editorTemplateFile, await savedTemplateFile.text());
        templateCount++;
    }

    spinner.succeed(
        `Synced ${templateCount} script template${templateCount != 1 ? "s" : ""} for version ${
            version.version
        }`
    );
}
