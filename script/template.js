class Template {
    static getStatisticIncome(data) {
        let html = '';
        let sum = 0;

        for (const date in data) {
            for (const elem of data[date]) {
                html += `<tr><td>${elem.sum}</td></tr>`;
                sum += elem.sum;
            }
        }
        html += `<tr><td>Загалом: <b>${sum}</b></td></tr>`;

        return html;
    }

    static getStatisticIncomeWeek(data) {
        let html = '';
        let sum = 0;

        for (const date in data) {
            html += `<tr><td>${DateWorker.getDateTableFormat(new Date(date))}</td></tr>`;
            for (const elem of data[date]) {
                html += `<tr><td>${elem.sum}</td></tr>`;
                sum += elem.sum;
            }
        }
        html += `<tr><td>Загалом: <b>${sum}</b></td></tr>`;

        return html;
    }

    static getStatisticExpense(data) {
        let html = '';
        let sum = 0;

        for (const date in data) {
            for (const elem of data[date]) {
                html +=
                    `<tr>
                        <td>${elem.sum}</td>
                        <td>${Dictionary.expenseCategory[elem.category]}</td>
                        <td>${elem.comment || ''}</td>
                    </tr>`;
                sum += elem.sum;
            }
        }
        html += `<tr><td>Загалом: <b>${sum}</b></td></tr>`;

        return html;
    }

    static getStatisticExpenseWeek(data, categoryTable) {
        let html = '';
        let sum = 0;
        const categorySum = {};

        for (const date in data) {
            html += `<tr><td>${DateWorker.getDateTableFormat(new Date(date))}</td></tr>`;
            for (const elem of data[date]) {
                html +=
                    `<tr>
                        <td>${elem.sum}</td>
                        <td>${Dictionary.expenseCategory[elem.category]}</td>
                        <td>${elem.comment || ''}</td>
                    </tr>`;
                sum += elem.sum;
                if (categorySum[elem.category] > 0) {
                    categorySum[elem.category] += elem.sum;
                } else {
                    categorySum[elem.category] = elem.sum;
                }
            }
        }
        html += `<tr><td>Загалом: <b>${sum}</b></td></tr>`;
        Template.setDataToExpenseWeekTotalTable(categorySum, categoryTable)
        return html;
    }

    static setDataToExpenseWeekTotalTable(data, table) {
        let html = '';

        for (const category in data) {
            html += `<tr><td>${data[category]}</td><td>${Dictionary.expenseCategory[category]}</td></tr>`;
        }

        table.innerHTML = html;
    }
}