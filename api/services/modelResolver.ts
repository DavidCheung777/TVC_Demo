import { db } from './db.js';

export type ModelRow = {
  id: string;
  Model_ID: string;
  provider: any;
  type: string;
  endpoint: string | null;
};

export class ModelResolutionError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export type MissingModelBehavior = 'throw400' | 'warn-keep' | 'silent-keep' | 'silent-unset';

async function findModelByIdOrModelId(inputModelId: string): Promise<ModelRow | null> {
  const { data: byId } = await db
    .from('models')
    .select('id, Model_ID, provider, type, endpoint')
    .eq('id', inputModelId)
    .single();

  if (byId) return byId as ModelRow;

  const { data: byModelId } = await db
    .from('models')
    .select('id, Model_ID, provider, type, endpoint')
    .eq('Model_ID', inputModelId)
    .single();

  return (byModelId as ModelRow) || null;
}

async function findDefaultModelByType(type: string): Promise<ModelRow | null> {
  const { data } = await db
    .from('models')
    .select('id, Model_ID, provider, type, endpoint')
    .eq('type', type)
    .eq('is_active', 1)
    .limit(1);

  if (data && data.length > 0) return data[0] as ModelRow;
  return null;
}

export async function resolveModel(opts: {
  inputModelId?: string;
  defaultModelType?: string;
  allowDefault?: boolean;
  missingModelBehavior?: MissingModelBehavior;
  logPrefix?: string;
}): Promise<{ modelIdToUse?: string; modelInfo: ModelRow | null; defaultUsed: boolean }> {
  const {
    inputModelId,
    defaultModelType,
    allowDefault = true,
    missingModelBehavior = 'warn-keep',
    logPrefix
  } = opts;

  const prefix = logPrefix ? `[${logPrefix}] ` : '';

  if (inputModelId) {
    const model = await findModelByIdOrModelId(inputModelId);
    if (model) {
      return { modelIdToUse: model.Model_ID, modelInfo: model, defaultUsed: false };
    }

    if (missingModelBehavior === 'throw400') {
      throw new ModelResolutionError('Model not found', 400, 'MODEL_NOT_FOUND');
    }

    if (missingModelBehavior === 'warn-keep') {
      console.warn(`${prefix}Model not found for id/Model_ID: ${inputModelId}`);
      return { modelIdToUse: inputModelId, modelInfo: null, defaultUsed: false };
    }

    if (missingModelBehavior === 'silent-keep') {
      return { modelIdToUse: inputModelId, modelInfo: null, defaultUsed: false };
    }

    return { modelIdToUse: undefined, modelInfo: null, defaultUsed: false };
  }

  if (allowDefault && defaultModelType) {
    const defaultModel = await findDefaultModelByType(defaultModelType);
    if (defaultModel) {
      if (logPrefix) console.log(`${prefix}Using default ${defaultModelType} model: ${defaultModel.Model_ID}`);
      return { modelIdToUse: defaultModel.Model_ID, modelInfo: defaultModel, defaultUsed: true };
    }
  }

  return { modelIdToUse: undefined, modelInfo: null, defaultUsed: false };
}

