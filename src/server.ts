import app from './app.ts';
import { port } from './config.ts';

app.listen(port, () => {
  console.log(`ask-my-docs app listening on port ${port}`);
});
