import { Choice, multiselect, confirm, required } from "@topcli/prompts";
import { getConfigFolder } from "../config";
import ora from "ora";
import { syncPrompt } from "./sync";
import open from "open";
import { scriptTemplates } from "../scriptTemplates";
import { EditorVersion } from "../misc";

export const savedScriptTemplatesPath: string = `${getConfigFolder()}/script-templates`;
const editorScriptTemplatesPath: string = "Editor/Data/Resources/ScriptTemplates";

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

        const templatePath: string = `${savedScriptTemplatesPath}/${chosenTemplate}`;
        const templateFile = Bun.file(templatePath);
        if (!(await templateFile.exists())) {
            const templateIndex = scriptTemplates.findIndex((template) => template.value == chosenTemplate);
            const templateText = scriptTemplates[templateIndex].defaultValue;

            await Bun.file(templatePath).write(templateText);
        }

        await open(templatePath, { wait: true });
        if (i < chosenTemplates.length - 1) {
            if (await confirm("Continue?", { initial: true })) {
                continue;
            } else break;
        }
    }

    await syncPrompt();
}

export async function syncScripts(version: EditorVersion) {
    const spinner = ora(`Syncing script templates for version ${version.version}`);

    for (const template of scriptTemplates) {
        const editorTemplateFile = Bun.file(`${version.path}/${editorScriptTemplatesPath}/${template.value}`);
        spinner.text = `Resetting template ${template.displayName}`;
        await Bun.write(editorTemplateFile, template.defaultValue);

        const savedTemplateFile = Bun.file(`${savedScriptTemplatesPath}/${template.value}`);
        if (!(await savedTemplateFile.exists())) continue;

        spinner.text = `Copying template ${template.displayName}`;
        await Bun.write(editorTemplateFile, await savedTemplateFile.text());
    }

    spinner.succeed(`Synced script templates for version ${version.version}`);
}
