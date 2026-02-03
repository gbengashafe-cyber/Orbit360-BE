import { Employee } from './employee.model';

export class EmployeeUtils {
  static readonly getDelta = (current: any, incoming: any) => {
    const changes: any[] = [];
    for (const key in incoming) {
      if (Object.prototype.hasOwnProperty.call(current, key) && incoming[key] !== current[key]) {
        changes.push({
          fieldName: key,
          oldValue: current[key]?.toString() || '',
          newValue: incoming[key]?.toString() || '',
        });
      }
    }
    return changes;
  };

  static readonly parseValue = (
    fieldName: string,
    value: string,
  ): { type: string; value: string | number | boolean | Date | null } => {
    if (value == null || value === 'null') {
      return { type: 'null', value: null };
    }

    const attribute = Employee.getAttributes[fieldName];
    if (!attribute) {
      return { type: 'string', value: value as string };
    }

    const type = attribute.type.toString().toUpperCase();

    if (type.includes('DECIMAL') || type.includes('INTEGER') || type.includes('NUMBER')) {
      return { type: 'number', value: Number(value) };
    }
    if (type.includes('BOOLEAN')) {
      return { type: 'boolean', value: value === 'true' || value === '1' };
    }
    if (type.includes('DATE')) {
      return { type: 'date', value: new Date(value) };
    }

    return { type: 'string', value: value as string };
  };
}
