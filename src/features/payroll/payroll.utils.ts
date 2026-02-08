import Decimal from 'decimal.js';
import { CreationAttributes } from 'sequelize';
import { Employee } from '../employee/employee.model';
import { LoanPayment } from '../loans/loan-payment.model';
import { Loan } from '../loans/loan.model';

type TaxBreakDown = {
  band: string;
  taxablePortion: number;
  rate: string;
  tax: number;
}[];

type PayeProps = {
  annualGross: number;
  annualPension: number;
  annualNhf: number;
  annualRentRelief: number;
};
const calculatePAYE = ({ annualGross, annualPension, annualNhf, annualRentRelief }: PayeProps) => {
  const gross = new Decimal(annualGross);
  const pension = new Decimal(annualPension);
  const nhf = new Decimal(annualNhf);
  const rentRelief = new Decimal(annualRentRelief);

  const bands = [
    { name: 'Tax-Free Threshold', limit: 800000, rate: 0.0 },
    { name: 'First Band', limit: 2200000, rate: 0.15 }, // 800k to 3m
    { name: 'Second Band', limit: 9000000, rate: 0.18 }, // 3m to 12m
    { name: 'Third Band', limit: 13000000, rate: 0.21 }, // 12m to 25m
    { name: 'Fourth Band', limit: 25000000, rate: 0.23 }, // 25m to 50m
    { name: 'Top Band', limit: Infinity, rate: 0.25 }, // Over 50m
  ];

  // 1. Taxable Income = Gross - (Pension + NHF + Rent Relief)
  let taxableIncome = gross.minus(pension).minus(nhf).minus(rentRelief);
  if (taxableIncome.lt(0)) taxableIncome = new Decimal(0);
  if (taxableIncome.lte(800000)) {
    return {
      annualTax: 0,
      monthlyTax: 0,
      taxableIncome: taxableIncome.toDecimalPlaces(2).toNumber(),
      taxBreakdown: [{ band: bands[0].name, taxablePortion: taxableIncome.toNumber(), rate: '0%', tax: 0 }],
    };
  }

  let totalTax = new Decimal(0);
  let remainingIncome = taxableIncome;
  const taxBreakdown: TaxBreakDown = [];

  for (const band of bands) {
    if (remainingIncome.lte(0)) break;

    const incomeInBand = Decimal.min(remainingIncome, band.limit);
    const taxInBand = incomeInBand.mul(band.rate);

    taxBreakdown.push({
      band: band.name,
      taxablePortion: incomeInBand.toDecimalPlaces(2).toNumber(),
      rate: `${band.rate * 100}%`,
      tax: taxInBand.toDecimalPlaces(2).toNumber(),
    });

    totalTax = totalTax.plus(taxInBand);
    remainingIncome = remainingIncome.minus(incomeInBand);
  }

  // 3. Minimum Tax Check (1% of Gross)
  const minimumTax = gross.mul(0.01);
  const finalAnnualTax = totalTax.gt(minimumTax) ? totalTax : minimumTax;

  return {
    annualTax: finalAnnualTax.toNumber(),
    monthlyTax: finalAnnualTax.div(12).toDecimalPlaces(2).toNumber(),
    taxableIncome: taxableIncome.toDecimalPlaces(2).toNumber(),
    taxBreakdown,
  };
};

/**
 * Calculates monthly or annual pension deduction
 * @param employee The employee record
 * @param rate The pension rate (default 0.08)
 */
export const calculatePension = (employee: any, rate: number = 0.08): Decimal => {
  const { annualBasicSalary, annualHousingAllowance, annualTransportAllowance } = employee;

  // Pension is calculated on (Basic + Housing + Transport)
  const pensionableIncome = new Decimal(annualBasicSalary).plus(annualHousingAllowance).plus(annualTransportAllowance);

  return pensionableIncome.mul(rate);
};

/**
 * Calculates NHF deduction
 * @param employee The employee record
 * @param rate The NHF rate (default 0.025)
 */
export const calculateNHF = (employee: any, rate: number = 0.025): Decimal => {
  return new Decimal(employee.annualBasicSalary).mul(rate);
};

