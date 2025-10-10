import { syncProjects } from "./project";
import ora from "ora";

export async function syncCommand() {
    const spin = ora("Syncing project templates").start();
    await syncProjects(spin);
    spin.succeed("Done!");
}
