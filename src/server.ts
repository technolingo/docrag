import app from './app.ts';
import { port } from './config.ts';

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
