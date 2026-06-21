import { buildApp } from "./composition-root.ts";
import { config } from "./config.ts";

const app = buildApp();

app.listen(config.port, () => {
    console.log(`ask-my-docs app listening on port ${config.port}`);
});
