import { calculateMonthlyInterest } from '../utils/financials.js';

const runProjection = (startBalance, startCardState, startEmis, horizonMonths, constraints) => {
    let balance = startBalance;
    let card = { ...startCardState };
    let emis = startEmis.map(e => ({ ...e }));

    let totalInterest = 0;
    let totalPenalties = 0;
    let cashBufferBreachMonth = null;
    let emiMissMonth = null;

    for (let m = 1; m <= horizonMonths; m++) {
        // 1. Accrue Interest on Card
        if (card && card.outstanding > 0) {
            const interest = calculateMonthlyInterest(card.outstanding, card.apr);
            totalInterest += interest;
            card.outstanding += interest;
        }

        // 2. Pay Obligations (BAU: Min Due + EMIs)
        let monthlyOutflow = 0;

        // Card Min Due
        if (card && card.outstanding > 0) {
            // Recalculate min_due? Usually % of outstanding or fixed. 
            // We will assume the strict input 'min_due' was for the current month.
            // For future months, we assume min_due is roughly same % of outstanding or same amount.
            // Let's approximate: Min Due is usually Max(fixed, % of balance).
            // Without formula, we might assume it stays constant or scales.
            // Let's assume generic 5% of outstanding if not provided for future.
            // But to be deterministic and simple: assume the *ratio* of initial min_due/initial_outstanding persists.
            const conversionRatio = (startCardState.min_due / startCardState.outstanding) || 0.05;
            let currentMinDue = card.outstanding * conversionRatio;

            // If balance enables payment
            if (balance >= currentMinDue) {
                monthlyOutflow += currentMinDue;
                card.outstanding -= currentMinDue; // Approximation: payment goes to principal+interest breakdown, but here we just reduce balance
                // (Since we added interest above, this roughly works)
            } else {
                // Miss
                totalPenalties += 0; // Unknown penalty amount for CC miss in valid constraints, assuming standard late fee?
                // Prompt doesn't give CC penalty. We should just flag liquidity issues.
                // But valid strategy constraint: "balance falls below min_cash_buffer" is checked on IMMEDIATE state only? 
                // "4. FOR EACH STRATEGY... forward projection... month of cash buffer breach"
                // So future breaches are allowed but recorded.
            }
        }

        // EMIs
        for (const emi of emis) {
            if (emi.remaining_months > 0) {
                if (balance >= emi.monthly_emi) {
                    monthlyOutflow += emi.monthly_emi;
                    balance -= emi.monthly_emi;
                    emi.remaining_months--;
                } else {
                    if (emiMissMonth === null) emiMissMonth = m;
                    totalPenalties += emi.miss_penalty;
                }
            }
        }

        // Pay CC
        // (Simulating order: EMIs first? or CC first? standard logic: pay all if possible)
        // We already deducted EMI from balance. Now CC.
        // Wait, I didn't deduct monthlyOutflow for CC above.
        // Let's just track balance changes directly.

        // Re-doing flow for clarity:
        // a. Income? (None)
        // b. Obligations:

        // EMI
        emis.forEach(emi => {
            if (emi.remaining_months > 0) {
                if (balance >= emi.monthly_emi) {
                    balance -= emi.monthly_emi;
                    emi.remaining_months--;
                } else {
                    if (!emiMissMonth) emiMissMonth = m;
                    totalPenalties += emi.miss_penalty;
                }
            }
        });

        // CC Min Due
        if (card && card.outstanding > 0) {
            const ratio = (startCardState.min_due / startCardState.outstanding) || 0;
            let pmt = card.outstanding * ratio;
            if (pmt < 10) pmt = card.outstanding; // rough floor

            if (balance >= pmt) {
                balance -= pmt;
                card.outstanding -= pmt;
            } else {
                // CC Miss (no specific penalty field provided for CC, so we ignore $ penalty but maybe score impact? Not requested.)
            }
        }

        // Check Breach
        if (balance < constraints.min_cash_buffer) {
            if (!cashBufferBreachMonth) cashBufferBreachMonth = m;
        }
    }

    return {
        total_interest: totalInterest,
        total_penalties: totalPenalties,
        cash_buffer_breach_month: cashBufferBreachMonth,
        emi_miss_month: emiMissMonth
    };
};

export const strategies = {
    minimum_payment: (state, constraints) => {
        const { credit_card, current_balance } = state;
        const amount = credit_card.min_due;
        const balance_after = current_balance - amount;
        return {
            amount,
            source: 'cash',
            balance_after,
            credit_utilization: ((credit_card.outstanding - amount) / credit_card.credit_limit) * 100
        };
    },
    full_payment: (state, constraints) => {
        const { credit_card, current_balance } = state;
        const amount = credit_card.outstanding;
        const balance_after = current_balance - amount;
        return {
            amount,
            source: 'cash',
            balance_after,
            credit_utilization: 0
        };
    },
    optimized_partial: (state, constraints) => {
        const { credit_card, current_balance } = state;
        const min_buffer = constraints.min_cash_buffer;

        // Max we can pay while keeping buffer
        let available = current_balance - min_buffer;
        if (available < 0) available = 0;

        // We want to pay as much of outstanding as possible
        let amount = Math.min(available, credit_card.outstanding);

        // But logic: if efficient amount < min_due, we must pay min_due to avoid issues?
        // Determining "Optimized":
        // If we can't pay min_due without breaching buffer, we pay min_due AND breach buffer (and let validator fail it)?
        // Or do we cap at available?
        // "A Strategy is invalid if balance falls below constraints.min_cash_buffer"
        // So `optimized_partial` should probably ensuring validity IF possible.
        // So we assume `amount = available`. If `amount < min_due`, it's not a valid STRATEGY (actions-wise) for the bank, but mathematically it respects the buffer.
        // HOWEVER, banks require min_due.
        // So `amount` must be at least `min_due`.
        // If `available < min_due`, we default to `min_due` (and it will be invalid).

        if (amount < credit_card.min_due) amount = credit_card.min_due;

        const balance_after = current_balance - amount;
        return {
            amount,
            source: 'cash',
            balance_after,
            credit_utilization: ((credit_card.outstanding - amount) / credit_card.credit_limit) * 100
        };
    },
    user_defined: (state, constraints, userAmt) => {
        const { credit_card, current_balance } = state;
        const amount = userAmt || 0;
        const balance_after = current_balance - amount;
        return {
            amount,
            source: 'cash',
            balance_after,
            credit_utilization: ((credit_card.outstanding - amount) / credit_card.credit_limit) * 100
        };
    }
};

export default { strategies, runProjection };
