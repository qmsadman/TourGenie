// Schema options shared across models.
//
// Every collection names its timestamps the way the proposal's schema does
// (created_at / updated_at) rather than Mongoose's camelCase default.
export const TIMESTAMPS = {
  timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
};
