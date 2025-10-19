import open from "open";
import { config, getConfigFolder } from "../config";
import { savedProjectTemplatesPath } from "./project";
import { savedScriptTemplatesPath } from "./script";

export async function openConfigCommand(options: any) {
    switch (options.file) {
        case "common": {
            await open(config.path);
            break;
        }

        case "project": {
            await open(savedProjectTemplatesPath);
            break;
        }

        case "script": {
            await open(savedScriptTemplatesPath);
            break;
        }

        default: {
            await open(getConfigFolder());
            break;
        }
    }
}