const MAX_RENT_RELIEF = 500000;
export const calculateRentRelief = (rentAmount: number) => {
  const rentRelief = new Decimal(rentAmount).mul(0.2);
  return rentRelief.lessThanOrEqualTo(500000) ? rentRelief : new Decimal(MAX_RENT_RELIEF);
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
  const { annualBasicSalary, annualHousingAllowance, annualTransportAllowance, annualLeaveAllowance, annualOtherAllowances } =
    employee;

  const basicSalary = new Decimal(annualBasicSalary).div(12);
  const housingAllowance = new Decimal(annualHousingAllowance).div(12);
  const transportAllowance = new Decimal(annualTransportAllowance).div(12);
  const leaveAllowance = new Decimal(annualLeaveAllowance).div(12);
  const otherMonthlyAllowances = new Decimal(annualOtherAllowances).div(12);

  const monthlyGross = basicSalary
    .plus(housingAllowance)
    .plus(transportAllowance)
    .plus(leaveAllowance)
    .plus(otherMonthlyAllowances);

  const monthlyPension = new Decimal(calculatePension(employee, pensionRate)).div(12);
  const monthlyNhf = new Decimal(calculateNHF(employee, 0.025)).div(12);

  const annualGross = monthlyGross.mul(12).toDecimalPlaces(2).toNumber();

  const annualPension = calculatePension(employee, pensionRate);
  const annualNhf = calculateNHF(employee, 0.025);
  const annualRentRelief = calculateRentRelief(employee.annualRentAmount);

  const { annualTax, taxBreakdown } = calculatePAYE({
    annualGross,
    annualPension: annualPension.toNumber(),
    annualNhf: annualNhf.toNumber(),
    annualRentRelief: annualRentRelief.toNumber(),
  });
  const monthlyTax = new Decimal(annualTax).div(12);

  const applicableLoansForPeriod = [] as Omit<CreationAttributes<LoanPayment>, 'payPeriod'>[];

  const periodDate = new Date(payPeriod + '-01');
  const periodYear = periodDate.getFullYear();
  const periodMonth = periodDate.getMonth();

  let loanDeduction = new Decimal(0);
  for (const loan of activeLoans) {
    const startDate = new Date(loan.startDate);
    const endDate = new Date(loan.endDate);

    // Create dates for the first day of start and end months for proper comparison
    const loanStartMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const loanEndMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    const payPeriodMonth = new Date(periodYear, periodMonth, 1);

    // Check if the pay period falls within the loan's active period
    if (payPeriodMonth >= loanStartMonth && payPeriodMonth <= loanEndMonth) {
      const principal = new Decimal(loan.principalAmount);
      const totalInterest = principal.mul(loan.interestRate / 100).mul(loan.tenureMonths / 12);
      const loanMonthlyDeduction = principal.plus(totalInterest).div(loan.tenureMonths);
      loanDeduction = loanDeduction.plus(loanMonthlyDeduction);

      applicableLoansForPeriod.push({
        ...loan,
        amount: loanMonthlyDeduction.toDecimalPlaces(2).toNumber(),
        paymentDate: periodDate,
        loanId: loan.id,
        employeeId: employee.id,
      });
    }
  }

  const totalDeductions = monthlyPension.plus(monthlyTax).plus(monthlyNhf).plus(loanDeduction);
  const netSalary = monthlyGross.minus(totalDeductions);

  const result = {
    payroll: {
      basicSalary: basicSalary.toDecimalPlaces(2).toNumber(),
      grossSalary: monthlyGross.toDecimalPlaces(2).toNumber(),
      housingAllowance: housingAllowance.toDecimalPlaces(2).toNumber(),
      transportAllowance: transportAllowance.toDecimalPlaces(2).toNumber(),
      leaveAllowance: leaveAllowance.toDecimalPlaces(2).toNumber(),
      otherAllowance: otherMonthlyAllowances.toDecimalPlaces(2).toNumber(),
      pensionDeduction: annualPension.div(12).toDecimalPlaces(2).toNumber(),
      nhfDeduction: annualNhf.div(12).toDecimalPlaces(2).toNumber(),
      payeDeduction: monthlyTax.toDecimalPlaces(2).toNumber(),
      loanDeduction: loanDeduction.toDecimalPlaces(2).toNumber(),
      rentRelief: annualRentRelief.div(12).toDecimalPlaces(2).toNumber(),
    },
    totalAllowances: housingAllowance
      .plus(transportAllowance)
      .plus(leaveAllowance)
      .plus(new Decimal(annualOtherAllowances).div(12))
      .toDecimalPlaces(2)
      .toNumber(),
    netSalary: netSalary.toDecimalPlaces(2).toNumber(),
    taxBreakdown,
    annualGross,
    applicableLoansForPeriod,
  };

  return result;
};

export { calculatePayroll };
