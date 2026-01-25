export const calculateMonthlyInterest = (principal, annualRate) => {
    if (!principal || !annualRate) return 0;
    return (principal * (annualRate / 100)) / 12;
};

export const calculatePMI = (principal, rate, months) => {
    // Not strictly needed if EMI amount is given, but good for validation or projection if needed.
    // The input gives 'monthly_emi', so we assume that is fixed.
    return 0; // Placeholder if not used
};
