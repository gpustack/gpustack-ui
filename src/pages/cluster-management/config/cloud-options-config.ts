import { FieldSchema } from '@/components/dynamic-form/config/types';

export const fields = {
  volumes: {
    type: 'array',
    minItems: 1,
    items: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        size_gb: { type: 'number', unit: 'GB' },
        format: { type: 'string' }
      },
      required: ['name', 'size_gb', 'format']
    }
  }
};

export const fieldConfig: Record<string, FieldSchema> = {
  volumes: {
    type: 'array',
    title: 'Volumes',
    name: 'volumes',
    required: ['name', 'size_gb', 'format'],
    properties: {
      name: {
        name: 'name',
        type: 'string',
        title: 'Name',
        widget: 'Input'
      },
      size_gb: {
        name: 'size_gb',
        type: 'number',
        title: 'Size (GB)',
        widget: 'InputNumber',
        min: 0,
        style: { width: 120 }
      },
      format: {
        name: 'format',
        type: 'string',
        title: 'Format',
        widget: 'Select',
        enum: ['ext4', 'xfs'],
        style: { width: 150 }
      }
    }
  }
};
