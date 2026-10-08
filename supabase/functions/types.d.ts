declare module 'npm:openai' {
  const OpenAI: any;
  export default OpenAI;
}

declare const Deno: {
  env: {
    get: (key: string) => string | undefined;
  };
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};
