// No-op module for externalized node dependencies in the renderer
export const env = {};
export const Tensor = {};
export const InferenceSession = {
  create: async () => { throw new Error("No-op InferenceSession in renderer"); }
};

export default {
  env,
  Tensor,
  InferenceSession,
};
