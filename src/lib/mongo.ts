import { Types, type Document, type Model } from "mongoose";

export function toPlainObject<T extends Document>(doc: T) {
  const plain = doc.toObject({ versionKey: false });

  for (const [key, value] of Object.entries(plain)) {
    if (value instanceof Types.ObjectId) {
      plain[key] = value.toString();
    }
  }

  const id =
    doc._id instanceof Types.ObjectId ? doc._id.toString() : String(doc._id);

  return {
    ...plain,
    id,
  };
}

export async function findByIdOrThrow<TDoc extends Document>(
  model: Model<TDoc>,
  id: string,
  errorMessage = "Resource not found",
) {
  const document = await model.findById(id);

  if (!document) {
    throw new Error(errorMessage);
  }

  return document;
}

