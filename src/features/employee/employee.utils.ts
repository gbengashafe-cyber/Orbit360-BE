import { toCents } from '../../utils/money.utils';
import { Employee } from './employee.model';

const calculateMonthlyPensionableIncome = (employee: Employee) => {
  return toCents(employee.annualBasicSalary + employee.annualHousingAllowance + employee.annualTransportAllowance);
};

export { calculateMonthlyPensionableIncome };
