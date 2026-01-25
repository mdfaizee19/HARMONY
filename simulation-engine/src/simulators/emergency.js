
export const strategies = {
    pay_with_cash: (state, constraints) => {
        const amount = state.emergency.amount;
        return {
            amount: amount,
            source: 'cash',
            balance_after: state.current_balance - amount,
            credit_utilization: null
        };
    },
    pay_with_credit: (state, constraints) => {
        const amount = state.emergency.amount;
        const cc = state.credit_card;

        // Current balance doesn't change (cash-wise), but CC uti does.
        // New util:
        const new_outstanding = cc.outstanding + amount;
        const new_util = (new_outstanding / cc.credit_limit) * 100;

        return {
            amount: amount,
            source: 'credit',
            balance_after: state.current_balance,
            credit_utilization: new_util,
            outstanding_increase: amount // Needed for projection state update
        };
    },
    split_payment: (state, constraints) => {
        const total = state.emergency.amount;
        // Logic: Use cash down to buffer, rest credit.
        let cash_avail = state.current_balance - constraints.min_cash_buffer;
        if (cash_avail < 0) cash_avail = 0;

        let pay_cash = Math.min(cash_avail, total);
        let pay_credit = total - pay_cash;

        const cc = state.credit_card;
        const new_outstanding = cc.outstanding + pay_credit;
        const new_util = (new_outstanding / cc.credit_limit) * 100;

        return {
            amount: total,
            source: 'split',
            balance_after: state.current_balance - pay_cash,
            credit_utilization: new_util,
            outstanding_increase: pay_credit
        };
    }
};

export default { strategies };
