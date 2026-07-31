import { buildApp } from "./composition-root.ts";
import { config } from "./config.ts";

const app = buildApp();
// build including db
// const { app, client } = await buildApp();

const server = app.listen(config.port, () => {
    console.log(`ask-my-docs app listening on port ${config.port}`);
});

// graceful shutdown: stop accepting requests first, then close the DB
// for (const signal of ["SIGINT", "SIGTERM"] as const) {
//     process.on(signal, () => {
//         server.close(async () => {
//             await client.close();
//             process.exit(0);
//         });
//     });
// }
