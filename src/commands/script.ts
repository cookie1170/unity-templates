import { Choice, select, confirm } from "@topcli/prompts";
import { configBasePath, EditorVersion } from "../config";
import { scriptTemplates } from "./scriptTemplates";
import { $ } from "bun";
import { getEditorVersions } from "../config";
import ora from "ora";
import { syncCommand } from "./sync";

const savedScriptTemplatesPath: string = `${configBasePath}/script-templates`;
const editorScriptTemplatesPath: string = "Editor/Data/Resources/ScriptTemplates";

export async function scriptCommand() {
    const choices: Choice<string>[] = scriptTemplates.map((template) => {
        return {
            label: template.displayName,
            value: template.value,
        };
    });

    const chosenTemplate: string = await select("Select template to edit", {
        choices: choices,
        autocomplete: true,
    });

    const templatePath: string = `${savedScriptTemplatesPath}/${chosenTemplate}`;
    const templateFile = Bun.file(templatePath);
    if (!(await templateFile.exists())) {
        const templateText = await Bun.file(
            `${(await getEditorVersions())[0].path}/${editorScriptTemplatesPath}/${chosenTemplate}`
        ).text();

        await Bun.file(templatePath).write(templateText);
    }

    await $`xdg-open ${savedScriptTemplatesPath}/${chosenTemplate}`;
    if (await confirm("Sync templates?", { initial: true })) {
        syncCommand();
    }
}

export async function syncScriptTemplates(version: EditorVersion) {
    const spinner = ora(`Syncing script templates for version ${version.version}`);

    for (const template of scriptTemplates) {
        const savedTemplateFile = Bun.file(`${savedScriptTemplatesPath}/${template.value}`);
        if (!(await savedTemplateFile.exists())) continue;

        const editorTemplateFile = Bun.file(`${version.path}/${editorScriptTemplatesPath}/${template.value}`);
        spinner.text = `Copying template ${template.displayName}`;
        await Bun.write(editorTemplateFile, await savedTemplateFile.text());
    }

    spinner.succeed(`Synced script templates for version ${version.version}`);
}
