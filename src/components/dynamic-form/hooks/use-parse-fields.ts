import { useMemo } from 'react';
import { FieldSchema } from '../config/types';

interface ParsedField {
  name: (string | number)[];
  schema: FieldSchema;
}

const parseSchema = (
  schema: Record<string, FieldSchema>,
  parentName: (string | number)[] = []
): ParsedField[] => {
  const fields: ParsedField[] = [];

  Object.entries(schema).forEach(([key, fieldSchema]) => {
    const currentName = [...parentName, key];
    if (fieldSchema.type === 'object' && fieldSchema.properties) {
      fields.push(...parseSchema(fieldSchema.properties, currentName));
    } else if (fieldSchema.type === 'array' && fieldSchema.items) {
      fields.push({ name: currentName, schema: fieldSchema });
    } else {
      fields.push({ name: currentName, schema: fieldSchema });
    }
  });

  return fields;
};

const useParsedFields = (schema: Record<string, FieldSchema>) => {
  return useMemo(() => parseSchema(schema), [schema]);
};

export default useParsedFields;
