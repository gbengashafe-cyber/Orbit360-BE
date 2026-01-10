import Decimal from 'decimal.js';
import { CreationAttributes } from 'sequelize';
import { Employee } from '../employee/employee.model';
import { LoanPayment } from '../loans/loan-payment.model';
import { Loan } from '../loans/loan.model';

type TaxBreakDown = {
  band: string;
  tier: string;
  taxablePortion: number;
  rate: string;
  tax: number;
}[];

// Gross Income - Deductions
const calculateTaxableIncome = (annualGross: number, annualPension: number, annualNhf: number) => {
  return Number.parseFloat(Math.max(0, annualGross - annualPension - annualNhf).toFixed(2));
};

const calculateBandTax = (remainingIncome: number, bandRate: number, bandMax: number) => {
  const bandAmount = Math.min(remainingIncome, bandMax);
  const bandTax = Number.parseFloat((bandAmount * bandRate).toFixed(2));

  return { bandAmount, bandTax };
};

type PayeProps = {
  annualGross: number;
  annualPension: number;
  annualNhf: number;
};
const calculatePAYE = ({ annualGross, annualPension, annualNhf }: PayeProps) => {
  const taxableIncome = calculateTaxableIncome(annualGross, annualPension, annualNhf);

  let annualTax = 0;
  let taxBreakdown: TaxBreakDown = [];
  let remainingIncome = taxableIncome;

  // Band 1: First ₦800,000 @ 0% (Tax-Free Threshold)
  if (remainingIncome > 0) {
    const bandRate = 0;
    const bandMax = 800_000;
    const { bandAmount, bandTax } = calculateBandTax(remainingIncome, bandRate, bandMax);
    annualTax += bandTax;
    taxBreakdown.push({
      band: 'Band 1',
      tier: 'First ₦800,000 (₦0 - ₦800,000)',
      taxablePortion: Number.parseFloat(bandAmount.toFixed(2)),
      rate: '0%',
      tax: bandTax,
    });
    remainingIncome -= bandAmount;
  }

  // Band 2: Next ₦2,200,000 (₦800,001 - ₦3,000,000) @ 15%
  if (remainingIncome > 0) {
    const bandMax = 2_200_000;
    const bandRate = 0.15;
    const { bandAmount, bandTax } = calculateBandTax(remainingIncome, bandRate, bandMax);
    annualTax += bandTax;
    taxBreakdown.push({
      band: 'Band 2',
      tier: 'Next ₦2,200,000 (₦800,001 - ₦3,000,000)',
      taxablePortion: Number.parseFloat(bandAmount.toFixed(2)),
      rate: '15%',
      tax: bandTax,
    });
    remainingIncome -= bandAmount;
  }

  // Band 3: Next ₦9,000,000 (₦3,000,001 - ₦12,000,000) @ 18%
  if (remainingIncome > 0) {
    const bandMax = 9_000_000;
    const bandRate = 0.18;
    const { bandAmount, bandTax } = calculateBandTax(remainingIncome, bandRate, bandMax);
    annualTax += bandTax;
    taxBreakdown.push({
      band: 'Band 3',
      tier: 'Next ₦9,000,000 (₦3,000,001 - ₦12,000,000)',
      taxablePortion: Number.parseFloat(bandAmount.toFixed(2)),
      rate: '18%',
      tax: bandTax,
    });
    remainingIncome -= bandAmount;
  }

  // Band 4: Next ₦13,000,000 (₦12,000,001 - ₦25,000,000) @ 21%
  if (remainingIncome > 0) {
    const bandMax = 13_000_000;
    const bandRate = 0.21;
    const { bandAmount, bandTax } = calculateBandTax(remainingIncome, bandRate, bandMax);
    annualTax += bandTax;
    taxBreakdown.push({
      band: 'Band 4',
      tier: 'Next ₦13,000,000 (₦12,000,001 - ₦25,000,000)',
      taxablePortion: Number.parseFloat(bandAmount.toFixed(2)),
      rate: '21%',
      tax: bandTax,
    });
    remainingIncome -= bandAmount;
  }

  // Band 5: Next ₦25,000,000 (₦25,000,001 - ₦50,000,000) @ 23%
  if (remainingIncome > 0) {
    const bandMax = 25_000_000;
    const bandRate = 0.23;
    const { bandAmount, bandTax } = calculateBandTax(remainingIncome, bandRate, bandMax);
    annualTax += bandTax;
    taxBreakdown.push({
      band: 'Band 5',
      tier: 'Next ₦25,000,000 (₦25,000,001 - ₦50,000,000)',
      taxablePortion: Number.parseFloat(bandAmount.toFixed(2)),
      rate: '23%',
      tax: bandTax,
    });
    remainingIncome -= bandAmount;
  }

  // Band 6: Above ₦50,000,000 @ 25%
  if (remainingIncome > 0) {
    const bandAmount = remainingIncome;
    const bandTax = Number.parseFloat((bandAmount * 0.25).toFixed(2));
    annualTax += bandTax;
    taxBreakdown.push({
      band: 'Band 6',
      tier: 'Above ₦50,000,000',
      taxablePortion: Number.parseFloat(bandAmount.toFixed(2)),
      rate: '25%',
      tax: bandTax,
    });
  }

  // Step 3: Return Annual Tax and Monthly Tax (Annual ÷ 12)
  const finalAnnualTax = Number.parseFloat(annualTax.toFixed(2));
  const monthlyTax = Number.parseFloat((finalAnnualTax / 12).toFixed(2));

  return {
    tax: finalAnnualTax,
    monthlyTax,
    taxableIncome,
    breakdown: taxBreakdown,
  };
};

