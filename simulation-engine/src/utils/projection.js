import { calculateMonthlyInterest } from './financials.js';

export const projectState = (
    startBalance,
    startObligations,
    horizonMonths,
    constraints
) => {
    let balance = startBalance;
    // Deep copy obligations to avoid mutating the strategy object state
    let obligations = JSON.parse(JSON.stringify(startObligations));

    let totalInterest = 0;
    let totalPenalties = 0;
    let cashBufferBreachMonth = null; // 1-indexed
    let emiMissMonth = null; // 1-indexed

    // We assume no income is added during the horizon as per standard debt simulation unless specified.
    // We assume the user wants to survive with current cash.

    for (let m = 1; m <= horizonMonths; m++) {
        // 1. Accrue Interest on Credit Card
        if (obligations.credit_card && obligations.credit_card.outstanding > 0) {
            const interest = calculateMonthlyInterest(
                obligations.credit_card.outstanding,
                obligations.credit_card.apr
            );
            totalInterest += interest;
            obligations.credit_card.outstanding += interest;
        }

        // 2. Determine Payments (EMIs + CC)
        // Priority: Usually EMIs are fixed commitments, CC is flexible min_due.
        // We will attempt to pay everything. If short, we prioritize EMIs? 
        // Or do we prioritize whichever avoids the biggest hit?
        // Let's assume standard behavior: Try to pay everything. 

        let monthlyBill = 0;

        // a. EMI Obligations
        let emiTotal = 0;
        if (obligations.emis) {
            obligations.emis.forEach(emi => {
                if (emi.remaining_months > 0) {
                    emiTotal += emi.monthly_emi;
                }
            });
        }

        // b. CC Min Due
        // Min due is usually recalculated.
        // If we have the initial min_due, we can assume a ratio or just generic 3-5%.
        // To match "Deterministic", we rely on the input ratio if possible.
        let ccMinDue = 0;
        if (obligations.credit_card && obligations.credit_card.outstanding > 0) {
            // If min_due was provided in input, we use that ratio. Else 5%.
            // But wait, the input `obligations` here are the *projected* ones.
            // We don't have the original input strictly here easily unless passed.
            // We'll trust `min_due` exists on the object.
            // We should stick to the ratio of (min_due / outstanding) from the start if possible, 
            // but here we just approximate 5% if we can't infer.
            // Actually `startObligations` is the state *right now*.
            // So `obligations.credit_card.min_due` is the current min due.
            // Let's calculate the ratio once.
            const ratio = (obligations.credit_card.min_due / obligations.credit_card.outstanding) || 0.05;
            ccMinDue = obligations.credit_card.outstanding * ratio;
            // Sanity check: Min due shouldn't exceed outstanding
            if (ccMinDue > obligations.credit_card.outstanding) ccMinDue = obligations.credit_card.outstanding;
        }

        // Total need
        // We pay EMIs first (Logic: Fixed term, higher penalty often, asset backed)
        // Then CC.

        // Pay EMIs
        if (obligations.emis) {
            obligations.emis.forEach(emi => {
                if (emi.remaining_months > 0) {
                    if (balance >= emi.monthly_emi) {
                        balance -= emi.monthly_emi;
                        emi.remaining_months--;
                    } else {
                        // Miss
                        if (emiMissMonth === null) emiMissMonth = m;
                        totalPenalties += emi.miss_penalty;
                        // Note: We do NOT decrement remaining_months if we miss? 
                        // Usually term extends or arrears. Let's assume simple miss.
                        // Important: If we miss, we don't pay.
                    }
                }
            });
        }

        // Pay CC
        if (obligations.credit_card && obligations.credit_card.outstanding > 0) {
            if (balance >= ccMinDue) {
                balance -= ccMinDue;
                // Pay down principal (minus interest we just added? No, standard logic)
                // outstanding reduced by payment
                obligations.credit_card.outstanding -= ccMinDue;
            } else {
                // Miss
                // No explicit CC penalty in input schema, so assuming 0 monetary but it's a "miss".
                // We can check liquidity risk flag later.
            }
        }

        // Check Buffer Breach
        if (balance < constraints.min_cash_buffer) {
            if (cashBufferBreachMonth === null) cashBufferBreachMonth = m;
        }
    }

    return {
        total_interest: Number(totalInterest.toFixed(2)),
        total_penalties: Number(totalPenalties.toFixed(2)),
        cash_buffer_breach_month: cashBufferBreachMonth,
        emi_miss_month: emiMissMonth
    };
};
