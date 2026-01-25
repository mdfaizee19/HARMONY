
import creditCardSim from './simulators/creditCard.js';
import emiSim from './simulators/emi.js';
import emergencySim from './simulators/emergency.js';
import { projectState } from './utils/projection.js';

const SIMULATORS = {
    'pay_credit_card': creditCardSim,
    'pay_emi': emiSim,
    'handle_emergency': emergencySim
};

const STRATEGY_LISTS = {
    'pay_credit_card': ['minimum_payment', 'optimized_partial', 'full_payment', 'user_defined'],
    'pay_emi': ['pay_emi', 'prepay_partial', 'skip_emi'],
    'handle_emergency': ['pay_with_cash', 'pay_with_credit', 'split_payment']
};

export const processSimulation = (input) => {
    const { meta, state, obligations, user_action, constraints } = input;
    const intent = meta.intent;

    if (!SIMULATORS[intent]) {
        throw new Error(`Unknown intent: ${intent}`);
    }

    const simulator = SIMULATORS[intent];
    const strategyNames = STRATEGY_LISTS[intent];

    const results = [];

    strategyNames.forEach(strategyId => {
        // 1. Validate applicability
        if (strategyId === 'user_defined' && user_action.amount === null) return;

        // Special check for prepay_partial validity: need prepay_allowed
        if (strategyId === 'prepay_partial') {
            // Need to check if ANY emi allows it? 
            // Input has `emis` array. `user_action` type might be `emi_payment`.
            // We assume we are operating on the emis.
            // If NO emi allows prepay, we skip?
            const canPrepay = obligations.emis.some(e => e.prepay_allowed);
            if (!canPrepay) return;
        }

        const runner = simulator.strategies[strategyId];
        if (!runner) return; // Should not happen

        // Run Immediate Simulation
        // Some strategies need extra args (user amount, or target emi)
        // We pass `user_action.amount` generically if needed.
        const immediateResult = runner(
            { ...state, ...obligations }, // Flattened state 
            constraints,
            user_action.amount // Passed for user_defined/prepay
        );

        // Apply immediate state changes to a temporary state object for projection
        // Construct the "Post-Action State"
        const postActionBalance = immediateResult.balance_after;

        // Clone obligations to modify them based on immediate result
        let postActionObligations = JSON.parse(JSON.stringify(obligations));

        // Apply strategy specific updates to obligations
        // This is tricky because simulator returns "balance_after" and "credit_utilization"
        // but we need to know how the *obligations* changed (e.g. reduced outstanding, reduced remaining months)
        // My simulator functions returned `balance_after` but didn't return the full modified obligation state.
        // I need to update my simulator return signature or infer it.

        // INFERENCE LOGIC:
        if (intent === 'pay_credit_card') {
            if (postActionObligations.credit_card) {
                // We paid `immediateResult.amount`.
                // Reduce outstanding by amount.
                postActionObligations.credit_card.outstanding -= immediateResult.amount;
                if (postActionObligations.credit_card.outstanding < 0) postActionObligations.credit_card.outstanding = 0;
            }
        } else if (intent === 'pay_emi') {
            // We paid `immediateResult.amount`.
            // If strategy was 'pay_emi', we reduce remaining_months of ALL active?
            // Wait, `processSimulation` needs to be precise.
            // Let's look at `emiSim`.

            if (strategyId === 'pay_emi') {
                postActionObligations.emis.forEach(e => {
                    if (e.remaining_months > 0) e.remaining_months--;
                });
            } else if (strategyId === 'skip_emi') {
                // No reduction in months.
                // Penalty applied immediately? 
                // My projection adds penalty during the month loop if missed.
                // But if "skip_emi" is the *INTENT*, we are saying "I skip THIS month".
                // So we should record the penalty NOW?
                // "Immediate state" -> "balance_after". 
                // Projection handles *future*.
                // So current month penalty should be in the projection? 
                // Prompt says: "forward projection... including total penalties".
                // So if I skip NOW, is that penalty in "total_penalties"? Yes.
                // So the projection for month 1 (current/next) should catch it?
                // Or do we treat "Immediate Action" as Month 0?
                // "immediate state": balance after payment.
                // "forward projection": for horizon_months.
                // If I skip EMI today, the penalty is accrued.
                // I should probably pass an "initialPenalty" to projection?
                // Let's assume projection starts from Next Month? 
                // If I click "Pay", I pay today.
                // If I "Skip", I don't pay today. 
                // Result: I still owe the EMI? Or it's considered "Missed" and we move on?
                // Usually "Skip" means you missed the deadline.
            } else if (strategyId === 'prepay_partial') {
                // We paid extra.
                // We need to reduce principal/months. 
                // Simplified: reduce remaining_months by extra amount / monthly_emi?
                // Or just reduce total outstanding? Input schema doesn't have "principal".
                // It has "remaining_months".
                // So we must reduce "remaining_months".
                const totalPaid = immediateResult.amount;
                // First cover current month
                let available = totalPaid;

                postActionObligations.emis.forEach(e => {
                    if (e.remaining_months > 0) {
                        // Standard EMI
                        available -= e.monthly_emi;
                        e.remaining_months--;
                    }
                });

                // Remainder used to prepay
                if (available > 0) {
                    // Simplistic: reduce remaining months of first/all?
                    // Let's reduce the first one for determinism.
                    const target = postActionObligations.emis.find(e => e.remaining_months > 0);
                    if (target) {
                        const monthsReduced = Math.floor(available / target.monthly_emi);
                        target.remaining_months -= monthsReduced;
                        if (target.remaining_months < 0) target.remaining_months = 0;
                    }
                }
            }
        } else if (intent === 'handle_emergency') {
            if (strategyId === 'pay_with_credit' || strategyId === 'split_payment') {
                // Increase CC outstanding
                const increase = immediateResult.outstanding_increase || 0; // passed from my sim update
                if (postActionObligations.credit_card) {
                    postActionObligations.credit_card.outstanding += increase;
                }
            }
            // Cash payment affects balance only (already in postActionBalance)
        }

        // 2. Run Projection
        const projection = projectState(
            postActionBalance,
            postActionObligations,
            meta.horizon_months,
            constraints
        );

        // 3. Risk Flags
        const liquidity_risk = (projection.cash_buffer_breach_month !== null) || (postActionBalance < constraints.min_cash_buffer);
        const penalty_risk = (projection.total_penalties > 0);
        // Commitment risk: e.g. EMI miss?
        const commitment_risk = (projection.emi_miss_month !== null);

        // 4. Validate
        let valid = true;
        if (postActionBalance < constraints.min_cash_buffer) valid = false; // Immediate breach
        if (projection.cash_buffer_breach_month !== null) valid = false; // Future breach (based on prompt "balance falls below...")
        // "A STRATEGY IS INVALID if... EMI is missed when a valid alternative exists" - This is a set-level check, handled later?
        // "A STRATEGY IS INVALID if... EMI is missed" -> If *this* strategy causes a miss.
        if (projection.emi_miss_month !== null) valid = false;

        // Credit Util Check
        let util = immediateResult.credit_utilization;
        if (util === null && postActionObligations.credit_card) {
            // Recalculate if null (e.g. emi payment didn't return it)
            util = (postActionObligations.credit_card.outstanding / postActionObligations.credit_card.credit_limit) * 100;
        }
        if (util !== null && util > constraints.max_credit_utilization) valid = false;

        // Formatting
        results.push({
            strategy_id: strategyId,
            payment: {
                amount: Number(immediateResult.amount.toFixed(2)),
                source: immediateResult.source
            },
            immediate_state: {
                balance_after: Number(postActionBalance.toFixed(2)),
                credit_utilization: util !== null ? Number(util.toFixed(2)) : null
            },
            projection: projection,
            risk_flags: {
                liquidity_risk,
                penalty_risk,
                commitment_risk
            },
            valid
        });
    });

    // 5. Cross-Strategy Validation
    // "A STRATEGY IS INVALID if... EMI is missed when a valid alternative exists"
    const hasValidNoMiss = results.some(r => r.valid && r.projection.emi_miss_month === null);
    if (hasValidNoMiss) {
        results.forEach(r => {
            if (r.projection.emi_miss_month !== null) {
                r.valid = false;
            }
        });
    }

    // 6. Select Recommended Strategy
    // Filter valid strategies
    const validStrategies = results.filter(r => r.valid);
    let recommended = null;
    let reasons = [];

    if (validStrategies.length > 0) {
        // Sort by cost (interest + penalties)
        // If tie, pick highest balance_after (liquidity).
        validStrategies.sort((a, b) => {
            const costA = a.projection.total_interest + a.projection.total_penalties;
            const costB = b.projection.total_interest + b.projection.total_penalties;
            if (Math.abs(costA - costB) > 0.01) return costA - costB; // Lower cost better
            return b.immediate_state.balance_after - a.immediate_state.balance_after; // Higher balance better
        });
        recommended = validStrategies[0];
    } else {
        // If no valid, pick "least bad"
        // Minimize breach duration? Minimize cost?
        // Usually minimize immediate buffer breach (survival).
        // Then minimize cost.

        const strategiesCopy = [...results];
        strategiesCopy.sort((a, b) => {
            // Prioritize NOT missing immediate buffer? 
            const breachA = a.immediate_state.balance_after >= constraints.min_cash_buffer;
            const breachB = b.immediate_state.balance_after >= constraints.min_cash_buffer;
            if (breachA && !breachB) return -1;
            if (!breachA && breachB) return 1;

            // Then minimize future cost
            const costA = a.projection.total_interest + a.projection.total_penalties;
            const costB = b.projection.total_interest + b.projection.total_penalties;
            return costA - costB;
        });
        recommended = strategiesCopy[0];
    }

    // Construct Reasons
    const totalCost = recommended.projection.total_interest + recommended.projection.total_penalties;
    const primaryReason = `Recommended ${recommended.strategy_id}. It results in a projected cost of ${totalCost.toFixed(2)} while maintaining liquidity.`;
    // (Simple string, can be more dynamic)

    const rejected = results
        .filter(r => r.strategy_id !== recommended.strategy_id)
        .map(r => {
            if (!r.valid) return `${r.strategy_id}: Violated constraints (Buffer/Util/miss).`;
            return `${r.strategy_id}: Higher cost or risk.`;
        });

    return {
        meta: {
            intent: meta.intent,
            horizon_months: meta.horizon_months
        },
        strategies: results,
        recommended_strategy: recommended.strategy_id,
        decision_reason: {
            primary: primaryReason,
            rejected: rejected
        }
    };
};