// 8% of (Basic + Housing + Transport)
const calculatePension = (employee: Employee, pensionRate = 0.08) => {
  const basic = Number(employee.annualBasicSalary);
  const housing = Number(employee.annualHousingAllowance);
  const transport = Number(employee.annualTransportAllowance);
  const pensionableIncome = basic + housing + transport;

  return Number(pensionableIncome * pensionRate).toFixed(2);
};

// 2.5% of Basic Salary only, if applicable
const calculateNHF = (employee: Employee, nhfRate = 0.025) => {
  if (!employee.nhfApplicable) return 0;

  return employee.annualBasicSalary * nhfRate;
};

type Year = `20${number}${number}`;
type Month = `0${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}` | `1${0 | 1 | 2}`;
export type PayPeriod = `${Year}-${Month}`;

type CalculatePayroll = {
  employee: Employee;
  activeLoans: Loan[];
  payPeriod: PayPeriod;
  pensionRate: number;
};

const calculatePayroll = ({ employee, activeLoans, payPeriod, pensionRate = 0.08 }: CalculatePayroll) => {
  const { annualBasicSalary, annualHousingAllowance, annualTransportAllowance, annualLeaveAllowance, otherAllowance } = employee;

  const basicSalary = annualBasicSalary / 12;
  const housingAllowance = annualHousingAllowance / 12;
  const transportAllowance = annualTransportAllowance / 12;
  const leaveAllowance = annualLeaveAllowance / 12;
  const otherMonthlyAllowances = otherAllowance / 12;

  const monthlyGross = basicSalary + housingAllowance + transportAllowance + leaveAllowance + otherMonthlyAllowances;
  const annualGross = monthlyGross * 12;

  const annualPension = Number(calculatePension(employee, pensionRate));
  const annualNhf = calculateNHF(employee, 0.025);

  const { tax: annualTax, breakdown: taxBreakdown } = calculatePAYE({ annualGross, annualPension, annualNhf });
  const monthlyTax = annualTax / 12;

  const applicableLoansForPeriod = [] as Omit<CreationAttributes<LoanPayment>, 'payPeriod'>[];

  const periodDate = new Date(payPeriod + '-01');
  const periodYear = periodDate.getFullYear();
  const periodMonth = periodDate.getMonth();

  let loanDeduction = 0;
  for (const loan of activeLoans) {
    const startDate = new Date(loan.startDate);
    const endDate = new Date(loan.endDate);

    // Create dates for the first day of start and end months for proper comparison
    const loanStartMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const loanEndMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    const payPeriodMonth = new Date(periodYear, periodMonth, 1);

    // Check if the pay period falls within the loan's active period
    if (payPeriodMonth >= loanStartMonth && payPeriodMonth <= loanEndMonth) {
      const totalInterest = Number(loan.principalAmount) * (loan.interestRate / 100) * (loan.tenureMonths / 12);

      const loanMonthlyDeduction = (Number(loan.principalAmount) + totalInterest) / loan.tenureMonths;

      loanDeduction = loanDeduction + loanMonthlyDeduction;

      applicableLoansForPeriod.push({
        ...loan,
        amount: loanMonthlyDeduction,
        paymentDate: periodDate,
        loanId: loan.id,
        employeeId: employee.id,
      });
    }
  }

  const totalDeductions = annualPension / 12 + monthlyTax + annualNhf / 12 + loanDeduction;
  const netSalary = monthlyGross - totalDeductions;

  const result = {
    payRoll: {
      basicSalary,
      grossSalary: Number(new Decimal(monthlyGross).toFixed(2)),
      housingAllowance,
      transportAllowance,
      leaveAllowance,
      otherAllowance: otherMonthlyAllowances,
      pensionDeduction: annualPension / 12,
      payeDeduction: monthlyTax,
      nhfDeduction: annualNhf / 12,
      loanDeduction,
    },
    totalAllowances: housingAllowance + transportAllowance + leaveAllowance + otherAllowance + otherAllowance / 12,
    netSalary,
    taxBreakdown,
    annualGross,
    applicableLoansForPeriod,
  };

  return result;
};

export { calculatePayroll };
