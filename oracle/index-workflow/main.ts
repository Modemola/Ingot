/// Entry point the CRE CLI compiles to WASM: parse the config, hand the workflow to the runner.
import { Runner } from "@chainlink/cre-sdk";

import { type Config, initWorkflow } from "../workflow";

export async function main() {
  const runner = await Runner.newRunner<Config>({
    configParser: (raw) => JSON.parse(new TextDecoder().decode(raw)) as Config,
  });
  await runner.run(initWorkflow);
}

main();
