import { inngest } from './client';

export const helloWorld = inngest.createFunction(
  { id: 'hello-world', triggers: [{ event: 'test/hello' }] },
  async ({ step }) => {
    const msg = await step.run('say-hello', async () => 'hello from inngest');
    return { msg };
  },
);
