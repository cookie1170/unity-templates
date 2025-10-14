import { Choice, select, confirm } from "@topcli/prompts";
import { configBasePath, EditorVersion } from "../config";
import { scriptTemplates } from "./scriptTemplates";
import { $ } from "bun";
import { getEditorVersions } from "../config";
import ora from "ora";
import { syncCommand } from "./sync";
import { cp, rm, exists } from "node:fs/promises";

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
    const csExtensionReplaced = templatePath.replace(".txt", "");
    try {
        await cp(templatePath, csExtensionReplaced); // for syntax highligthing
        await $`code -w ${csExtensionReplaced}`;
        await cp(csExtensionReplaced, templatePath);
    } catch {
        try {
            await $`xdg-open ${templatePath}`;
        } catch {
            console.log(`Failed to open the script template at path ${templatePath}`);
        }
    }

    const doSync = await confirm("Sync templates?", { initial: true });
    if (await exists(csExtensionReplaced)) await rm(csExtensionReplaced);

    if (doSync) {
        syncCommand();
    }
}

export async function syncScripts(version: EditorVersion) {
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
