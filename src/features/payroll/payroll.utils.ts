import Decimal from 'decimal.js';
import { Employee } from '../employee/employee.model';

type TaxBreakDown = {
  band: string;
  tier: string;
  taxablePortion: number;
  rate: string;
  tax: number;
}[];

// Gross Income - Deductions
const calculateTaxableIncome = (annualGross: number, annualPension: number, annualNhf: number) => {
  return parseFloat(Math.max(0, annualGross - annualPension - annualNhf).toFixed(2));
};

const calculatePAYE = ({
  annualGross,
  annualPension,
  annualNhf,
}: {
  annualGross: number;
  annualPension: number;
  annualNhf: number;
}) => {
  const taxableIncome = calculateTaxableIncome(annualGross, annualPension, annualNhf);

  let annualTax = 0;
  let taxBreakdown: TaxBreakDown = [];
  let remainingIncome = taxableIncome;

  // Band 1: First ₦800,000 @ 0% (Tax-Free Threshold)
  if (remainingIncome > 0) {
    const bandAmount = Math.min(remainingIncome, 800000);
    const bandTax = parseFloat((bandAmount * 0).toFixed(2));
    annualTax += bandTax;
    taxBreakdown.push({
      band: 'Band 1',
      tier: 'First ₦800,000 (₦0 - ₦800,000)',
      taxablePortion: parseFloat(bandAmount.toFixed(2)),
      rate: '0%',
      tax: bandTax,
    });
    remainingIncome -= bandAmount;
  }

  // Band 2: Next ₦2,200,000 (₦800,001 - ₦3,000,000) @ 15%
  if (remainingIncome > 0) {
    const bandAmount = Math.min(remainingIncome, 2200000);
    const bandTax = parseFloat((bandAmount * 0.15).toFixed(2));
    annualTax += bandTax;
    taxBreakdown.push({
      band: 'Band 2',
      tier: 'Next ₦2,200,000 (₦800,001 - ₦3,000,000)',
      taxablePortion: parseFloat(bandAmount.toFixed(2)),
      rate: '15%',
      tax: bandTax,
    });
    remainingIncome -= bandAmount;
  }

  // Band 3: Next ₦9,000,000 (₦3,000,001 - ₦12,000,000) @ 18%
  if (remainingIncome > 0) {
    const bandAmount = Math.min(remainingIncome, 9000000);
    const bandTax = parseFloat((bandAmount * 0.18).toFixed(2));
    annualTax += bandTax;
    taxBreakdown.push({
      band: 'Band 3',
      tier: 'Next ₦9,000,000 (₦3,000,001 - ₦12,000,000)',
      taxablePortion: parseFloat(bandAmount.toFixed(2)),
      rate: '18%',
      tax: bandTax,
    });
    remainingIncome -= bandAmount;
  }

  // Band 4: Next ₦13,000,000 (₦12,000,001 - ₦25,000,000) @ 21%
  if (remainingIncome > 0) {
    const bandAmount = Math.min(remainingIncome, 13000000);
    const bandTax = parseFloat((bandAmount * 0.21).toFixed(2));
    annualTax += bandTax;
    taxBreakdown.push({
      band: 'Band 4',
      tier: 'Next ₦13,000,000 (₦12,000,001 - ₦25,000,000)',
      taxablePortion: parseFloat(bandAmount.toFixed(2)),
      rate: '21%',
      tax: bandTax,
    });
    remainingIncome -= bandAmount;
  }

  // Band 5: Next ₦25,000,000 (₦25,000,001 - ₦50,000,000) @ 23%
  if (remainingIncome > 0) {
    const bandAmount = Math.min(remainingIncome, 25000000);
    const bandTax = parseFloat((bandAmount * 0.23).toFixed(2));
    annualTax += bandTax;
    taxBreakdown.push({
      band: 'Band 5',
      tier: 'Next ₦25,000,000 (₦25,000,001 - ₦50,000,000)',
      taxablePortion: parseFloat(bandAmount.toFixed(2)),
      rate: '23%',
      tax: bandTax,
    });
    remainingIncome -= bandAmount;
  }

  // Band 6: Above ₦50,000,000 @ 25%
  if (remainingIncome > 0) {
    const bandAmount = remainingIncome;
    const bandTax = parseFloat((bandAmount * 0.25).toFixed(2));
    annualTax += bandTax;
    taxBreakdown.push({
      band: 'Band 6',
      tier: 'Above ₦50,000,000',
      taxablePortion: parseFloat(bandAmount.toFixed(2)),
      rate: '25%',
      tax: bandTax,
    });
  }

  // Step 3: Return Annual Tax and Monthly Tax (Annual ÷ 12)
  const finalAnnualTax = parseFloat(annualTax.toFixed(2));
  const monthlyTax = parseFloat((finalAnnualTax / 12).toFixed(2));

  return {
    tax: finalAnnualTax,
    monthlyTax: monthlyTax,
    taxableIncome: taxableIncome,
    breakdown: taxBreakdown,
  };
};

// 8% of (Basic + Housing + Transport)
const calculatePension = (employee: Employee, pensionRate = 0.08) => {
  const basic = new Decimal(employee.annualBasicSalary);
  const housing = new Decimal(employee.annualHousingAllowance);
  const transport = new Decimal(employee.annualTransportAllowance);
  const pensionableIncome = basic.plus(housing).plus(transport);

  return pensionableIncome.times(pensionRate).toFixed(2);
};

// 2.5% of Basic Salary only, if applicable
const calculateNHF = (employee: Employee, nhfRate = 0.025) => {
  if (!employee.nhfApplicable) return 0;

  return employee.annualBasicSalary * nhfRate;
};

const calculatePayroll = (employee: Employee, pensionRate = 0.08) => {
  const { annualBasicSalary, annualHousingAllowance, annualTransportAllowance, annualLeaveAllowance, otherAllowance } = employee;

  const basicSalary = annualBasicSalary / 12;
  const housingAllowance = annualHousingAllowance / 12;
  const transportAllowance = annualTransportAllowance / 12;
  const leaveAllowance = annualLeaveAllowance / 12;

  const monthlyGross = basicSalary + housingAllowance + transportAllowance + leaveAllowance;
  const annualGross = monthlyGross * 12;
  const annualPension = Number(calculatePension(employee, pensionRate));
  const annualNhf = calculateNHF(employee, 0.025);

  const { tax: annualTax, breakdown: taxBreakdown } = calculatePAYE({ annualGross, annualPension, annualNhf });
  const monthlyTax = annualTax / 12;

  const totalDeductions = annualPension / 12 + monthlyTax;
  const netSalary = monthlyGross - totalDeductions;

  const result = {
    payRoll: {
      basicSalary,
      grossSalary: Number(new Decimal(monthlyGross).toFixed(2)),
      housingAllowance,
      transportAllowance,
      leaveAllowance,
      otherAllowance,
      pensionDeduction: annualPension / 12,
      payeDeduction: monthlyTax,
      nhfDeduction: annualNhf / 12,
      loanDeduction: 0,
    },

    others: {
      allowances: {
        total: housingAllowance + transportAllowance + leaveAllowance + otherAllowance + otherAllowance / 12,
      },

      netSalary,
      taxBreakdown,
      annualGross,
    },
  };

  return result;
};

export { calculatePayroll };
